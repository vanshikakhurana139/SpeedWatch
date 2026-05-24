"""
Authentication endpoints.
POST /api/auth/login   — returns JWT tokens
POST /api/auth/refresh — refreshes access token
GET  /api/auth/me      — current user profile
"""
import hashlib
# pyrefly: ignore [missing-import]
from fastapi import APIRouter, Depends, HTTPException, status
# pyrefly: ignore [missing-import]
from sqlalchemy.ext.asyncio import AsyncSession
# pyrefly: ignore [missing-import]
from sqlalchemy import text
from datetime import datetime, timedelta, timezone
from jose import jwt
# pyrefly: ignore [missing-import]
from pydantic import BaseModel
from typing import Optional
from deps import get_db, get_current_user, settings

router = APIRouter(prefix="/auth", tags=["Authentication"])


# ─── Request/Response Models ──────────────────────────────────────────────────

class LoginRequest(BaseModel):
    phone: str
    password: str  # In production: OTP. For Phase 1: password

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    role: str
    name: str

class FCMTokenRequest(BaseModel):
    fcm_token: str


# ─── Helper Functions ────────────────────────────────────────────────────────

def create_access_token(user_id: str, role: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.access_token_expire_minutes
    )
    payload = {
        "sub": str(user_id),
        "role": role,
        "exp": expire,
        "iat": datetime.now(timezone.utc)
    }
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)

def verify_password(plain: str, hashed: str) -> bool:
    """Verify a plain password against a SHA256 hex digest."""
    return hashlib.sha256(plain.encode()).hexdigest() == hashed


# ─── Endpoints ───────────────────────────────────────────────────────────────

@router.post("/login", response_model=TokenResponse)
async def login(request: LoginRequest, db: AsyncSession = Depends(get_db)):
    """
    Authenticate with phone + password.
    Returns a JWT access token valid for 24 hours.
    """
    result = await db.execute(
        text("""
            SELECT id, name, phone, role, hashed_password, is_active
            FROM users WHERE phone = :phone
        """),
        {"phone": request.phone}
    )
    user = result.fetchone()

    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid phone number or password"
        )

    if not verify_password(request.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid phone number or password"
        )

    access_token = create_access_token(user.id, user.role)

    return TokenResponse(
        access_token=access_token,
        user_id=str(user.id),
        role=user.role,
        name=user.name
    )


@router.get("/me")
async def get_me(current_user=Depends(get_current_user)):
    """Returns the authenticated user's profile."""
    return {
        "id": str(current_user.id),
        "name": current_user.name,
        "phone": current_user.phone,
        "role": current_user.role,
        "vendor_id": str(current_user.vendor_id) if current_user.vendor_id else None
    }


@router.post("/fcm-token")
async def update_fcm_token(
    request: FCMTokenRequest,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Updates the driver's FCM token for push notifications."""
    await db.execute(
        text("UPDATE users SET fcm_token = :token WHERE id = :id"),
        {"token": request.fcm_token, "id": current_user.id}
    )
    return {"status": "ok"}