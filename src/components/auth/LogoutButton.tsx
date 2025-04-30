"use client";

import { useAuth } from '@/components/auth/AuthProvider';
import { useRouter } from 'next/navigation';

export default function LogoutButton() {
    const { logout } = useAuth();
    const router = useRouter();

    const handleLogout = async () => {
        try {
            await logout();
            router.push('/');
        } catch (err) {
            console.error('Logout failed:', err);
        }
    };

    return (
        <button
            onClick={handleLogout}
            className="w-full text-left px-4 py-2 text-gray-300 hover:bg-gray-700 hover:text-white rounded-lg transition duration-200"
        >
            Logout
        </button>
    );
}