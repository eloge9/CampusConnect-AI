from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.database import get_db
from app.models.user import User
from app.schemas.auth import ChangePasswordRequest, LoginRequest, TokenResponse
from app.schemas.user import UserCreate, UserResponse
from app.services import auth_service

router = APIRouter(prefix="/auth", tags=["Authentification"])


@router.post("/inscription", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def inscription(user_in: UserCreate, db: Session = Depends(get_db)):
    return auth_service.create_user(db, user_in)


@router.post("/connexion", response_model=TokenResponse)
def connexion(credentials: LoginRequest, db: Session = Depends(get_db)):
    user = auth_service.authenticate_user(db, credentials.email, credentials.password)
    return auth_service.build_token_response(user)


@router.get("/moi", response_model=UserResponse)
def moi(current_user: User = Depends(get_current_user)):
    return current_user


@router.post("/changer-mot-de-passe", status_code=status.HTTP_204_NO_CONTENT)
def changer_mot_de_passe(
    payload: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    auth_service.change_password(db, current_user, payload.current_password, payload.new_password)
