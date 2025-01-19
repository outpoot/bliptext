<script lang="ts">
	import { goto } from '$app/navigation';

	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import * as Tabs from '$lib/components/ui/tabs';

	import { slugify } from '$lib/utils';

	import MarkdownViewer from '$lib/components/self/MarkdownViewer.svelte';
	import { currentUser } from '$lib/stores/user';

	const defaultContent = `# [A dog | i.imgur.com/XgbZdeA.jpeg | An image of a dog.]
Dog is a [domesticated](articles/domestication) [carnivorous](articles/carnivorous) mammal that typically has a long snout, an acute sense of smell, non-retractile claws, and a barking, howling, or whining voice. It is widely kept as a pet or for work or field sports. Dogs are known for their **loyalty** and **companionship**.`;

	let title = $state('');
	let content = $state(defaultContent);
	let isSubmitting = $state(false);
	let activeTab = $state('edit');
	let renderKey = $state(0);

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

	function handleTabChange(value: string) {
		activeTab = value;
		if (value === 'preview') {
			renderKey++;
		}
	}
</script>

{#if $currentUser?.isAdmin}
	<div class="container-2xl mx-auto py-8">
		<h1 class="mb-8 text-3xl font-bold">Create New Article</h1>

		<Tabs.Root value={activeTab} onValueChange={handleTabChange}>
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
					{#key renderKey}
						<MarkdownViewer
							{content}
							title={title || 'Untitled Article'}
							article={{ title, content }}
							showHeader={true}
						/>
					{/key}
				</div>
			</Tabs.Content>
		</Tabs.Root>
	</div>
{:else}
	<p>You must be an admin to do this.</p>
{/if}
