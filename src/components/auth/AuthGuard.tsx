import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { getSession } from '../../lib/auth';

interface AuthGuardProps {
    children: React.ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
    const { setAccountId } = useStore();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const session = getSession();
        if (!session) {
            navigate('/login');
        } else {
            setAccountId(session.accountId);
        }
        setLoading(false);
    }, [setAccountId, navigate]);

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50">
                <div className="text-gray-500">Loading...</div>
            </div>
        );
    }

    return <>{children}</>;
};
