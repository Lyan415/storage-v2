import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { useStore } from '../store/useStore';

export const Breadcrumbs: React.FC = () => {
    const { currentFolderId, getPath, navigateToFolder } = useStore();
    const path = currentFolderId ? getPath(currentFolderId) : [];

    return (
        <div className="flex items-center space-x-1 overflow-x-auto whitespace-nowrap px-1 py-3 text-sm text-gray-600 scrollbar-hide">
            <button
                onClick={() => navigateToFolder(null)}
                className={`flex items-center hover:text-blue-600 ${!currentFolderId ? 'font-bold text-blue-600' : ''}`}
            >
                <Home size={16} />
            </button>
            {path.map((item) => (
                <React.Fragment key={item.id}>
                    <ChevronRight size={14} className="text-gray-400" />
                    <button onClick={() => navigateToFolder(item.id)} className="hover:text-blue-600">
                        {item.name}
                    </button>
                </React.Fragment>
            ))}
            {currentFolderId && (
                <>
                    <ChevronRight size={14} className="text-gray-400" />
                    <span className="font-bold text-blue-600">
                        {useStore.getState().getItem(currentFolderId)?.name || 'Unknown'}
                    </span>
                </>
            )}
        </div>
    );
};
