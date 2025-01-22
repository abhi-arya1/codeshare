export function generateShortUUID(): string {
    // Generate a random UUID and return the first 6 characters
    return crypto.randomUUID().replace(/-/g, '').slice(0, 6);
}