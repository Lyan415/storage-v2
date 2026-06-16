import imageCompression from 'browser-image-compression';
import { getGasUrl } from './gasClient';

const COMPRESSION_OPTIONS = {
    maxSizeMB: 0.2,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
};

export async function uploadImage(file: File): Promise<string> {
    const compressed = await imageCompression(file, COMPRESSION_OPTIONS);

    const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(compressed);
    });

    const base64 = dataUrl.split(',')[1];

    const gasUrl = getGasUrl();
    if (!gasUrl) throw new Error('未設定 Google Apps Script URL');

    const res = await fetch(gasUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({
            action: 'uploadPhoto',
            base64,
            mimeType: compressed.type || 'image/jpeg',
            fileName: `${crypto.randomUUID()}.jpg`,
        }),
        redirect: 'follow',
    });

    if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
    const result = await res.json();
    if (!result.success) throw new Error(result.error || 'Upload failed');
    return result.url;
}
