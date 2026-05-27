from fastapi import FastAPI, Form, File, HTTPException, Request, UploadFile, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from Services.chroma_service import ChromaService
from Services.files import upload_file, delete_file
from Services.Chat import delete_chat, process_chat_stream
from Services.User import handle_user_created,promote_user_by_ID
from models import Chat, Message, User, File
from db import get_db
import asyncio
import logging
import os
import json
from svix.webhooks import Webhook
from auth import require_admin,require_user
from Services.ragas import test_ragas

# Configure logger for webhook
logger = logging.getLogger(__name__)

chroma = ChromaService()

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



@app.get("/")
async def root():
    return {"status": "ok", "message": "API is running"}

# ─── POST METHODS ────────────────────────────────────────────────────────────

@app.post("/test-ragas-interaction")
async def test_ragas_interaction(
    chat_id: int = Form(...), 
    db: Session = Depends(get_db),
    interaction_id:int=Form()
):
    return await test_ragas(chat_id,db,interaction_id)
    

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
    return chroma.check_chroma_size()


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
    return chroma.del_all_chroma()


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

