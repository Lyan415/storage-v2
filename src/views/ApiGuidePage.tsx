import React from 'react';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const ApiGuidePage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="flex items-center gap-3 border-b bg-white px-4 py-3 shadow-sm">
                <button onClick={() => navigate(-1)} className="rounded-full p-2 hover:bg-gray-100"><ArrowLeft size={20} /></button>
                <h1 className="text-lg font-bold">API Key Guide</h1>
            </div>
            <div className="max-w-md mx-auto p-4 space-y-6">
                <section className="rounded-xl bg-white p-4 shadow-sm space-y-3">
                    <h2 className="text-base font-bold text-purple-700">Claude (Anthropic)</h2>
                    <p className="text-sm text-gray-600">Recommended for Traditional Chinese output.</p>
                    <ol className="list-decimal list-inside text-sm text-gray-700 space-y-2">
                        <li>Visit <a href="https://console.anthropic.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">console.anthropic.com <ExternalLink size={12} className="inline" /></a></li>
                        <li>Sign up or log in</li>
                        <li>Go to "API Keys" section</li>
                        <li>Click "Create Key" and copy it</li>
                        <li>Add credits ($5 minimum) under Billing</li>
                    </ol>
                    <p className="text-xs text-gray-500">Model used: claude-haiku-4-5 (fast & affordable)</p>
                </section>

                <section className="rounded-xl bg-white p-4 shadow-sm space-y-3">
                    <h2 className="text-base font-bold text-blue-700">OpenAI</h2>
                    <ol className="list-decimal list-inside text-sm text-gray-700 space-y-2">
                        <li>Visit <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">platform.openai.com <ExternalLink size={12} className="inline" /></a></li>
                        <li>Sign up or log in</li>
                        <li>Click "Create new secret key"</li>
                        <li>Copy and save the key</li>
                        <li>Add credits under Billing</li>
                    </ol>
                    <p className="text-xs text-gray-500">Model used: gpt-4o-mini</p>
                </section>

                <section className="rounded-xl bg-white p-4 shadow-sm space-y-3">
                    <h2 className="text-base font-bold text-green-700">Google Gemini</h2>
                    <ol className="list-decimal list-inside text-sm text-gray-700 space-y-2">
                        <li>Visit <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">AI Studio <ExternalLink size={12} className="inline" /></a></li>
                        <li>Sign in with Google account</li>
                        <li>Click "Create API Key"</li>
                        <li>Select a project and copy the key</li>
                    </ol>
                    <p className="text-xs text-gray-500">Model used: gemini-2.0-flash (free tier available but may have regional limits)</p>
                </section>
            </div>
        </div>
    );
};
