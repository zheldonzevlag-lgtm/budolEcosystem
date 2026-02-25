import useSWR from 'swr';
import { useEffect } from 'react';
import Pusher from 'pusher-js';
import { io } from 'socket.io-client';

const fetcher = url => fetch(url).then(r => r.json());

export function useRealtimeUser({ userId, onEvent }) {
    // 1. Fetch System Realtime Config
    const { data: config } = useSWR('/api/system/realtime', fetcher, {
        revalidateOnFocus: true,
        dedupingInterval: 5000 // Cache for 5s
    });

    const isPolling = config?.provider === 'POLLING';
    const isPusher = config?.provider === 'PUSHER';
    const isSocket = config?.provider === 'SOCKET_IO';

    // 2. Pusher Subscription
    useEffect(() => {
        if (!isPusher || !userId || !config?.pusherKey) return;

        const pusher = new Pusher(config.pusherKey, {
            cluster: config.pusherCluster,
        });

        const channelName = `user-${userId}`;
        const channel = pusher.subscribe(channelName);

        // Common user events
        const userEvents = ['store-status-updated', 'order-updated', 'rating-created'];

        // Bind each event
        userEvents.forEach(eventName => {
            channel.bind(eventName, (data) => {
                console.log(`⚡ [RealtimeUser] ${eventName} (Pusher):`, data);
                if (onEvent) onEvent(eventName, data);
            });
        });

        return () => {
            // Unbind all events from this channel
            if (channel.unbind_all) {
                channel.unbind_all();
            }
            channel.unsubscribe();
            pusher.disconnect();
        };
    }, [isPusher, userId, config, onEvent]);

    // 3. Socket.io Subscription
    useEffect(() => {
        if (!isSocket || !userId || !config?.socketUrl) return;

        const socket = io(config.socketUrl);

        socket.on('connect', () => {
            socket.emit('subscribe', `user-${userId}`);
        });

        // Socket.io doesn't have a direct "bind_all" like Pusher, 
        // but we can listen for specific known events or use a catch-all if the server supports it.
        // For now, let's list common user events.
        const userEvents = ['store-status-updated', 'order-updated', 'rating-created'];
        
        userEvents.forEach(eventName => {
            socket.on(eventName, (data) => {
                console.log(`⚡ [RealtimeUser] ${eventName} (Socket):`, data);
                if (onEvent) onEvent(eventName, data);
            });
        });

        return () => {
            socket.disconnect();
        };
    }, [isSocket, userId, config, onEvent]);

    return { config, isPolling };
}
