'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useIdleTimeout } from '@/hooks/useIdleTimeout';

/**
 * SessionProvider - Global component to manage user session lifecycle.
 * In v43.3, it handles auto-logout on inactivity and ensures a forensic audit log 
 * is broadcasted to the dashboard.
 */
export default function SessionProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  
  // 15-minute timeout for Admin staff (BSP & PCI-DSS compliance)
  const { isIdle, isWarning } = useIdleTimeout({
    timeoutMs: 15 * 60 * 1000,
    warningMs: 14 * 60 * 1000
  });

  useEffect(() => {
    if (isIdle && pathname !== '/login') {
      console.log('[SessionProvider] User idle detected. Triggering forensic logout sync...');
      
      const performAutoLogout = async () => {
        try {
          const response = await fetch('/api/auth/logout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reason: 'TIMEOUT' })
          });

          if (response.ok) {
            // Redirect to login with a message
            router.push('/login?message=Session timed out due to inactivity');
            router.refresh(); // Clear any cached layout states
          }
        } catch (error) {
          console.error('[SessionProvider] Auto-logout failed:', error);
          // Fallback redirect if API fails
          router.push('/login');
        }
      };

      performAutoLogout();
    }
  }, [isIdle, pathname, router]);

  return (
    <>
      {children}
      {isWarning && pathname !== '/login' && (
        <div className="fixed bottom-4 right-4 z-[9999] bg-amber-100 border border-amber-300 p-4 rounded-lg shadow-xl animate-bounce">
          <p className="text-amber-800 text-sm font-bold">
            ⚠️ Session Timeout Warning
          </p>
          <p className="text-amber-700 text-xs">
            Your session will expire in 1 minute due to inactivity. Move your mouse to stay logged in.
          </p>
        </div>
      )}
    </>
  );
}
