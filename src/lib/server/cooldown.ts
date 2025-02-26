import { redis } from './redis';

class RedisCooldownManager {
    private readonly keyPrefix = 'cooldown:';
    private readonly DEFAULT_COOLDOWN = 30000;

    async isOnCooldown(userId: string, type: 'hover' | 'edit' = 'edit'): Promise<boolean> {
        const key = `${this.keyPrefix}${type}:${userId}`;
        const cooldownUntil = await redis.get(key);
        if (!cooldownUntil) return false;

        const expiryTime = parseInt(cooldownUntil);
        return Date.now() < expiryTime;
    }

    async getRemainingTime(userId: string, type: 'hover' | 'edit' = 'edit'): Promise<number> {
        const key = `${this.keyPrefix}${type}:${userId}`;
        const cooldownUntil = await redis.get(key);
        if (!cooldownUntil) return 0;

        const expiryTime = parseInt(cooldownUntil);
        const remaining = expiryTime - Date.now();
        return remaining > 0 ? remaining : 0;
    }

    async addCooldown(userId: string, duration: number = this.DEFAULT_COOLDOWN, type: 'hover' | 'edit' = 'edit'): Promise<void> {
        const key = `${this.keyPrefix}${type}:${userId}`;
        const expiry = Date.now() + duration;

        await redis.set(key, expiry.toString(), 'PX', duration + 1000);
    }

    async clearCooldown(userId: string, type: 'hover' | 'edit' = 'edit'): Promise<void> {
        const key = `${this.keyPrefix}${type}:${userId}`;
        await redis.del(key);
    }
}

export const cooldownManager = new RedisCooldownManager();