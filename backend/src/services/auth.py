import hashlib
import secrets
from datetime import UTC, datetime, timedelta

from pwdlib import PasswordHash
from pwdlib.exceptions import UnknownHashError
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from src.config import config
from src.models.user import AuthSession, User, UserRole

password_hasher = PasswordHash.recommended()


def hash_password(password: str) -> str:
    return password_hasher.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return password_hasher.verify(password, password_hash)
    except UnknownHashError:
        return False


def user_public_id(prefix: str) -> str:
    return f"{prefix}-{secrets.randbelow(900000) + 100000}"


async def create_user(
    session: AsyncSession,
    public_id: str,
    password: str,
    role: UserRole,
) -> User:
    user = User(public_id=public_id.upper(), password_hash=hash_password(password), role=role)
    session.add(user)
    await session.flush()
    return user


async def authenticate(session: AsyncSession, public_id: str, password: str) -> User | None:
    user = await session.scalar(select(User).where(User.public_id == public_id.strip().upper()))
    if user is None or not verify_password(password, user.password_hash):
        return None
    return user


def token_digest(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


async def create_auth_session(session: AsyncSession, user: User) -> tuple[str, AuthSession]:
    token = secrets.token_urlsafe(32)
    auth_session = AuthSession(
        user_id=user.id,
        token_hash=token_digest(token),
        expires_at=datetime.now(UTC) + timedelta(hours=config.auth.session_ttl_hours),
    )
    session.add(auth_session)
    await session.flush()
    return token, auth_session


async def get_user_by_token(session: AsyncSession, token: str) -> User | None:
    return await session.scalar(
        select(User)
        .join(AuthSession)
        .where(AuthSession.token_hash == token_digest(token), AuthSession.expires_at > datetime.now(UTC))
        .options(selectinload(User.patient))
    )


async def revoke_session(session: AsyncSession, token: str) -> None:
    await session.execute(delete(AuthSession).where(AuthSession.token_hash == token_digest(token)))


async def ensure_bootstrap_doctor(session: AsyncSession) -> None:
    public_id = config.auth.doctor_id.strip().upper()
    doctor = await session.scalar(select(User).where(User.public_id == public_id))
    if doctor is None:
        await create_user(session, public_id, config.auth.doctor_password, UserRole.doctor)
