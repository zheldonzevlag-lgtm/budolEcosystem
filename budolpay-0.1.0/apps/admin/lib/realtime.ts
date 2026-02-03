/**
 * Realtime connection utilities for admin dashboard
 * This module provides WebSocket or Server-Sent Events functionality
 */

type RealtimeCallback = (data: any) => void;

class RealtimeService {
    private callbacks: Map<string, Set<RealtimeCallback>> = new Map();
    private ws: WebSocket | null = null;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;

    /**
     * Subscribe to realtime updates for a specific channel
     */
    subscribe(channel: string, callback: RealtimeCallback): () => void {
        if (!this.callbacks.has(channel)) {
            this.callbacks.set(channel, new Set());
        }
        this.callbacks.get(channel)!.add(callback);

        // Return unsubscribe function
        return () => {
            const channelCallbacks = this.callbacks.get(channel);
            if (channelCallbacks) {
                channelCallbacks.delete(callback);
                if (channelCallbacks.size === 0) {
                    this.callbacks.delete(channel);
                }
            }
        };
    }

    /**
     * Emit data to all subscribers of a channel
     */
    private emit(channel: string, data: any): void {
        const channelCallbacks = this.callbacks.get(channel);
        if (channelCallbacks) {
            channelCallbacks.forEach(callback => callback(data));
        }
    }

    /**
     * Connect to WebSocket server
     */
    connect(url?: string): void {
        if (this.ws?.readyState === WebSocket.OPEN) {
            return;
        }

        const wsUrl = url || process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001';

        try {
            this.ws = new WebSocket(wsUrl);

            this.ws.onopen = () => {
                console.log('Realtime connection established');
                this.reconnectAttempts = 0;
            };

            this.ws.onmessage = (event) => {
                try {
                    const { channel, data } = JSON.parse(event.data);
                    this.emit(channel, data);
                } catch (error) {
                    console.error('Failed to parse realtime message:', error);
                }
            };

            this.ws.onerror = (error) => {
                console.error('Realtime connection error:', error);
            };

            this.ws.onclose = () => {
                console.log('Realtime connection closed');
                this.attemptReconnect();
            };
        } catch (error) {
            console.error('Failed to establish realtime connection:', error);
        }
    }

    /**
     * Attempt to reconnect with exponential backoff
     */
    private attemptReconnect(): void {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
            this.reconnectAttempts++;

            setTimeout(() => {
                console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
                this.connect();
            }, delay);
        }
    }

    /**
     * Disconnect from WebSocket server
     */
    disconnect(): void {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this.callbacks.clear();
    }

    /**
     * Initialize connection (alias for connect, but async to match expected interface)
     */
    async init(): Promise<void> {
        this.connect();
        // Wait a bit to allow connection to establish, or just return immediately since connect() handles it
        return Promise.resolve();
    }

    /**
     * Subscribe to updates (alias for subscribe)
     */
    on(channel: string, callback: RealtimeCallback): () => void {
        return this.subscribe(channel, callback);
    }
}

// Export singleton instance
export const realtime = new RealtimeService();

// Auto-connect in browser environment
if (typeof window !== 'undefined') {
    realtime.connect();
}
