import useSWR from 'swr';
import { useEffect } from 'react';
import Pusher from 'pusher-js';
import { io } from 'socket.io-client';

const fetcher = url => fetch(url).then(r => r.json());

export function useRealtimeReturns({ storeId, page = 1, limit = 20, initialData = null }) {
    // 1. Fetch System Realtime Config
    const { data: config } = useSWR('/api/system/realtime', fetcher, {
        revalidateOnFocus: false,
        dedupingInterval: 60000 // Cache for 1 min
    });

    const isPolling = config?.provider === 'POLLING';
    const isPusher = config?.provider === 'PUSHER';
    const isSocket = config?.provider === 'SOCKET_IO';

    // 2. Main Returns Fetching with SWR
    const returnsUrl = storeId ? `/api/returns?storeId=${storeId}&page=${page}&limit=${limit}` : null;

    const { data, error, mutate, isLoading } = useSWR(returnsUrl, fetcher, {
        refreshInterval: isPolling ? 5000 : 0,
        fallbackData: initialData,
        revalidateOnFocus: true
    });

    // 3. Pusher Subscription Effect
    useEffect(() => {
        if (!isPusher || !storeId || !config?.pusherKey) return;

        console.log('🔌 Connecting to Pusher for Returns...', config.pusherCluster);
        const pusher = new Pusher(config.pusherKey, {
            cluster: config.pusherCluster,
        });

        const channelName = `store-${storeId}`;
        const channel = pusher.subscribe(channelName);

        // Listen for new return requests
        channel.bind('return-requested', (data) => {
            console.log('⚡ Pusher Return Requested:', data);
            mutate();
        });

        // Listen for return updates (e.g. buyer ships, admin resolves dispute)
        channel.bind('return-updated', (data) => {
            console.log('⚡ Pusher Return Updated:', data);
            mutate();
        });

        channel.bind('dispute-resolved', (data) => {
            console.log('⚡ Pusher Dispute Resolved:', data);
            mutate();
        });

        return () => {
            if (channel.unbind_all) {
                channel.unbind_all();
            }
            channel.unsubscribe();
            pusher.disconnect();
        };
    }, [isPusher, storeId, config, mutate]);

    // 4. Socket.io Subscription Effect
    useEffect(() => {
        if (!isSocket || !storeId || !config?.socketUrl) return;

        console.log('🔌 Connecting to Socket.io for Returns...', config.socketUrl);
        const socket = io(config.socketUrl);

        socket.on('connect', () => {
            console.log('✅ Socket connected for Returns');
            socket.emit('subscribe', `store-${storeId}`);
        });

        socket.on('return-requested', (data) => {
            console.log('⚡ Socket Return Requested:', data);
            mutate();
        });

        socket.on('return-updated', (data) => {
            console.log('⚡ Socket Return Updated:', data);
            mutate();
        });

        socket.on('dispute-resolved', (data) => {
            console.log('⚡ Socket Dispute Resolved:', data);
            mutate();
        });

        return () => {
            socket.disconnect();
        };
    }, [isSocket, storeId, config, mutate]);

    return {
        returns: data || [], // /api/returns returns an array directly based on returnsService.js
        isLoading,
        error,
        mutate
    };
}
