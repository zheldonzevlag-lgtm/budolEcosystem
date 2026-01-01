'use client';

import React from 'react';
import { usePathname } from 'next/navigation';

export default function MainContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';

  return (
    <main className={`flex-1 min-h-screen transition-all ${isLoginPage ? 'ml-0' : 'ml-64'}`}>
      <div className={isLoginPage ? '' : 'p-8'}>
        {children}
      </div>
    </main>
  );
}
