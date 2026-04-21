from sqlalchemy.orm import Session
from models import User
from datetime import datetime
import requests
import os

CLERK_SECRET_KEY = os.getenv("CLERK_SECRET_KEY")


def update_clerk_metadata(clerk_id: str):
    """
    Moves role from unsafeMetadata to publicMetadata via Clerk Backend API
    and clears unsafeMetadata.
    """
    url = f"https://api.clerk.com/v1/users/{clerk_id}"
    headers = {
        "Authorization": f"Bearer {CLERK_SECRET_KEY}",
        "Content-Type": "application/json"
    }
    print("header ready: ", headers)
    payload = {
        "public_metadata": {"role": "user"},
    }
    print("payload ready: ", payload)

    response = requests.patch(url, json=payload, headers=headers)

    print("response received: ", response.status_code, response.text)

    if response.status_code == 200:
        print(f"✓ Metadata updated for {clerk_id}")
    else:
        print(f"✗ Failed to update metadata: {response.status_code} {response.text}")


def handle_user_created(db: Session, clerk_id: str, email: str) -> dict:
    try:
        existing_user = db.query(User).filter(User.clerk_id == clerk_id).first()

        if existing_user:
            return {
                "status": "user_exists",
                "message": "User already in database",
                "user_id": existing_user.id,
                "email": existing_user.email,
            }
        print("not exists")
        # Save to DB
        new_user = User(
            clerk_id=clerk_id,
            email=email,
            role="user",
            created_at=datetime.utcnow(),
        )
        print("user created: ")
        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        # Move role to publicMetadata and clear unsafeMetadata
        update_clerk_metadata(clerk_id)

        return {
            "status": "created",
            "message": "User created successfully",
            "user_id": new_user.id,
            "clerk_id": new_user.clerk_id,
        }

    except Exception as e:
        db.rollback()
        print(f"Error creating user {clerk_id}: {str(e)}")
        return {"status": "error", "message": f"Failed to create user: {str(e)}"}


def promote_user_by_ID(email: str, db: Session):
    try:
        user = db.query(User).filter(User.email == email).first()
        if not user:
            return {"status": "error", "message": "User not found"}
        ## update in pg
        user.role = "admin"
        db.commit()
        db.refresh(user)

        ## update in clerk
        url = f"https://api.clerk.com/v1/users/{user.clerk_id}"
        headers = {
            "Authorization": f"Bearer {CLERK_SECRET_KEY}",
            "Content-Type": "application/json"
        }
        payload = {
            "public_metadata": {"role": "admin"},
        }
        response = requests.patch(url, json=payload, headers=headers)
        if response.status_code == 200:
            print(f"✓ User {email} promoted to admin in Clerk")
        else:
            print(f"✗ Failed to promote user in Clerk: {response.status_code} {response.text}")

        return {"status": "success", "message": f"User {email} promoted to admin"}
    except Exception as e:
        db.rollback()
        print(f"Error promoting user {email}: {str(e)}")
        return {"status": "error", "message": f"Failed to promote user: {str(e)}"}