import type { Account } from '../types';

export const ACCOUNTS: Account[] = [
    { label: 'Lyan', id: 'lyan' },
    { label: '小章魚', id: 'octopus' },
];

export const ACCOUNT_GAS_URLS: Record<string, string> = {
    lyan: 'https://script.google.com/macros/s/AKfycbwZANZ-IIoWmXXJ1JjbnLNMzC3worT78rJrA-i91Hb6yZJiOTKrwvm8jMsX_VWTwBwC/exec',
};

// Symbol keys: ◆=1, ●=2, ▲=3, ■=4
// Lyan: ●●●●▲▲■■ → "22223344"
// 小章魚: ●●●●●●●● → "22222222"
const HASHES: Record<string, string> = {
    lyan: '43313c4dadece159fd40c04e51be65ae71154ea1fb12e37e5c9fae800a3cb06b',
    octopus: '33a7d3da476a32ac237b3f603a1be62fad00299e0d4b5a8db8d913104edec629',
};

async function sha256(message: string): Promise<string> {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function verifyPassword(accountId: string, sequence: string): Promise<boolean> {
    const hash = await sha256(sequence);
    return hash === HASHES[accountId];
}

export function getSession(): { accountId: string; label: string } | null {
    try {
        const raw = localStorage.getItem('storage-v2-session');
        if (!raw) return null;
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

export function saveSession(accountId: string, label: string): void {
    localStorage.setItem('storage-v2-session', JSON.stringify({ accountId, label }));
}

export function clearSession(): void {
    localStorage.removeItem('storage-v2-session');
}
