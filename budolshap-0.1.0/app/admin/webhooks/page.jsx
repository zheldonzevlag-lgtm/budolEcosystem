'use client'
import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { Activity, RefreshCcw, Eye, RotateCw, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'
import Loading from "@/components/Loading"
import { formatManilaTime } from "@/lib/dateUtils"

export default function AdminWebhooks() {
    const [events, setEvents] = useState([])
    const [loading, setLoading] = useState(true)
    const [viewEvent, setViewEvent] = useState(null)
    const [retryingId, setRetryingId] = useState(null)
    const [simulateOpen, setSimulateOpen] = useState(false)
    const [simulatePayload, setSimulatePayload] = useState(JSON.stringify({
        eventType: "DRIVER_ASSIGNED",
        data: {
            order: {
                orderId: "REPLACE_WITH_LALAMOVE_BOOKING_ID"
            },
            driver: {
                driverId: "888",
                name: "Simulated Driver",
                phone: "+639999999999",
                plateNumber: "ABC-1234",
                photo: "https://via.placeholder.com/150",
                rating: "5.0"
            },
            location: {
                lat: "14.5547",
                lng: "121.0244"
            }
        }
    }, null, 2))
    const [simulating, setSimulating] = useState(false)

    const fetchEvents = async () => {
        try {
            // Don't set loading on refresh to allow background refresh
            if (events.length === 0) setLoading(true)

            const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
            const response = await fetch('/api/admin/webhooks', {
                credentials: 'include',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
            if (response.ok) {
                const data = await response.json()
                setEvents(data)
            } else {
                toast.error('Failed to fetch webhook logs')
            }
        } catch (error) {
            console.error('Error:', error)
            toast.error('Error fetching logs')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchEvents()
    }, [])

    const handleRetry = async (eventId, e) => {
        e.stopPropagation()
        setRetryingId(eventId)
        try {
            const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
            const response = await fetch('/api/admin/webhooks/retry', {
                method: 'POST',
                credentials: 'include',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ eventId })
            })

            const data = await response.json()

            if (response.ok && data.success) {
                toast.success('Retry initiatied successfully')
                setTimeout(fetchEvents, 2000)
            } else {
                toast.error(data.message || 'Retry failed')
            }
        } catch (error) {
            console.error('Retry error:', error)
            toast.error('Retry failed')
        } finally {
            setRetryingId(null)
        }
    }

    const handleSimulate = async () => {
        try {
            const payload = JSON.parse(simulatePayload)
            setSimulating(true)

            const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
            const response = await fetch('/api/admin/webhooks/simulate', {
                method: 'POST',
                credentials: 'include',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    provider: 'lalamove',
                    payload
                })
            })

            const data = await response.json()

            if (response.ok && data.success) {
                toast.success('Simulation sent successfully')
                setSimulateOpen(false)
                setTimeout(fetchEvents, 2000)
            } else {
                toast.error(data.message || 'Simulation failed')
            }
        } catch (error) {
            console.error('Simulation error:', error)
            toast.error(error.message || 'Invalid JSON')
        } finally {
            setSimulating(false)
        }
    }

    const getStatusColor = (status) => {
        switch (status) {
            case 'SUCCESS': return 'bg-green-100 text-green-700'
            case 'FAILED': return 'bg-red-100 text-red-700'
            case 'IGNORED': return 'bg-slate-100 text-slate-700'
            case 'PENDING': return 'bg-yellow-100 text-yellow-700'
            default: return 'bg-slate-100 text-slate-700'
        }
    }

    const getStatusIcon = (status) => {
        switch (status) {
            case 'SUCCESS': return <CheckCircle size={14} />
            case 'FAILED': return <XCircle size={14} />
            case 'IGNORED': return <AlertTriangle size={14} />
            default: return <Activity size={14} />
        }
    }

    const failedCount = events.filter(e => e.status === 'FAILED').length

    if (loading && events.length === 0) return <Loading />

    return (
        <div className="text-slate-600 mb-20">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2 text-slate-800">
                        <Activity className="text-blue-600" />
                        Webhook History
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">Monitor and debug shipping provider webhooks</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setSimulateOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                        <RefreshCcw size={16} className="rotate-90" />
                        Simulate Event
                    </button>
                    <button
                        onClick={fetchEvents}
                        className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-slate-50 transition"
                    >
                        <RefreshCcw size={16} />
                        Refresh
                    </button>
                </div>
            </div>

            {failedCount > 0 && (
                <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3 text-red-700 animate-pulse">
                    <AlertTriangle />
                    <div>
                        <span className="font-bold">{failedCount} Failed Webhooks Detected.</span>
                        <span className="text-sm ml-1">Please review and retry them.</span>
                    </div>
                </div>
            )}

            <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 border-b">
                            <tr>
                                <th className="p-4 font-semibold text-slate-700">Events</th>
                                <th className="p-4 font-semibold text-slate-700">Type</th>
                                <th className="p-4 font-semibold text-slate-700">Order ID</th>
                                <th className="p-4 font-semibold text-slate-700">Status</th>
                                <th className="p-4 font-semibold text-slate-700">Date</th>
                                <th className="p-4 font-semibold text-slate-700 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {events.length > 0 ? events.map((event) => (
                                <tr key={event.id} className="hover:bg-slate-50 transition">
                                    <td className="p-4">
                                        <div className="font-medium text-slate-800">{event.provider}</div>
                                        <div className="text-xs text-slate-400 font-mono">{event.id}</div>
                                    </td>
                                    <td className="p-4">
                                        <span className="inline-block px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium font-mono">
                                            {event.eventType}
                                        </span>
                                    </td>
                                    <td className="p-4 font-mono text-xs">
                                        {event.orderId || '-'}
                                    </td>
                                    <td className="p-4">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(event.status)}`}>
                                            {getStatusIcon(event.status)}
                                            {event.status}
                                        </span>
                                        {event.error && (
                                            <div className="text-xs text-red-500 mt-1 max-w-[200px] truncate" title={event.error}>
                                                {event.error}
                                            </div>
                                        )}
                                    </td>
                                    <td className="p-4 text-slate-500">
                                        {formatManilaTime(event.createdAt)}
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => setViewEvent(event)}
                                                className="p-1.5 hover:bg-slate-200 rounded text-slate-500 hover:text-blue-600 transition"
                                                title="View Payload"
                                            >
                                                <Eye size={18} />
                                            </button>

                                            {event.status !== 'SUCCESS' && (
                                                <button
                                                    onClick={(e) => handleRetry(event.id, e)}
                                                    className="p-1.5 hover:bg-slate-200 rounded text-slate-500 hover:text-green-600 transition"
                                                    title="Retry Webhook"
                                                    disabled={retryingId === event.id}
                                                >
                                                    <RotateCw size={18} className={retryingId === event.id ? 'animate-spin' : ''} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="6" className="p-12 text-center text-slate-400">
                                        No webhook events recorded yet
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Simulate Modal */}
            {simulateOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSimulateOpen(false)}>
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="p-4 border-b flex items-center justify-between">
                            <h3 className="font-bold text-lg">Simulate Webhook Event</h3>
                            <button onClick={() => setSimulateOpen(false)} className="p-1 hover:bg-slate-100 rounded">
                                <XCircle size={20} />
                            </button>
                        </div>
                        <div className="p-4">
                            <p className="text-sm text-slate-500 mb-2">Paste JSON payload below. Use a real booking ID to test database updates.</p>
                            <textarea
                                value={simulatePayload}
                                onChange={(e) => setSimulatePayload(e.target.value)}
                                className="w-full h-64 p-3 font-mono text-xs bg-slate-50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div className="p-4 border-t flex justify-end gap-3">
                            <button
                                onClick={() => setSimulateOpen(false)}
                                className="px-4 py-2 hover:bg-slate-100 rounded text-slate-700 font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSimulate}
                                disabled={simulating}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium flex items-center gap-2"
                            >
                                {simulating ? <RotateCw className="animate-spin" size={16} /> : <div className="flex items-center gap-2"><RefreshCcw size={16} className="rotate-90" /> Send Simulation</div>}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Payload Viewer Modal */}
            {viewEvent && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setViewEvent(null)}>
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="p-4 border-b flex items-center justify-between">
                            <h3 className="font-bold text-lg">Webhook Payload</h3>
                            <button onClick={() => setViewEvent(null)} className="p-1 hover:bg-slate-100 rounded">
                                <XCircle size={20} />
                            </button>
                        </div>
                        <div className="p-0 overflow-auto bg-slate-900 text-green-400 p-4 font-mono text-xs">
                            <pre>{JSON.stringify(viewEvent.payload, null, 2)}</pre>
                        </div>
                        <div className="p-4 border-t flex justify-end">
                            <button
                                onClick={() => setViewEvent(null)}
                                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 font-medium"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
