const STORAGE_KEY = 'storage-v2-gas-url';
const URL_REGEX = /^https:\/\/script\.google\.com\/.*\/exec/;

let DEFAULT_GAS_URL = 'https://script.google.com/macros/s/AKfycbwZANZ-IIoWmXXJ1JjbnLNMzC3worT78rJrA-i91Hb6yZJiOTKrwvm8jMsX_VWTwBwC/exec';

export function setDefaultGasUrl(url: string): void {
    DEFAULT_GAS_URL = url;
}

export function getGasUrl(): string {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && URL_REGEX.test(stored)) return stored;
    return DEFAULT_GAS_URL;
}

export function saveGasUrl(url: string): void {
    if (URL_REGEX.test(url)) {
        localStorage.setItem(STORAGE_KEY, url);
    }
}

function getValidGasUrl(): string {
    const url = getGasUrl();
    if (!url || !URL_REGEX.test(url)) {
        throw new Error('未設定有效的 Google Apps Script URL');
    }
    return url;
}

export async function gasGet<T = any>(params: Record<string, string>): Promise<T> {
    const url = getValidGasUrl();
    const qs = new URLSearchParams(params).toString();
    const res = await fetch(`${url}?${qs}`);
    if (!res.ok) throw new Error(`GAS GET error: ${res.status}`);
    return res.json();
}

export async function gasPost<T = any>(body: Record<string, any>): Promise<T> {
    const url = getValidGasUrl();
    await fetch(url, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(body),
    });
    return {} as T;
}

export async function gasPostWithResponse<T = any>(body: Record<string, any>): Promise<T> {
    const url = getValidGasUrl();
    // Use GET with action param to get readable responses
    const params = new URLSearchParams({
        action: body.action,
        data: JSON.stringify(body),
    });
    const res = await fetch(`${url}?${params}`);
    if (!res.ok) throw new Error(`GAS error: ${res.status}`);
    return res.json();
}
