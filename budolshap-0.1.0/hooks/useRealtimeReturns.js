import useSWR from 'swr';
import { useEffect, useRef } from 'react';
import Pusher from 'pusher-js';
import { io } from 'socket.io-client';

const fetcher = url => fetch(url).then(r => r.json());

export function useRealtimeReturns({ storeId, page = 1, limit = 20, initialData = null }) {
    // Use ref to stable reference mutate
    const mutateRef = useRef(null);

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

    // Keep mutate ref updated
    useEffect(() => {
        mutateRef.current = mutate;
    }, [mutate]);

    // 3. Pusher Subscription Effect
    useEffect(() => {
        if (!isPusher || !storeId || !config?.pusherKey) return;

        let isMounted = true;
        console.log('🔌 Connecting to Pusher for Returns...', config.pusherCluster);
        const pusher = new Pusher(config.pusherKey, {
            cluster: config.pusherCluster,
        });

        const channelName = `store-${storeId}`;
        const channel = pusher.subscribe(channelName);

        // Listen for new return requests
        channel.bind('return-requested', (data) => {
            if (!isMounted) return;
            console.log('⚡ Pusher Return Requested:', data);
            if (mutateRef.current) mutateRef.current();
        });

        // Listen for return updates (e.g. buyer ships, admin resolves dispute)
        channel.bind('return-updated', (data) => {
            if (!isMounted) return;
            console.log('⚡ Pusher Return Updated:', data);
            if (mutateRef.current) mutateRef.current();
        });

        channel.bind('dispute-resolved', (data) => {
            if (!isMounted) return;
            console.log('⚡ Pusher Dispute Resolved:', data);
            if (mutateRef.current) mutateRef.current();
        });

        return () => {
            isMounted = false;
            if (channel.unbind_all) {
                channel.unbind_all();
            }
            channel.unsubscribe();
            pusher.disconnect();
        };
    }, [isPusher, storeId, config?.pusherKey, config?.pusherCluster]);

    // 4. Socket.io Subscription Effect
    useEffect(() => {
        if (!isSocket || !storeId || !config?.socketUrl) return;

        let isMounted = true;
        console.log('🔌 Connecting to Socket.io for Returns...', config.socketUrl);
        const socket = io(config.socketUrl, {
            reconnectionAttempts: 3,
            timeout: 5000,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000
        });

        socket.on('connect', () => {
            if (!isMounted) return;
            console.log('✅ Socket connected for Returns');
            socket.emit('subscribe', `store-${storeId}`);
        });

        socket.on('disconnect', () => {
            if (!isMounted) return;
            console.log("[Returns] Socket.io disconnected");
        });

        socket.on('connect_error', (err) => {
            if (!isMounted) return;
            console.error("[Returns] Socket.io Connection Error:", err.message);
        });

        socket.on('return-requested', (data) => {
            if (!isMounted) return;
            console.log('⚡ Socket Return Requested:', data);
            if (mutateRef.current) mutateRef.current();
        });

        socket.on('return-updated', (data) => {
            if (!isMounted) return;
            console.log('⚡ Socket Return Updated:', data);
            if (mutateRef.current) mutateRef.current();
        });

        socket.on('dispute-resolved', (data) => {
            if (!isMounted) return;
            console.log('⚡ Socket Dispute Resolved:', data);
            if (mutateRef.current) mutateRef.current();
        });

        return () => {
            isMounted = false;
            socket.disconnect();
        };
    }, [isSocket, storeId, config?.socketUrl]);

    return {
        returns: data || [], // /api/returns returns an array directly based on returnsService.js
        isLoading,
        error,
        mutate
    };
}
