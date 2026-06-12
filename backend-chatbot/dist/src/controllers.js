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
exports.getMessages = exports.getChats = exports.loginAdmin = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const loginAdmin = (req, res) => {
    const { username, password } = req.body;
    // Hardcoded for simplicity as per requirements
    if (username === 'admin' && password === 'admin123') {
        return res.json({ success: true, token: 'admin-token' });
    }
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
};
exports.loginAdmin = loginAdmin;
const getChats = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const chats = yield prisma.user.findMany({
            include: {
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(chats);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch chats' });
    }
});
exports.getChats = getChats;
const getMessages = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId } = req.params;
    try {
        const messages = yield prisma.message.findMany({
            where: { userId },
            orderBy: { createdAt: 'asc' }
        });
        res.json(messages);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
});
exports.getMessages = getMessages;
