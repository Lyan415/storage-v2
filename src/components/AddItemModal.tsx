import React, { useState, useRef } from 'react';
import { X, Camera, Sparkles, Loader2 } from 'lucide-react';
import { useStore } from '../store/useStore';
import { uploadImage } from '../lib/imageUpload';
import { recognizeImage } from '../lib/aiRecognition';
import { getAIConfig } from '../lib/aiConfig';
interface AddItemModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const AddItemModal: React.FC<AddItemModalProps> = ({ isOpen, onClose }) => {
    const { addItem, currentFolderId, currentProjectId } = useStore();
    const [name, setName] = useState('');
    const [note, setNote] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [recognizing, setRecognizing] = useState(false);
    const [error, setError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const aiConfig = getAIConfig();
    const hasAI = !!(aiConfig?.provider && aiConfig?.apiKey);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setImageFile(file);
        const reader = new FileReader();
        reader.onloadend = () => setImagePreview(reader.result as string);
        reader.readAsDataURL(file);
    };

    const handleAIRecognize = async () => {
        if (!imageFile || !hasAI) return;
        setRecognizing(true);
        setError('');
        try {
            const result = await recognizeImage(imageFile);
            if (result) setName(prev => prev ? `${prev} ${result}` : result);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'AI recognition failed');
        } finally {
            setRecognizing(false);
        }
    };

    const handleSubmit = async () => {
        if (!name.trim()) return;
        setUploading(true);
        setError('');
        try {
            let imageUrl = '';
            if (imageFile) {
                imageUrl = await uploadImage(imageFile);
            }
            addItem({
                name: name.trim(),
                note: note.trim(),
                imageUrl,
                parentId: currentFolderId,
                projectId: currentProjectId || 'default',
            });
            setName(''); setNote(''); setImageFile(null); setImagePreview(null);
            onClose();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to add item');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center bg-black/60 backdrop-blur-sm">
            <div className="flex w-full max-w-md flex-col rounded-t-2xl bg-white shadow-xl sm:rounded-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between border-b px-4 py-3">
                    <h2 className="text-lg font-semibold">Add Item</h2>
                    <button onClick={onClose} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full"><X size={20} /></button>
                </div>
                <div className="p-4 space-y-4">
                    <div className="flex flex-col items-center gap-3">
                        {imagePreview ? (
                            <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-gray-100">
                                <img src={imagePreview} alt="Preview" className="w-full h-full object-contain" />
                                <button onClick={() => { setImageFile(null); setImagePreview(null); }} className="absolute top-2 right-2 rounded-full bg-black/50 p-1 text-white"><X size={16} /></button>
                            </div>
                        ) : (
                            <button onClick={() => fileInputRef.current?.click()} className="flex w-full aspect-video items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 text-gray-400 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-500 transition-colors">
                                <Camera size={32} />
                            </button>
                        )}
                        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                        {imageFile && hasAI && (
                            <button onClick={handleAIRecognize} disabled={recognizing} className="flex items-center gap-2 rounded-lg bg-purple-100 px-4 py-2 text-sm font-medium text-purple-700 hover:bg-purple-200 disabled:opacity-50 transition-colors">
                                {recognizing ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                                {recognizing ? 'Recognizing...' : 'AI Recognize'}
                            </button>
                        )}
                    </div>
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Item name" className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                    <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note (optional)" rows={3} className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none" />
                    {error && <p className="text-sm text-red-500">{error}</p>}
                    <button onClick={handleSubmit} disabled={!name.trim() || uploading} className="w-full rounded-xl bg-blue-600 py-3 font-semibold text-white shadow-md hover:bg-blue-700 active:scale-95 disabled:bg-gray-300 transition-all">
                        {uploading ? 'Uploading...' : 'Add Item'}
                    </button>
                </div>
            </div>
        </div>
    );
};
