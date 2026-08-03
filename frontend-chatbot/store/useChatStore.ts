import { io, Socket } from 'socket.io-client';
import { create } from 'zustand';

interface Message {
    id: string;
    content: string;
    sender: string;
    createdAt: string;
    userId: string;
    isAi?: boolean;
    status?: string;
}

interface ChatStore {
    socket: Socket | null;
    messages: Message[];
    isOpen: boolean;
    userId: string | null;
    adminTyping: boolean;
    connect: () => void;
    sendMessage: (content: string) => void;
    markAsRead: () => void;
    toggleChat: () => void;
    setMessages: (messages: Message[]) => void;
    addMessage: (message: Message) => void;
    setTyping: (typing: boolean) => void;
}

export const useChatStore = create<ChatStore>((set, get) => ({
    socket: null,
    messages: [],
    isOpen: false,
    userId: null,
    adminTyping: false,
    connect: () => {
        if (get().socket) return;

        // Generate a random user ID if not exists
        let storedUserId = localStorage.getItem('chat_user_id');
        if (!storedUserId) {
            storedUserId = 'user_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('chat_user_id', storedUserId);
        }
        set({ userId: storedUserId });

        const API_URL =
            process.env.NEXT_PUBLIC_API_URL ||
            "https://chatbot-1-02fl.onrender.com";
        const socket = io(API_URL);
        set({ socket });

        socket.on('connect', () => {
            console.log('Connected to server');
            socket.emit('join_chat', storedUserId);
        });

        socket.on('receive_message', (message: Message) => {
            get().addMessage(message);
        });

        socket.on('typing', (data: { userId: string, typing: boolean, sender: string }) => {
            // if admin is typing, set adminTyping true
            if (data.sender === 'admin') {
                set({ adminTyping: data.typing });
            }
        });

        socket.on('messages_read', (data: { userId: string, reader: string }) => {
            const currentMessages = get().messages;
            const updatedMessages = currentMessages.map(msg => {
                if (msg.userId === data.userId) {
                    const senderToUpdate = data.reader === 'user' ? 'admin' : 'user';
                    if (msg.sender === senderToUpdate && msg.status !== 'READ') {
                        return { ...msg, status: 'READ' };
                    }
                }
                return msg;
            });
            set({ messages: updatedMessages });
        });

        // Fetch existing messages
        fetch(`${API_URL}/api/messages/${storedUserId}`)
            .then(res => res.json())
            .then(data => set({ messages: data }))
            .catch(err => console.error(err));
    },
    sendMessage: (content: string) => {
        const { socket, userId } = get();
        if (socket && userId) {
            socket.emit('send_message', { userId, content, sender: 'user' });
        }
    },
    markAsRead: () => {
        const { socket, userId } = get();
        if (socket && userId) {
            socket.emit('mark_as_read', { userId, sender: 'user' });
        }
    },
    toggleChat: () => {
        set((state) => ({ isOpen: !state.isOpen }));
        if (get().isOpen) {
            get().markAsRead();
        }
    },
    setMessages: (messages) => set({ messages }),
    addMessage: (message) => {
        set((state) => ({ messages: [...state.messages, message] }));
        // If chat is open, mark new messages as read immediately
        if (get().isOpen) {
            get().markAsRead();
        }
    },
    setTyping: (typing: boolean) => {
        const { socket, userId } = get();
        if (socket && userId) {
            socket.emit('typing', { userId, typing, sender: 'user' });
        }
    }
}));
