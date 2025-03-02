<script lang="ts">
    import { goto } from "$app/navigation";
    import { page } from "$app/state";
    import { toast } from "svelte-sonner";
    import { Card } from "$lib/components/ui/card";
    import { Button } from "$lib/components/ui/button";
    import {
        Avatar,
        AvatarImage,
        AvatarFallback,
    } from "$lib/components/ui/avatar";
    import Gavel from "lucide-svelte/icons/gavel.svelte";
    import HistoryList from "$lib/components/self/HistoryList.svelte";
    import { currentUser } from "$lib/stores/user";
    import type { RevisionWithUser } from "$lib/utils/revision";
    import { Input } from "$lib/components/ui/input/index.js";

    let userInfo: any = $state(null);
    let username: string = $state("");

    let loading = $state(false);
    let error: string | null = $state(null);

    function getTimeDifferences(
        revisions: RevisionWithUser[],
    ): RevisionWithUser[] {
        return revisions.map((rev, idx, arr) => {
            rev.timeDifference =
                idx < arr.length - 1
                    ? (new Date(rev.createdAt).getTime() -
                          new Date(arr[idx + 1].createdAt).getTime()) /
                      1000
                    : null;
            return rev;
        });
    }

    async function fetchUser(name: string) {
        if (!name) return;
        loading = true;
        error = null;
        try {
            const res = await fetch(
                `/api/blipper?username=${encodeURIComponent(name)}`,
            );
            if (!res.ok && res.status === 404)
                throw new Error("User not found");
            userInfo = await res.json();
            if ($currentUser?.isAdmin) {
                userInfo.revisions = getTimeDifferences(userInfo.revisions);
            }
        } catch (err) {
            toast.error(
                err instanceof Error ? err.message : "Failed to fetch user",
            );
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

    async function navigateToUser() {
        if (username) {
            const cleanUsername = username.replace(/^@/, "");
            if (window.location.pathname === `/blipper/@${cleanUsername}`) {
                return;
            }
            loading = true;
            goto(`/blipper/@${cleanUsername}`);
        }
    }

    $effect(() => {
        const { username: pathUsername } = page.params;
        if (pathUsername) {
            const cleanUsername = pathUsername.replace(/^@/, "");
            username = cleanUsername;
            fetchUser(cleanUsername);
        }
    });
</script>

<svelte:head>
    <title
        >{userInfo ? `${userInfo.name}'s Profile` : "User Profile"} | BlipText</title
    >
</svelte:head>

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
            placeholder="@username"
            bind:value={username}
            class="max-w-xs"
            onkeydown={(e) => e.key === "Enter" && navigateToUser()}
        />
        <Button variant="secondary" disabled={loading} onclick={navigateToUser}>
            {loading ? "Loading..." : "View"}
        </Button>
    </div>

    {#if userInfo}
        <Card class="mt-6 p-6">
            <div
                class="flex flex-col sm:flex-row sm:items-start sm:justify-between sm:gap-8"
            >
                <div class="flex items-center gap-4">
                    <Avatar class="h-16 w-16">
                        <AvatarImage src={userInfo.image} alt={userInfo.name} />
                        <AvatarFallback>
                            <img src="/images/unknown.png" alt="Unknown user" />
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <h2 class="text-xl font-semibold">{userInfo.name}</h2>
                        <p class="text-xs sm:text-sm text-muted-foreground">
                            ID: {userInfo.id}
                        </p>
                        <p class="text-sm text-muted-foreground">
                            Joined: {formatDate(userInfo.createdAt)}
                        </p>
                        <p class="text-sm text-muted-foreground">
                            Total revisions: {userInfo.totalRevisions}
                        </p>
                        {#if userInfo.isBanned}
                            <p class="mt-1 text-sm text-destructive">
                                User is banned
                            </p>
                        {/if}
                    </div>
                </div>
                {#if $currentUser?.isAdmin && !userInfo.isBanned}
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

            <div class="mt-8">
                <h3 class="mb-4 text-lg font-semibold">Recent Activity</h3>
                <HistoryList
                    revisions={userInfo.revisions}
                    loading={false}
                    hasMore={false}
                    onLoadMore={() => {}}
                    onBanUser={banUser}
                    showBanButton={false}
                    showTimeDifference={$currentUser?.isAdmin === true}
                />
                {#if userInfo.totalRevisions > userInfo.revisions.length}
                    <p class="mt-4 text-sm text-muted-foreground">
                        Showing {userInfo.revisions.length} of {userInfo.totalRevisions}
                        total revisions
                    </p>
                {/if}
            </div>
        </Card>
    {:else if error}
        <div class="mt-4 text-red-500">{error}</div>
    {/if}
</div>
