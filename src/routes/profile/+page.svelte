<script lang="ts">
	import { currentUser } from '$lib/stores/user';
</script>

<div class="flex min-h-screen items-center justify-center">
	<!-- TODO: load currentUser before entire page? idk its kinda weird doing #if's -->
	{#if $currentUser}
		<h1>Username: {$currentUser.name}</h1>
	{/if}
</div>
