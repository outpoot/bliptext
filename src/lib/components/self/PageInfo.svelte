<script lang="ts">
    import * as AlertDialog from "$lib/components/ui/alert-dialog";
    import type { Article } from "$lib/server/db/schema";
    
    let { article, open = $bindable() } = $props<{ article: Article; open: boolean }>();

    const formatDate = (date: Date | string) => new Date(date).toLocaleString();
    const wordCount = article.content.split(/\s+/).length;
</script>

<AlertDialog.Root bind:open>
    <AlertDialog.Content class="max-w-[540px]">
        <AlertDialog.Header>
            <AlertDialog.Title>Page Information</AlertDialog.Title>
            <AlertDialog.Description>Details about this article and its history</AlertDialog.Description>
        </AlertDialog.Header>

        <div class="mt-6 space-y-6">
            <div class="grid gap-4">
                <div>
                    <div class="text-sm font-medium">Created</div>
                    <div class="text-sm text-muted-foreground">{formatDate(article.createdAt)}</div>
                </div>
                <div>
                    <div class="text-sm font-medium">Last Modified</div>
                    <div class="text-sm text-muted-foreground">{formatDate(article.updatedAt)}</div>
                </div>
                <div>
                    <div class="text-sm font-medium">Word Count</div>
                    <div class="text-sm text-muted-foreground">{wordCount} words</div>
                </div>
            </div>
        </div>

        <AlertDialog.Footer class="mt-6">
            <AlertDialog.Cancel>Close</AlertDialog.Cancel>
        </AlertDialog.Footer>
    </AlertDialog.Content>
</AlertDialog.Root>
