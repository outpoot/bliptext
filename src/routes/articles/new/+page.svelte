<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import { slugify } from '$lib/utils';

	let title = $state('');
	let content = $state('');
	let isSubmitting = $state(false);

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

	<form class="grid max-w-2xl gap-6" onsubmit={handleSubmit}>
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
</div>
