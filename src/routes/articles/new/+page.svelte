<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import * as Tabs from '$lib/components/ui/tabs';
	import Clock from 'lucide-svelte/icons/clock';
	import { slugify } from '$lib/utils';

	import Markdown from 'svelte-exmarkdown';
	import { gfmPlugin } from 'svelte-exmarkdown/gfm';
	import type { Plugin } from 'svelte-exmarkdown';
	import rehypeHighlight from 'rehype-highlight';
	import 'highlight.js/styles/github-dark.css';

	import WikiBox from '$lib/components/self/WikiBox.svelte';

	const defaultContent = `# [A dog | i.imgur.com/XgbZdeA.jpeg | An image of a dog.]
Dog is a [domesticated](articles/domestication) [carnivorous](articles/carnivorous) mammal that typically has a long snout, an acute sense of smell, non-retractile claws, and a barking, howling, or whining voice. It is widely kept as a pet or for work or field sports. Dogs are known for their **loyalty** and **companionship**.`;

	let title = $state('');
	let content = $state(defaultContent);
	let isSubmitting = $state(false);
	let activeTab = $state('edit');

	// https://ssssota.github.io/svelte-exmarkdown/docs/04-skip-render
	const highlightPlugin: Plugin = { rehypePlugin: [rehypeHighlight, { ignoreMissing: true }] };
	const plugins: Plugin[] = [
		gfmPlugin(),
		highlightPlugin,
		{
			renderer: {
				h1: WikiBox
			}
		}
	];

	async function handleSubmit(e: Event) {
		e.preventDefault();
		if (isSubmitting) return;

		isSubmitting = true;
		try {
			const response = await fetch('/api/articles', {
				method: 'POST',
				body: JSON.stringify({ title, content })
			});

			if (response.ok) {
				goto(`/articles/${slugify(title)}`);
			}
		} catch (error) {
			console.error('Failed to create article:', error);
		} finally {
			isSubmitting = false;
		}
	}
</script>

<div class="container mx-auto py-8">
	<h1 class="mb-8 text-3xl font-bold">Create New Article</h1>

	<Tabs.Root value={activeTab} onValueChange={(value: string) => (activeTab = value)}>
		<Tabs.List>
			<Tabs.Trigger value="edit">Edit</Tabs.Trigger>
			<Tabs.Trigger value="preview">Preview</Tabs.Trigger>
		</Tabs.List>

		<Tabs.Content value="edit">
			<form class="grid gap-6 pt-4" onsubmit={handleSubmit}>
				<div class="grid gap-2">
					<Label for="title">Title</Label>
					<Input id="title" bind:value={title} required />
				</div>

				<div class="grid gap-2">
					<Label for="content">Content</Label>
					<Textarea id="content" bind:value={content} class="min-h-[300px]" required />
				</div>

				<Button type="submit" disabled={isSubmitting}>
					{isSubmitting ? 'Creating...' : 'Create Article'}
				</Button>
			</form>
		</Tabs.Content>

		<Tabs.Content value="preview">
			<div class="pt-4">
				<div class="mb-8 flex items-center justify-between">
					<h1 class="text-3xl font-bold">{title || 'Untitled Article'}</h1>
					<div class="flex items-center gap-2 text-sm text-muted-foreground">
						<Clock class="h-4 w-4" />
						<time datetime={new Date().toISOString()}>
							{new Date().toLocaleDateString()}
						</time>
					</div>
				</div>
				<div class="markdown-content">
					<Markdown md={content} {plugins} />
				</div>
			</div>
		</Tabs.Content>
	</Tabs.Root>
</div>
