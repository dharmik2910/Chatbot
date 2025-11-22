import { PrismaClient } from '@prisma/client';
import { Server, Socket } from 'socket.io';

const prisma = new PrismaClient();

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

        socket.on('disconnect', () => {
            console.log('User disconnected:', socket.id);
        });
    });
};
