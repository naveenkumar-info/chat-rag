# chat-rag
A fullstack **RAG (Retrieval-Augmented Generation)** chat application that lets users chat with their private documents using AI. Built with FastAPI, PostgreSQL, Next.js, and Cloudinary — fully containerized with Docker.

---

## Features

- **Chat with your documents** — Private documents are already uploaded and stored; just ask questions powered by RAG.
- **Streaming responses** — AI answers stream token-by-token for a faster, more responsive feel.
- **Authentication** — User management via Clerk.
- **File uploads** — Stored and managed through Cloudinary.
- **Chat history** — Persistent conversations saved per user.
- **Dockerized** — Consistent environment across any machine.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js (TypeScript) |
| Backend | FastAPI (Python) |
| Database | PostgreSQL |
| ORM | SQLAlchemy |
| Embedding Database | Chroma |
| Auth | Clerk |
| File Storage | Cloudinary |
| Streaming | Server-Sent Events (SSE) |
| Containerization | Docker + Docker Compose |

---

## Project Structure

```
chat-rag/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── db.py
│   │   ├── models.py
│   │   └── ...
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   └── chat/
│       ├── app/
│       ├── components/
│       └── Dockerfile
├── docker-compose.yml
└── .env
```

---

## Getting Started

### Prerequisites

- [Docker](https://www.docker.com/get-started) & Docker Compose
- [Clerk](https://clerk.com) account for auth
- [Cloudinary](https://cloudinary.com) account for file storage

### 1. Clone the repository

```bash
git clone https://github.com/naveenkumar-info/chat-rag.git
cd chat-rag
git checkout development
```

### 2. Set up environment variables

You need `.env` files in three locations. Create each one with the variables listed below.

---

#### `.env` (root — Docker Compose level)

```env
POSTGRES_USER_NAME=your_postgres_username
POSTGRES_PASSWORD_STAR=your_postgres_password
POSTGRES_DB_NAME=your_db_name
CLERK_SECRET_KEY=your_clerk_secret_key
CLERK_WEBHOOK_SECRET=your_clerk_webhook_secret
```

---

#### `backend/.env`

```env
POSTGRES_URL=postgresql://postgres:your_postgres_password@db:5432/your_db_name
CLERK_SECRET_KEY=your_clerk_secret_key
CLERK_WEBHOOK_SECRET=your_clerk_webhook_secret
CLOUD_NAME=your_cloudinary_cloud_name
API_KEY=your_cloudinary_api_key
API_SECRET=your_cloudinary_api_secret
CHROMA_HOST=your_chroma_host
CHROMA_PORT=your_chroma_port
```

---

#### `frontend/chat/.env`

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
CLERK_WEBHOOK_SECRET=your_clerk_webhook_secret
NEXT_PUBLIC_API_URL=http://localhost:8001
```

---

### 3. Run the app

```bash
# First time or after changes to backend/db
docker-compose up --build

# Run in background
docker-compose up -d --build
```

### 4. Access the app

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8001 |
| API Docs | http://localhost:8001/docs |

---

## Database Models

| Model | Description |
|---|---|
| `User` | Clerk user ID, email, and role |
| `Chat` | Chat session linked to a user — stores name and Clerk user ID |
| `Message` | Individual message within a chat — stores role, content, and chat ID |
| `File` | Uploaded file — stores Cloudinary URL, filename, file type, and public ID |

---

## API Endpoints

Key endpoints at a glance:

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/chat/create_chat` | Create a new chat session |
| `GET` | `/chat/{chat_id}` | Get messages for a chat |
| `POST` | `/get_answer` | Send a message and receive a streaming RAG response |
| `POST` | `/uploadfile` | Upload a file to Cloudinary and db |
| `GET` | `/files` | List all the uploaded files |

Full interactive API docs available at `http://localhost:8001/docs` once the app is running.

---

## Docker Commands

```bash
# Start all services
docker-compose up --build

# Stop all services (keeps DB data)
docker-compose down

# Stop and wipe database
docker-compose down -v

# View logs
docker-compose logs -f <container_name>
```

---

## Contributing

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m 'Add your feature'`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

---

## License

This project is open source.
