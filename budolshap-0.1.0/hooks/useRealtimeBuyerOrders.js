import useSWR from 'swr';
import { useEffect } from 'react';
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

    // 3. Pusher Subscription
    useEffect(() => {
        if (!isPusher || !userId || !config?.pusherKey) return;

        const pusher = new Pusher(config.pusherKey, {
            cluster: config.pusherCluster,
        });

        const channelName = `user-${userId}`;
        const channel = pusher.subscribe(channelName);

        channel.bind('order-updated', (eventData) => {
            console.log('⚡ [BuyerOrders] Order Updated (Pusher):', eventData);
            mutate();
        });

        return () => {
            if (channel.unbind_all) {
                channel.unbind_all();
            }
            channel.unsubscribe();
            pusher.disconnect();
        };
    }, [isPusher, userId, config, mutate]);

    // 4. Socket.io Subscription
    useEffect(() => {
        if (!isSocket || !userId || !config?.socketUrl) return;

        const socket = io(config.socketUrl);

        socket.on('connect', () => {
            socket.emit('subscribe', `user-${userId}`);
        });

        socket.on('order-updated', (eventData) => {
            console.log('⚡ [BuyerOrders] Order Updated (Socket):', eventData);
            mutate();
        });

        return () => {
            socket.disconnect();
        };
    }, [isSocket, userId, config, mutate]);

    return {
        orders: data?.orders || EMPTY_ARRAY,
        pagination: data?.pagination || EMPTY_OBJECT,
        isLoading,
        error,
        mutate
    };
}
