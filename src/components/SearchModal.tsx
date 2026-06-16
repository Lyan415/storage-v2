import React, { useState, useEffect, useRef } from 'react';
import { X, Search as SearchIcon } from 'lucide-react';
import { useStore } from '../store/useStore';
import { ItemCard } from './ItemCard';
import { ItemDetailModal } from './ItemDetailModal';
import type { Item } from '../types';

interface SearchModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose }) => {
    const { items, getPath, navigateToFolder, setViewMode } = useStore();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Item[]>([]);
    const [selectedItem, setSelectedItem] = useState<Item | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
        } else {
            setQuery(''); setResults([]); setSelectedItem(null);
        }
    }, [isOpen]);

    useEffect(() => {
        if (!query.trim()) { setResults([]); return; }
        const lowerQuery = query.toLowerCase();
        setResults(items.filter(item =>
            item.name.toLowerCase().includes(lowerQuery) ||
            (item.note && item.note.toLowerCase().includes(lowerQuery))
        ));
    }, [query, items]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] bg-gray-50 animate-in fade-in duration-200 flex flex-col">
            <div className="flex items-center gap-2 border-b bg-white px-4 py-3 shadow-sm">
                <SearchIcon className="text-gray-400" size={20} />
                <input ref={inputRef} type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search items, notes..." className="flex-1 bg-transparent text-lg outline-none placeholder:text-gray-400" />
                <button onClick={onClose} className="rounded-full bg-gray-100 p-2 text-gray-500 hover:bg-gray-200"><X size={20} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
                {!query.trim() ? (
                    <div className="mt-20 flex flex-col items-center justify-center text-gray-400">
                        <SearchIcon size={48} className="mb-4 opacity-20" /><p>Type to search...</p>
                    </div>
                ) : results.length === 0 ? (
                    <div className="mt-20 text-center text-gray-500">No results found for "{query}"</div>
                ) : (
                    <div className="space-y-3">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Found {results.length} items</p>
                        {results.map(item => (
                            <ItemCard key={item.id} item={item} variant="list" onClick={(i) => setSelectedItem(i)} showPath={true} path={getPath(item.id)} onPathClick={(fid) => { navigateToFolder(fid); setViewMode('hierarchy'); onClose(); }} />
                        ))}
                    </div>
                )}
            </div>
            {selectedItem && <ItemDetailModal item={selectedItem} onClose={() => setSelectedItem(null)} />}
        </div>
    );
};
