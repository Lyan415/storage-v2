import React, { useState, useRef, useCallback } from 'react';
import { Folder, Image as ImageIcon, ChevronRight, Home, Edit2 } from 'lucide-react';
import type { Item } from '../types';
import { twMerge } from 'tailwind-merge';

interface ItemCardProps {
    item: Item;
    onClick: (item: Item) => void;
    onLongPress?: (item: Item) => void;
    variant?: 'grid' | 'list';
    showPath?: boolean;
    path?: Item[];
    onPathClick?: (folderId: string | null) => void;
}

export const ItemCard: React.FC<ItemCardProps> = ({
    item, onClick, onLongPress, variant = 'grid',
    showPath = false, path = [], onPathClick
}) => {
    const [hasError, setHasError] = useState(false);
    const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const didLongPress = useRef(false);

    const handleTouchStart = useCallback(() => {
        if (!onLongPress) return;
        didLongPress.current = false;
        longPressTimer.current = setTimeout(() => {
            didLongPress.current = true;
            onLongPress(item);
        }, 500);
    }, [item, onLongPress]);

    const handleTouchEnd = useCallback(() => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
    }, []);

    const handleClick = () => {
        if (didLongPress.current) { didLongPress.current = false; return; }
        onClick(item);
    };

    const handleEditClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onLongPress?.(item);
    };

    const handlePathClick = (e: React.MouseEvent, folderId: string | null) => {
        e.stopPropagation();
        onPathClick?.(folderId);
    };

    return (
        <div
            onClick={handleClick}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
            className={twMerge(
                "group relative overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition-all active:scale-95",
                variant === 'grid' ? "aspect-square flex flex-col" : "flex items-center p-3 h-auto min-h-[5rem]"
            )}
        >
            <div className={twMerge(
                "relative overflow-hidden bg-gray-50 flex items-center justify-center group flex-grow w-full",
                variant === 'grid' ? "" : "h-14 w-14 rounded-lg flex-shrink-0"
            )}>
                {item.imageUrl && !hasError ? (
                    <>
                        <img src={item.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover opacity-30 blur-sm scale-110" loading="lazy" />
                        <img src={item.imageUrl} alt={item.name} className="relative h-full w-full object-contain z-10 transition-transform duration-300 group-hover:scale-105" loading="lazy" onError={() => setHasError(true)} />
                    </>
                ) : (
                    <div className="flex h-full w-full items-center justify-center text-gray-300 relative z-10">
                        <ImageIcon size={variant === 'grid' ? 32 : 24} />
                    </div>
                )}
                <div className="absolute top-2 right-2 z-20 flex gap-1">
                    {onLongPress && (
                        <button onClick={handleEditClick} className="rounded-full bg-black/50 p-1.5 text-white backdrop-blur-sm hover:bg-black/70 transition-colors" title="Edit">
                            <Edit2 size={12} />
                        </button>
                    )}
                    <div className="rounded-full bg-black/50 p-1 text-white backdrop-blur-sm">
                        <Folder size={12} />
                    </div>
                </div>
            </div>
            <div className={twMerge(
                "flex flex-col justify-center min-w-0 w-full bg-white relative z-30",
                variant === 'grid' ? "h-auto py-2 px-3 shrink-0" : "ml-3 flex-1"
            )}>
                <h3 className="truncate text-sm font-medium text-gray-900 w-full">{item.name}</h3>
                {showPath && (path.length > 0 || onPathClick) && (
                    <div className="mt-1 flex flex-wrap items-center gap-1 text-xs text-gray-500 w-full">
                        <button onClick={(e) => handlePathClick(e, null)} className="flex items-center hover:text-blue-600 hover:underline px-1 rounded transition-colors">
                            <Home size={10} className="mr-0.5" />Root
                        </button>
                        {path.map((pathItem) => (
                            <React.Fragment key={pathItem.id}>
                                <ChevronRight size={10} className="text-gray-300 flex-shrink-0" />
                                <button onClick={(e) => handlePathClick(e, pathItem.id)} className="truncate max-w-[80px] hover:text-blue-600 hover:underline px-1 rounded transition-colors">
                                    {pathItem.name}
                                </button>
                            </React.Fragment>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
