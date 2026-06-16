import React, { useState, useRef } from 'react';
import { X, Edit2, Trash2, Move, Share2, Camera, Sparkles, Loader2 } from 'lucide-react';
import type { Item } from '../types';
import { useStore } from '../store/useStore';
import { FolderPicker } from './FolderPicker';
import { uploadImage } from '../lib/imageUpload';
import { recognizeImage } from '../lib/aiRecognition';
import { getAIConfig } from '../lib/aiConfig';

interface ItemDetailModalProps {
    item: Item;
    onClose: () => void;
}

export const ItemDetailModal: React.FC<ItemDetailModalProps> = ({ item, onClose }) => {
    const { updateItem, deleteItem, moveItem, getPath } = useStore();
    const [editing, setEditing] = useState(false);
    const [name, setName] = useState(item.name);
    const [note, setNote] = useState(item.note || '');
    const [imageUrl, setImageUrl] = useState(item.imageUrl || '');
    const [showFolderPicker, setShowFolderPicker] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [recognizing, setRecognizing] = useState(false);
    const [error, setError] = useState('');
    const [newImageFile, setNewImageFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const path = getPath(item.id);

    const aiConfig = getAIConfig();
    const hasAI = !!(aiConfig?.provider && aiConfig?.apiKey);

    const handleSave = async () => {
        if (!name.trim()) return;
        setUploading(true);
        setError('');
        try {
            let finalImageUrl = imageUrl;
            if (newImageFile) {
                finalImageUrl = await uploadImage(newImageFile);
            }
            updateItem(item.id, { name: name.trim(), note: note.trim(), imageUrl: finalImageUrl });
            setEditing(false);
            setNewImageFile(null);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to save');
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = () => {
        if (confirm('Delete this item?')) {
            deleteItem(item.id);
            onClose();
        }
    };

    const handleMove = (newParentId: string | null) => {
        moveItem(item.id, newParentId);
    };

    const handleShare = async () => {
        const text = `${item.name}${item.note ? `\n${item.note}` : ''}`;
        if (navigator.share) {
            try { await navigator.share({ title: item.name, text, url: item.imageUrl || undefined }); } catch { /* cancelled */ }
        } else {
            await navigator.clipboard.writeText(text);
            alert('Copied to clipboard');
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setNewImageFile(file);
        const reader = new FileReader();
        reader.onloadend = () => setImageUrl(reader.result as string);
        reader.readAsDataURL(file);
    };

    const handleAIRecognize = async () => {
        const file = newImageFile;
        if (!file || !hasAI) return;
        setRecognizing(true);
        setError('');
        try {
            const result = await recognizeImage(file);
            if (result) setName(prev => prev ? `${prev} ${result}` : result);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'AI recognition failed');
        } finally {
            setRecognizing(false);
        }
    };

    return (
        <>
            <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center bg-black/60 backdrop-blur-sm">
                <div className="flex w-full max-w-md flex-col rounded-t-2xl bg-white shadow-xl sm:rounded-2xl max-h-[90vh] overflow-y-auto">
                    <div className="flex items-center justify-between border-b px-4 py-3">
                        <h2 className="text-lg font-semibold truncate">{editing ? 'Edit Item' : item.name}</h2>
                        <button onClick={onClose} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full"><X size={20} /></button>
                    </div>
                    <div className="p-4 space-y-4">
                        {editing ? (
                            <>
                                <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-gray-100">
                                    {imageUrl ? (
                                        <img src={imageUrl} alt="" className="w-full h-full object-contain" />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center text-gray-300"><Camera size={32} /></div>
                                    )}
                                    <button onClick={() => fileInputRef.current?.click()} className="absolute bottom-2 right-2 rounded-full bg-black/50 p-2 text-white"><Camera size={16} /></button>
                                </div>
                                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                                {newImageFile && hasAI && (
                                    <button onClick={handleAIRecognize} disabled={recognizing} className="flex items-center gap-2 rounded-lg bg-purple-100 px-4 py-2 text-sm font-medium text-purple-700 hover:bg-purple-200 disabled:opacity-50">
                                        {recognizing ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                                        {recognizing ? 'Recognizing...' : 'AI Recognize'}
                                    </button>
                                )}
                                <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                                <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none" />
                                {error && <p className="text-sm text-red-500">{error}</p>}
                                <div className="flex gap-2">
                                    <button onClick={() => { setEditing(false); setName(item.name); setNote(item.note || ''); setImageUrl(item.imageUrl || ''); setNewImageFile(null); }} className="flex-1 rounded-xl border py-3 font-medium text-gray-700">Cancel</button>
                                    <button onClick={handleSave} disabled={!name.trim() || uploading} className="flex-1 rounded-xl bg-blue-600 py-3 font-semibold text-white disabled:bg-gray-300">{uploading ? 'Saving...' : 'Save'}</button>
                                </div>
                            </>
                        ) : (
                            <>
                                {item.imageUrl && (
                                    <div className="w-full aspect-video rounded-xl overflow-hidden bg-gray-100">
                                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-contain" />
                                    </div>
                                )}
                                {item.note && <p className="text-sm text-gray-600 whitespace-pre-wrap">{item.note}</p>}
                                {path.length > 0 && (
                                    <p className="text-xs text-gray-400">Path: {path.map(p => p.name).join(' / ')}</p>
                                )}
                                <div className="grid grid-cols-4 gap-2">
                                    <button onClick={() => setEditing(true)} className="flex flex-col items-center gap-1 rounded-xl bg-gray-100 p-3 text-gray-700 hover:bg-gray-200 active:scale-95"><Edit2 size={18} /><span className="text-xs">Edit</span></button>
                                    <button onClick={() => setShowFolderPicker(true)} className="flex flex-col items-center gap-1 rounded-xl bg-gray-100 p-3 text-gray-700 hover:bg-gray-200 active:scale-95"><Move size={18} /><span className="text-xs">Move</span></button>
                                    <button onClick={handleShare} className="flex flex-col items-center gap-1 rounded-xl bg-gray-100 p-3 text-gray-700 hover:bg-gray-200 active:scale-95"><Share2 size={18} /><span className="text-xs">Share</span></button>
                                    <button onClick={handleDelete} className="flex flex-col items-center gap-1 rounded-xl bg-red-50 p-3 text-red-600 hover:bg-red-100 active:scale-95"><Trash2 size={18} /><span className="text-xs">Delete</span></button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
            {showFolderPicker && <FolderPicker isOpen={showFolderPicker} onClose={() => setShowFolderPicker(false)} itemToMove={item} onMove={handleMove} />}
        </>
    );
};
