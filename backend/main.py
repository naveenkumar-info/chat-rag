from pyexpat.errors import messages

from fastapi import FastAPI, Form, File, HTTPException, Request, UploadFile, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from Services.files import upload_file, delete_file, check_chroma_size, del_all_chroma
from models import Chat, Message, User, File
from db import get_db, Base, create_table
from Services.Message import delete_chat, process_chat_stream
from Services.User import handle_user_created,promote_user_by_ID
import asyncio
import logging
import os
import json
from svix.webhooks import Webhook
import requests
from auth import require_admin,require_user


# Configure logger for webhook
logger = logging.getLogger(__name__)


# Get Clerk webhook secret from environment
CLERK_WEBHOOK_SECRET = os.getenv("CLERK_WEBHOOK_SECRET")

# Instance of FastAPI
app = FastAPI()

# CORS
origins = ["http://localhost:3000", "http://192.168.0.239:3000"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    return create_table()

@app.get("/")
async def root():
    return {"status": "ok", "message": "API is running"}

# ─── POST METHODS ────────────────────────────────────────────────────────────

@app.post("/uploadfile/")
async def upload_file_DB(
    db: Session = Depends(get_db),
    file: UploadFile = File(),
    clerk_id: str = Depends(require_admin),
    
):
    return await upload_file(db, file,clerk_id)


@app.post("/get-answer")
async def ask_question(
    chat_id: int = Form(...),
    question: str = Form(...), 
    db: Session = Depends(get_db),
    clerk_id: str = Depends(require_user),
):
    return await process_chat_stream(chat_id, question, db,clerk_id)


@app.post("/chat/create_chat")
async def create_chat(
    name: str = Form(...), 
    db: Session = Depends(get_db),
    clerk_id: str = Depends(require_user)
):
    chat = Chat(
        name=name,
        clerk_id=clerk_id['clerk_id']
        )
    db.add(chat)
    db.commit()
    db.refresh(chat)
    return {"chat_id": chat.id}


@app.post("/webhook/clerk")
async def clerk_webhook(request: Request, db: Session = Depends(get_db)):
    """
    Webhook endpoint for Clerk events.
    Handles user.created events and stores user in database.
    Requires CLERK_WEBHOOK_SECRET in environment variables for signature verification.
    """
    try:
        body = await request.body()
        print(f"Received webhook body")

        # Guard against empty body
        if not body:
            logger.error("✗ Empty request body received")
            return {"status": "error", "message": "Empty request body"}
        
        print(f"Received webhook body: {body[:200]}...")  # Log first 200 chars for debugging

        logger.info(f"Raw body length: {len(body)}")
        logger.info(f"Content-Type: {request.headers.get('content-type')}")
        logger.info(f"CLERK_WEBHOOK_SECRET configured: {bool(CLERK_WEBHOOK_SECRET)}")

        if CLERK_WEBHOOK_SECRET:
            try:
                wh = Webhook(CLERK_WEBHOOK_SECRET)
                payload = wh.verify(body, dict(request.headers))
                logger.info("✓ Clerk webhook signature verified successfully")
            except Exception as e:
                logger.error(f"✗ Webhook signature verification failed: {str(e)}", exc_info=True)
                return {
                    "status": "error",
                    "message": "Webhook signature verification failed",
                }
        else:
            logger.warning("⚠ CLERK_WEBHOOK_SECRET not configured. Skipping verification (dev mode only)")
            try:
                payload = json.loads(body)
            except json.JSONDecodeError as e:
                logger.error(f"✗ JSON decode failed: {e} | body preview: {body[:200]}")
                return {"status": "error", "message": "Invalid JSON body"}

        event_type = payload.get("type")
        logger.info(f"✓ Received Clerk webhook event: {event_type}")

        if event_type == "user.created":
            clerk_id = payload.get("data", {}).get("id")
            email_addresses = payload.get("data", {}).get("email_addresses", [])
            email = email_addresses[0].get("email_address") if email_addresses else None


            if not clerk_id:
                return {"status": "error", "message": "Missing clerk_id in payload"}

            return handle_user_created(db, clerk_id,email)
        else:
            logger.debug(f"Ignoring unhandled event type: {event_type}")
            return {"status": "ignored", "message": f"Event type {event_type} not handled"}

    except Exception as e:
        logger.error(f"✗ Error processing Clerk webhook: {str(e)}", exc_info=True)
        return {"status": "error", "message": "Internal server error processing webhook"}

@app.post("/promote")
async def promote_by_ID(
    email: str = Form(...), 
    db: Session = Depends(get_db),
    clerk_id: str = Depends(require_admin)    
):
    return promote_user_by_ID(email, db)

# ─── GET METHODS ─────────────────────────────────────────────────────────────

@app.get("/webhook-test")
async def webhook_test():
    return {
        "status": "ok",
        "backend_running": True,
        "clerk_webhook_secret_configured": bool(CLERK_WEBHOOK_SECRET),
        "webhook_endpoint": "/webhook/clerk",
        "message": "Webhook is ready to receive Clerk events",
    }

@app.get("/files/")
async def get_files(
    db: Session = Depends(get_db),
    clerk_id: str = Depends(require_admin)):
    print(f"Fetching files for clerk_id: {clerk_id['clerk_id']}")
    return db.query(File).filter(File.clerk_id == clerk_id['clerk_id']).all()

@app.get("/check-size-chroma")
async def get_file_size(
    db: Session = Depends(get_db),
    clerk_id: str = Depends(require_admin)
    ):
    return check_chroma_size()


@app.get("/chats")
async def get_chats(
    db: Session = Depends(get_db),
    clerk_id: str = Depends(require_user)
    ):
    chats = db.query(Chat).order_by(Chat.created_at.desc()).filter(Chat.clerk_id == clerk_id['clerk_id']).all()
    return [
        {
            "id": c.id,
            "name": c.name,
            "created_at": c.created_at,
        }
        for c in chats
    ]


@app.get("/chat/{chat_id}")
def get_chat(
    chat_id: int, 
    db: Session = Depends(get_db),
    clerk_id: str = Depends(require_user)
    ):
    chat = db.query(Chat).filter(Chat.id == chat_id).first()

    if chat:
        if chat.clerk_id != clerk_id['clerk_id']:
            raise HTTPException(status_code=403, detail="Access denied to this chat")

    messages = (
        db.query(Message)
        .filter(Message.chat_id == chat_id)
        .order_by(Message.created_at)
        .all()
    )
    return [{"role": m.role, "content": m.content} for m in messages]

@app.get("/allusers")
async def get_all_users(
    db: Session = Depends(get_db),
    clerk_id: str = Depends(require_admin)
):
    users = db.query(User).all()
    return [
        {
            "id": u.id,
            "email": u.email,
            "clerk_id": u.clerk_id,
            "role": u.role,
            "created_at": u.created_at,
        }
        for u in users
    ]


# ─── DELETE METHODS ───────────────────────────────────────────────────────────

@app.delete("/delete_all_chroma")
async def delete_all_chroma(
    clerk_id: str = Depends(require_admin)
):
    return del_all_chroma()


@app.delete("/deletefiles/{file_id}")
async def delete_file_DB(
    file_id: int, 
    db: Session = Depends(get_db),
    clerk_id: str = Depends(require_admin)
    ):
    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(None, lambda: delete_file(db, file_id,clerk_id['clerk_id']))


@app.delete("/delete/{chat_id}")
async def delete_chat_byID(
    chat_id: int, 
    db: Session = Depends(get_db),
    clerk_id: str = Depends(require_user)
    ):
    return delete_chat(chat_id=chat_id, db=db,clerk_id=clerk_id['clerk_id'])

@app.delete("/delete_user/{user_id}")
async def delete_user_byID(
    user_id: str,
    db: Session = Depends(get_db),
    clerk_id: str = Depends(require_admin)
):
    user_to_delete = db.query(User).filter(User.clerk_id == user_id).first()
    if not user_to_delete:
        return {"status": "error", "message": "User not found"}

    # 1. Delete from Clerk
    url = f"https://api.clerk.com/v1/users/{user_to_delete.clerk_id}"
    headers = {"Authorization": f"Bearer {os.getenv('CLERK_SECRET_KEY')}"}
    response = requests.delete(url, headers=headers)
    if response.status_code == 200:
        print(f"✓ User {user_id} deleted from Clerk successfully")
    else:
        print(f"✗ Failed to delete user from Clerk: {response.status_code} {response.text}")

    # 2. Delete all files belonging to this user (Cloudinary + ChromaDB + DB rows)
    user_files = db.query(File).filter(File.clerk_id == user_to_delete.clerk_id).all()
    for file in user_files:
        try:
            loop = asyncio.get_running_loop()
            await loop.run_in_executor(None, lambda f=file: delete_file(db, f.id))
        except Exception as e:
            print(f"Warning: Failed to delete file {file.id}: {str(e)}")

    # 3. Delete all chats (messages are cascade-deleted via the relationship)
    user_chats = db.query(Chat).filter(Chat.clerk_id == user_to_delete.clerk_id).all()
    for chat in user_chats:
        try:
            delete_chat(chat_id=chat.id, db=db)
        except Exception as e:
            print(f"Warning: Failed to delete chat {chat.id}: {str(e)}")

    # 4. Delete user from DB
    db.delete(user_to_delete)
    db.commit()

    return {"status": "success", "message": f"User {user_id} and all associated data deleted"}
   