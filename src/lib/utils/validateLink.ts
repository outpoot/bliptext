export function shouldWarnForLink(url: HTMLAnchorElement | string | null) {
    const link = typeof url === "string" ? url : url?.getAttribute("href");
    if (!link) return false;

    const normalized = link.trim().toLowerCase();

    if (
        !normalized.startsWith("https://bliptext.com") &&
        !normalized.startsWith("http://bliptext.com") &&
        !normalized.startsWith("bliptext.com")
    ) {
        return true;
    }

    return normalized.replace(/(^\w+:|^)\/\//, "").split(".").length > 2;
}
