declare module 'lucide-svelte/icons/*' {
    import type { IconProps } from 'lucide-svelte';
    import type { SvelteComponent } from 'svelte';
    const cmp: SvelteComponent<IconProps>;

    export = cmp;
}