import React, { useState } from 'react';
import { X, Folder, ChevronRight, Check } from 'lucide-react';
import { useStore } from '../store/useStore';
import type { Item } from '../types';

interface FolderPickerProps {
    isOpen: boolean;
    onClose: () => void;
    itemToMove: Item;
    onMove: (newParentId: string | null) => void;
}

export const FolderPicker: React.FC<FolderPickerProps> = ({ isOpen, onClose, itemToMove, onMove }) => {
    const { getItemsInFolder, getParent } = useStore();
    const [currentPickerFolderId, setCurrentPickerFolderId] = useState<string | null>(null);
    const currentFolder = useStore(state => state.getItem(currentPickerFolderId || ''));
    const items = getItemsInFolder(currentPickerFolderId);

    if (!isOpen) return null;

    const handleNavigate = (folderId: string) => {
        if (folderId === itemToMove.id) return;
        setCurrentPickerFolderId(folderId);
    };

    const handleNavigateUp = () => {
        if (!currentPickerFolderId) return;
        const parent = getParent(currentPickerFolderId);
        setCurrentPickerFolderId(parent ? parent.id : null);
    };

    const isCurrentLocationTheItemItself = currentPickerFolderId === itemToMove.id;

    return (
        <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center bg-black/60 backdrop-blur-sm">
            <div className="flex h-[80vh] w-full max-w-md flex-col rounded-t-2xl bg-white shadow-xl sm:h-[600px] sm:rounded-2xl">
                <div className="flex flex-shrink-0 items-center justify-between border-b px-4 py-3">
                    <div><h2 className="text-lg font-semibold">Move "{itemToMove.name}"</h2><p className="text-xs text-gray-500">Select destination</p></div>
                    <button onClick={onClose} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full"><X size={20} /></button>
                </div>
                <div className="flex flex-shrink-0 items-center gap-2 border-b bg-gray-50 px-4 py-2">
                    {currentPickerFolderId ? (
                        <button onClick={handleNavigateUp} className="flex items-center text-sm font-medium text-blue-600"><ChevronRight className="rotate-180 mr-1" size={16} />Back</button>
                    ) : (<span className="text-sm font-medium text-gray-400">Root</span>)}
                    <span className="text-gray-300">|</span>
                    <span className="truncate text-sm font-medium text-gray-900">{currentFolder?.name || 'My Space'}</span>
                </div>
                <div className="flex-1 overflow-y-auto p-2">
                    {items.length === 0 ? (
                        <div className="mt-10 text-center text-sm text-gray-400">No items here</div>
                    ) : (
                        <div className="space-y-1">
                            {items.map(item => {
                                const isItemItself = item.id === itemToMove.id;
                                return (
                                    <button key={item.id} onClick={() => handleNavigate(item.id)} disabled={isItemItself} className={`flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors ${isItemItself ? 'opacity-50 cursor-not-allowed bg-gray-50' : 'hover:bg-gray-100 active:bg-gray-200'}`}>
                                        <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-md bg-gray-200">
                                            {item.imageUrl ? <img src={item.imageUrl} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center"><Folder size={16} className="text-gray-400" /></div>}
                                        </div>
                                        <div className="flex-1 truncate font-medium text-gray-900">{item.name}</div>
                                        <ChevronRight size={16} className="text-gray-400" />
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
                <div className="flex flex-shrink-0 flex-col gap-2 border-t p-4">
                    <div className="text-center text-xs text-gray-500 mb-2">Moving to: <span className="font-semibold">{currentFolder?.name || 'Root'}</span></div>
                    <button onClick={() => { onMove(currentPickerFolderId); onClose(); }} disabled={isCurrentLocationTheItemItself} className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 font-semibold text-white shadow-md active:scale-95 disabled:bg-gray-300">
                        <Check size={18} />Move Here
                    </button>
                </div>
            </div>
        </div>
    );
};
