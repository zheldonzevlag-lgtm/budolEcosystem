"use client";

import Pusher from "pusher-js";
import { io, Socket } from "socket.io-client";

type RealtimeCallback = (data: any) => void;

interface RealtimeConfig {
  provider: "PUSHER" | "SOCKETIO" | "SWR";
  pusherKey?: string;
  pusherCluster?: string;
  socketioUrl?: string;
  swrInterval?: number;
}

class RealtimeService {
  private callbacks: Map<string, Set<RealtimeCallback>> = new Map();
  private pusher: Pusher | null = null;
  private socket: Socket | null = null;
  private config: RealtimeConfig | null = null;
  private pollingInterval: NodeJS.Timeout | null = null;
  private isInitialized = false;
  private lastEmittedId: string | null = null;

  /**
   * Initialize the realtime service by fetching configuration
   */
  async init(force = false): Promise<void> {
    if (this.isInitialized && !force) return;

    try {
      console.log("[Realtime] Fetching configuration...");
      const res = await fetch("/api/system/realtime");
      const data = await res.json();
      
      // Map backend config to frontend format
      this.config = {
        provider: data.provider || data.realtimeProvider || "SWR",
        pusherKey: data.pusherKey,
        pusherCluster: data.pusherCluster,
        socketioUrl: data.socketUrl,
        swrInterval: data.swrPollingInterval || 10000
      };

      console.log(`[Realtime] Initializing with provider: ${this.config.provider}`);
      
      // Initialize lastEmittedId with the current latest log to avoid duplicate on first poll
      if (this.config.provider === "SWR") {
        try {
          const res = await fetch("/api/security?limit=1");
          const logs = await res.json();
          if (logs && logs.length > 0) {
            this.lastEmittedId = logs[0].id;
          }
        } catch (e) {}
      }

      await this.connect();
      this.isInitialized = true;
    } catch (error) {
      console.error("[Realtime] Failed to initialize:", error);
      // Fallback to SWR if initialization fails
      this.config = { provider: "SWR", swrInterval: 10000 };
      this.startPolling();
    }
  }

  /**
   * Force re-initialization (e.g. after settings change)
   */
  async reinit(): Promise<void> {
    console.log("[Realtime] Re-initializing service...");
    await this.init(true);
  }

  /**
   * Connect to the selected provider
   */
  private async connect(): Promise<void> {
    this.disconnect();

    if (!this.config) return;

    switch (this.config.provider) {
      case "PUSHER":
        this.connectPusher();
        break;
      case "SOCKETIO":
        this.connectSocketIO();
        break;
      case "SWR":
      default:
        this.startPolling();
        break;
    }
  }

  private connectPusher() {
    if (!this.config?.pusherKey) {
      console.warn("[Realtime] Pusher key missing, falling back to SWR");
      this.startPolling();
      return;
    }

    this.pusher = new Pusher(this.config.pusherKey, {
      cluster: this.config.pusherCluster || "ap1",
    });

    const channel = this.pusher.subscribe("admin");
    
    // Listen for config changes to automatically re-initialize
    channel.bind("REALTIME_CONFIG_CHANGED", () => {
      console.log("[Realtime] Config change detected via Pusher, re-initializing...");
      this.reinit();
    });

    // Listen for all events and emit them to local callbacks
    const events = ["AUDIT_LOG_CREATED", "SECURITY_ALERT", "SYSTEM_CONFIG_CHANGED"];
    events.forEach(event => {
      channel.bind(event, (data: any) => {
        console.log(`[Realtime] Pusher event received: ${event}`);
        if (event === "SYSTEM_CONFIG_CHANGED") {
          console.log("[Realtime] System config change detected via Pusher, re-initializing...");
          this.reinit();
        }
        this.emit(event, data);
      });
    });

    this.pusher.connection.bind("connected", () => {
      console.log("[Realtime] Pusher connected");
    });
  }

  private connectSocketIO() {
    const url = this.config?.socketioUrl || "http://localhost:4000";
    console.log(`[Realtime] Connecting to Socket.io at ${url}`);
    
    this.socket = io(url, {
      transports: ["websocket"],
      reconnectionAttempts: 5
    });

    this.socket.on("connect", () => {
      console.log("[Realtime] Socket.io connected");
      this.socket?.emit("join", "admin");
    });

    // Listen for all events
    this.socket.onAny((event, data) => {
      console.log(`[Realtime] Socket.io event received: ${event}`);
      if (event === "REALTIME_CONFIG_CHANGED" || event === "SYSTEM_CONFIG_CHANGED") {
        console.log(`[Realtime] Config change detected via Socket.io (${event}), re-initializing...`);
        this.reinit();
      }
      this.emit(event, data);
    });

    this.socket.on("disconnect", () => {
      console.log("[Realtime] Socket.io disconnected");
    });
  }

  private startPolling() {
    console.log(`[Realtime] Starting SWR polling (interval: ${this.config?.swrInterval}ms)`);
    
    let pollCount = 0;
    const poll = async () => {
      try {
        pollCount++;
        // Every 5 polls, check if the provider has changed
        if (pollCount % 5 === 0) {
          const configRes = await fetch("/api/system/realtime");
          const configData = await configRes.json();
          const newProvider = configData.provider || configData.realtimeProvider || "SWR";
          if (newProvider !== this.config?.provider) {
            console.log(`[Realtime] Provider change detected via polling (${this.config?.provider} -> ${newProvider}), re-initializing...`);
            this.reinit();
            return;
          }
        }

        // For audit logs, we fetch the latest logs and emit if there are new ones
        const res = await fetch("/api/security?limit=1");
        const logs = await res.json();
        if (logs && logs.length > 0) {
          const latestLog = logs[0];
          if (latestLog.id !== this.lastEmittedId) {
            console.log(`[Realtime] Polling found new audit log: ${latestLog.action}`);
            this.emit("AUDIT_LOG_CREATED", latestLog);
            this.lastEmittedId = latestLog.id;
          }
        }
      } catch (error) {
        console.error("[Realtime] Polling failed:", error);
      }
    };

    // Initial poll
    poll();
    
    this.pollingInterval = setInterval(poll, this.config?.swrInterval || 10000);
  }

  /**
   * Subscribe to realtime updates for a specific event
   */
  on(event: string, callback: RealtimeCallback): () => void {
    if (!this.callbacks.has(event)) {
      this.callbacks.set(event, new Set());
    }
    this.callbacks.get(event)!.add(callback);

    // Return unsubscribe function
    return () => {
      const eventCallbacks = this.callbacks.get(event);
      if (eventCallbacks) {
        eventCallbacks.delete(callback);
        if (eventCallbacks.size === 0) {
          this.callbacks.delete(event);
        }
      }
    };
  }

  /**
   * Unsubscribe from realtime updates for a specific event
   */
  off(event: string, callback?: RealtimeCallback): void {
    if (!callback) {
      this.callbacks.delete(event);
      return;
    }
    const eventCallbacks = this.callbacks.get(event);
    if (eventCallbacks) {
      eventCallbacks.delete(callback);
      if (eventCallbacks.size === 0) {
        this.callbacks.delete(event);
      }
    }
  }

  /**
   * Emit data to all subscribers of an event
   */
  private emit(event: string, data: any): void {
    const eventCallbacks = this.callbacks.get(event);
    if (eventCallbacks) {
      eventCallbacks.forEach(callback => callback(data));
    }
  }

  /**
   * Disconnect and cleanup
   */
  disconnect(): void {
    if (this.pusher) {
      this.pusher.unsubscribe("admin");
      this.pusher.disconnect();
      this.pusher = null;
    }

    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }
}

// Export singleton instance
export const realtime = new RealtimeService();
