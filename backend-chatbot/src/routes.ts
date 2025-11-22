import { Router } from 'express';
import { loginAdmin, getChats, getMessages } from './controllers';

const router = Router();

router.post('/login', loginAdmin);
router.get('/chats', getChats);
router.get('/messages/:userId', getMessages);

export default router;
