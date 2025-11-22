"use client";

import { useChatStore } from '@/store/useChatStore';
import clsx from 'clsx';
import { MessageCircle, Send, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export default function ChatWidget() {
    const { connect, isOpen, toggleChat, messages, sendMessage, userId } = useChatStore();
    const { adminTyping, setTyping } = useChatStore();
    const [input, setInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const typingTimeoutRef = useRef<number | null>(null);

    useEffect(() => {
        connect();
    }, [connect]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;
        sendMessage(input);
        // stop typing signal
        setTyping(false);
        setInput('');
    };

    const handleInputChange = (value: string) => {
        setInput(value);
        // emit typing true
        setTyping(true);
        // debounce stop typing
        if (typingTimeoutRef.current) {
            window.clearTimeout(typingTimeoutRef.current);
        }
        typingTimeoutRef.current = window.setTimeout(() => {
            setTyping(false);
        }, 900);
    };

    return (
        <div className="fixed bottom-4 right-4 z-50">
            {isOpen && (
                <div className="mb-4 w-96 h-[600px] bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl flex flex-col border border-gray-200/50 overflow-hidden relative">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-5 text-white flex justify-between items-center shadow-lg">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center font-bold shadow-md">
                                <MessageCircle size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg">Chat Support</h3>
                                <p className="text-xs text-blue-100">We're here to help</p>
                            </div>
                        </div>
                        <button 
                            onClick={toggleChat} 
                            className="hover:bg-white/20 rounded-lg p-2 transition-all hover:rotate-90"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 p-5 overflow-y-auto bg-gradient-to-b from-gray-50 via-blue-50/30 to-indigo-50/30">
                        {messages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center">
                                <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center mb-4">
                                    <MessageCircle className="w-10 h-10 text-blue-600" />
                                </div>
                                <p className="text-gray-500 font-medium">Start a conversation</p>
                                <p className="text-gray-400 text-sm mt-1">Send a message to get started!</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {messages.map((msg) => (
                                    <div 
                                        key={msg.id} 
                                        className={clsx(
                                            "flex items-end gap-2 opacity-0 animate-fade-in",
                                            msg.sender === 'user' ? "justify-end" : "justify-start"
                                        )}
                                    > 
                                        {msg.sender !== 'user' && (
                                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white font-bold text-xs shadow-md flex-shrink-0">
                                                A
                                            </div>
                                        )}
                                        <div className={clsx(
                                            "px-4 py-3 rounded-2xl max-w-[75%] shadow-md transition-all duration-200",
                                            msg.sender === 'user'
                                                ? "bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-br-sm"
                                                : "bg-white text-gray-900 border border-gray-200 rounded-bl-sm"
                                        )}>
                                            <p className="text-sm leading-relaxed font-medium">{msg.content}</p>
                                            <span className={clsx(
                                                "text-xs block mt-2",
                                                msg.sender === 'user' ? "text-blue-100" : "text-gray-400"
                                            )}>
                                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        {msg.sender === 'user' && (
                                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold text-xs shadow-md flex-shrink-0">
                                                U
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                        
                        {/* Admin typing indicator */}
                        {adminTyping && (
                            <div className="flex items-center gap-2 mt-3 animate-fade-in">
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white font-bold text-xs shadow-md">
                                    A
                                </div>
                                <div className="bg-white rounded-2xl px-4 py-3 shadow-md border border-gray-200">
                                    <div className="flex gap-1.5">
                                        <span className="block w-2 h-2 rounded-full bg-gray-400 animate-bounce [animation-delay:0ms]" />
                                        <span className="block w-2 h-2 rounded-full bg-gray-400 animate-bounce [animation-delay:150ms]" />
                                        <span className="block w-2 h-2 rounded-full bg-gray-400 animate-bounce [animation-delay:300ms]" />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Input Area */}
                    <form onSubmit={handleSend} className="p-4 bg-white/80 backdrop-blur-xl border-t border-gray-200/50 shadow-lg">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => handleInputChange(e.target.value)}
                                placeholder="Type your message..."
                                className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            />
                            <button 
                                type="submit" 
                                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 flex items-center justify-center shadow-lg hover:shadow-xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={!input.trim()}
                            >
                                <Send size={18} />
                            </button>
                        </div>
                    </form>
                </div>
            )}
            
            {/* Toggle Button */}
            <button
                onClick={toggleChat}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white p-5 rounded-full shadow-2xl transition-all transform hover:scale-110 hover:rotate-12 relative group"
            >
                {isOpen ? (
                    <X size={24} className="transition-transform group-hover:rotate-90" />
                ) : (
                    <>
                        <MessageCircle size={24} />
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
                    </>
                )}
            </button>
        </div>
    );
}
