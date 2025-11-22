"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupSocket = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const setupSocket = (io) => {
    io.on('connection', (socket) => {
        console.log('User connected:', socket.id);
        socket.on('join_chat', (userId) => __awaiter(void 0, void 0, void 0, function* () {
            socket.join(userId);
            console.log(`User ${userId} joined room ${userId}`);
            // Ensure user exists
            try {
                let user = yield prisma.user.findUnique({ where: { id: userId } });
                if (!user) {
                    user = yield prisma.user.create({ data: { id: userId } });
                    io.emit('chat_updated', user); // Notify admin of new user
                }
            }
            catch (e) {
                console.error("Error creating user:", e);
            }
        }));
        socket.on('send_message', (data) => __awaiter(void 0, void 0, void 0, function* () {
            const { userId, content, sender } = data;
            try {
                // Save to DB
                const message = yield prisma.message.create({
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
            }
            catch (e) {
                console.error("Error sending message:", e);
            }
        }));
        socket.on('disconnect', () => {
            console.log('User disconnected:', socket.id);
        });
    });
};
exports.setupSocket = setupSocket;
