"use client";

import { AuthProvider } from '@/components/auth/AuthProvider';
import Navigation from '@/components/Navigation';
import { usePathname } from 'next/navigation';

export default function ClientWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname === '/login' || pathname === '/register' || pathname === '/';

  return (
    <AuthProvider>
      <div className="flex min-h-screen">
        {!isAuthPage && <Navigation />}
        <main className={`flex-1 overflow-y-auto ${isAuthPage ? '' : 'pl-0 lg:pl-64'}`}>
          {children}
        </main>
      </div>
    </AuthProvider>
  );
}
