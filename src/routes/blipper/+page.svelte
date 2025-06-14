<script lang="ts">
    import { goto } from "$app/navigation";
    import { Input } from "$lib/components/ui/input";
    import { Button } from "$lib/components/ui/button";

    let username = $state("");

    function navigateToUser() {
        if (username) {
            const cleanUsername = username.replace(/^@/, "");
            goto(`/blipper/@${cleanUsername}`);
        }
    }
</script>

<div class="container mx-auto p-4">
    <div class="mb-6">
        <h1 class="text-2xl font-bold sm:text-3xl">Blipper</h1>
        <p class="text-sm text-muted-foreground sm:text-base">
            Search Bliptext users (blippers) by username.
        </p>
    </div>
    <div class="flex gap-2">
        <Input
            type="text"
            placeholder="@facedevstuff"
            bind:value={username}
            class="max-w-xs"
            onkeydown={(e) => e.key === "Enter" && navigateToUser()}
        />
        <Button variant="secondary" onclick={navigateToUser}>View</Button>
    </div>
</div>
