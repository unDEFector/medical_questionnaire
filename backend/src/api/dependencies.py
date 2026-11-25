from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession
from src.db.session import get_session
from src.models.user import User, UserRole
from src.services import auth

bearer = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> User:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Требуется вход в систему")
    user = await auth.get_user_by_token(session, credentials.credentials)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Сессия истекла или недействительна"
        )
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


async def require_admin(user: CurrentUser) -> User:
    if user.role != UserRole.admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Доступно только администратору")
    return user


async def require_doctor(user: CurrentUser) -> User:
    if user.role != UserRole.doctor:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Доступно только врачу")
    return user


async def require_patient(user: CurrentUser) -> User:
    if user.role != UserRole.patient or user.patient is None:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Доступно только пациенту")
    return user


AdminUser = Annotated[User, Depends(require_admin)]
DoctorUser = Annotated[User, Depends(require_doctor)]
PatientUser = Annotated[User, Depends(require_patient)]
