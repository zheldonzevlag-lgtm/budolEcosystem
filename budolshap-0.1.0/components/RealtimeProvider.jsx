'use client'
import useSWR, { SWRConfig, mutate } from 'swr'
import { useEffect, useState, useRef } from 'react'
import Pusher from 'pusher-js'
import io from 'socket.io-client'
import toast from 'react-hot-toast'
import React from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useDispatch } from 'react-redux'
import { addProduct, updateProduct } from '@/lib/features/product/productSlice'
import BudolPayText from '@/components/payment/BudolPayText'
import { getStatusLabel, UNIVERSAL_STATUS } from '@/lib/shipping/statusMapper'

/**
 * RealtimeProvider
 * 
 * Responsibilities:
 * 1. Fetch System Settings to determine Realtime strategy.
 * 2. Configure SWR globally:
 *    - If POLLING: set refreshInterval to 5000ms (or config value).
 *    - If PUSHER/SOCKET: set refreshInterval to 0 (disable polling).
 * 3. Initialize Connection (Pusher/Socket) if active.
 * 4. Listen for global events (user-registered, etc.) and specific events.
 * 5. Handle "Refetch" signals by calling mutate().
 */

export default function RealtimeProvider({ children }) {
    const router = useRouter()
    const { user } = useAuth()
    const dispatch = useDispatch()
    const [socket, setSocket] = useState(null)
    const [pusher, setPusher] = useState(null)
    const seenEvents = useRef(new Set())
    const lastSeenStatus = useRef(new Map()) // Track last seen status per order/return to avoid repeated toasts

    // Default SWR settings
    const [swrOptions, setSwrOptions] = useState({
        refreshInterval: 5000,
        fetcher: (url) => fetch(url).then(res => res.json())
    })

    const { data: configData, mutate: mutateConfig } = useSWR('/api/system/settings', (url) => fetch(url).then(res => res.json()), {
        revalidateOnFocus: true,
        dedupingInterval: 5000 // Cache for 5 seconds for better responsiveness
    })

    // 2. Adjust Strategy based on Config
    useEffect(() => {
        if (!configData) return

        // Provider-agnostic initialization: uses provider from settings, fallbacks to POLLING
        const provider = configData.provider || configData.realtimeProvider || 'POLLING'
        console.log(`[Realtime] Active Provider: ${provider}`)

        let currentPusher = null
        let currentSocket = null

        const handleVisibilityChange = () => {
            const isHidden = document.visibilityState === 'hidden'

            if (provider === 'POLLING') {
                // Reduce polling frequency when hidden to save bandwidth/costs
                setSwrOptions(prev => ({
                    ...prev,
                    refreshInterval: isHidden ? 30000 : 5000
                }))
            }
        }

        document.addEventListener('visibilitychange', handleVisibilityChange)

        if (provider === 'POLLING') {
            // Enable Polling (Default to 5s if visible)
            setSwrOptions(prev => ({
                ...prev,
                refreshInterval: document.visibilityState === 'hidden' ? 30000 : 5000
            }))

            // Disconnect others if exists
            if (socket) { socket.disconnect(); setSocket(null); }
            if (pusher) { pusher.disconnect(); setPusher(null); }
        }
        else {
            // Disable Polling (Push mode)
            setSwrOptions(prev => ({ ...prev, refreshInterval: 0 }))

            // Initialize Provider
            if (provider === 'PUSHER' && configData.pusherKey) {
                // Re-initialize if config changed or user changed (to update channels)
                if (pusher) pusher.disconnect();

                try {
                    const pusherInstance = new Pusher(configData.pusherKey, {
                        cluster: configData.pusherCluster,
                    })
                    setPusher(pusherInstance)
                    currentPusher = pusherInstance
                    setupPusherListeners(pusherInstance)
                } catch (e) {
                    console.error("Pusher init failed:", e)
                }
            }
            else if (provider === 'SOCKET_IO' && configData.socketUrl) {
                if (socket) socket.disconnect();

                try {
                    const socketInstance = io(configData.socketUrl)
                    setSocket(socketInstance)
                    currentSocket = socketInstance
                    setupSocketListeners(socketInstance)
                } catch (e) {
                    console.error("Socket init failed:", e)
                }
            }
        }

        // Cleanup on unmount or dependency change
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange)
            if (currentPusher) {
                console.log("[Realtime] Cleaning up Pusher listeners...")
                currentPusher.disconnect()
            }
            if (currentSocket) {
                console.log("[Realtime] Cleaning up Socket listeners...")
                currentSocket.disconnect()
            }
        }
    }, [configData?.realtimeProvider, configData?.pusherKey, configData?.socketUrl, user?.id, user?.store?.id])

    // --- Listeners Setup ---

    const handleGlobalEvent = (event, data) => {
        const orderId = data.orderId || data.id || data.name
        const status = data.status || ''

        // --- Deduplication Logic ---
        // 1. Immediate Duplicate Suppression (within 5 seconds)
        // Catches rapid-fire events from multiple channels (user, store, admin)
        const timestampBucket = Math.floor(Date.now() / 5000)
        const fingerprint = `${event}:${orderId}:${status}:${timestampBucket}`

        if (seenEvents.current.has(fingerprint)) {
            console.log(`[Realtime] Deduplicated rapid-fire event: ${fingerprint}`)
            // Still run cache patching for suppressed duplicates to ensure UI consistency
            if (event === 'order-updated' || event === 'return-updated' || event === 'return-requested') {
                patchOrderCache(data)
            }
            return
        }
        seenEvents.current.add(fingerprint)
        setTimeout(() => seenEvents.current.delete(fingerprint), 10000)

        // 2. Persistent Status Duplicate Suppression
        // Prevents showing the same status toast multiple times
        const eventGroup = (event === 'order-updated' || event === 'return-updated' || event === 'return-requested' || event === 'dispute-resolved')
            ? 'status-sync'
            : event
        const statusKey = `${eventGroup}:${orderId}`
        const isRepeatStatus = lastSeenStatus.current.get(statusKey) === status

        if (isRepeatStatus && eventGroup === 'status-sync') {
            console.log(`[Realtime] Status unchanged for ${statusKey} (${status}), skipping toast but updating cache.`)
            if (event === 'order-updated' || event === 'return-updated' || event === 'return-requested') {
                patchOrderCache(data)
            }
            return
        }

        // Update last seen status
        if (status) {
            lastSeenStatus.current.set(statusKey, status)
        }

        console.log(`[Realtime Event] ${event}:`, data)

        // 1. Show Toast
        if (event === 'user-registered') {
            toast.success(
                <div>
                    <p className="font-bold">New User Registered</p>
                    <p className="text-sm">{data.name}</p>
                </div>,
                { duration: 4000, position: 'top-right' }
            )
            // Refresh Users List
            mutate('/api/admin/users')
        }

        if (event === 'user-updated') {
            // Refresh Users List for admins
            mutate('/api/admin/users')
            // Refresh Admin Stores as they contain user data
            mutate('/api/admin/stores')
            // Refresh current user if it affects their profile
            if (data.id === user?.id) {
                // Usually AuthContext handles this, but we can nudge it
                window.dispatchEvent(new Event('login-success'))
            }
        }

        if (event === 'store-updated' || event === 'store-status-updated') {
            // Refresh Admin Stores List
            mutate('/api/admin/stores')
            // Refresh specific store endpoints
            const sId = data.id || data.storeId
            if (sId) mutate(`/api/stores/${sId}`)
            if (data.userId) mutate(`/api/stores/user/${data.userId}`)

            // Dispatch legacy JS event for components like StoreLayout
            window.dispatchEvent(new Event('store-updated'))
        }

        if (event === 'order-updated') {
            // Check if this is a return-related status change. 
            // If so, we might want to skip the toast here because return-requested/updated will show a better one.
            const isReturnStatus = ['RETURN_REQUESTED', 'RETURN_APPROVED', 'RETURN_DISPUTED', 'REFUNDED'].includes(data.status)

            if (!isReturnStatus) {
                const displayLabel = getStatusLabel(data.status, data.isReturn || false)
                toast(
                    <div className="flex flex-col gap-0.5">
                        <p className="font-bold text-slate-800">Order Update</p>
                        <p className="text-sm text-slate-600">
                            Order #{data.orderId} is now {displayLabel}
                        </p>
                    </div>,
                    {
                        icon: '📦',
                        duration: 5000,
                        position: 'top-right',
                        style: {
                            borderRadius: '10px',
                            background: '#fff',
                            color: '#333',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                            border: '1px solid #f0f0f0'
                        }
                    }
                )
            }
            // Refresh Orders using patching to avoid flicker
            patchOrderCache(data)
            // Refresh Dashboard stats
            mutate((key) => typeof key === 'string' && key.startsWith('/api/dashboard/store'))
            // Refresh Wallet if status indicates funds release
            if (data.status === 'COMPLETED' || data.status === 'DELIVERED') {
                mutate('/api/store/wallet')
            }
        }

        if (event === 'order-created') {
            toast.success(
                <div className="flex flex-col gap-0.5">
                    <p className="font-bold text-slate-800">New Order Received! 💰</p>
                    <p className="text-sm text-slate-600">Order #{data.orderId} needs attention</p>
                </div>,
                {
                    duration: 5000,
                    position: 'top-right',
                    style: {
                        borderRadius: '10px',
                        background: '#fff',
                        color: '#333',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        border: '1px solid #f0f0f0'
                    }
                }
            )
            // Refresh both admin and seller order lists
            mutate((key) => typeof key === 'string' && (
                key.startsWith('/api/dashboard/seller/orders') ||
                key.startsWith('/api/orders')
            ))
            // Refresh Dashboard stats
            mutate((key) => typeof key === 'string' && key.startsWith('/api/dashboard/store'))
        }

        if (event === 'rating-created') {
            toast.success(
                <div>
                    <p className="font-bold">New Review Received! ⭐</p>
                    <p className="text-sm">{data.customerName} rated a product</p>
                </div>,
                { duration: 4000, position: 'top-right' }
            )
            // Refresh order details to show the new rating
            if (data.orderId) {
                mutate(`/api/orders/${data.orderId}`)
            }
            // Refresh Dashboard reviews
            mutate((key) => typeof key === 'string' && key.startsWith('/api/dashboard/store'))
        }

        if (event === 'message-received') {
            // 1. Mutate messages for the specific chat
            if (data.chatId) {
                mutate(`/api/chats/${data.chatId}/messages`)
            }

            // 2. Show toast if it's from someone else
            if (data.senderId !== user?.id) {
                toast(
                    <div>
                        <p className="font-bold">New Message from {data.sender?.name}</p>
                        <p className="text-sm truncate">{data.content}</p>
                    </div>,
                    { icon: '💬', duration: 4000, position: 'top-right' }
                )
            }
        }

        if (event === 'product-added') {
            toast.success(
                <div>
                    <p className="font-bold">New Product Alert! 🔥</p>
                    <p className="text-sm">{data.name}</p>
                    <p className="text-xs text-gray-500">Just added by {data.store?.name}</p>
                </div>,
                { duration: 4000, position: 'top-right', icon: '🛍️' }
            )
            // Add to Redux Store (Updates LatestProducts instantly)
            dispatch(addProduct(data))
        }

        if (event === 'product-updated') {
            toast(
                <div>
                    <p className="font-bold">Product Updated 🔄</p>
                    <p className="text-sm">{data.name}</p>
                    <p className="text-xs text-gray-500">Price or details have been updated</p>
                </div>,
                { duration: 3000, position: 'top-right', icon: '✏️' }
            )
            // Update Redux Store
            dispatch(updateProduct(data))
        }

        if (event === 'return-requested') {
            const displayLabel = getStatusLabel(UNIVERSAL_STATUS.RETURN_REQUESTED, true)
            toast(
                <div>
                    <p className="font-bold">{displayLabel} 🔄</p>
                    <p className="text-sm">Order #<BudolPayText text={data.orderId} /> - {data.reason}</p>
                </div>,
                { duration: 5000, position: 'top-right', icon: '⚠️' }
            )
            mutate((key) => typeof key === 'string' && key.startsWith('/api/returns'))
            // Sync the order list as well to move it to the Return tab
            patchOrderCache({ ...data, status: 'RETURN_REQUESTED' })
        }

        if (event === 'return-updated') {
            const displayLabel = getStatusLabel(data.status, true)
            toast(
                <div className="flex flex-col gap-0.5">
                    <p className="font-bold text-slate-800">Return Update</p>
                    <p className="text-sm text-slate-600">Order #{data.orderId} return is now {displayLabel}</p>
                </div>,
                {
                    icon: '🔄',
                    duration: 5000,
                    position: 'top-right',
                    style: {
                        borderRadius: '10px',
                        background: '#fff',
                        color: '#333',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        border: '1px solid #f0f0f0'
                    }
                }
            )
            mutate((key) => typeof key === 'string' && key.startsWith('/api/returns'))
            // Sync order cache if it affects order status (Mapping return status to order status if needed)
            const orderStatusMap = {
                'APPROVED': 'RETURN_APPROVED',
                'DISPUTED': 'RETURN_DISPUTED',
                'REFUNDED': 'REFUNDED'
            }
            const orderStatus = orderStatusMap[data.status] || data.status
            patchOrderCache({ ...data, status: orderStatus })
        }

        if (event === 'dispute-resolved') {
            const displayLabel = getStatusLabel(data.status, true)
            toast.success(
                <div>
                    <p className="font-bold">Dispute Resolved ✅</p>
                    <p className="text-sm">Order #<BudolPayText text={data.orderId} />: {data.resolution}</p>
                    <p className="text-xs">New Status: {displayLabel}</p>
                </div>,
                { duration: 6000, position: 'top-right' }
            )
            mutate((key) => typeof key === 'string' && key.startsWith('/api/returns'))
            // Sync order status (mapping return status if needed)
            const orderStatusMap = {
                'REFUND_BUYER': 'REFUNDED',
                'REJECT_RETURN': 'COMPLETED'
            }
            const orderStatus = orderStatusMap[data.resolution] || data.status
            patchOrderCache({ ...data, status: orderStatus })
        }
    }

    /**
     * Patch Order Cache
     * Updates SWR cache for order lists without triggering a full loading state (flicker)
     * 
     * v494 Update: Handles tab-specific status filtering. If an order's status 
     * changes such that it no longer belongs in a filtered tab (e.g. moves from 
     * TO_RECEIVE to COMPLETED), it is removed from that tab's cache instantly.
     */
    const patchOrderCache = (data, forceRevalidate = false) => {
        const orderId = data.orderId || data.id
        const newStatus = data.status

        if (!orderId || !newStatus) return

        // Targeted mutation for all order-related SWR keys
        mutate(
            (key) => typeof key === 'string' && (key.startsWith('/api/orders') || key.startsWith('/api/dashboard/seller/orders')),
            (currentData) => {
                if (!currentData || !currentData.orders) return currentData

                // 1. Check if the order belongs in this specific cache entry based on filters in the key
                let shouldBeInList = true
                let hasStatusFilter = false
                try {
                    // SWR keys are often relative paths, so we use a dummy base for URL parsing
                    const url = new URL(key, 'http://dummy.com')
                    const statusFilter = url.searchParams.get('status')

                    if (statusFilter) {
                        hasStatusFilter = true
                        const allowedStatuses = statusFilter.split(',')
                        shouldBeInList = allowedStatuses.includes(newStatus)
                    }

                    // Also check for isPaid filter if relevant
                    const isPaidFilter = url.searchParams.get('isPaid')
                    if (isPaidFilter !== null && data.isPaid !== undefined) {
                        const filterVal = isPaidFilter === 'true'
                        if (filterVal !== data.isPaid) shouldBeInList = false
                    }

                    // Handle isCancelledTab filter
                    const isCancelledTabFilter = url.searchParams.get('isCancelledTab') === 'true'
                    if (isCancelledTabFilter) {
                        // Logic from ordersService.js: 
                        // Order is in cancelled tab if:
                        // 1. Status is CANCELLED
                        // 2. Payment status is cancelled
                        // 3. Shipping has failureReason
                        // 4. BUT NOT if status is DELIVERED or COMPLETED

                        const isCancelled =
                            newStatus === 'CANCELLED' ||
                            data.paymentStatus === 'cancelled' ||
                            (data.shipping?.failureReason || data.failureReason);

                        const isTerminalSuccess = ['DELIVERED', 'COMPLETED'].includes(newStatus);

                        shouldBeInList = isCancelled && !isTerminalSuccess;
                    }
                } catch (e) {
                    // If parsing fails, default to keeping it (safety first)
                }

                const isInList = currentData.orders.some(order => order.id === orderId)

                // 2. Logic for updating the list
                if (shouldBeInList) {
                    if (isInList) {
                        // Update existing order
                        return {
                            ...currentData,
                            orders: currentData.orders.map(order =>
                                order.id === orderId
                                    ? {
                                        ...order,
                                        status: newStatus,
                                        isPaid: data.isPaid !== undefined ? data.isPaid : order.isPaid,
                                        // Update shipping if provided in payload (common in sync events)
                                        shipping: data.shipping
                                            ? { ...order.shipping, ...data.shipping }
                                            : data.shippingStatus
                                                ? { ...order.shipping, status: data.shippingStatus }
                                                : order.shipping,
                                        // Update other fields if present
                                        ...(data.total ? { total: data.total } : {}),
                                        ...(data.paymentMethod ? { paymentMethod: data.paymentMethod } : {})
                                    }
                                    : order
                            )
                        }
                    } else if (hasStatusFilter) {
                        // It belongs here but isn't present. 
                        // Returning undefined triggers a full revalidation for this key.
                        return undefined
                    }
                }
                // 3. If it should NOT be in the list anymore
                else if (isInList) {
                    console.log(`[Realtime] Removing order ${orderId} from cache ${key} as status ${newStatus} does not match filter.`)
                    return {
                        ...currentData,
                        orders: currentData.orders.filter(order => order.id !== orderId)
                    }
                }

                return currentData
            },
            { revalidate: forceRevalidate || true } // Always revalidate in background to ensure perfect sync
        )
    }

    const setupPusherListeners = (pusherInstance) => {
        console.log("[Realtime] Subscribing to Pusher channels...")

        // 1. Admin Channel
        const adminChannel = pusherInstance.subscribe('admin-notifications')
        adminChannel.bind('user-registered', (data) => handleGlobalEvent('user-registered', data))
        adminChannel.bind('user-updated', (data) => handleGlobalEvent('user-updated', data))
        adminChannel.bind('store-updated', (data) => handleGlobalEvent('store-updated', data))
        adminChannel.bind('store-status-updated', (data) => handleGlobalEvent('store-status-updated', data))

        // 2. User Channel (for buyer notifications)
        if (user?.id) {
            const userChannelName = `user-${user.id}`
            console.log(`[Realtime] Subscribing to ${userChannelName}`)
            const userChannel = pusherInstance.subscribe(userChannelName)
            userChannel.bind('order-updated', (data) => handleGlobalEvent('order-updated', data))
            userChannel.bind('order-created', (data) => handleGlobalEvent('order-created', data))
            userChannel.bind('return-updated', (data) => handleGlobalEvent('return-updated', data))
            userChannel.bind('dispute-resolved', (data) => handleGlobalEvent('dispute-resolved', data))
            userChannel.bind('rating-created', (data) => handleGlobalEvent('rating-created', data))
            userChannel.bind('message-received', (data) => handleGlobalEvent('message-received', data))
            userChannel.bind('user-updated', (data) => handleGlobalEvent('user-updated', data))
            userChannel.bind('store-updated', (data) => handleGlobalEvent('store-updated', data))
            userChannel.bind('store-status-updated', (data) => handleGlobalEvent('store-status-updated', data))
        }

        // 3. Store Channel (if user has a store)
        if (user?.store?.id) {
            const channelName = `store-${user.store.id}`
            console.log(`[Realtime] Subscribing to ${channelName}`)
            const storeChannel = pusherInstance.subscribe(channelName)

            storeChannel.bind('order-created', (data) => handleGlobalEvent('order-created', data))
            storeChannel.bind('order-updated', (data) => handleGlobalEvent('order-updated', data))
            storeChannel.bind('return-requested', (data) => handleGlobalEvent('return-requested', data))
            storeChannel.bind('return-updated', (data) => handleGlobalEvent('return-updated', data))
            storeChannel.bind('dispute-resolved', (data) => handleGlobalEvent('dispute-resolved', data))
            storeChannel.bind('rating-created', (data) => handleGlobalEvent('rating-created', data))
        }

        // 4. Marketplace Public Channel
        const marketChannel = pusherInstance.subscribe('marketplace-updates')
        marketChannel.bind('product-added', (data) => handleGlobalEvent('product-added', data))
        marketChannel.bind('product-updated', (data) => handleGlobalEvent('product-updated', data))
    }

    const setupSocketListeners = (socketInstance) => {
        console.log("[Realtime] Setting up Socket.io listeners...")

        socketInstance.on('connect', () => {
            console.log("✅ Socket.io Connected")
            socketInstance.emit('subscribe', 'admin-notifications')
            if (user?.id) socketInstance.emit('subscribe', `user-${user.id}`)
            if (user?.store?.id) socketInstance.emit('subscribe', `store-${user.store.id}`)
            socketInstance.emit('subscribe', 'marketplace-updates')
        })

        socketInstance.on('user-registered', (data) => handleGlobalEvent('user-registered', data))
        socketInstance.on('order-updated', (data) => handleGlobalEvent('order-updated', data))
        socketInstance.on('order-created', (data) => handleGlobalEvent('order-created', data))
        socketInstance.on('return-requested', (data) => handleGlobalEvent('return-requested', data))
        socketInstance.on('return-updated', (data) => handleGlobalEvent('return-updated', data))
        socketInstance.on('dispute-resolved', (data) => handleGlobalEvent('dispute-resolved', data))
        socketInstance.on('rating-created', (data) => handleGlobalEvent('rating-created', data))
        socketInstance.on('message-received', (data) => handleGlobalEvent('message-received', data))
        socketInstance.on('product-added', (data) => handleGlobalEvent('product-added', data))
        socketInstance.on('product-updated', (data) => handleGlobalEvent('product-updated', data))
        socketInstance.on('user-updated', (data) => handleGlobalEvent('user-updated', data))
        socketInstance.on('store-updated', (data) => handleGlobalEvent('store-updated', data))
        socketInstance.on('store-status-updated', (data) => handleGlobalEvent('store-status-updated', data))
    }

    return (
        <SWRConfig value={swrOptions}>
            {children}
        </SWRConfig>
    )
}
