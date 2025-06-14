export const timeQuery = async <T>(name: string, fn: () => Promise<T>): Promise<T> => {
    const start = performance.now();
    try {
        const result = await fn();
        const duration = Math.round(performance.now() - start);
        console.log(`[QUERY] ${name} took ${duration}ms`);
        return result;
    } catch (error) {
        const duration = Math.round(performance.now() - start);
        console.error(`[QUERY] ${name} failed after ${duration}ms:`, error);
        throw error;
    }
};
