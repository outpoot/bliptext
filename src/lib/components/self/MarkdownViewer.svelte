<script lang="ts">
	import type { Article } from "$lib/server/db/schema";
	import type { Plugin } from "svelte-exmarkdown";
	import Markdown from "svelte-exmarkdown";
	import { gfmPlugin } from "svelte-exmarkdown/gfm";
	import { onMount } from "svelte";

	import { cooldown } from "$lib/stores/cooldown";
	import { activeUsers } from "$lib/stores/activeUsers";
	import * as Dialog from "$lib/components/ui/dialog";
	import { Button } from "$lib/components/ui/button";
	import { Separator } from "$lib/components/ui/separator";

	import WikiBox from "$lib/components/self/WikiBox.svelte";
	import Summary from "$lib/components/self/Summary.svelte";
	import TableOfContents from "./TableOfContents.svelte";
	import Tools from "./Tools.svelte";
	import FloatingWord from "./FloatingWord.svelte";
	import SafeLink from "./SafeLink.svelte";
	import WordInput from "./WordInput.svelte";

	import { WordProcessor } from "$lib/utils/wordProcessor";
	import { soundMuted } from "$lib/stores/soundMuted";
	import { toast } from "svelte-sonner";

	import FileText from "lucide-svelte/icons/file-text";
	import Users from "lucide-svelte/icons/users";
	import ListTree from "lucide-svelte/icons/list-tree";
	import Wrench from "lucide-svelte/icons/wrench";
	import X from "lucide-svelte/icons/x";
	import Pen from "lucide-svelte/icons/pen";
	import Eye from "lucide-svelte/icons/eye";
	import Badge from "../ui/badge/badge.svelte";
    import { shouldWarnForLink } from "$lib/utils/validateLink";

	const clickSound = "/sound/click.mp3";
	const swapSound = "/sound/swap.mp3";

	let showMobileTools = $state(false);
	let showMobileContents = $state(false);

	let {
		content,
		title = "",
		showSidebars = true,
		showHeader = false,
		isEditPage = false,
		article = { title, content },
		selectedWord = $bindable(""),
		selfId = "",
		ws,
		onInputKeyDown = undefined,
		onInput = undefined,
		onSelectElement = undefined,
	} = $props<{
		content: string;
		title?: string;
		showSidebars?: boolean;
		showHeader?: boolean;
		isEditPage?: boolean;
		article?: Partial<Article>;
		selectedWord?: string;
		selfId?: string;
		ws?: WebSocket | null;
		onInputKeyDown?: (event: KeyboardEvent) => void;
		onInput?: (event: InputEvent) => void;
		onSelectElement?: (element: HTMLElement | null) => void;
	}>();

	function preprocessContent(content: string): string {
		return content.replace(/:::summary[\s\S]*?:::/g, "");
	}

	const wordProcessor = new WordProcessor(preprocessContent(content), {
		onHover: (element) => handleElementHover(element),
		onLeave: (element) => handleElementLeave(element),
		onClick: (element) => handleElementClick(element),
	});

	// Plugin configuration
	const plugins: Plugin[] = [
		gfmPlugin(),
		{
			renderer: {
				h1: WikiBox,
				// @ts-ignore
				p: Summary,
				a: SafeLink,
			},
		},
	];

	// State management
	let selectedElement: HTMLElement | null = $state(null);
	let showSubmitButton = $state(false);
	let submitButtonPosition = $state({ x: 0, y: 0 });
	let isReplacing = $state(false); // For click/selection state
	let isPending = $state(false); // For request pending state

	let hoverTimeout: ReturnType<typeof setTimeout> | null = null;
	let leaveTimeout: ReturnType<typeof setTimeout> | null = null;

	let otherUsersHovers = $state<{
		[editorId: string]: {
			word: string;
			wordIndex: number;
			editorName: string;
			editorImage: string;
		};
	}>({});

	let showLinkDialog = $state(false);
	let pendingUrl = $state("");

	let lastSoundPlayed = 0;
	const SOUND_DEBOUNCE = 50;
	const HOVER_DEBOUNCE = 100;

	let isMobile = false;

	onMount(() => {
		isMobile = window.matchMedia("(max-width: 768px)").matches;
	});

	function playSound(sound: string) {
		if ($soundMuted) return;

		const now = Date.now();
		if (now - lastSoundPlayed < SOUND_DEBOUNCE) return;

		const audio = new Audio(sound);
		audio.play().catch(() => {}); // fuck
		lastSoundPlayed = now;
	}

	function handleElementHover(element: HTMLElement, self: boolean = true) {
		if (self && (!selectedWord?.trim() || $cooldown.isActive)) return;

		element.classList.add("shake");

		if (self && !$cooldown.isActive && !isReplacing) {
			hoverTimeout = setTimeout(
				() => handleHover(element),
				HOVER_DEBOUNCE,
			);
		} else if (self && $cooldown.isActive) {
			toast.error(
				`Please wait ${$cooldown.remainingTime}s before editing more words.`,
				{ duration: 2000 },
			);
		}
	}

	function handleElementLeave(element: HTMLElement) {
		element.classList.remove("shake");

		if (hoverTimeout) {
			clearTimeout(hoverTimeout);
			hoverTimeout = null;
		}

		if (leaveTimeout) {
			clearTimeout(leaveTimeout);
		}

		// no leave request if we're in replace mode
		if (isReplacing || !selectedWord.trim()) return;

		leaveTimeout = setTimeout(() => {
			const actualIndex = wordProcessor.wordIndicesMap.get(element);
			if (actualIndex !== undefined && !$cooldown.isActive) {
				ws.send(
					JSON.stringify({
						type: "word_leave",
						wordIndex: actualIndex,
					}),
				);
			}
		}, HOVER_DEBOUNCE);
	}

	function updateSubmitButtonPosition() {
		if (!selectedElement || !showSubmitButton) return;

		requestAnimationFrame(() => {
			const rect = selectedElement?.getBoundingClientRect();
			if (rect?.width && rect?.height) {
				if (isMobile) {
					submitButtonPosition = { x: rect?.left, y: rect?.top - 40 };
				} else {
					const viewportCenter = window.innerHeight / 2;
					submitButtonPosition = {
						x: rect?.left,
						y: Math.min(
							Math.max(rect.top - 40, 20),
							viewportCenter,
						),
					};
				}
			}
		});
	}

	function handleElementClick(element: HTMLElement) {
		if (!selectedWord || $cooldown.isActive) return;
		playSound(clickSound);
		navigator?.vibrate?.(100);

		if (hoverTimeout) {
			clearTimeout(hoverTimeout);
			hoverTimeout = null;
		}

		if (leaveTimeout) {
			clearTimeout(leaveTimeout);
			leaveTimeout = null;
		}

		if (isReplacing && selectedElement && selectedElement !== element) {
			const previousIndex =
				wordProcessor.wordIndicesMap.get(selectedElement);
			if (previousIndex !== undefined) {
				ws.send(
					JSON.stringify({
						type: "word_leave",
						wordIndex: previousIndex,
					}),
				);
			}
			selectedElement.classList.remove("selected");
		}

		selectedElement = element;
		element.classList.add("selected");
		isReplacing = true;

		const actualIndex = wordProcessor.wordIndicesMap.get(element);
		if (actualIndex !== undefined && !$cooldown.isActive) {
			ws.send(
				JSON.stringify({
					type: "word_hover",
					wordIndex: actualIndex,
					newWord: selectedWord,
				}),
			);
		}

		const rect = element.getBoundingClientRect();
		if (rect.width && rect.height) {
			submitButtonPosition = { x: rect.left, y: rect.top - 40 };
		}
		showSubmitButton = true;
		onSelectElement?.(element);

		requestAnimationFrame(updateSubmitButtonPosition);
	}

	function handleHover(element: HTMLElement) {
		if (!selectedWord || !article?.slug || $cooldown.isActive) return;

		const actualIndex = wordProcessor.wordIndicesMap.get(element);
		if (actualIndex === undefined) return;

		ws.send(
			JSON.stringify({
				type: "word_hover",
				wordIndex: actualIndex,
				newWord: selectedWord,
			}),
		);
	}

	$effect(() => {
		if (!ws) return;

		let currentHoveredElement: HTMLElement | null = null;

		ws.addEventListener("message", (event: { data: string }) => {
			const data = JSON.parse(event.data);

			if (data.type === "error") {
				if (data.data.code === "COOLDOWN") {
					// Clear any floating words when cooldown starts
					if (selectedElement) {
						selectedElement.classList.remove("selected");
						selectedElement = null;
						onSelectElement?.(null);
					}
					showSubmitButton = false;
					isReplacing = false;
					selectedWord = "";
					cooldown.startCooldown(data.data.remainingTime);
				} else if (data.data.code === "INVALID_WORD") {
					toast.error("Invalid word format");
				}
			} else if (data.type === "word_hover") {
				const {
					wordIndex,
					newWord,
					replace,
					editorId,
					editorName,
					editorImage,
				} = data.data;

				if (editorId === selfId) return;

				if (replace) {
					const element =
						wordProcessor.getElementByWordIndex(wordIndex);
					if (!element) {
						console.error(
							"Element from update not found, index:",
							wordIndex,
						);
						return;
					}

					if (otherUsersHovers[editorId]) {
						const newHovers = { ...otherUsersHovers };
						delete newHovers[editorId];
						otherUsersHovers = newHovers;
					}

					wordProcessor.replaceWord(newWord, element, () => {});
					playSound(swapSound);
					return;
				}

				if (editorId === selfId) return;

				if (currentHoveredElement)
					handleElementLeave(currentHoveredElement);

				const element = wordProcessor.getElementByWordIndex(wordIndex);
				if (element) {
					currentHoveredElement = element;
					handleElementHover(element, false);
				}

				otherUsersHovers = {
					...otherUsersHovers,
					[editorId]: {
						word: newWord,
						wordIndex,
						editorName,
						editorImage,
					},
				};
			} else if (
				data.type === "word_leave" ||
				data.type === "user_disconnected"
			) {
				const { editorId } = data.data;

				const userHover = otherUsersHovers[editorId];
				if (userHover) {
					const element = wordProcessor.getElementByWordIndex(
						userHover.wordIndex,
					);
					if (element) {
						handleElementLeave(element);
					}
				}

				const newHovers = { ...otherUsersHovers };
				delete newHovers[editorId];
				otherUsersHovers = newHovers;
			} else if (
				data.type === "word_replace" ||
				(data.type === "word_hover" && data.data.replace)
			) {
				playSound(swapSound);
			}
		});
	});

	$effect(() => {
		const content = document.querySelector(".markdown-content");
		if (!content) return;

		if (isEditPage) {
			wordProcessor.wordIndicesMap.clear();
			content
				.querySelectorAll("p, h1, h2, h3, h4, h5, h6, a, li")
				.forEach((element) => {
					wordProcessor.wrapTextNodes(element);
				});

			content
				.querySelectorAll("a")
				.forEach((link) =>
					link.addEventListener("click", (e) => e.preventDefault()),
				);
		} else {
			const handleViewModeClick = (e: Event) => {
				const target = e.target as HTMLElement;
				const link = target.closest("a");
				if (link && shouldWarnForLink(link)) {
					e.preventDefault();
					e.stopPropagation();
					pendingUrl = link.getAttribute("href") || "";
					showLinkDialog = true;
				}
			};

			content.addEventListener("click", handleViewModeClick, true);
			return () =>
				content.removeEventListener("click", handleViewModeClick, true);
		}
	});

	$effect(() => {
		if (showSubmitButton && selectedElement) {
			window.addEventListener("scroll", updateSubmitButtonPosition);
			window.addEventListener("resize", updateSubmitButtonPosition);

			return () => {
				window.removeEventListener(
					"scroll",
					updateSubmitButtonPosition,
				);
				window.removeEventListener(
					"resize",
					updateSubmitButtonPosition,
				);
			};
		}
	});

	async function handleWordChanged({
		newWord,
		wordIndex,
		context,
	}: {
		newWord: string;
		wordIndex: number;
		context?: string;
	}) {
		isPending = true;
		try {
			const res = await fetch(`/api/articles/${article.slug}/word`, {
				method: "PUT",
				body: JSON.stringify({
					wordIndex,
					newWord,
					context: context,
				}),
			});

			const data = await res.json();

			if (res.status === 429) {
				cooldown.startCooldown(data.remainingTime);
				toast.error(data.error);
				return;
			}

			if (!res.ok) {
				toast.error(data.error);
				return;
			}

			if (data.remainingTime) {
				cooldown.startCooldown(data.remainingTime);
			}

			// update UI after successful edit
			wordProcessor.replaceWord(newWord, selectedElement!, () => {});
			cooldown.startCooldown(30000);
			playSound(swapSound);
			navigator?.vibrate?.([75, 75, 75]);

			isReplacing = false;
			selectedWord = "";
			showSubmitButton = false;
			if (selectedElement) {
				selectedElement.classList.remove("selected");
				selectedElement = null;
				onSelectElement?.(null);
			}
		} finally {
			isPending = false;
		}
	}

	function handleConfirmNavigation() {
		window.open(pendingUrl, "_blank");
		showLinkDialog = false;
	}
</script>

<!-- <CaptchaManager bind:this={captchaManager} /> -->

<!-- Template -->
{#if showSidebars}
	<div class="flex gap-6">
		<div class="hidden ml-6 w-64 pt-16 md:block">
			<TableOfContents
				{content}
				{title}
				wordInput={isEditPage}
				inputProps={isEditPage
					? {
							onkeydown: onInputKeyDown,
							oninput: onInput,
							value: selectedWord,
						}
					: undefined}
				onNavigate={() => (showMobileContents = false)}
			/>
		</div>

		<div class="flex-1">
			{#if showHeader}
				<div class="mb-4 ml-3 flex items-baseline gap-2">
					<FileText class="h-5 w-5 text-muted-foreground" />
					<h1 id="title" class="text-3xl font-bold">
						{article.title || "Untitled"}
					</h1>

					<div class="ml-auto mr-3">
						<Badge variant="outline">
							<Users class="mr-1.5 h-3 w-3" />
							<span>{$activeUsers}</span>
						</Badge>
					</div>
				</div>

				<Separator class="mb-8" />
			{/if}
			<div class="markdown-content px-4 md:px-0">
				<Markdown md={content} {plugins} />

				{#if article?.id}
					<div
						class="mt-8 border-t pt-4 text-sm text-muted-foreground"
					>
						<p>
							This article is derived from Wikipedia and licensed
							under
							<a
								href="https://creativecommons.org/licenses/by-sa/4.0/"
								class="text-primary underline">CC BY-SA 4.0</a
							>. View the
							<a
								href={`https://en.wikipedia.org/wiki/${article.title?.replace(/ /g, "_")}`}
								class="text-primary underline"
								target="_blank"
								rel="noopener noreferrer">original article</a
							>.
						</p>
						<p class="mt-2 text-xs">
							Wikipedia® is a registered trademark of the
							Wikimedia Foundation, Inc.<br>Bliptext is not
							affiliated with or endorsed by Wikipedia or the
							Wikimedia Foundation.
						</p>
					</div>
				{/if}
			</div>
		</div>

		<div class="hidden w-64 pt-16 md:block">
			<Tools {article} {isEditPage} />
		</div>
	</div>
{:else}
	<div class="flex-1">
		{#if showHeader}
			<div class="mb-4 flex items-baseline gap-2">
				<FileText class="h-5 w-5 text-muted-foreground" />
				<h1 id="title" class="text-3xl font-bold">
					{article?.title || "Untitled"}
				</h1>

				<div class="ml-auto">
					<Badge variant="secondary">
						<Users class="mr-1.5 h-3 w-3" />
						<span>{$activeUsers}</span>
					</Badge>
				</div>
			</div>
			<Separator class="mb-8" />
		{/if}
		<div class="markdown-content px-4">
			<Markdown md={content} {plugins} />

			{#if article?.id}
				<div class="mt-8 border-t pt-4 text-sm text-muted-foreground">
					<p>
						This article is derived from Wikipedia and licensed
						under
						<a
							href="https://creativecommons.org/licenses/by-sa/4.0/"
							class="text-primary underline">CC BY-SA 4.0</a
						>. View the
						<a
							href={`https://en.wikipedia.org/wiki/${article.title?.replace(/ /g, "_")}`}
							class="text-primary underline"
							target="_blank"
							rel="noopener noreferrer">original article</a
						>.
					</p>
					<p class="mt-2">
						Wikipedia® is a registered trademark of the Wikimedia
						Foundation, Inc. Bliptext is not affiliated with or
						endorsed by Wikipedia or the Wikimedia Foundation.
					</p>
				</div>
			{/if}
		</div>
	</div>
{/if}

<!-- Mobile FAB Menu -->
{#if showSidebars}
	<div class="fixed bottom-6 right-6 flex items-end gap-3 md:hidden">
		<div class="flex-none">
			{#if isEditPage}
				<WordInput
					class="w-64"
					inputProps={{
						onkeydown: onInputKeyDown,
						oninput: onInput,
						value: selectedWord,
					}}
				/>
			{/if}
		</div>

		<div class="flex flex-col gap-3">
			{#if isEditPage}
				<Button
					variant="default"
					size="icon"
					class="h-12 w-12 rounded-full shadow-lg"
					href={`../${article.slug}`}
				>
					<Eye class="h-6 w-6" />
					<span class="sr-only">View original</span>
				</Button>
			{:else}
				<Button
					variant="default"
					size="icon"
					class="h-12 w-12 rounded-full shadow-lg"
					href={`${article.slug}/edit`}
				>
					<Pen class="h-6 w-6" />
					<span class="sr-only">Edit article</span>
				</Button>
			{/if}

			<Button
				variant="default"
				size="icon"
				class="h-12 w-12 rounded-full shadow-lg"
				onclick={() => (showMobileContents = true)}
			>
				<ListTree class="h-6 w-6" />
				<span class="sr-only">Show contents</span>
			</Button>
			<Button
				variant="default"
				size="icon"
				class="h-12 w-12 rounded-full shadow-lg"
				onclick={() => (showMobileTools = true)}
			>
				<Wrench class="h-6 w-6" />
				<span class="sr-only">Show tools</span>
			</Button>
		</div>
	</div>
{/if}

<!-- Mobile Overlays -->
{#if showMobileTools}
	<div class="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true">
		<button
			class="absolute inset-0 bg-background/80 backdrop-blur-sm"
			onclick={() => (showMobileTools = false)}
			aria-label="Close tools"
		></button>
		<div
			class="absolute inset-x-4 bottom-4 rounded-lg border bg-background p-4 shadow-lg"
		>
			<div class="mb-2 flex items-center justify-between">
				<Button
					variant="ghost"
					size="icon"
					onclick={() => (showMobileTools = false)}
				>
					<X class="h-4 w-4" />
				</Button>
			</div>
			<Tools {article} {isEditPage} />
		</div>
	</div>
{/if}

{#if showMobileContents}
	<div class="fixed inset-0 z-50 md:hidden">
		<button
			type="button"
			class="absolute inset-0 bg-background/80 backdrop-blur-sm"
			onclick={() => (showMobileContents = false)}
			onkeydown={(e) =>
				e.key === "Escape" && (showMobileContents = false)}
			aria-label="Close contents"
		></button>
		<div
			class="absolute inset-x-4 bottom-4 rounded-lg border bg-background p-4 shadow-lg"
		>
			<div class="mb-2 flex items-center justify-between">
				<Button
					variant="ghost"
					size="icon"
					onclick={() => (showMobileContents = false)}
				>
					<X class="h-4 w-4" />
				</Button>
			</div>
			<TableOfContents
				{content}
				{title}
				wordInput={isEditPage}
				inputProps={isEditPage
					? {
							onkeydown: onInputKeyDown,
							oninput: onInput,
							value: selectedWord,
						}
					: undefined}
				onNavigate={() => (showMobileContents = false)}
			/>
		</div>
	</div>
{/if}

{#if showSubmitButton && selectedElement}
	<div
		class="fixed z-50"
		style="left: {submitButtonPosition.x}px; top: {submitButtonPosition.y}px;"
	>
		<Button
			class="transform-gpu plausible-event-name--Word-Edit"
			disabled={isPending}
			onclick={async () => {
				const actualIndex = wordProcessor.wordIndicesMap.get(
					selectedElement!,
				);
				if (actualIndex !== undefined) {
					const words = wordProcessor.getWordsFromText(
						wordProcessor.content,
					);
					const start = Math.max(0, actualIndex - 2);
					const end = Math.min(words.length, actualIndex + 3);

					const context = {
						before: words.slice(start, actualIndex).join(" "),
						word: words[actualIndex],
						after: words.slice(actualIndex + 1, end).join(" "),
						index: actualIndex,
					};

					await handleWordChanged({
						newWord: selectedWord,
						wordIndex: actualIndex,
						context: JSON.stringify(context),
					});
				}
			}}
		>
			{isPending ? "Loading..." : "Replace"}
		</Button>
	</div>
{/if}

{#each Object.entries(otherUsersHovers) as [_, hover]}
	{@const element = wordProcessor.getElementByWordIndex(hover.wordIndex)}
	{#if element}
		<FloatingWord
			word={hover.word}
			{element}
			image={hover.editorImage}
			editorName={hover.editorName}
		/>
	{/if}
{/each}

<Dialog.Root bind:open={showLinkDialog}>
	<Dialog.Content class="sm:max-w-[425px]">
		<Dialog.Header>
			<Dialog.Title>Leave this page?</Dialog.Title>
			<Dialog.Description>
				You're about to visit: {pendingUrl}
				<br />
				<br />
				We <strong>STRONGLY</strong> recommend you don't visit any external
				links.
			</Dialog.Description>
		</Dialog.Header>
		<div class="flex justify-end gap-3 pt-6">
			<Dialog.Close>No, take me back</Dialog.Close>
			<Button onclick={handleConfirmNavigation} variant="destructive"
				>Yes</Button
			>
		</div>
	</Dialog.Content>
</Dialog.Root>

<style>
	:global(.hv) {
		display: inline;
		padding: 0 2px;
		border-radius: 2px;
		cursor: pointer;
	}

	:global(.shake) {
		animation: backgroundTint 1.5s ease-in-out infinite;
		background: hsl(var(--primary) / 20%);
	}

	:global(.selected) {
		font-weight: bold;
		background: hsl(var(--primary) / 30%);
	}

	:global(.word-exit) {
		animation: wordExit 0.3s ease-out;
	}

	:global(.word-enter) {
		animation: wordEnter 0.5s ease-out;
	}

	@keyframes backgroundTint {
		0%,
		100% {
			background: hsl(var(--primary) / 20%);
		}
		50% {
			background: hsl(var(--primary) / 10%);
		}
	}

	@keyframes wordExit {
		0% {
			transform: scale(1);
			filter: brightness(1);
			opacity: 1;
		}
		100% {
			transform: scale(0.8) translateY(-10px);
			filter: brightness(1.5);
			opacity: 0;
		}
	}

	@keyframes wordEnter {
		0% {
			transform: scale(1.2) translateY(10px);
			filter: brightness(2);
			opacity: 0;
		}
		20% {
			opacity: 1;
		}
		60% {
			transform: scale(1.1);
			filter: brightness(1.5);
		}
		80% {
			transform: scale(0.95);
			filter: brightness(1.2);
		}
		100% {
			transform: scale(1);
			filter: brightness(1);
		}
	}
</style>
