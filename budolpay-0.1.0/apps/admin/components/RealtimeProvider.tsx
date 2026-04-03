'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { realtime } from '@/lib/realtime';

export default function RealtimeProvider() {
  const router = useRouter();
  const initAttempted = useRef(false);

  useEffect(() => {
    // Ensure realtime is initialized only once per browser session
    if (!initAttempted.current) {
      initAttempted.current = true;
      realtime.init();
    }

    const handleUpdate = (data: any) => {
      console.log('[RealtimeProvider] Event received, forcing background Server Component refetch...', data);
      // Soft-navigation refresh: re-fetches Server Components using the latest DB data
      // while preserving client state (scroll position, inputs, etc.)
      router.refresh();
    };

    // Listen to all primary backend event namespaces used across the BudolPay ecosystem
    const events = [
      "AUDIT_LOG_CREATED", 
      "SECURITY_ALERT", 
      "SYSTEM_CONFIG_CHANGED", 
      "REALTIME_CONFIG_CHANGED",
      "TRANSACTION_COMPLETED",
      "USER_VERIFIED",
      "EMPLOYEE_UPDATED",
      "ANY_UPDATE"
    ];

    const unsubscribers = events.map(eventName => realtime.on(eventName, handleUpdate));

    return () => {
      // Cleanup all event listeners on unmount
      unsubscribers.forEach(unsub => unsub());
    };
  }, [router]);

  // This is a headless logic component
  return null;
}
