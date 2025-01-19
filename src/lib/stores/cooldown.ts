import { writable } from 'svelte/store';

type CooldownState = {
    isActive: boolean;
    remainingTime: number;
};

function createCooldownStore() {
    const { subscribe, set, update } = writable<CooldownState>({
        isActive: false,
        remainingTime: 0
    });

    let interval: ReturnType<typeof setInterval>;

    return {
        subscribe,
        startCooldown: (durationMs: number) => {
            clearInterval(interval);

            set({
                isActive: true,
                remainingTime: Math.ceil(durationMs / 1000)
            });

            interval = setInterval(() => {
                update(state => {
                    if (state.remainingTime <= 1) {
                        clearInterval(interval);
                        return { isActive: false, remainingTime: 0 };
                    }
                    return { ...state, remainingTime: state.remainingTime - 1 };
                });
            }, 1000);
        },
        clear: () => {
            clearInterval(interval);
            set({ isActive: false, remainingTime: 0 });
        }
    };
}

export const cooldown = createCooldownStore();
