import useSWR from 'swr';

const fetcher = url => fetch(url).then(r => r.json());

/**
 * useStoreDashboard
 * 
 * SWR hook for Seller Dashboard stats.
 * Allows realtime updates via global RealtimeProvider.
 */
export function useStoreDashboard(storeId) {
    const { data, error, mutate, isLoading } = useSWR(
        storeId ? `/api/dashboard/store?storeId=${storeId}` : null,
        fetcher,
        {
            revalidateOnFocus: true,
            revalidateOnMount: true,
            dedupingInterval: 10000 // 10s deduplication
        }
    );

    return {
        dashboardData: data || {
            totalProducts: 0,
            totalEarnings: 0,
            pendingEarnings: 0,
            potentialEarnings: 0,
            totalOrders: 0,
            totalSoldProducts: 0,
            ratings: [],
            protectionWindowDays: 7
        },
        isLoading,
        error,
        mutate
    };
}
