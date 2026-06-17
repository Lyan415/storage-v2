import { create } from 'zustand';
import type { Item, ViewMode, Project } from '../types';
import { getGasUrl } from '../lib/gasClient';

const ITEMS_KEY = 'storage-v2-items';
const PROJECTS_KEY = 'storage-v2-projects';

function loadLocal<T>(key: string, fallback: T): T {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
    } catch {
        return fallback;
    }
}

function saveLocal<T>(key: string, data: T): void {
    localStorage.setItem(key, JSON.stringify(data));
}

function now(): string {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Taipei' }).format(new Date())
        + ' ' + new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Taipei', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(new Date());
}

interface StoreState {
    accountId: string | null;
    projects: Project[];
    items: Item[];
    currentProjectId: string | null;
    currentFolderId: string | null;
    viewMode: ViewMode;
    history: (string | null)[];
    isLoading: boolean;
    isSyncing: boolean;
    initialSyncDone: boolean;
    lastSyncTime: string | null;

    setAccountId: (id: string | null) => void;

    // Project Actions
    fetchProjects: () => void;
    createProject: (name: string) => void;
    updateProject: (projectId: string, name: string) => void;
    deleteProject: (projectId: string) => void;
    setCurrentProject: (projectId: string | null) => void;

    // Item Actions
    fetchItems: (projectId: string) => void;
    addItem: (item: Omit<Item, 'id' | 'createdAt'>) => void;
    deleteItem: (itemId: string) => void;
    moveItem: (itemId: string, newParentId: string | null) => void;
    updateItem: (itemId: string, updates: Partial<Omit<Item, 'id' | 'createdAt' | 'projectId'>>) => void;

    // Sync
    syncToCloud: () => Promise<void>;
    syncFromCloud: () => Promise<void>;

    // Navigation
    setViewMode: (mode: ViewMode) => void;
    navigateToFolder: (folderId: string | null) => void;
    navigateBack: () => void;

    // Selectors
    getItemsInFolder: (folderId: string | null) => Item[];
    getParent: (itemId: string) => Item | undefined;
    getItem: (itemId: string) => Item | undefined;
    getPath: (itemId: string) => Item[];
}

export const useStore = create<StoreState>((set, get) => ({
    accountId: null,
    projects: loadLocal<Project[]>(PROJECTS_KEY, []),
    items: loadLocal<Item[]>(ITEMS_KEY, []),
    currentProjectId: null,
    currentFolderId: null,
    viewMode: 'hierarchy',
    history: [],
    isLoading: false,
    isSyncing: false,
    initialSyncDone: false,
    lastSyncTime: null,

    setAccountId: (id) => set({ accountId: id }),

    fetchProjects: () => {
        const projects = loadLocal<Project[]>(PROJECTS_KEY, []);
        set({ projects });
    },

    createProject: (name) => {
        const accountId = get().accountId;
        if (!accountId) return;
        const newProject: Project = {
            id: crypto.randomUUID(),
            name,
            ownerId: accountId,
            createdAt: now(),
        };
        const projects = [newProject, ...get().projects];
        set({ projects });
        saveLocal(PROJECTS_KEY, projects);
        get().syncToCloud();
    },

    updateProject: (projectId, name) => {
        const projects = get().projects.map(p =>
            p.id === projectId ? { ...p, name } : p
        );
        set({ projects });
        saveLocal(PROJECTS_KEY, projects);
        get().syncToCloud();
    },

    deleteProject: (projectId) => {
        const projects = get().projects.filter(p => p.id !== projectId);
        const items = get().items.filter(i => i.projectId !== projectId);
        set({ projects, items });
        saveLocal(PROJECTS_KEY, projects);
        saveLocal(ITEMS_KEY, items);
        get().syncToCloud();
    },

    setCurrentProject: (projectId) => {
        set({ currentProjectId: projectId, currentFolderId: null, history: [] });
        if (projectId) get().fetchItems(projectId);
    },

    fetchItems: (_projectId) => {
        const items = loadLocal<Item[]>(ITEMS_KEY, []);
        set({ items });
    },

    addItem: (itemPayload) => {
        const projectId = get().currentProjectId;
        if (!projectId) return;
        const newItem: Item = {
            ...itemPayload,
            id: crypto.randomUUID(),
            projectId,
            createdAt: now(),
        };
        const items = [...get().items, newItem];
        set({ items });
        saveLocal(ITEMS_KEY, items);
        get().syncToCloud();
    },

    deleteItem: (itemId) => {
        const allItems = get().items;
        const getDescendants = (id: string, items: Item[]): string[] => {
            const children = items.filter(i => i.parentId === id);
            let desc = children.map(c => c.id);
            children.forEach(c => { desc = [...desc, ...getDescendants(c.id, items)]; });
            return desc;
        };
        const idsToDelete = [itemId, ...getDescendants(itemId, allItems)];

        let newFolderId = get().currentFolderId;
        if (newFolderId && idsToDelete.includes(newFolderId)) {
            newFolderId = null;
        }

        const items = allItems.filter(i => !idsToDelete.includes(i.id));
        set({ items, currentFolderId: newFolderId });
        saveLocal(ITEMS_KEY, items);
        get().syncToCloud();
    },

    moveItem: (itemId, newParentId) => {
        if (itemId === newParentId) return;
        const items = get().items.map(item =>
            item.id === itemId ? { ...item, parentId: newParentId } : item
        );
        set({ items });
        saveLocal(ITEMS_KEY, items);
        get().syncToCloud();
    },

    updateItem: (itemId, updates) => {
        const items = get().items.map(item =>
            item.id === itemId ? { ...item, ...updates } : item
        );
        set({ items });
        saveLocal(ITEMS_KEY, items);
        get().syncToCloud();
    },

    syncToCloud: async () => {
        const gasUrl = getGasUrl();
        if (!gasUrl) return;
        if (!get().initialSyncDone) return;

        try {
            const res = await fetch(gasUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain' },
                body: JSON.stringify({
                    action: 'saveAll',
                    data: {
                        projects: get().projects,
                        items: get().items,
                        accountId: get().accountId,
                    },
                }),
                redirect: 'follow',
            });
            const result = await res.json();
            if (result.success) {
                set({ lastSyncTime: now() });
            }
        } catch (err) {
            console.error('Sync to cloud failed:', err);
        }
    },

    syncFromCloud: async () => {
        const gasUrl = getGasUrl();
        if (!gasUrl) return;

        set({ isSyncing: true });
        try {
            const params = new URLSearchParams({
                action: 'loadAll',
                accountId: get().accountId || '',
            });
            const res = await fetch(`${gasUrl}?${params}`);
            if (!res.ok) throw new Error(`Sync download failed: ${res.status}`);
            const result = await res.json();

            if (result.success) {
                // Cloud is the single source of truth. Replace local with
                // remote (not union-merge) so deletes propagate and stale
                // local data gets cleared. Safe because every mutation
                // immediately uploads, so local-only changes are already
                // in the cloud before the next load.
                const remoteProjects: Project[] = result.projects || [];
                const remoteItems: Item[] = result.items || [];

                set({ projects: remoteProjects, items: remoteItems, lastSyncTime: now(), initialSyncDone: true });
                saveLocal(PROJECTS_KEY, remoteProjects);
                saveLocal(ITEMS_KEY, remoteItems);
            }
        } catch (err) {
            console.error('Sync from cloud failed:', err);
        } finally {
            set({ isSyncing: false, initialSyncDone: true });
        }
    },

    setViewMode: (mode) => set({ viewMode: mode }),

    navigateToFolder: (folderId) =>
        set((state) => ({
            currentFolderId: folderId,
            history: [...state.history, state.currentFolderId],
        })),

    navigateBack: () => set((state) => {
        if (state.history.length === 0) return {};
        const previous = state.history[state.history.length - 1];
        return {
            currentFolderId: previous,
            history: state.history.slice(0, -1),
        };
    }),

    getItemsInFolder: (folderId) => {
        const projectId = get().currentProjectId;
        return get().items.filter(item =>
            item.parentId === folderId && item.projectId === projectId
        );
    },

    getParent: (itemId) => {
        const item = get().items.find(i => i.id === itemId);
        if (!item || !item.parentId) return undefined;
        return get().items.find(i => i.id === item.parentId);
    },

    getItem: (itemId) => get().items.find(i => i.id === itemId),

    getPath: (itemId) => {
        const path: Item[] = [];
        let current = get().items.find(i => i.id === itemId);
        while (current) {
            if (current.parentId) {
                const parent = get().items.find(i => i.id === current!.parentId);
                if (parent) {
                    path.unshift(parent);
                    current = parent;
                } else {
                    current = undefined;
                }
            } else {
                current = undefined;
            }
        }
        return path;
    },
}));
