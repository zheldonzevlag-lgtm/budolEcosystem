"use client";

/**
 * realtime.ts - Provider-Agnostic Realtime Service Singleton
 *
 * ARCHITECTURE:
 * - Supports Pusher (hosted WebSocket), Socket.io (self-hosted), and SWR (HTTP polling).
 * - WebSocket providers (Pusher/Socket.io) are always tried first for instant updates.
 * - SWR polling runs ONLY when WebSocket is offline/unavailable (genuine fallback).
 * - Exposes isWebSocketConnected() so RealtimeProvider can adapt its heartbeat strategy.
 * - On settings save, RealtimeMethodSelector calls reinit() for seamless provider hot-swap.
 *
 * TODO: Add Pusher.trigger() / socket.emit() calls in API routes (e.g. after transaction
 *       creation, user verification, KYC approval) for true instant push events.
 */

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

  // WebSocket health tracking - used by RealtimeProvider to adapt heartbeat strategy
  private _wsConnected = false;
  private _onWsStatusChange: ((connected: boolean) => void) | null = null;

  /** Returns true when the WebSocket provider (Pusher/Socket.io) is live and connected */
  isWebSocketConnected(): boolean {
    return this._wsConnected;
  }

  /** Register a callback that fires whenever WebSocket connection status changes */
  onWebSocketStatusChange(cb: (connected: boolean) => void) {
    this._onWsStatusChange = cb;
  }

  private setWsConnected(connected: boolean) {
    if (this._wsConnected !== connected) {
      this._wsConnected = connected;
      this._onWsStatusChange?.(connected);
      console.log(`[Realtime] WebSocket status: ${connected ? 'CONNECTED' : 'DISCONNECTED'}`);
    }
  }

  /**
   * Initialize the realtime service by fetching configuration from the admin settings.
   * Called once on app boot by RealtimeProvider, and again on settings save via reinit().
   */
  async init(force = false): Promise<void> {
    if (this.isInitialized && !force) return;

    try {
      console.log("[Realtime] Fetching configuration...");
      const res = await fetch("/api/system/realtime");
      const data = await res.json();

      this.config = {
        provider: data.provider || "SWR",
        pusherKey: data.pusherKey,
        pusherCluster: data.pusherCluster || "ap1",
        socketioUrl: data.socketUrl,
        swrInterval: data.swrPollingInterval || 10000,
      };

      console.log(`[Realtime] Provider: ${this.config.provider}`);
      await this.connect();
      this.isInitialized = true;
    } catch (error) {
      console.error("[Realtime] Failed to initialize, defaulting to SWR:", error);
      this.config = { provider: "SWR", swrInterval: 10000 };
      this.startPolling(); // SWR as ultimate failsafe
    }
  }

  /**
   * Force re-initialization — called by RealtimeMethodSelector when admin saves new settings.
   * This is the server-driven hot-swap mechanism: no periodic config polling needed.
   */
  async reinit(): Promise<void> {
    console.log("[Realtime] Re-initializing (settings changed)...");
    this.isInitialized = false;
    await this.init(true);
  }

  private async connect(): Promise<void> {
    // Disconnect any existing connections before switching providers
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
        // SWR: no WebSocket, use simple polling as the primary mechanism
        this.setWsConnected(false);
        this.startPolling();
        break;
    }
  }

  private connectPusher() {
    if (!this.config?.pusherKey) {
      console.warn("[Realtime] Pusher key missing — falling back to SWR polling");
      this.setWsConnected(false);
      this.startPolling();
      return;
    }

    this.pusher = new Pusher(this.config.pusherKey, {
      cluster: this.config.pusherCluster || "ap1",
    });

    const channel = this.pusher.subscribe("admin");

    // Listen to all Pusher events globally (any event published to this channel)
    channel.bind_global((eventName: string, data: any) => {
      if (eventName.startsWith("pusher:")) return; // ignore internal events
      console.log(`[Realtime] Pusher event: ${eventName}`);
      if (eventName === "SYSTEM_CONFIG_CHANGED" || eventName === "REALTIME_CONFIG_CHANGED") {
        this.reinit();
        return;
      }
      this.emit(eventName, data);
    });

    this.pusher.connection.bind("connected", () => {
      console.log("[Realtime] Pusher connected ✓");
      this.setWsConnected(true);
    });

    this.pusher.connection.bind("disconnected", () => {
      console.warn("[Realtime] Pusher disconnected — SWR fallback will activate");
      this.setWsConnected(false);
      // RealtimeProvider listens to onWebSocketStatusChange and activates its heartbeat
    });

    this.pusher.connection.bind("failed", () => {
      console.error("[Realtime] Pusher connection failed — SWR fallback will activate");
      this.setWsConnected(false);
    });

    this.pusher.connection.bind("unavailable", () => {
      console.warn("[Realtime] Pusher unavailable — SWR fallback will activate");
      this.setWsConnected(false);
    });
  }

  private connectSocketIO() {
    const url = this.config?.socketioUrl || "http://localhost:4000";
    console.log(`[Realtime] Connecting Socket.io → ${url}`);

    this.socket = io(url, {
      transports: ["websocket"],
      reconnectionAttempts: 5,
      timeout: 5000,
    });

    this.socket.on("connect", () => {
      console.log("[Realtime] Socket.io connected ✓");
      this.setWsConnected(true);
      this.socket?.emit("join", "admin");
    });

    this.socket.onAny((eventName, data) => {
      console.log(`[Realtime] Socket.io event: ${eventName}`);
      if (eventName === "SYSTEM_CONFIG_CHANGED" || eventName === "REALTIME_CONFIG_CHANGED") {
        this.reinit();
        return;
      }
      this.emit(eventName, data);
    });

    this.socket.on("disconnect", () => {
      console.warn("[Realtime] Socket.io disconnected — SWR fallback will activate");
      this.setWsConnected(false);
    });

    this.socket.on("connect_error", () => {
      console.error("[Realtime] Socket.io connection error — SWR fallback will activate");
      this.setWsConnected(false);
    });

    // If we exhaust reconnection attempts, mark as permanently disconnected
    this.socket.io.on("reconnect_failed", () => {
      console.error("[Realtime] Socket.io reconnection exhausted — falling back to SWR");
      this.setWsConnected(false);
    });
  }

  /**
   * SWR polling — used when provider is SWR, or when WebSocket is offline.
   * RealtimeProvider controls the actual interval for both cases.
   * This method handles audit-log-specific detection for the security page.
   */
  private startPolling() {
    if (this.pollingInterval) clearInterval(this.pollingInterval);
    const interval = this.config?.swrInterval || 10000;
    console.log(`[Realtime] SWR polling started (${interval}ms)`);

    let pollCount = 0;
    this.pollingInterval = setInterval(async () => {
      try {
        pollCount++;
        // Every 5 polls, check if the DB provider has changed (cheap server-driven check)
        if (pollCount % 5 === 0) {
          const configRes = await fetch("/api/system/realtime");
          const configData = await configRes.json();
          const newProvider = configData.provider || "SWR";
          if (newProvider !== this.config?.provider) {
            console.log(`[Realtime] Provider changed: ${this.config?.provider} → ${newProvider}`);
            this.reinit();
            return;
          }
        }

        const res = await fetch("/api/security?limit=1");
        const logs = await res.json();
        if (logs?.length > 0) {
          const latestLog = logs[0];
          if (latestLog.id !== this.lastEmittedId) {
            this.emit("AUDIT_LOG_CREATED", latestLog);
            this.lastEmittedId = latestLog.id;
          }
        }

        // Always emit ANY_UPDATE so RealtimeProvider and Client pages refresh
        this.emit("ANY_UPDATE", { source: "swr-poll" });
      } catch (error) {
        console.error("[Realtime] Polling error:", error);
      }
    }, interval);
  }

  /** Subscribe to an event. Returns an unsubscribe function. */
  on(event: string, callback: RealtimeCallback): () => void {
    if (!this.callbacks.has(event)) {
      this.callbacks.set(event, new Set());
    }
    this.callbacks.get(event)!.add(callback);
    return () => {
      const cbs = this.callbacks.get(event);
      if (cbs) {
        cbs.delete(callback);
        if (cbs.size === 0) this.callbacks.delete(event);
      }
    };
  }

  off(event: string, callback?: RealtimeCallback): void {
    if (!callback) {
      this.callbacks.delete(event);
      return;
    }
    const cbs = this.callbacks.get(event);
    if (cbs) {
      cbs.delete(callback);
      if (cbs.size === 0) this.callbacks.delete(event);
    }
  }

  /**
   * PUBLIC: Broadcast ANY_UPDATE to all page subscribers.
   * Called by RealtimeProvider's heartbeat to update Client Component pages.
   */
  broadcast(data?: any): void {
    this.emit("ANY_UPDATE", data ?? { source: "heartbeat" });
  }

  private emit(event: string, data: any): void {
    const cbs = this.callbacks.get(event);
    if (cbs) cbs.forEach(cb => cb(data));

    // Cascade all events to ANY_UPDATE listeners
    if (event !== "ANY_UPDATE") {
      const globalCbs = this.callbacks.get("ANY_UPDATE");
      if (globalCbs) globalCbs.forEach(cb => cb({ sourceEvent: event, data }));
    }
  }

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
    this.setWsConnected(false);
  }
}

// Singleton — one shared instance across the entire Next.js client app
export const realtime = new RealtimeService();
