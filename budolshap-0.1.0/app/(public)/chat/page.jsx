'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MessageSquareIcon } from 'lucide-react'
import ChatWindow from '@/components/ChatWindow'
import toast from 'react-hot-toast'
import { getUser } from '@/lib/auth-client'

export default function BuyerChatPage() {
    const router = useRouter()
    const [chats, setChats] = useState([])
    const [selectedChat, setSelectedChat] = useState(null)
    const [loading, setLoading] = useState(true)
    const [currentUser, setCurrentUser] = useState(null)

    useEffect(() => {
        fetchUserAndChats()
    }, [])

    const fetchUserAndChats = async () => {
        try {
            const userData = getUser()
            if (!userData) {
                router.push('/login')
                return
            }
            setCurrentUser(userData)

            const chatsRes = await fetch('/api/chats')
            if (chatsRes.ok) {
                const data = await chatsRes.json()
                setChats(data)
            }
        } catch (error) {
            console.error('Error:', error)
            toast.error('Failed to load chats')
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
            </div>
        )
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex items-center gap-3 mb-6">
                <MessageSquareIcon className="w-8 h-8 text-emerald-500" />
                <h1 className="text-3xl font-bold">My Messages</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Chat List */}
                <div className="lg:col-span-1 bg-white rounded-lg shadow-md p-4 max-h-[700px] overflow-y-auto">
                    <h2 className="font-semibold text-lg mb-4">Conversations</h2>
                    {chats.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">No conversations yet</p>
                    ) : (
                        <div className="space-y-2">
                            {chats.map((chat) => {
                                const lastMessage = chat.messages[0]

                                return (
                                    <div
                                        key={chat.id}
                                        onClick={() => setSelectedChat(chat)}
                                        className={`p-3 rounded-lg cursor-pointer transition ${selectedChat?.id === chat.id
                                            ? 'bg-emerald-50 border-2 border-emerald-500'
                                            : 'hover:bg-gray-50 border-2 border-transparent'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <img
                                                src={chat.store.logo || '/default-store.png'}
                                                alt={chat.store.name}
                                                className="w-12 h-12 rounded-full object-cover"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium truncate">{chat.store.name}</p>
                                                {lastMessage && (
                                                    <p className="text-sm text-gray-600 truncate">
                                                        {lastMessage.content}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>

                {/* Chat Window */}
                <div className="lg:col-span-2">
                    {selectedChat ? (
                        <div>
                            <div className="bg-white rounded-lg shadow-md p-4 mb-4">
                                <div className="flex items-center gap-3">
                                    <img
                                        src={selectedChat.store.logo || '/default-store.png'}
                                        alt={selectedChat.store.name}
                                        className="w-12 h-12 rounded-full object-cover"
                                    />
                                    <div>
                                        <h2 className="font-semibold text-lg">{selectedChat.store.name}</h2>
                                        <p className="text-sm text-gray-600">{selectedChat.seller.name}</p>
                                    </div>
                                </div>
                            </div>
                            <ChatWindow chatId={selectedChat.id} currentUserId={currentUser?.id} />
                        </div>
                    ) : (
                        <div className="bg-white rounded-lg shadow-md p-8 text-center h-[600px] flex items-center justify-center">
                            <div>
                                <MessageSquareIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500 text-lg">Select a conversation to start messaging</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
