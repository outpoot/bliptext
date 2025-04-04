<script lang="ts">
	import { Button } from "$lib/components/ui/button";
	import Separator from "../ui/separator/separator.svelte";
	import PageInfo from "./PageInfo.svelte";

	import Pen from "lucide-svelte/icons/pen";
	import History from "lucide-svelte/icons/history";
	import Link from "lucide-svelte/icons/link";
	import Check from "lucide-svelte/icons/check";
	import Download from "lucide-svelte/icons/download";
	import Info from "lucide-svelte/icons/info";
	import Trash2 from "lucide-svelte/icons/trash-2";
	import Headphones from "lucide-svelte/icons/headphones";
	import { currentUser } from "$lib/stores/user";
	import { toast } from "svelte-sonner";
	import { WordProcessor } from "$lib/utils/wordProcessor";
	import { onDestroy } from "svelte";
	import { browser } from "$app/environment";

	import type { Article } from "$lib/server/db/schema";
	import { styles } from "$lib/utils/styles";
	let { article, isEditPage = false } = $props<{
		article: Article;
		isEditPage?: boolean;
	}>();
	let { title, slug, content } = article;

	let isCollapsed = $state(false);
	let showPageInfo = $state(false);
	let showCopyCheck = $state(false);
	let isReading = $state(false);

	let synth: SpeechSynthesis | undefined;
	let currentUtterance: SpeechSynthesisUtterance | null = null;

	if (browser) {
		synth = window.speechSynthesis;
		window.addEventListener("beforeunload", () => {
			if (window.speechSynthesis.speaking) {
				window.speechSynthesis.cancel();
			}
		});
	}

	$effect(() => {
		if (showCopyCheck) {
			setTimeout(() => (showCopyCheck = false), 2000);
		}
	});

	function handleCopy() {
		navigator.clipboard.writeText(window.location.href);
		showCopyCheck = true;
	}

	// this function is so seductive oh lord
	function handleDownload() {
		const header = `<!--
        This is an informative header that provides metadata about the article. It will not get rendered when the markdown file is viewed in a markdown viewer.
        
        Article: ${slug}
        Downloaded from Bliptext (https://bliptext.com)
        Date: ${new Date().toISOString()}
        
        This file is provided by Bliptext, a free and open source knowledge base, where everybody can edit 1 word per 30 seconds.
        
        Visit us at https://bliptext.com
-->\n\n# ${title}\n\n`;

		const blob = new Blob([header + content], { type: "text/markdown" });
		const url = window.URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `${slug}.md`;
		document.body.appendChild(a);
		a.click();
		window.URL.revokeObjectURL(url);
		document.body.removeChild(a);
	}

	async function handleDelete() {
		if (!$currentUser?.isAdmin) return;

		if (
			!confirm(
				"Are you sure you want to delete this article? This action cannot be undone.",
			)
		) {
			return;
		}

		try {
			const response = await fetch("/api/admin/article/delete", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ articleId: article.id }),
			});

			if (!response.ok) {
				throw new Error("Failed to delete article");
			}

			toast.success("Article deleted successfully");
		} catch (error) {
			console.error("Error deleting article:", error);
			toast.error("Failed to delete article");
		}
	}

	function handleRead() {
		if (!content || !synth) {
			toast.error("Speech synthesis is not supported in your browser");
			return;
		}

		if (isReading) {
			synth.cancel();
			isReading = false;
			currentUtterance = null;
			return;
		}

		const wordProcessor = new WordProcessor(content);
		const textWithoutLinks = content.replace(
			/\[([^\]]+)\]\([^\)]+\)/g,
			"$1",
		);
		const words = wordProcessor.getWordsFromText(
			textWithoutLinks.replace(/[-_/[()\]#]/g, " "),
		);

		const cleanContent = words.join(" ");

		currentUtterance = new SpeechSynthesisUtterance(cleanContent);
		currentUtterance.rate = 0.9;

		currentUtterance.onend = () => {
			isReading = false;
			currentUtterance = null;
		};

		currentUtterance.onerror = () => {
			isReading = false;
			currentUtterance = null;
			toast.info("Speech synthesis stopped");
		};

		try {
			isReading = true;
			synth.speak(currentUtterance);
		} catch (error) {
			isReading = false;
			currentUtterance = null;
			toast.error("Failed to start speech synthesis");
		}
	}

	onDestroy(() => {
		if (synth && (isReading || currentUtterance)) {
			synth.cancel();
		}
	});

	const buttonClass = "w-full justify-start group";
</script>

<div class="sticky top-4">
	<div class="mb-2 flex items-center justify-between">
		<h2 class="text-lg font-bold">Tools</h2>
		<Button
			variant="ghost"
			size="icon"
			onclick={() => (isCollapsed = !isCollapsed)}
		>
			{isCollapsed ? "+" : "-"}
		</Button>
	</div>

	<Separator class="mb-2" />

	<div class="space-y-1 overflow-hidden text-sm" class:h-0={isCollapsed}>
		<Button
			variant="ghost"
			class={buttonClass}
			href={isEditPage ? `../${slug}` : `${slug}/edit`}
		>
			<Pen class={styles.iconClass} />
			{isEditPage ? "View original" : "Edit"}
		</Button>
		<Button
			variant="ghost"
			class={buttonClass}
			href={isEditPage ? `./history` : `${slug}/history`}
		>
			<History class={styles.iconClass} /> History
		</Button>
		<Button variant="ghost" class={buttonClass} onclick={handleCopy}>
			{#if showCopyCheck}
				<Check class="copy-check mr-2 h-4 w-4" /> Copied!
			{:else}
				<Link class={styles.iconClass} /> Copy link
			{/if}
		</Button>
		<Button variant="ghost" class={buttonClass} onclick={handleDownload}>
			<Download class={styles.iconClass} /> Download
		</Button>
		<Button variant="ghost" class={buttonClass} onclick={handleRead}>
			<Headphones class={styles.iconClass} />
			{isReading ? "Stop reading" : "Read article"}
		</Button>
		<Button
			variant="ghost"
			class={buttonClass}
			onclick={() => (showPageInfo = true)}
		>
			<Info class={styles.iconClass} /> Page information
		</Button>
		{#if $currentUser?.isAdmin}
			<Button
				variant="ghost"
				class="{buttonClass} text-destructive hover:text-destructive"
				onclick={handleDelete}
			>
				<Trash2 class={styles.iconClass} /> Delete article
			</Button>
		{/if}
	</div>
</div>

<PageInfo {article} bind:open={showPageInfo} />

<style>
	:global(.copy-check) {
		animation: pop 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
	}
	@keyframes pop {
		0% {
			transform: scale(0.8);
		}
		50% {
			transform: scale(1.1);
		}
		100% {
			transform: scale(1);
		}
	}
</style>
