<script lang="ts">
    import { client } from "$lib/auth-client";

const session = client.useSession();
</script>

<div class="flex items-center justify-center min-h-screen">
    <h1>hi {$session.data?.user.name}</h1>
</div>