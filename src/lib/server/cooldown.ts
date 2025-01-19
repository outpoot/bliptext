type CooldownEntry = {
    until: number;
};

class CooldownManager {
    private cooldowns: Map<string, CooldownEntry> = new Map();

    addCooldown(userId: string, durationMs: number = 30000) {
        const until = Date.now() + durationMs;
        this.cooldowns.set(userId, { until });
    }

    isOnCooldown(userId: string): boolean {
        const entry = this.cooldowns.get(userId);

        if (!entry) return false;

        if (Date.now() > entry.until) {
            this.cooldowns.delete(userId);
            return false;
        }

        return true;
    }

    getRemainingTime(userId: string): number {
        const entry = this.cooldowns.get(userId);

        if (!entry) return 0;

        const remaining = entry.until - Date.now();
        return remaining > 0 ? remaining : 0;
    }
}

export const cooldownManager = new CooldownManager();
