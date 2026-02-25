'use client'

import { useState, useEffect, useRef } from 'react'
import { SendIcon } from 'lucide-react'
import toast from 'react-hot-toast'
import useSWR from 'swr'
import { formatManilaTime } from "@/lib/dateUtils"

export default function ChatWindow({ chatId, currentUserId }) {
    const { data: messages = [], mutate } = useSWR(
        chatId ? `/api/chats/${chatId}/messages` : null,
        (url) => fetch(url).then(res => res.json()),
        {
            revalidateOnFocus: true,
            dedupingInterval: 2000
        }
    )
    const [newMessage, setNewMessage] = useState('')
    const [loading, setLoading] = useState(false)
    const messagesEndRef = useRef(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    const sendMessage = async (e) => {
        e.preventDefault()
        if (!newMessage.trim()) return

        const messageContent = newMessage.trim()
        setNewMessage('') // Clear input immediately
        setLoading(true)

        try {
            const res = await fetch(`/api/chats/${chatId}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: messageContent })
            })

            if (res.ok) {
                // SWR will be updated by the realtime event, 
                // but we can call mutate() here to be sure or just wait for the event.
                // mutate() is safer to ensure immediate local update.
                mutate() 
            } else {
                toast.error('Failed to send message')
                setNewMessage(messageContent) // Restore text on failure
            }
        } catch (error) {
            console.error('Error sending message:', error)
            toast.error('Failed to send message')
            setNewMessage(messageContent) // Restore text on failure
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex flex-col h-[600px] bg-white rounded-lg shadow-md">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                    <div className="text-center text-gray-500 mt-8">
                        No messages yet. Start the conversation!
                    </div>
                ) : (
                    messages.map((message) => (
                        <div
                            key={message.id}
                            className={`flex ${message.senderId === currentUserId ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-[70%] rounded-lg p-3 ${message.senderId === currentUserId
                                        ? 'bg-emerald-500 text-white'
                                        : 'bg-gray-100 text-gray-800'
                                    }`}
                            >
                                <p className="text-sm font-medium mb-1">{message.sender.name}</p>
                                <p>{message.content}</p>
                                <p className="text-xs mt-1 opacity-70">
                                    {formatManilaTime(message.createdAt, { timeStyle: 'short' })}
                                </p>
                            </div>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={sendMessage} className="border-t p-4 flex gap-2">
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    disabled={loading}
                />
                <button
                    type="submit"
                    disabled={loading || !newMessage.trim()}
                    className="bg-emerald-500 text-white px-4 py-2 rounded-lg hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <SendIcon className="w-5 h-5" />
                </button>
            </form>
        </div>
    )
}
