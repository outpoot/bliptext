<script lang="ts">
    import { Button } from '$lib/components/ui/button';
    import { Card } from '$lib/components/ui/card';
    import { Input } from '$lib/components/ui/input';
    import { Avatar, AvatarImage, AvatarFallback } from '$lib/components/ui/avatar';
    import { toast } from 'svelte-sonner';
    import HistoryList from '$lib/components/self/HistoryList.svelte';

    let userId = $state('');
    let userInfo = $state<{
        id: string;
        name: string;
        image: string;
        isBanned: boolean;
        createdAt: string;
        revisions: Array<{
            id: string;
            createdAt: string;
            wordChanged: string;
            wordIndex: number;
            newWord: string;
            article: {
                title: string;
                slug: string;
            };
            user: {
                id: string;
                name: string;
                image: string;
                isBanned: boolean;
            };
        }>;
    } | null>(null);

    let loading = $state(false);

    async function fetchUser() {
        if (!userId) return;
        loading = true;
        
        try {
            const res = await fetch(`/api/admin/inspect?userId=${userId}`);
            if (!res.ok) throw new Error('User not found');
            userInfo = await res.json();
        } catch (error) {
            toast.error('Failed to fetch user');
            userInfo = null;
        } finally {
            loading = false;
        }
    }

    async function banUser() {
        if (!userInfo) return;
        
        try {
            const res = await fetch('/api/admin/bans', {
                method: 'POST',
                body: JSON.stringify({ userId: userInfo.id })
            });

            if (!res.ok) throw new Error();
            toast.success('User banned successfully');
            userInfo.isBanned = true;
        } catch {
            toast.error('Failed to ban user');
        }
    }

    function formatDate(date: string) {
        return new Date(date).toLocaleString();
    }
</script>

<div class="container mx-auto p-4">
    <h1 class="mb-6 text-2xl font-bold">User Inspector</h1>

    <div class="flex gap-2">
        <Input 
            type="text" 
            placeholder="Enter user ID" 
            bind:value={userId}
            class="max-w-xs"
        />
        <Button variant="secondary" onclick={fetchUser}>Inspect</Button>
    </div>

    {#if userInfo}
        <Card class="mt-6 p-6">
            <div class="flex items-start justify-between">
                <div class="flex items-center gap-4">
                    <Avatar class="h-16 w-16">
                        <AvatarImage src={userInfo.image} alt={userInfo.name} />
                        <AvatarFallback>{userInfo.name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                        <h2 class="text-xl font-semibold">{userInfo.name}</h2>
                        <p class="text-sm text-muted-foreground">ID: {userInfo.id}</p>
                        <p class="text-sm text-muted-foreground">Joined: {formatDate(userInfo.createdAt)}</p>
                        {#if userInfo.isBanned}
                            <p class="mt-1 text-sm text-destructive">User is banned</p>
                        {/if}
                    </div>
                </div>
                
                {#if !userInfo.isBanned}
                    <Button variant="destructive" onclick={banUser}>Ban User</Button>
                {/if}
            </div>

            <div class="mt-8">
                <h3 class="mb-4 text-lg font-semibold">Recent Activity</h3>
                <HistoryList 
                    revisions={userInfo.revisions}
                    loading={loading}
                    hasMore={false}
                    onLoadMore={() => {}}
                    onBanUser={banUser}
                    showBanButton={false}
                />
            </div>
        </Card>
    {/if}
</div>
