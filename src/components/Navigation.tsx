'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from './auth/AuthProvider';

export default function Navigation() {
  const pathname = usePathname();
  const { user } = useAuth();

  if (!user) return null;

  const navItems = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/statistics', label: 'Statistics' }
  ];

  return (
    <aside className="fixed top-0 left-0 w-64 h-screen bg-gray-900 text-white flex flex-col border-r border-gray-800 z-10">
      <div className="text-2xl font-bold px-6 py-4 border-b border-gray-700">Finndash</div>
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`block px-4 py-2 rounded-md transition ${
              pathname === item.href
                ? 'bg-blue-600 text-white'
                : 'hover:bg-gray-800 text-gray-300'
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      {/* <button
        onClick={() => auth.signOut()}
        className="m-4 px-4 py-2 rounded-md bg-red-600 hover:bg-red-700 transition"
      >
        Sign Out
      </button> */}
    </aside>
  );
}