<script>
    import { page } from "$app/stores";
    import { Button } from "$lib/components/ui/button";
    import { goto } from "$app/navigation";
    
    $: status = $page.status;
    $: message = $page.error?.message || getDefaultMessage(status);
    
    function getDefaultMessage(status) {
        switch(status) {
            case 404: return "The page you're looking for doesn't exist or has been moved.";
            case 403: return "You don't have permission to access this resource.";
            case 500: return "Something went wrong on our server. Please try again later.";
            default: return "An unexpected error occurred.";
        }
    }
    
</script>

<svelte:head>
    <title>{status} - {status === 404 ? 'Page Not Found' : 'Error'} | Bliptext</title>
</svelte:head>

<div class="container mx-auto flex min-h-[70vh] flex-col items-center justify-center py-8">
    <div class="text-center">
        <h1 class="mb-4 text-6xl font-bold text-primary">{status}</h1>
        <p class="mb-6 text-2xl font-semibold">{status === 404 ? 'Page not found' : 'Error occurred'}</p>
        <p class="mb-8 max-w-md text-center text-muted-foreground">
            {message}
        </p>
        <div class="flex flex-wrap justify-center gap-4">
            <Button variant="default" onclick={() => goto('/home')}>Go Home</Button>
            <Button variant="outline" onclick={() => history.back()}>Go Back</Button>
        </div>
    </div>
</div>