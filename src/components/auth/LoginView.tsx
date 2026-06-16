import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Package, ChevronDown, Sparkles, Eye, EyeOff, Delete } from 'lucide-react';
import { ACCOUNTS, ACCOUNT_GAS_URLS, verifyPassword, saveSession } from '../../lib/auth';
import { getAIConfig, saveAIConfig, clearAIConfig, type AIProvider } from '../../lib/aiConfig';
import { getGasUrl, saveGasUrl } from '../../lib/gasClient';

const SHAPES = [
    { key: '1', label: '◆', className: 'bg-red-500' },
    { key: '2', label: '●', className: 'bg-blue-500' },
    { key: '3', label: '▲', className: 'bg-green-500' },
    { key: '4', label: '■', className: 'bg-amber-500' },
];

const AI_PROVIDERS: { value: AIProvider; label: string }[] = [
    { value: 'gemini', label: 'Google Gemini' },
    { value: 'openai', label: 'OpenAI' },
    { value: 'claude', label: 'Claude (Anthropic)' },
];

export const LoginView = () => {
    const [selectedAccount, setSelectedAccount] = useState('');
    const [sequence, setSequence] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const [aiProvider, setAiProvider] = useState<AIProvider | ''>('');
    const [aiApiKey, setAiApiKey] = useState('');
    const [showApiKey, setShowApiKey] = useState(false);
    const [aiSaved, setAiSaved] = useState(false);

    const [gasUrl, setGasUrlLocal] = useState('');
    const [gasUrlSaved, setGasUrlSaved] = useState(false);

    useEffect(() => {
        const existing = getAIConfig();
        if (existing) {
            setAiProvider(existing.provider);
            setAiApiKey(existing.apiKey);
            setAiSaved(true);
        }
        const existingUrl = getGasUrl();
        if (existingUrl) {
            setGasUrlLocal(existingUrl);
            setGasUrlSaved(true);
        }
    }, []);

    const handleAccountChange = (accountId: string) => {
        setSelectedAccount(accountId);
        const boundUrl = ACCOUNT_GAS_URLS[accountId];
        if (boundUrl && !gasUrl) {
            setGasUrlLocal(boundUrl);
            setGasUrlSaved(false);
        }
    };

    const handleShapePress = (key: string) => {
        if (sequence.length >= 12) return;
        setSequence(prev => prev + key);
        setError(null);
    };

    const handleClear = () => {
        setSequence('');
        setError(null);
    };

    const handleBackspace = () => {
        setSequence(prev => prev.slice(0, -1));
        setError(null);
    };

    const handleLogin = async () => {
        if (!selectedAccount || !sequence) {
            setError('請選擇帳號並輸入密碼');
            return;
        }
        setLoading(true);
        setError(null);

        if (aiProvider && aiApiKey.trim()) {
            saveAIConfig({ provider: aiProvider as AIProvider, apiKey: aiApiKey.trim() });
        } else {
            clearAIConfig();
        }

        if (gasUrl.trim()) {
            saveGasUrl(gasUrl.trim());
        }

        try {
            const account = ACCOUNTS.find(a => a.id === selectedAccount);
            if (!account) throw new Error('Invalid account');

            const valid = await verifyPassword(selectedAccount, sequence);
            if (!valid) {
                setError('密碼錯誤');
                setSequence('');
                return;
            }

            saveSession(selectedAccount, account.label);
            navigate('/projects');
        } catch {
            setError('登入失敗');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 py-8">
            <div className="w-full max-w-sm space-y-6">
                <div className="flex flex-col items-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
                        <Package className="h-8 w-8 text-blue-600" />
                    </div>
                    <h2 className="mt-4 text-center text-2xl font-bold text-gray-900">
                        Storage Organizer
                    </h2>
                    <p className="mt-1 text-center text-sm text-gray-500">
                        選擇帳號，輸入符號密碼
                    </p>
                </div>

                {/* Account Selector */}
                <div className="relative">
                    <select
                        value={selectedAccount}
                        onChange={(e) => handleAccountChange(e.target.value)}
                        className="block w-full appearance-none rounded-lg border border-gray-300 bg-white px-4 py-3 pr-10 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 text-sm"
                    >
                        <option value="">請選擇帳號</option>
                        {ACCOUNTS.map((acc) => (
                            <option key={acc.id} value={acc.id}>{acc.label}</option>
                        ))}
                    </select>
                    <ChevronDown size={18} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>

                {/* Symbol Pad */}
                <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-4">
                    {/* Sequence Dots */}
                    <div className="flex items-center justify-center gap-2 min-h-[2rem]">
                        {sequence.split('').map((key, i) => {
                            const shape = SHAPES.find(s => s.key === key);
                            return (
                                <div
                                    key={i}
                                    className={`h-4 w-4 rounded-full ${shape?.className || 'bg-gray-300'}`}
                                />
                            );
                        })}
                        {sequence.length === 0 && (
                            <span className="text-sm text-gray-400">點擊下方符號</span>
                        )}
                    </div>

                    {/* Shape Buttons */}
                    <div className="grid grid-cols-4 gap-3">
                        {SHAPES.map((shape) => (
                            <button
                                key={shape.key}
                                onClick={() => handleShapePress(shape.key)}
                                className="flex h-16 items-center justify-center rounded-xl bg-gray-50 text-3xl font-bold active:scale-90 active:bg-gray-100 transition-all border border-gray-200 hover:border-gray-300"
                            >
                                <span className={`inline-block w-8 h-8 rounded-lg ${shape.className} opacity-80`}
                                    style={{
                                        clipPath: shape.key === '1' ? 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' :
                                            shape.key === '2' ? 'circle(50%)' :
                                                shape.key === '3' ? 'polygon(50% 0%, 100% 100%, 0% 100%)' :
                                                    'none',
                                        borderRadius: shape.key === '4' ? '4px' : undefined,
                                    }}
                                />
                            </button>
                        ))}
                    </div>

                    {/* Pad Actions */}
                    <div className="flex justify-between">
                        <button onClick={handleClear} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">
                            清除
                        </button>
                        <button onClick={handleBackspace} className="p-2 text-gray-500 hover:text-gray-700">
                            <Delete size={20} />
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="text-red-500 text-sm text-center">{error}</div>
                )}

                <button
                    onClick={handleLogin}
                    disabled={loading || !selectedAccount || !sequence}
                    className="flex w-full justify-center rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-50"
                >
                    {loading ? '登入中...' : '解鎖'}
                </button>

                {/* GAS URL Setting */}
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-600">Google Apps Script URL</span>
                        {gasUrlSaved && <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">已儲存</span>}
                    </div>
                    <input
                        type="url"
                        autoComplete="off"
                        data-lpignore="true"
                        data-form-type="other"
                        className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-xs text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                        placeholder="https://script.google.com/.../exec"
                        value={gasUrl}
                        onChange={(e) => { setGasUrlLocal(e.target.value); setGasUrlSaved(false); }}
                    />
                </div>

                {/* AI Settings */}
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 space-y-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                            <Sparkles size={14} className="text-amber-500" />
                            <span className="text-xs font-medium text-gray-600">AI 物件辨識（選填）</span>
                        </div>
                        {aiSaved && <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">已儲存</span>}
                    </div>

                    <div className="relative">
                        <select
                            value={aiProvider}
                            onChange={(e) => { setAiProvider(e.target.value as AIProvider | ''); setAiSaved(false); }}
                            className="block w-full appearance-none rounded-lg border border-gray-300 bg-white px-3 py-2 pr-10 text-xs text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">選擇 AI 供應商</option>
                            {AI_PROVIDERS.map((p) => (
                                <option key={p.value} value={p.value}>{p.label}</option>
                            ))}
                        </select>
                        <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    </div>

                    {aiProvider && (
                        <>
                            <div className="relative">
                                <input
                                    type={showApiKey ? 'text' : 'password'}
                                    className="block w-full rounded-lg border border-gray-300 px-3 py-2 pr-10 text-xs text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                                    placeholder="貼上 API Key"
                                    value={aiApiKey}
                                    onChange={(e) => { setAiApiKey(e.target.value); setAiSaved(false); }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowApiKey(!showApiKey)}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400"
                                >
                                    {showApiKey ? <EyeOff size={14} /> : <Eye size={14} />}
                                </button>
                            </div>
                            <Link to="/api-guide" className="text-xs text-blue-600 hover:underline">
                                如何取得 API Key？
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
