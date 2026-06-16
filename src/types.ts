export interface Item {
    id: string;
    name: string;
    imageUrl?: string | null;
    note?: string | null;
    parentId: string | null;
    projectId: string;
    createdAt: string;
}

export interface Project {
    id: string;
    name: string;
    ownerId: string;
    createdAt: string;
}

export type ViewMode = 'hierarchy' | 'flat';

export interface Account {
    label: string;
    id: string;
}
