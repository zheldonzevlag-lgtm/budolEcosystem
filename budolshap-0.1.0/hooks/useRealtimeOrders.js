import useSWR from 'swr';

const fetcher = url => fetch(url).then(r => r.json());

/**
 * useRealtimeOrders
 * 
 * Simple SWR wrapper for Seller Orders.
 * Realtime updates are handled globally by RealtimeProvider.jsx via Cache Patching.
 */
export function useRealtimeOrders({ storeId, page = 1, limit = 20, search = '', initialData = null }) {
    // 1. Fetch System Realtime Config
    const { data: config } = useSWR('/api/system/realtime', fetcher, {
        revalidateOnFocus: true,
        dedupingInterval: 5000 
    });

    // Provider-agnostic check: if no provider is set or set to POLLING, use SWR polling
    const provider = config?.provider || config?.realtimeProvider || 'POLLING';
    const isPolling = provider === 'POLLING';

    // 2. Main Orders Fetching with SWR
    let ordersUrl = storeId ? `/api/orders?storeId=${storeId}&page=${page}&limit=${limit}` : null;
    
    if (ordersUrl && search) {
        ordersUrl += `&search=${encodeURIComponent(search)}`;
    }

    const { data, error, mutate, isLoading } = useSWR(ordersUrl, fetcher, {
        refreshInterval: isPolling ? 5000 : 0,
        fallbackData: initialData,
        revalidateOnFocus: true,
        revalidateOnMount: true
    });

    return {
        orders: data?.orders || [],
        pagination: data?.pagination || {},
        isLoading,
        error,
        mutate
    };
}
