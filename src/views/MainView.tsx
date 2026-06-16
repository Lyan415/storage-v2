import React from 'react';
import { useStore } from '../store/useStore';
import { MobileLayout } from '../layouts/MobileLayout';
import { HierarchyView } from './HierarchyView';
import { FlatView } from './FlatView';

export const MainView: React.FC = () => {
    const { viewMode } = useStore();

    return (
        <MobileLayout>
            {viewMode === 'hierarchy' ? <HierarchyView /> : <FlatView />}
        </MobileLayout>
    );
};
