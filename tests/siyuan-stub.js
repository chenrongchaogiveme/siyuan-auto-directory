export class Plugin {
    constructor(options) {
        this.options = options;
    }
}

export class Dialog {}

export async function confirm() {
    return true;
}

export function fetchSyncPost(url, payload, headers, process = true) {
    return globalThis.__siyuanFetchSyncPost(url, payload, headers, process);
}

export function getAllEditor() {
    return [];
}

export function openTab() {}

export function showMessage() {}
