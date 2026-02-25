import useSWR from 'swr';

const fetcher = (url) => fetch(url).then((res) => res.json());

export function useStoreWallet() {
    const { data, error, mutate, isLoading } = useSWR(
        '/api/store/wallet',
        fetcher,
        {
            revalidateOnFocus: true,
            dedupingInterval: 10000 // 10s deduplication
        }
    );

    return {
        wallet: data || { balance: 0, transactions: [] },
        isLoading,
        error,
        mutate
    };
}
