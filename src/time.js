import { text } from "./dom.js";

function pad2(value) {
    return String(value).padStart(2, "0");
}

function localDate(year, month, day, hour = 0, minute = 0, second = 0) {
    const date = new Date(year, month - 1, day, hour, minute, second);
    if (date.getFullYear() !== year ||
        date.getMonth() + 1 !== month ||
        date.getDate() !== day ||
        date.getHours() !== hour ||
        date.getMinutes() !== minute) {
        return null;
    }
    return date;
}

function parseDateTime(value) {
    const raw = text(value).trim();
    if (!raw) {
        return null;
    }
    const compact = raw.match(/^(\d{4})(\d{2})(\d{2})(\d{2})?(\d{2})?(\d{2})?$/);
    if (compact) {
        const date = localDate(
            Number(compact[1]),
            Number(compact[2]),
            Number(compact[3]),
            Number(compact[4] || 0),
            Number(compact[5] || 0),
            Number(compact[6] || 0)
        );
        if (date) {
            return date;
        }
    }
    const separated = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/);
    if (separated) {
        const date = localDate(
            Number(separated[1]),
            Number(separated[2]),
            Number(separated[3]),
            Number(separated[4] || 0),
            Number(separated[5] || 0),
            Number(separated[6] || 0)
        );
        if (date) {
            return date;
        }
    }
    if (/^\d{10}$/.test(raw)) {
        return new Date(Number(raw) * 1000);
    }
    if (/^\d{13}$/.test(raw)) {
        return new Date(Number(raw));
    }
    const timestamp = Date.parse(raw);
    return Number.isNaN(timestamp) ? null : new Date(timestamp);
}

export function formatDateTime(value) {
    const date = parseDateTime(value);
    if (!date || Number.isNaN(date.getTime())) {
        return "";
    }
    return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())} ${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}
