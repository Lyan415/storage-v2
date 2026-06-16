import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { ItemCard } from '../components/ItemCard';
import { ItemDetailModal } from '../components/ItemDetailModal';
import type { Item } from '../types';

export const FlatView: React.FC = () => {
    const { items, getPath, navigateToFolder, setViewMode } = useStore();
    const [selectedItem, setSelectedItem] = useState<Item | null>(null);

    const sorted = [...items].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return (
        <div className="flex flex-col h-full">
            <div className="px-4 py-3">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">All Items ({items.length})</h2>
            </div>
            <div className="flex-1 overflow-y-auto px-3 pb-4">
                {sorted.length === 0 ? (
                    <div className="mt-20 text-center text-gray-400">
                        <p className="text-lg">No items yet</p>
                        <p className="text-sm mt-1">Tap + to add your first item</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {sorted.map(item => (
                            <ItemCard key={item.id} item={item} variant="list" onClick={(i) => setSelectedItem(i)} onLongPress={(i) => setSelectedItem(i)} showPath={true} path={getPath(item.id)} onPathClick={(fid) => { navigateToFolder(fid); setViewMode('hierarchy'); }} />
                        ))}
                    </div>
                )}
            </div>
            {selectedItem && <ItemDetailModal item={selectedItem} onClose={() => setSelectedItem(null)} />}
        </div>
    );
};
