<script lang="ts">
    import { onMount } from "svelte";
    import { Card } from "$lib/components/ui/card";
    import { Badge } from "$lib/components/ui/badge";
    import {
        Avatar,
        AvatarImage,
        AvatarFallback,
    } from "$lib/components/ui/avatar";
    import { goto } from "$app/navigation";
    import { toast } from "svelte-sonner";

    type UserData = {
        id: string;
        name: string;
        image: string;
        isBanned: boolean;
        createdAt: string;
    };

    type IPGroup = {
        groupId: string;
        account_count: number;
        users: UserData[];
    };

    let ipGroups: IPGroup[] = $state([]);
    let loading = $state(true);

    function formatDate(date: string) {
        return new Date(date).toLocaleString();
    }

    function inspectUser(userId: string) {
        goto(`/admin/inspect?userId=${userId}`);
    }

    onMount(async () => {
        try {
            const response = await fetch("/api/admin/terminator");
            if (!response.ok) throw new Error("Failed to fetch data");
            ipGroups = await response.json();
        } catch (err) {
            toast.error("Failed to load data");
            console.error(err);
        } finally {
            loading = false;
        }
    });
</script>

<svelte:head>
    <title>Terminator - Admin</title>
    <meta
        name="description"
        content="Identify multiple accounts under the same IP address"
    />
</svelte:head>

<div class="container mx-auto px-4 py-6">
    <div class="mb-6">
        <h1 class="text-2xl font-bold sm:text-3xl">Terminator</h1>
        <p class="text-sm text-muted-foreground sm:text-base">
            Identify multiple accounts under the same IP address
        </p>
    </div>

    {#if loading}
        <div class="text-center">Loading...</div>
    {:else if ipGroups.length === 0}
        <Card class="p-4">
            <p class="text-center text-sm text-muted-foreground">
                No suspicious IP patterns found
            </p>
        </Card>
    {:else}
        <div class="space-y-4">
            {#each ipGroups as group}
                <Card class="p-4">
                    <div class="mb-3 flex items-center justify-between">
                        <div>
                            <h2 class="font-mono text-sm font-medium">
                                {group.groupId}
                            </h2>
                            <Badge variant="secondary"
                                >{group.account_count} accounts</Badge
                            >
                        </div>
                    </div>

                    <div class="grid gap-3">
                        {#each group.users as user}
                            <!-- svelte-ignore a11y_click_events_have_key_events -->
                            <!-- svelte-ignore a11y_no_static_element_interactions -->
                            <div
                                class="flex w-full cursor-pointer items-center justify-between rounded-lg p-2 hover:bg-accent"
                                onclick={() => inspectUser(user.id)}
                            >
                                <div class="flex items-center gap-3">
                                    <Avatar class="h-8 w-8 shrink-0">
                                        <AvatarImage
                                            src={user.image}
                                            alt={user.name}
                                        />
                                        <AvatarFallback
                                            >{user.name[0]}</AvatarFallback
                                        >
                                    </Avatar>
                                    <div class="min-w-0">
                                        <div class="truncate font-medium">
                                            {user.name}
                                        </div>
                                        <div
                                            class="text-xs text-muted-foreground"
                                        >
                                            Joined {formatDate(user.createdAt)}
                                        </div>
                                    </div>
                                </div>
                                {#if user.isBanned}
                                    <Badge variant="destructive">Banned</Badge>
                                {/if}
                            </div>
                        {/each}
                    </div>
                </Card>
            {/each}
        </div>
    {/if}
</div>
