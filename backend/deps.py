"""
Shared FastAPI dependencies — injected into route handlers.
Think of these as reusable middleware for authentication and DB access.
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
# pyrefly: ignore [missing-import]
from redis.asyncio import Redis
from jose import JWTError, jwt
from config import settings
# pyrefly: ignore [missing-import]
import redis.asyncio as aioredis

# ============================================================
# Database Setup
# ============================================================
engine = create_async_engine(
    settings.database_url,
    echo=settings.environment == "development",
    pool_size=20,
    max_overflow=0
)

AsyncSessionLocal = async_sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)

async def get_db() -> AsyncSession:
    """Yields a database session. Auto-closes after request."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise

# ============================================================
# Redis Setup
# ============================================================
redis_client: Redis = None

async def get_redis() -> Redis:
    """Returns the shared Redis connection."""
    global redis_client
    if redis_client is None:
        redis_client = aioredis.from_url(settings.redis_url, decode_responses=True)
    return redis_client

# ============================================================
# Authentication
# ============================================================
security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
):
    """
    Validates JWT token and returns the current user.
    Raises 401 if token is invalid or expired.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(
            credentials.credentials,
            settings.jwt_secret_key,
            algorithms=[settings.jwt_algorithm]
        )
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    # pyrefly: ignore [missing-import]
    from sqlalchemy import text
    result = await db.execute(
        text("SELECT id, name, phone, role, vendor_id FROM users WHERE id = :id AND is_active = true"),
        {"id": user_id}
    )
    user = result.fetchone()
    if user is None:
        raise credentials_exception
    return user

async def require_supervisor(current_user=Depends(get_current_user)):
    """Only allows supervisors and admins."""
    if current_user.role not in ("supervisor", "admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Supervisor access required"
        )
    return current_user

async def require_admin(current_user=Depends(get_current_user)):
    """Only allows admins."""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user