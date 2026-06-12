# Chatbot Project

A modern chatbot application with a Next.js + Tailwind CSS frontend and a Node.js + Express backend using Prisma for database management. Features real-time chat, admin dashboard, and a sleek modern UI.

## Project Structure

```
chatbot/
├── frontend-chatbot/   # Frontend (Next.js, TypeScript, Tailwind CSS)
│   ├── app/            # Next.js pages and layouts
│   ├── components/     # React components (ChatWidget, AdminDashboard)
│   ├── store/          # Zustand store for chat state
│   └── ...
├── backend-chatbot/    # Backend (Node.js, Express, Prisma)
│   ├── src/            # Express controllers, routes, socket logic
│   ├── prisma/         # Prisma schema and migrations
│   ├── scripts/        # Utility scripts (e.g., createUser.js)
│   └── ...
└── README.md
```

## Setup Instructions

### Prerequisites
- Node.js (v18+ recommended)
- npm or yarn

### 1. Install Dependencies

#### Frontend
```bash
cd frontend-chatbot
npm install
```

#### Backend
```bash
cd backend-chatbot
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the `backend-chatbot/` directory with your environment variables. Example:

**For SQLite (default):**
```
DATABASE_URL="file:./prisma/dev.db"
PORT=3001
OPENAI_API_KEY=your_openai_api_key_here
```

**For PostgreSQL:**
```
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
PORT=3001
OPENAI_API_KEY=your_openai_api_key_here
```

### 3. Set Up the Database

Run Prisma migrations (if you changed the schema):
```bash
cd backend-chatbot
npx prisma migrate dev
```

Generate Prisma Client (run after schema changes):
```bash
npx prisma generate
```

### 4. Start the Development Servers

#### Backend (Terminal 1)
```cmd
cd backend-chatbot
npm run dev
```

#### Frontend (Terminal 2)
```bash
cd frontend-chatbot
npm run dev
```

The frontend will be available at `http://localhost:3000` and the backend at `http://localhost:3001`

## Features

- ✨ **Modern UI** - Beautiful gradient designs with glassmorphism effects
- 💬 **Real-time Chat** - WebSocket-based instant messaging
- 👨‍💼 **Admin Dashboard** - Manage and respond to customer chats
- ⌨️ **Typing Indicators** - See when users or admins are typing
- 💾 **Persistent Chat History** - All messages saved to database via Prisma
- 🎨 **Responsive Design** - Works seamlessly on desktop and mobile
- 🔐 **Admin Authentication** - Secure login for admin panel

## Admin Access

**Default Credentials:**
- Username: `admin`
- Password: `admin123`

⚠️ **Note:** Change these credentials in production!

## Utility Scripts

### Delete All Chat Data

To clear all messages and users from the database:

```bash
cd backend-chatbot
npx ts-node scripts/deleteChatData.ts
```


## Tech Stack

### Frontend
- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Zustand** - State management
- **Socket.io Client** - WebSocket communication
- **Lucide React** - Icons

### Backend
- **Node.js** - Runtime
- **Express** - Web framework
- **TypeScript** - Type safety
- **Prisma** - ORM and database toolkit
- **Socket.io** - WebSocket server
- **SQLite** - Database (default, can be changed to PostgreSQL)

## Folder Overview

- `eraclient/app/` - Next.js pages and layouts
- `client/components/` - React components (ChatWidget, AdminDashboard)
- `client/store/` - Zustand store for chat state management
- `server/src/` - Express controllers, routes, and socket logic
- `server/prisma/` - Prisma schema and database migrations
- `server/scripts/` - Utility scripts for database options

## Available Scripts

### Client
- `npm run dev` - Start Next.js development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Server
- `npm run dev` - Start development server with nodemon
- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Start production server

## Database Management

### View Database (Prisma Studio)
```bash
cd backend-chatbot
npx prisma studio
```

### Reset Database
```bash
cd backend-chatbot
npx prisma migrate reset
```
