import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { ItemCard } from '../components/ItemCard';
import { ItemDetailModal } from '../components/ItemDetailModal';
import type { Item } from '../types';

export const HierarchyView: React.FC = () => {
    const { currentFolderId, getItemsInFolder, navigateToFolder } = useStore();
    const items = getItemsInFolder(currentFolderId);
    const [selectedItem, setSelectedItem] = useState<Item | null>(null);

    const handleClick = (item: Item) => {
        navigateToFolder(item.id);
    };

    return (
        <div className="flex flex-col h-full">
            <div className="px-3">
                <Breadcrumbs />
            </div>
            <div className="flex-1 overflow-y-auto px-3 pb-4">
                {items.length === 0 ? (
                    <div className="mt-20 text-center text-gray-400">
                        <p className="text-lg">Empty</p>
                        <p className="text-sm mt-1">Tap + to add items</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {items.map(item => (
                            <ItemCard key={item.id} item={item} variant="grid" onClick={handleClick} onLongPress={(i) => setSelectedItem(i)} />
                        ))}
                    </div>
                )}
            </div>
            {selectedItem && <ItemDetailModal item={selectedItem} onClose={() => setSelectedItem(null)} />}
        </div>
    );
};
