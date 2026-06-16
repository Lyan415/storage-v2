import { getAIConfig, type AIProvider } from './aiConfig';
import imageCompression from 'browser-image-compression';

async function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(',')[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

const PROMPT = '請辨識這張照片中的所有物件，只輸出物件名稱，用空格分隔。例如：手錶 手機 鑰匙。請使用繁體中文或英文，不要使用簡體中文。不要輸出任何其他文字。';

async function recognizeWithOpenAI(apiKey: string, base64: string, mimeType: string): Promise<string> {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [{
                role: 'user',
                content: [
                    { type: 'text', text: PROMPT },
                    { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64}` } },
                ],
            }],
            max_tokens: 300,
        }),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error?.message || `OpenAI API error: ${res.status}`);
    }
    const data = await res.json();
    return data.choices[0].message.content.trim();
}

async function recognizeWithGemini(apiKey: string, base64: string, mimeType: string): Promise<string> {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{
                parts: [
                    { text: PROMPT },
                    { inline_data: { mime_type: mimeType, data: base64 } },
                ],
            }],
        }),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error?.message || `Gemini API error: ${res.status}`);
    }
    const data = await res.json();
    return data.candidates[0].content.parts[0].text.trim();
}

async function recognizeWithClaude(apiKey: string, base64: string, mimeType: string): Promise<string> {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 300,
            messages: [{
                role: 'user',
                content: [
                    { type: 'image', source: { type: 'base64', media_type: mimeType, data: base64 } },
                    { type: 'text', text: PROMPT },
                ],
            }],
        }),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(`Claude ${res.status}: ${err.error?.type || 'unknown'} - ${err.error?.message || JSON.stringify(err)}`);
    }
    const data = await res.json();
    return data.content[0].text.trim();
}

const recognizers: Record<AIProvider, (apiKey: string, base64: string, mimeType: string) => Promise<string>> = {
    openai: recognizeWithOpenAI,
    gemini: recognizeWithGemini,
    claude: recognizeWithClaude,
};

export async function recognizeImage(file: File): Promise<string> {
    const config = getAIConfig();
    if (!config) throw new Error('尚未設定 AI API Key');

    const processedFile = await imageCompression(file, {
        maxSizeMB: 3,
        maxWidthOrHeight: 2048,
        useWebWorker: true,
    });

    const base64 = await fileToBase64(processedFile);
    const mimeType = processedFile.type || 'image/jpeg';

    return recognizers[config.provider](config.apiKey, base64, mimeType);
}
