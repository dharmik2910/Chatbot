import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const loginAdmin = (req: Request, res: Response) => {
    const { username, password } = req.body;
    // Hardcoded for simplicity as per requirements
    if (username === 'admin' && password === 'admin123') {
        return res.json({ success: true, token: 'admin-token' });
    }
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
};

export const getChats = async (req: Request, res: Response) => {
    try {
        const chats = await prisma.user.findMany({
            include: {
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(chats);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch chats' });
    }
};

export const getMessages = async (req: Request, res: Response) => {
    const { userId } = req.params;
    try {
        const messages = await prisma.message.findMany({
            where: { userId },
            orderBy: { createdAt: 'asc' }
        });
        res.json(messages);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
};
