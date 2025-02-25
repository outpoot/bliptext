<script lang="ts">
    import { page } from "$app/state";
    import { goto } from "$app/navigation";
    import { onMount } from "svelte";
    import { toast } from "svelte-sonner";
    import { Input } from "$lib/components/ui/input";
    import { Button } from "$lib/components/ui/button";
    import { Card } from "$lib/components/ui/card";
    import {
        Avatar,
        AvatarImage,
        AvatarFallback,
    } from "$lib/components/ui/avatar";
    import HistoryList from "$lib/components/self/HistoryList.svelte";
    import Gavel from "lucide-svelte/icons/gavel.svelte";

    let userId = $state("");
    let userInfo: any = $state(null);
    let loading = $state(false);
    let error: string | null = $state(null);

    async function fetchUser() {
        if (!userId) return;
        loading = true;
        try {
            const res = await fetch(`/api/admin/inspect?userId=${userId}`);
            if (!res.ok) throw new Error("User not found");
            userInfo = await res.json();
        } catch (err) {
            toast.error("Failed to fetch user");
            error = err instanceof Error ? err.message : "An error occurred";
            userInfo = null;
        } finally {
            loading = false;
        }
    }

    async function banUser() {
        if (!userInfo) return;
        try {
            const res = await fetch("/api/admin/bans", {
                method: "POST",
                body: JSON.stringify({ userId: userInfo.id }),
            });
            if (!res.ok) throw new Error();
            toast.success("User banned successfully");
            userInfo.isBanned = true;
        } catch {
            toast.error("Failed to ban user");
        }
    }

    function formatDate(date: string) {
        return new Date(date).toLocaleString();
    }

    function formatSeconds(seconds: number) {
        return `${seconds.toFixed(2)}s`;
    }

    function handleInput(e: Event) {
        userId = (e.target as HTMLInputElement).value;
    }

    function handleInspect() {
        if (userId) {
            goto(`?userId=${userId}`, { keepFocus: true });
            fetchUser();
        } else {
            goto(".", { keepFocus: true });
        }
    }

    onMount(() => {
        const urlUserId = page.url.searchParams.get("userId");
        if (urlUserId) {
            userId = urlUserId;
            fetchUser();
        }
    });
</script>

<div class="container mx-auto p-4">
    <h1 class="text-2xl font-bold mb-4">User Inspector</h1>

    <div class="flex gap-2">
        <Input
            type="text"
            placeholder="Enter user ID"
            value={userId}
            oninput={handleInput}
            class="max-w-xs"
        />
        <Button variant="secondary" onclick={handleInspect}>Inspect</Button>
    </div>

    {#if userInfo}
        <Card class="mt-6 p-6">
            <div
                class="flex flex-col sm:flex-row sm:items-start sm:justify-between sm:gap-8"
            >
                <div class="flex items-center gap-4">
                    <Avatar class="h-16 w-16">
                        <AvatarImage src={userInfo.image} alt={userInfo.name} />
                        <AvatarFallback
                            >{userInfo.name && userInfo.name[0]}</AvatarFallback
                        >
                    </Avatar>
                    <div>
                        <h2 class="text-xl font-semibold">{userInfo.name}</h2>
                        <p class="text-xs sm:text-sm text-muted-foreground">
                            ID: {userInfo.id}
                        </p>
                        <p class="text-sm text-muted-foreground">
                            Joined: {formatDate(userInfo.createdAt)}
                        </p>
                        {#if userInfo.isBanned}
                            <p class="mt-1 text-sm text-destructive">
                                User is banned
                            </p>
                        {/if}
                    </div>
                </div>

                {#if !userInfo.isBanned}
                    <Button
                        variant="destructive"
                        class="flex items-center gap-2 mt-2"
                        onclick={banUser}
                    >
                        <Gavel class="h-4 w-4" />
                        Ban
                    </Button>
                {/if}
            </div>

            {#if userInfo?.botMetrics}
                <Card class="mt-4 p-6">
                    <h3 class="mb-4 text-lg font-semibold">Metrics</h3>
                    <div class="grid gap-4 sm:grid-cols-2">
                        <div>
                            <p class="text-sm text-muted-foreground">
                                Avg. interval between changes
                            </p>
                            <p class="text-lg font-medium">
                                {formatSeconds(
                                    userInfo.botMetrics.averageInterval,
                                )}
                            </p>
                        </div>
                        <div>
                            <p class="text-sm text-muted-foreground">
                                Max consecutive word repetition
                            </p>
                            <p class="text-lg font-medium">
                                {userInfo.botMetrics.maxConsecutiveRepetition}x
                            </p>
                        </div>
                    </div>
                </Card>
            {/if}

            <div class="mt-8">
                <h3 class="mb-4 text-lg font-semibold">Recent Activity</h3>
                <HistoryList
                    revisions={userInfo.revisions}
                    {loading}
                    hasMore={false}
                    onLoadMore={() => {}}
                    onBanUser={banUser}
                    showBanButton={false}
                />
            </div>
        </Card>
    {:else if loading}
        <div class="mt-4">Loading...</div>
    {:else if error}
        <div class="mt-4 text-red-500">{error}</div>
    {/if}
</div>
