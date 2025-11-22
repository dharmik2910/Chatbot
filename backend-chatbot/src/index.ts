import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import router from './routes';
import { setupSocket } from './socket';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api', router);

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

setupSocket(io);

const PORT = process.env.PORT || 3001;

app.get('/', (req, res) => {
    res.send('Chatbot Server is running');
});

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
