import useSWR from 'swr';
import { useEffect, useRef } from 'react';
import Pusher from 'pusher-js';
import { io } from 'socket.io-client';

const fetcher = async (url) => {
    const res = await fetch(url);
    if (!res.ok) {
        const error = new Error('An error occurred while fetching the data.');
        error.info = await res.json();
        error.status = res.status;
        throw error;
    }
    return res.json();
};

export function useRealtimeOrderDetail({ orderId, userId, initialData = null }) {
    // 1. Fetch System Realtime Config
    const { data: config } = useSWR('/api/system/realtime', fetcher, {
        revalidateOnFocus: true,
        dedupingInterval: 5000 // Cache for 5s
    });

    const isPolling = config?.provider === 'POLLING';
    const isPusher = config?.provider === 'PUSHER';
    const isSocket = config?.provider === 'SOCKET_IO';

    // 2. Main Order Fetching with SWR
    const orderUrl = orderId ? `/api/orders/${orderId}` : null;

    const { data, error, mutate, isLoading } = useSWR(orderUrl, fetcher, {
        refreshInterval: isPolling ? 5000 : 0,
        fallbackData: initialData,
        revalidateOnFocus: true
    });

    // Use ref to stable reference mutate - initialize with null, update in effect
    const mutateRef = useRef(null);
    // Keep mutate ref updated
    useEffect(() => {
        mutateRef.current = mutate;
    }, [mutate]);

    // 3. Pusher Subscription
    useEffect(() => {
        if (!isPusher || !userId || !config?.pusherKey || !orderId) return;

        let isMounted = true;
        const pusher = new Pusher(config.pusherKey, {
            cluster: config.pusherCluster,
        });

        const channelName = `user-${userId}`;
        const channel = pusher.subscribe(channelName);

        channel.bind('order-updated', (eventData) => {
            if (!isMounted) return;
            console.log('⚡ [OrderDetail] Order Updated (Pusher):', eventData);
            if (eventData.orderId === orderId && mutateRef.current) {
                mutateRef.current();
            }
        });

        return () => {
            isMounted = false;
            if (channel.unbind_all) {
                channel.unbind_all();
            }
            channel.unsubscribe();
            pusher.disconnect();
        };
    }, [isPusher, userId, orderId, config?.pusherKey, config?.pusherCluster]);

    // 4. Socket.io Subscription
    useEffect(() => {
        if (!isSocket || !userId || !config?.socketUrl || !orderId) return;

        let isMounted = true;
        const socket = io(config.socketUrl, {
            reconnectionAttempts: 3,
            timeout: 5000,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000
        });

        socket.on('connect', () => {
            if (!isMounted) return;
            console.log("[OrderDetail] Socket.io connected");
            socket.emit('subscribe', `user-${userId}`);
        });

        socket.on('disconnect', () => {
            if (!isMounted) return;
            console.log("[OrderDetail] Socket.io disconnected");
        });

        socket.on('connect_error', (err) => {
            if (!isMounted) return;
            console.error("[OrderDetail] Socket.io Connection Error:", err.message);
        });

        socket.on('order-updated', (eventData) => {
            if (!isMounted) return;
            console.log('⚡ [OrderDetail] Order Updated (Socket):', eventData);
            if (eventData.orderId === orderId && mutateRef.current) {
                mutateRef.current();
            }
        });

        return () => {
            isMounted = false;
            socket.disconnect();
        };
    }, [isSocket, userId, orderId, config?.socketUrl]);

    return { order: data, isLoading, error, mutate };
}
