import useSWR from 'swr';
import { useEffect, useRef } from 'react';
import Pusher from 'pusher-js';
import { io } from 'socket.io-client';

const fetcher = url => fetch(url).then(r => r.json());

const EMPTY_ARRAY = [];
const EMPTY_OBJECT = {};

/**
 * useRealtimeBuyerOrders
 * 
 * Simple SWR wrapper for Buyer Orders.
 * Realtime updates are handled via Pusher/Socket.io subscriptions on the user channel.
 */
export function useRealtimeBuyerOrders({ userId, page = 1, limit = 10, status = '', isPaid = null, paymentStatus = '', paymentMethod = '', excludePaymentMethod = '', excludeAbandonedPayments = 'true', isCancelledTab = false, search = '' }) {
    // Use ref to stable reference mutate
    const mutateRef = useRef(null);

    // 1. Fetch System Realtime Config (for polling fallback)
    const { data: config } = useSWR('/api/system/realtime', fetcher, {
        revalidateOnFocus: true,
        dedupingInterval: 5000 
    });

    // Provider-agnostic check: if no provider is set or set to POLLING, use SWR polling
    const provider = config?.provider || config?.realtimeProvider || 'POLLING';
    const isPolling = provider === 'POLLING';
    const isPusher = provider === 'PUSHER';
    const isSocket = provider === 'SOCKET_IO';

    // 2. Fetch orders
    let ordersUrl = userId ? `/api/orders?userId=${userId}&page=${page}&limit=${limit}` : null;

    if (ordersUrl) {
        if (status) ordersUrl += `&status=${status}`;
        if (isPaid !== null) ordersUrl += `&isPaid=${isPaid}`;
        if (paymentStatus) ordersUrl += `&paymentStatus=${paymentStatus}`;
        if (paymentMethod) ordersUrl += `&paymentMethod=${paymentMethod}`;
        if (excludePaymentMethod) ordersUrl += `&excludePaymentMethod=${excludePaymentMethod}`;
        if (excludeAbandonedPayments !== null) ordersUrl += `&excludeAbandonedPayments=${excludeAbandonedPayments}`;
        if (isCancelledTab) ordersUrl += `&isCancelledTab=true`;
        if (search) ordersUrl += `&search=${encodeURIComponent(search)}`;
    }

    const { data, error, mutate, isLoading } = useSWR(ordersUrl, fetcher, {
        refreshInterval: isPolling ? 5000 : 0,
        revalidateOnFocus: true,
        revalidateOnMount: true
    });

    // Keep mutate ref updated
    useEffect(() => {
        mutateRef.current = mutate;
    }, [mutate]);

    // 3. Pusher Subscription
    useEffect(() => {
        if (!isPusher || !userId || !config?.pusherKey) return;

        let isMounted = true;
        const pusher = new Pusher(config.pusherKey, {
            cluster: config.pusherCluster,
        });

        const channelName = `user-${userId}`;
        const channel = pusher.subscribe(channelName);

        channel.bind('order-updated', (eventData) => {
            if (!isMounted) return;
            console.log('⚡ [BuyerOrders] Order Updated (Pusher):', eventData);
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
    }, [isPusher, userId, config?.pusherKey, config?.pusherCluster]);

    // 4. Socket.io Subscription
    useEffect(() => {
        if (!isSocket || !userId || !config?.socketUrl) return;

        let isMounted = true;
        const socket = io(config.socketUrl, {
            reconnectionAttempts: 3,
            timeout: 5000,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000
        });

        socket.on('connect', () => {
            if (!isMounted) return;
            console.log("[BuyerOrders] Socket.io connected");
            socket.emit('subscribe', `user-${userId}`);
        });

        socket.on('disconnect', () => {
            if (!isMounted) return;
            console.log("[BuyerOrders] Socket.io disconnected");
        });

        socket.on('connect_error', (err) => {
            if (!isMounted) return;
            console.error("[BuyerOrders] Socket.io Connection Error:", err.message);
        });

        socket.on('order-updated', (eventData) => {
            if (!isMounted) return;
            console.log('⚡ [BuyerOrders] Order Updated (Socket):', eventData);
            if (mutateRef.current) mutateRef.current();
        });

        return () => {
            isMounted = false;
            socket.disconnect();
        };
    }, [isSocket, userId, config?.socketUrl]);

    return {
        orders: data?.orders || EMPTY_ARRAY,
        pagination: data?.pagination || EMPTY_OBJECT,
        isLoading,
        error,
        mutate
    };
}
