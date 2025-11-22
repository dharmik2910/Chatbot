import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function deleteChatData() {
    try {
        console.log('Deleting all messages...');
        const deletedMessages = await prisma.message.deleteMany({});
        console.log(`Deleted ${deletedMessages.count} messages`);

        console.log('Deleting all users...');
        const deletedUsers = await prisma.user.deleteMany({});
        console.log(`Deleted ${deletedUsers.count} users`);

        console.log('✅ All chat data deleted successfully!');
    } catch (error) {
        console.error('❌ Error deleting chat data:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

deleteChatData();

