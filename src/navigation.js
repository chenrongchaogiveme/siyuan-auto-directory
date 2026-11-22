import { text } from "./dom.js";

export const NAVIGATION_LIMIT = 10;

export function appendNavigationOrigin(stack, origin, targetId, limit = NAVIGATION_LIMIT) {
    const target = text(targetId);
    const originId = text(origin && origin.id);
    const entries = (Array.isArray(stack) ? stack : [])
        .map((entry) => ({
            id: text(entry && entry.id),
            title: text(entry && entry.title),
        }))
        .filter((entry) => entry.id && entry.id !== target);
    if (!target || !originId || originId === target) {
        return entries;
    }
    entries.push({
        id: originId,
        title: text(origin && origin.title) || originId,
    });
    return entries.slice(-Math.max(1, limit));
}
