from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from src.api.dependencies import CurrentUser, bearer
from src.db.session import get_session
from src.models.user import User
from src.schemas.auth import LoginRequest, LoginResponse, UserRead
from src.services import auth

router = APIRouter(prefix="/auth", tags=["Аутентификация"])


def user_read(user: User) -> UserRead:
    return UserRead(
        public_id=user.public_id,
        role=user.role.value,
        patient_id=str(user.patient.id) if user.patient else None,
    )


@router.post("/login", response_model=LoginResponse)
async def login(data: LoginRequest, session: AsyncSession = Depends(get_session)) -> LoginResponse:
    user = await auth.authenticate(session, data.public_id, data.password)
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Неверный ID или пароль")
    token, auth_session = await auth.create_auth_session(session, user)
    await session.commit()
    user = await auth.get_user_by_token(session, token)
    assert user is not None
    return LoginResponse(access_token=token, expires_at=auth_session.expires_at, user=user_read(user))


@router.get("/me", response_model=UserRead)
async def me(user: CurrentUser) -> UserRead:
    return user_read(user)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer),
    session: AsyncSession = Depends(get_session),
) -> None:
    if credentials is not None:
        await auth.revoke_session(session, credentials.credentials)
        await session.commit()
