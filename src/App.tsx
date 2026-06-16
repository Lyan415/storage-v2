import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginView } from './components/auth/LoginView';
import { AuthGuard } from './components/auth/AuthGuard';
import { ProjectListView } from './views/ProjectListView';
import { MainView } from './views/MainView';
import { ApiGuidePage } from './views/ApiGuidePage';

function App() {
    return (
        <BrowserRouter basename="/storage-v2">
            <Routes>
                <Route path="/login" element={<LoginView />} />
                <Route path="/api-guide" element={<ApiGuidePage />} />
                <Route path="/projects" element={<AuthGuard><ProjectListView /></AuthGuard>} />
                <Route path="/app" element={<AuthGuard><MainView /></AuthGuard>} />
                <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
