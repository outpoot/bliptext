<script lang="ts">
	import type { Article } from "$lib/server/db/schema";
	import type { Plugin } from "svelte-exmarkdown";
	import Markdown from "svelte-exmarkdown";
	import { gfmPlugin } from "svelte-exmarkdown/gfm";

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
	import { toast } from "svelte-sonner";

	import FileText from "lucide-svelte/icons/file-text";
	import Users from "lucide-svelte/icons/users";
	import ListTree from "lucide-svelte/icons/list-tree";
	import Wrench from "lucide-svelte/icons/wrench";
	import X from "lucide-svelte/icons/x";
	import Pen from "lucide-svelte/icons/pen";
	import Eye from "lucide-svelte/icons/eye";
	import Badge from "../ui/badge/badge.svelte";
	import { captchaToken, captchaVerified } from "$lib/stores/captcha";
	import CaptchaManager from "./CaptchaManager.svelte";
	import { tick } from "svelte";

	const clickSound = "/sound/click.mp3";
	const swapSound = "/sound/swap.mp3";

	let showMobileTools = $state(false);
	let showMobileContents = $state(false);
	let captchaManager: CaptchaManager;

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
	}>();

	const wordProcessor = new WordProcessor(content, {
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
	let isReplacing = $state(false);

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

	function playSound(sound: string) {
		const now = Date.now();
		if (now - lastSoundPlayed < SOUND_DEBOUNCE) return;

		const audio = new Audio(sound);
		audio.play().catch(() => {}); // fuck
		lastSoundPlayed = now;
	}

	function handleElementHover(element: HTMLElement, self: boolean = true) {
		if (!selectedWord && self) return;
		element.classList.add("shake");

		if (self) hoverTimeout = setTimeout(() => handleHover(element), 150);
	}

	async function handleElementLeave(element: HTMLElement) {
		element.classList.remove("shake");

		if (hoverTimeout) {
			clearTimeout(hoverTimeout);
			hoverTimeout = null;
		}

		if (leaveTimeout) {
			clearTimeout(leaveTimeout);
		}

		// no leave request if we're in replace mode
		if (isReplacing) return;

		leaveTimeout = setTimeout(async () => {
			const actualIndex = wordProcessor.wordIndicesMap.get(element);
			if (actualIndex !== undefined && !$cooldown.isActive) {
				try {
					await fetch(`/api/articles/${article.slug}/hover`, {
						method: "DELETE",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({
							wordIndex: actualIndex,
						}),
					});
				} catch (error) {
					console.error("Failed to send hover leave:", error);
				}
			}
		}, 125);
	}

	function handleElementClick(element: HTMLElement) {
		if (!selectedWord) return;
		playSound(clickSound);
		if (navigator?.vibrate) {
			navigator.vibrate(100);
		}
		if (selectedElement) selectedElement.classList.remove("selected");

		selectedElement = element;
		element.classList.add("selected");
		isReplacing = true;

		const rect = element.getBoundingClientRect();
		submitButtonPosition = { x: rect.left, y: rect.top - 40 };
		showSubmitButton = true;
	}

	async function handleHover(element: HTMLElement) {
		if (!selectedWord || !article?.slug) return;

		const actualIndex = wordProcessor.wordIndicesMap.get(element);
		if (actualIndex === undefined) return;

		try {
			const response = await fetch(
				`/api/articles/${article.slug}/hover`,
				{
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						wordIndex: actualIndex,
						newWord: selectedWord,
					}),
				},
			);

			const data = await response.json();

			if (response.status === 429) {
				cooldown.startCooldown(data.remainingTime);
				return;
			}

			if (!response.ok) throw new Error("Hover update failed");
		} catch (error) {
			console.error("Failed to send hover update:", error);
		}
	}

	$effect(() => {
		if (!ws) return;

		let currentHoveredElement: HTMLElement | null = null;

		ws.addEventListener("message", (event: { data: string }) => {
			const data = JSON.parse(event.data);

			if (data.type === "word_hover") {
				const {
					wordIndex,
					newWord,
					replace,
					editorId,
					editorName,
					editorImage,
				} = data.data;

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
				if (link) {
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

	async function handleWordChanged({
		newWord,
		wordIndex,
	}: {
		newWord: string;
		wordIndex: number;
	}) {
		if (!$captchaVerified) {
			captchaManager.startVerification();
			await tick();
			while (!$captchaVerified) {
				await new Promise((resolve) => setTimeout(resolve, 100));
			}
		}

		const res = await fetch(`/api/articles/${article.slug}/word`, {
			method: "PUT",
			body: JSON.stringify({
				wordIndex,
				newWord,
				captchaToken: $captchaToken,
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

		$captchaVerified = false;
		// update UI after successful edit
		wordProcessor.replaceWord(newWord, selectedElement!, () => {});
		cooldown.startCooldown(30000);
		playSound(swapSound);

		isReplacing = false;
		selectedWord = "";
		showSubmitButton = false;
		if (selectedElement) {
			selectedElement.classList.remove("selected");
			selectedElement = null;
		}
	}

	function handleConfirmNavigation() {
		window.open(pendingUrl, "_blank");
		showLinkDialog = false;
	}
</script>

<CaptchaManager bind:this={captchaManager} />

<!-- Template -->
{#if showSidebars}
	<div class="flex gap-6">
		<div class="hidden w-64 pt-16 md:block">
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

					<div class="ml-auto">
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
	<Button
		class="fixed z-50"
		style="left: {submitButtonPosition.x}px; top: {submitButtonPosition.y}px;"
		onclick={() => {
			const actualIndex = wordProcessor.wordIndicesMap.get(
				selectedElement!,
			);
			if (actualIndex !== undefined) {
				handleWordChanged({
					newWord: selectedWord,
					wordIndex: actualIndex,
				});
			}
		}}
	>
		Replace
	</Button>
{/if}

{#each Object.entries(otherUsersHovers) as [_, hover]}
	{#if true}
		{@const element = wordProcessor.getElementByWordIndex(hover.wordIndex)}
		{#if element}
			<FloatingWord
				word={hover.word}
				{element}
				image={hover.editorImage}
			/>
		{/if}
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
		display: inline-block;
		padding: 0 2px;
		border-radius: 2px;
		cursor: pointer;
	}

	:global(.shake) {
		animation: shake 0.5s linear infinite;
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

	@keyframes shake {
		0%,
		100% {
			transform: translateX(0);
		}
		25% {
			transform: translateX(-1px) rotate(-1deg);
		}
		75% {
			transform: translateX(1px) rotate(1deg);
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
