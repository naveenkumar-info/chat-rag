from fastapi import Depends, HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import os
from datetime import timedelta
import jwt

security = HTTPBearer()
CLERK_JWT_PUBLIC_KEY = os.getenv("CLERK_JWT_PUBLIC_KEY", "").replace("\\n", "\n")

def decode_token(token: str) -> dict:
    return jwt.decode(
        token,
        CLERK_JWT_PUBLIC_KEY,
        algorithms=["RS256"],
        options={"verify_aud": False},
        leeway=timedelta(seconds=200)
    )

def get_current_user(credentials: HTTPAuthorizationCredentials = Security(security)) -> dict:
    token = credentials.credentials
    print(f"Token received: {token[:30]}...")
    print(f"Public key loaded: {bool(CLERK_JWT_PUBLIC_KEY)}")
    print(f"Public key preview: {CLERK_JWT_PUBLIC_KEY[:50]}")
    try:
        payload = decode_token(token)
        print(f"Decoded payload: {payload}")
        clerk_id = payload.get("sub")
        if not clerk_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        role = payload.get("publicMetadata", {}).get("role")
        print(f"clerk_id={clerk_id}, role={role}")
        return {"clerk_id": clerk_id, "role": role}
    except HTTPException:
        raise  # re-raise HTTP exceptions as-is
    except jwt.ExpiredSignatureError:
        print("Token expired")
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError as e:
        print(f"Invalid token: {e}")
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")
    except Exception as e:
        print(f"Unexpected error: {type(e).__name__}: {e}")  # ← this will catch key issues
        raise HTTPException(status_code=401, detail="Unauthorized")
# ── Role guard dependencies ──────────────────────────────
def require_admin(user: dict = Depends(get_current_user)):
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

def require_user(user: dict = Depends(get_current_user)):
    if user["role"] not in ( "user"):
        raise HTTPException(status_code=403, detail="Access denied")
    return user