# Bliptext Moderation & Validity

## Missing component

If you're seeing this, Bliptext is likely failing due to a missing `moderation.ts` file in this directory.

### Quick Fix

Create a `moderation.ts` file with this minimal implementation:

```ts
export function checkHardcore() {
    return false;
}
```

### Note

The official `moderation.ts` implementation is private for security reasons. Feel free to extend this basic version for your own use case.

## Validator & Tests
You can run the validation tests using either:

- [Bun](https://bun.sh): `bun test`
- Node.js: `node --test validator.test.js`

If all tests pass, your modifications to `wordMatching.ts` are likely working correctly. This is particularly useful when self-hosting and customizing the project.