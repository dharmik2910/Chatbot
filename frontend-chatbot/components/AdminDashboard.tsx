"use client";

import clsx from 'clsx';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { io, type Socket } from 'socket.io-client';

interface Message {
    id: string;
    content: string;
    sender: string;
    createdAt: string;
    userId: string;
}

interface User {
    id: string;
    name?: string;
    messages: Message[];
}

export default function AdminDashboard() {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [chats, setChats] = useState<User[]>([]);
    const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [reply, setReply] = useState('');
    const [userTyping, setUserTyping] = useState(false);
    const typingTimeoutRef = useRef<number | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    useEffect(() => {
        const newSocket = io('http://localhost:3001');
        setSocket(newSocket);

        newSocket.on('connect', () => {
            console.log('Admin connected');
            newSocket.emit('admin_join');
        });

        newSocket.on('chat_updated', () => {
            fetchChats();
        });

        newSocket.on('receive_message', (message: Message) => {
            if (selectedChatId === message.userId) {
                setMessages(prev => [...prev, message]);
            }
            fetchChats(); // Update list preview
        });

        newSocket.on('typing', (data: { userId: string, typing: boolean, sender: string }) => {
            // show typing indicator when the selected user is typing
            if (data.userId === selectedChatId && data.sender === 'user') {
                setUserTyping(data.typing);
            }
        });

        return () => {
            newSocket.disconnect();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedChatId]);

    const fetchChats = async () => {
        try {
            const res = await fetch('http://localhost:3001/api/chats');
            const data = await res.json();
            setChats(data);
        } catch (e) {
            console.error(e);
        }
    };

    const fetchMessages = async (userId: string) => {
        try {
            const res = await fetch(`http://localhost:3001/api/messages/${userId}`);
            const data = await res.json();
            setMessages(data);
        } catch (e) {
            console.error(e);
        }
    };

    const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        try {
            const res = await fetch('http://localhost:3001/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await res.json();
            if (data.success) {
                setIsAuthenticated(true);
                fetchChats();
            } else {
                alert('Invalid credentials');
            }
        } catch (e) {
            alert('Login failed');
        }
    };

    const handleSelectChat = (userId: string) => {
        setSelectedChatId(userId);
        fetchMessages(userId);
    };

    const handleReply = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!reply.trim() || !selectedChatId || !socket) return;

        socket.emit('send_message', {
            userId: selectedChatId,
            content: reply,
            sender: 'admin'
        });
        // notify stop typing
        socket.emit('typing', { userId: selectedChatId, typing: false, sender: 'admin' });
        if (typingTimeoutRef.current) {
            window.clearTimeout(typingTimeoutRef.current);
        }
        setReply('');
    };

    const handleReplyInputChange = (value: string) => {
        setReply(value);
        if (!socket || !selectedChatId) return;
        socket.emit('typing', { userId: selectedChatId, typing: true, sender: 'admin' });
        if (typingTimeoutRef.current) {
            window.clearTimeout(typingTimeoutRef.current);
        }
        typingTimeoutRef.current = window.setTimeout(() => {
            if (socket && selectedChatId) socket.emit('typing', { userId: selectedChatId, typing: false, sender: 'admin' });
        }, 900);
    };

    if (!isAuthenticated) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-20"></div>
                <form onSubmit={handleLogin} className="bg-white/10 backdrop-blur-xl p-10 rounded-2xl shadow-2xl w-full max-w-md border border-white/20">
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-4 shadow-lg">
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                        <h2 className="text-3xl font-bold text-white mb-2">Admin Portal</h2>
                        <p className="text-white/70">Sign in to manage chats</p>
                    </div>
                    <div className="space-y-5">
                        <div>
                            <input
                                className="w-full bg-white/10 border border-white/20 text-white placeholder-white/50 p-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white/20 transition-all"
                                placeholder="Username"
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                            />
                        </div>
                        <div>
                            <input
                                className="w-full bg-white/10 border border-white/20 text-white placeholder-white/50 p-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white/20 transition-all"
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                            />
                        </div>
                        <button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transform hover:scale-[1.02] transition-all shadow-lg hover:shadow-xl">
                            Sign In
                        </button>
                    </div>
                </form>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
            {/* Sidebar */}
            <div className="w-80 bg-white/80 backdrop-blur-xl border-r border-gray-200/50 shadow-xl flex flex-col">
                <div className="p-6 border-b border-gray-200/50 bg-gradient-to-r from-blue-600 to-indigo-600">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="font-bold text-xl text-white">Active Chats</h2>
                            <p className="text-blue-100 text-sm">{chats.length} conversations</p>
                        </div>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {chats.length === 0 ? (
                        <div className="p-8 text-center text-gray-400">
                            <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                            </svg>
                            <p>No active chats</p>
                        </div>
                    ) : (
                        chats.map(chat => (
                            <div
                                key={chat.id}
                                onClick={() => handleSelectChat(chat.id)}
                                className={clsx(
                                    "flex items-center gap-4 p-4 cursor-pointer transition-all duration-200 border-b border-gray-100/50",
                                    selectedChatId === chat.id 
                                        ? "bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-l-blue-600 shadow-sm" 
                                        : "hover:bg-gray-50/50"
                                )}
                            >
                                <div className={clsx(
                                    "w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg shadow-md transition-all",
                                    selectedChatId === chat.id
                                        ? "bg-gradient-to-br from-blue-500 to-indigo-600 text-white scale-110"
                                        : "bg-gradient-to-br from-gray-200 to-gray-300 text-gray-700"
                                )}>
                                    {chat.name ? chat.name[0]?.toUpperCase() : chat.id[0]?.toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-semibold text-gray-900 truncate">
                                        {chat.name || `User ${chat.id.substring(0, 8)}`}
                                    </div>
                                    <div className="text-sm text-gray-500 truncate mt-1">
                                        {chat.messages[0]?.content || "No messages yet"}
                                    </div>
                                    {chat.messages[0] && (
                                        <div className="text-xs text-gray-400 mt-1">
                                            {new Date(chat.messages[0].createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col bg-white/50 backdrop-blur-sm">
                {selectedChatId ? (
                    <>
                        {/* Chat Header */}
                        <div className="p-6 bg-white/80 backdrop-blur-xl border-b border-gray-200/50 shadow-sm">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                                    {chats.find(c => c.id === selectedChatId)?.name
                                        ? chats.find(c => c.id === selectedChatId)?.name![0]?.toUpperCase()
                                        : selectedChatId[0]?.toUpperCase()}
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-lg text-gray-900">
                                        {chats.find(c => c.id === selectedChatId)?.name || `User ${selectedChatId.substring(0, 8)}`}
                                    </h3>
                                    {userTyping && (
                                        <div className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                                            <div className="flex gap-1">
                                                <span className="w-2 h-2 rounded-full bg-green-500 animate-bounce [animation-delay:0ms]" />
                                                <span className="w-2 h-2 rounded-full bg-green-500 animate-bounce [animation-delay:150ms]" />
                                                <span className="w-2 h-2 rounded-full bg-green-500 animate-bounce [animation-delay:300ms]" />
                                            </div>
                                            <span>User is typing...</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 p-6 overflow-y-auto bg-gradient-to-b from-white via-blue-50/30 to-indigo-50/30">
                            <div className="max-w-4xl mx-auto space-y-4">
                                {messages.length === 0 ? (
                                    <div className="text-center py-12 text-gray-400">
                                        <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                        </svg>
                                        <p>No messages yet. Start the conversation!</p>
                                    </div>
                                ) : (
                                    messages.map(msg => (
                                        <div
                                            key={msg.id}
                                            className={clsx(
                                                "flex items-end gap-3 opacity-0 animate-fade-in",
                                                msg.sender === "admin" ? "justify-end" : "justify-start"
                                            )}
                                        >
                                            {msg.sender !== "admin" && (
                                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white font-bold text-xs shadow-md flex-shrink-0">
                                                    {chats.find(c => c.id === msg.userId)?.name
                                                        ? chats.find(c => c.id === msg.userId)?.name![0]?.toUpperCase()
                                                        : msg.userId[0]?.toUpperCase()}
                                                </div>
                                            )}
                                            <div
                                                className={clsx(
                                                    "px-4 py-3 rounded-2xl max-w-[70%] shadow-md transition-all duration-200",
                                                    msg.sender === "admin"
                                                        ? "bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-br-sm"
                                                        : "bg-white text-gray-900 border border-gray-200 rounded-bl-sm"
                                                )}
                                            >
                                                <p className="text-sm leading-relaxed">{msg.content}</p>
                                                <span className={clsx(
                                                    "text-xs block mt-2",
                                                    msg.sender === "admin" ? "text-blue-100" : "text-gray-400"
                                                )}>
                                                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            {msg.sender === "admin" && (
                                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold text-xs shadow-md flex-shrink-0">
                                                    A
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Input Area */}
                        <form onSubmit={handleReply} className="p-6 bg-white/80 backdrop-blur-xl border-t border-gray-200/50 shadow-lg">
                            <div className="max-w-4xl mx-auto flex gap-3">
                                <input
                                    className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    placeholder="Type your message..."
                                    value={reply}
                                    onChange={e => handleReplyInputChange(e.target.value)}
                                />
                                <button 
                                    type="submit"
                                    className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transform hover:scale-105 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={!reply.trim()}
                                >
                                    Send
                                </button>
                            </div>
                        </form>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="text-center">
                            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-3xl flex items-center justify-center">
                                <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                            </div>
                            <h3 className="text-2xl font-bold text-gray-700 mb-2">Select a conversation</h3>
                            <p className="text-gray-500">Choose a chat from the sidebar to start messaging</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
