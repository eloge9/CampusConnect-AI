from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.database import get_db
from app.models.user import User
from app.schemas.conversation import ConversationCreate, ConversationResponse
from app.schemas.message import MessageCreate, MessageResponse
from app.services import conversation_service

router = APIRouter(prefix="/conversations", tags=["Messagerie"])


@router.post("", response_model=ConversationResponse, status_code=status.HTTP_201_CREATED)
def creer_conversation(
    data: ConversationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return conversation_service.get_or_create_direct_conversation(db, current_user, data.user_id)


@router.get("", response_model=list[ConversationResponse])
def lister_conversations(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    return conversation_service.list_conversations(db, current_user)


@router.get("/{conversation_id}", response_model=ConversationResponse)
def obtenir_conversation(
    conversation_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    return conversation_service.get_conversation(db, conversation_id, current_user)


@router.get("/{conversation_id}/messages", response_model=list[MessageResponse])
def lister_messages(
    conversation_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    return conversation_service.list_messages(db, conversation_id, current_user)


@router.post(
    "/{conversation_id}/messages", response_model=MessageResponse, status_code=status.HTTP_201_CREATED
)
def envoyer_message(
    conversation_id: int,
    data: MessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return conversation_service.send_message(db, conversation_id, data.content, current_user)


@router.post("/{conversation_id}/lire")
def marquer_conversation_lue(
    conversation_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    conversation_service.mark_conversation_read(db, conversation_id, current_user)
    return {"status": "ok"}
