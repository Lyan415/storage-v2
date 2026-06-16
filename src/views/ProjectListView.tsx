import React, { useState, useEffect } from 'react';
import { Plus, Folder, Trash2, Edit2, LogOut, RefreshCw } from 'lucide-react';
import { useStore } from '../store/useStore';
import { clearSession } from '../lib/auth';
import { useNavigate } from 'react-router-dom';

export const ProjectListView: React.FC = () => {
    const { projects, createProject, updateProject, deleteProject, setCurrentProject, syncFromCloud, syncToCloud, isSyncing } = useStore();
    const [showCreate, setShowCreate] = useState(false);
    const [newName, setNewName] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingName, setEditingName] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        useStore.getState().fetchProjects();
    }, []);

    const handleCreate = () => {
        if (!newName.trim()) return;
        createProject(newName.trim());
        setNewName('');
        setShowCreate(false);
    };

    const handleSelect = (projectId: string) => {
        setCurrentProject(projectId);
        navigate('/app');
    };

    const handleSync = async () => {
        await syncFromCloud();
        await syncToCloud();
    };

    const handleLogout = () => {
        clearSession();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="flex items-center justify-between border-b bg-white px-4 py-3 shadow-sm">
                <h1 className="text-lg font-bold">My Projects</h1>
                <div className="flex items-center gap-2">
                    <button onClick={handleSync} disabled={isSyncing} className="rounded-full p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-50">
                        <RefreshCw size={20} className={isSyncing ? 'animate-spin' : ''} />
                    </button>
                    <button onClick={handleLogout} className="rounded-full p-2 text-gray-500 hover:bg-gray-100"><LogOut size={20} /></button>
                </div>
            </div>
            <div className="max-w-md mx-auto p-4 space-y-3">
                {projects.length === 0 && !showCreate && (
                    <div className="text-center py-16 text-gray-400">
                        <Folder size={48} className="mx-auto mb-4 opacity-30" />
                        <p>No projects yet</p>
                        <p className="text-sm mt-1">Create one to get started</p>
                    </div>
                )}
                {projects.map(project => (
                    <div key={project.id} className="flex items-center gap-3 rounded-xl bg-white p-4 shadow-sm border border-gray-100">
                        {editingId === project.id ? (
                            <div className="flex flex-1 items-center gap-2">
                                <input type="text" value={editingName} onChange={(e) => setEditingName(e.target.value)} className="flex-1 rounded-lg border px-3 py-2 text-sm" autoFocus onKeyDown={(e) => { if (e.key === 'Enter') { updateProject(project.id, editingName.trim()); setEditingId(null); } }} />
                                <button onClick={() => { updateProject(project.id, editingName.trim()); setEditingId(null); }} className="text-blue-600 text-sm font-medium">Save</button>
                                <button onClick={() => setEditingId(null)} className="text-gray-500 text-sm">Cancel</button>
                            </div>
                        ) : (
                            <>
                                <button onClick={() => handleSelect(project.id)} className="flex flex-1 items-center gap-3 text-left">
                                    <Folder size={20} className="text-blue-500" />
                                    <span className="font-medium text-gray-900">{project.name}</span>
                                </button>
                                <button onClick={() => { setEditingId(project.id); setEditingName(project.name); }} className="p-2 text-gray-400 hover:text-gray-600"><Edit2 size={16} /></button>
                                <button onClick={() => { if (confirm(`Delete "${project.name}"?`)) deleteProject(project.id); }} className="p-2 text-gray-400 hover:text-red-500"><Trash2 size={16} /></button>
                            </>
                        )}
                    </div>
                ))}
                {showCreate ? (
                    <div className="flex items-center gap-2 rounded-xl bg-white p-4 shadow-sm border border-blue-200">
                        <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Project name" className="flex-1 rounded-lg border px-3 py-2 text-sm" autoFocus onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); }} />
                        <button onClick={handleCreate} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white">Create</button>
                        <button onClick={() => { setShowCreate(false); setNewName(''); }} className="text-gray-500 text-sm">Cancel</button>
                    </div>
                ) : (
                    <button onClick={() => setShowCreate(true)} className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 bg-white p-4 text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors">
                        <Plus size={20} /><span className="font-medium">New Project</span>
                    </button>
                )}
            </div>
        </div>
    );
};
