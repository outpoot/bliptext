<script lang="ts">
    import { theme } from "$lib/stores/theme";
    import { Button } from "../ui/button";
    import {
        DropdownMenu,
        DropdownMenuContent,
        DropdownMenuItem,
        DropdownMenuTrigger,
    } from "../ui/dropdown-menu";
    import Sun from "lucide-svelte/icons/sun";
    import Moon from "lucide-svelte/icons/moon";
    import Palette from "lucide-svelte/icons/palette";
    import Skull from "lucide-svelte/icons/skull";

    const themes = [
        {
            name: "light",
            icon: Sun,
            label: "Light",
        },
        {
            name: "dark",
            icon: Moon,
            label: "Dark",
        },
        {
            name: "lyntr",
            icon: Skull,
            label: "Lyntr",
        },
    ] as const;
</script>

<DropdownMenu>
    <DropdownMenuTrigger>
        <Button variant="outline" size="icon" class="w-9 px-0">
            {#if $theme === "light"}
                <Sun class="h-4 w-4" />
            {:else if $theme === "dark"}
                <Moon class="h-4 w-4" />
            {:else}
                <Palette class="h-4 w-4" />
            {/if}
            <span class="sr-only">Toggle theme</span>
        </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
        {#each themes as t}
            <DropdownMenuItem onclick={() => theme.set(t.name)}>
                <svelte:component this={t.icon} class="mr-2 h-4 w-4" />
                <span>{t.label}</span>
            </DropdownMenuItem>
        {/each}
    </DropdownMenuContent>
</DropdownMenu>
