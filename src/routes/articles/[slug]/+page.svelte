<script lang="ts">
	import { Separator } from '$lib/components/ui/separator';
	import FileText from 'lucide-svelte/icons/file-text';
	import type { Article } from '$lib/server/db/schema';
	import MarkdownViewer from '$lib/components/self/MarkdownViewer.svelte';

	let { data } = $props<{ data: { article: Article } }>();
</script>

<div class="container-2xl mx-auto py-8">
	<MarkdownViewer 
		content={data.article.content} 
		title={data.article.title}
		article={data.article}
		showHeader={true}
	/>
</div>
