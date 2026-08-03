import { PrismaClient } from '@prisma/client';
import { Server, Socket } from 'socket.io';
import OpenAI from 'openai';

const prisma = new PrismaClient();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || 'mock_key' });


export const setupSocket = (io: Server) => {
    io.on('connection', (socket: Socket) => {
        console.log('User connected:', socket.id);

        socket.on('join_chat', async (userId: string) => {
            socket.join(userId);
            console.log(`User ${userId} joined room ${userId}`);

            // Ensure user exists
            try {
                let user = await prisma.user.findUnique({ where: { id: userId } });
                if (!user) {
                    user = await prisma.user.create({ data: { id: userId } });
                    io.emit('chat_updated', user); // Notify admin of new user
                }
            } catch (e) {
                console.error("Error creating user:", e);
            }
        });

        socket.on('send_message', async (data: { userId: string, content: string, sender: string }) => {
            const { userId, content, sender } = data;

            try {
                // Save to DB
                const message = await prisma.message.create({
                    data: {
                        content,
                        sender,
                        userId
                    }
                });

                // Emit to room (user's room) - this goes to the user and any admin in the room
                io.to(userId).emit('receive_message', message);

                // Notify admin list to update last message preview
                io.emit('chat_updated', { userId, lastMessage: message });

                // AI Auto-responder logic
                if (sender === 'user') {
                    // Start typing indicator for AI
                    io.to(userId).emit('typing', { userId, typing: true, sender: 'admin' });
                    
                    try {
                        let aiResponseContent = "I'm sorry, I cannot process your request right now.";
                        
                        if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key_here') {
                            const chatCompletion = await openai.chat.completions.create({
                                messages: [{ role: 'user', content }],
                                model: 'gpt-3.5-turbo',
                            });
                            aiResponseContent = chatCompletion.choices[0].message.content || aiResponseContent;
                        } else {
                            // Mock response if no valid key
                            await new Promise(resolve => setTimeout(resolve, 1000));
                            
                            const lowerContent = content.toLowerCase();
                            const containsEmail = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(content);

                            if (lowerContent.includes('pricing plans')) {
                                aiResponseContent = "Our pricing plans start at $9/month for the Basic tier, which includes up to 500 chats, and $29/month for the Pro tier with unlimited chats. You can find more details on our Pricing page!";
                            } else if (lowerContent.includes('help with my account')) {
                                aiResponseContent = "I can definitely help with your account! Could you please provide the email address associated with your account so I can look it up?";
                            } else if (lowerContent.includes('speak to a human')) {
                                aiResponseContent = "I understand. I'm transferring your chat to a human agent now. Someone will be with you in just a moment. Thank you for your patience!";
                            } else if (lowerContent.includes('report a bug')) {
                                aiResponseContent = "Thank you for letting us know! To help us fix it quickly, could you please describe the bug in more detail and tell us what device/browser you are using?";
                            } else if (containsEmail) {
                                aiResponseContent = "Thanks for providing your email! I've securely linked it to this chat session. An admin will review your account details and assist you shortly.";
                            } else {
                                aiResponseContent = `Thanks for reaching out! I've notified our support team, and a human agent will be with you shortly to help with your request.`;
                            }
                        }

                        // Save AI message
                        const aiMessage = await prisma.message.create({
                            data: {
                                content: aiResponseContent,
                                sender: 'admin',
                                isAi: true,
                                userId
                            }
                        });

                        // Stop typing indicator and emit message
                        io.to(userId).emit('typing', { userId, typing: false, sender: 'admin' });
                        io.to(userId).emit('receive_message', aiMessage);
                        io.emit('chat_updated', { userId, lastMessage: aiMessage });

                    } catch (aiError) {
                        console.error("AI Auto-responder error:", aiError);
                        io.to(userId).emit('typing', { userId, typing: false, sender: 'admin' });
                    }
                }

            } catch (e) {
                console.error("Error sending message:", e);
            }
        });

        // typing indicator: broadcast typing status to room and to admin
        socket.on('typing', (data: { userId: string, typing: boolean, sender: string }) => {
            const { userId, typing, sender } = data;
            try {
                // send to the user's room (so user/admin in same room get it)
                io.to(userId).emit('typing', { userId, typing, sender });
                // also notify admin list/global listeners
                io.emit('typing', { userId, typing, sender });
            } catch (e) {
                console.error('Error broadcasting typing:', e);
            }
        });

        // mark messages as read
        socket.on('mark_as_read', async (data: { userId: string, sender: string }) => {
            const { userId, sender } = data;
            try {
                // If a user is marking as read, they are reading admin messages.
                // If an admin is marking as read, they are reading user messages.
                const senderToUpdate = sender === 'user' ? 'admin' : 'user';

                await prisma.message.updateMany({
                    where: {
                        userId,
                        sender: senderToUpdate,
                        status: { not: 'READ' }
                    },
                    data: {
                        status: 'READ'
                    }
                });

                // Notify the room that messages have been read
                io.to(userId).emit('messages_read', { userId, reader: sender });
                io.emit('messages_read', { userId, reader: sender });
            } catch (e) {
                console.error('Error marking messages as read:', e);
            }
        });

        socket.on('disconnect', () => {
            console.log('User disconnected:', socket.id);
        });
    });
};
