import React, { useState } from 'react';
import { Layers, Grid3x3, Search, Plus, LogOut } from 'lucide-react';
import { useStore } from '../store/useStore';
import { clearSession } from '../lib/auth';
import { useNavigate } from 'react-router-dom';
import { SearchModal } from '../components/SearchModal';
import { AddItemModal } from '../components/AddItemModal';

interface MobileLayoutProps {
    children: React.ReactNode;
}

export const MobileLayout: React.FC<MobileLayoutProps> = ({ children }) => {
    const { viewMode, setViewMode } = useStore();
    const [showSearch, setShowSearch] = useState(false);
    const [showAdd, setShowAdd] = useState(false);
    const navigate = useNavigate();

    const handleLogout = () => {
        clearSession();
        navigate('/login');
    };

    return (
        <div className="flex h-screen flex-col bg-gray-50">
            <div className="flex items-center justify-between border-b bg-white px-4 py-3 shadow-sm">
                <h1 className="text-lg font-bold text-gray-900">My Storage</h1>
                <div className="flex items-center gap-2">
                    <button onClick={() => setShowSearch(true)} className="rounded-full p-2 text-gray-500 hover:bg-gray-100"><Search size={20} /></button>
                    <button onClick={handleLogout} className="rounded-full p-2 text-gray-500 hover:bg-gray-100"><LogOut size={20} /></button>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto">
                {children}
            </div>
            <div className="flex items-center justify-around border-t bg-white px-4 py-2 safe-area-pb">
                <button onClick={() => setViewMode('hierarchy')} className={`flex flex-col items-center gap-1 p-2 ${viewMode === 'hierarchy' ? 'text-blue-600' : 'text-gray-400'}`}>
                    <Layers size={22} /><span className="text-xs">Browse</span>
                </button>
                <button onClick={() => setShowAdd(true)} className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg active:scale-95 -mt-4">
                    <Plus size={24} />
                </button>
                <button onClick={() => setViewMode('flat')} className={`flex flex-col items-center gap-1 p-2 ${viewMode === 'flat' ? 'text-blue-600' : 'text-gray-400'}`}>
                    <Grid3x3 size={22} /><span className="text-xs">All</span>
                </button>
            </div>
            <SearchModal isOpen={showSearch} onClose={() => setShowSearch(false)} />
            <AddItemModal isOpen={showAdd} onClose={() => setShowAdd(false)} />
        </div>
    );
};
