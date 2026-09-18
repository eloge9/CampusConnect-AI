from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.models.conversation import Conversation
from app.models.conversation_member import ConversationMember
from app.models.message import Message
from app.models.notification import NotificationType
from app.models.teacher_assignment import TeacherAssignment
from app.models.user import User, UserRole
from app.schemas.announcement import AnnouncementAuthorResponse
from app.schemas.conversation import ConversationResponse
from app.schemas.message import MessageResponse
from app.services.notification_service import notify_users


def _get_conversation_or_404(db: Session, conversation_id: int) -> Conversation:
    conversation = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if conversation is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation introuvable.")
    return conversation


def _get_membership(db: Session, conversation_id: int, user_id: int) -> ConversationMember | None:
    return (
        db.query(ConversationMember)
        .filter(
            ConversationMember.conversation_id == conversation_id,
            ConversationMember.user_id == user_id,
        )
        .first()
    )


def ensure_is_member(db: Session, conversation_id: int, current_user: User) -> ConversationMember:
    membership = _get_membership(db, conversation_id, current_user.id)
    if membership is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Vous ne faites pas partie de cette conversation.",
        )
    return membership


def _build_conversation_response(
    db: Session, conversation: Conversation, current_user: User
) -> ConversationResponse:
    members = (
        db.query(User)
        .join(ConversationMember, ConversationMember.user_id == User.id)
        .filter(ConversationMember.conversation_id == conversation.id)
        .all()
    )
    last_message = (
        db.query(Message)
        .options(joinedload(Message.sender))
        .filter(Message.conversation_id == conversation.id)
        .order_by(Message.created_at.desc())
        .first()
    )

    membership = _get_membership(db, conversation.id, current_user.id)
    unread_query = db.query(Message).filter(
        Message.conversation_id == conversation.id, Message.sender_id != current_user.id
    )
    if membership is not None and membership.last_read_at is not None:
        unread_query = unread_query.filter(Message.created_at > membership.last_read_at)
    unread_count = unread_query.count()

    return ConversationResponse(
        id=conversation.id,
        is_group=conversation.is_group,
        members=[AnnouncementAuthorResponse.model_validate(member) for member in members],
        last_message=MessageResponse.model_validate(last_message) if last_message else None,
        unread_count=unread_count,
        created_at=conversation.created_at,
        updated_at=conversation.updated_at,
    )


def get_or_create_direct_conversation(
    db: Session, current_user: User, other_user_id: int
) -> ConversationResponse:
    if other_user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Vous ne pouvez pas démarrer une conversation avec vous-même.",
        )
    other_user = db.query(User).filter(User.id == other_user_id).first()
    if other_user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Utilisateur introuvable.")

    my_conversation_ids = [
        row[0]
        for row in db.query(ConversationMember.conversation_id)
        .join(Conversation, Conversation.id == ConversationMember.conversation_id)
        .filter(ConversationMember.user_id == current_user.id, Conversation.is_group.is_(False))
        .all()
    ]
    if my_conversation_ids:
        existing = (
            db.query(Conversation)
            .join(ConversationMember, ConversationMember.conversation_id == Conversation.id)
            .filter(
                Conversation.id.in_(my_conversation_ids), ConversationMember.user_id == other_user_id
            )
            .first()
        )
        if existing is not None:
            return _build_conversation_response(db, existing, current_user)

    conversation = Conversation(is_group=False)
    db.add(conversation)
    db.flush()
    db.add(ConversationMember(conversation_id=conversation.id, user_id=current_user.id))
    db.add(ConversationMember(conversation_id=conversation.id, user_id=other_user_id))
    db.commit()
    db.refresh(conversation)
    return _build_conversation_response(db, conversation, current_user)


def list_conversations(db: Session, current_user: User) -> list[ConversationResponse]:
    conversation_ids = [
        row[0]
        for row in db.query(ConversationMember.conversation_id)
        .filter(ConversationMember.user_id == current_user.id)
        .all()
    ]
    if not conversation_ids:
        return []

    conversations = db.query(Conversation).filter(Conversation.id.in_(conversation_ids)).all()
    responses = [_build_conversation_response(db, c, current_user) for c in conversations]
    responses.sort(
        key=lambda r: r.last_message.created_at if r.last_message else r.created_at, reverse=True
    )
    return responses


def get_conversation(db: Session, conversation_id: int, current_user: User) -> ConversationResponse:
    conversation = _get_conversation_or_404(db, conversation_id)
    ensure_is_member(db, conversation_id, current_user)
    return _build_conversation_response(db, conversation, current_user)


def list_contacts(db: Session, current_user: User) -> list[User]:
    """Personnes avec qui l'utilisateur peut démarrer une conversation 1-à-1."""
    query = db.query(User).filter(User.id != current_user.id, User.is_active.is_(True))
    if current_user.role == UserRole.ADMIN:
        return query.order_by(User.last_name, User.first_name).all()

    ids: set[int] = set()
    staff = (
        db.query(User.id)
        .filter(
            User.role.in_([UserRole.TEACHER, UserRole.ADMIN]),
            User.id != current_user.id,
            User.is_active.is_(True),
        )
        .all()
    )
    ids.update(row[0] for row in staff)

    if current_user.role == UserRole.STUDENT and current_user.class_id is not None:
        classmates = (
            db.query(User.id)
            .filter(User.class_id == current_user.class_id, User.id != current_user.id)
            .all()
        )
        ids.update(row[0] for row in classmates)
        teachers = (
            db.query(TeacherAssignment.teacher_id)
            .filter(TeacherAssignment.class_id == current_user.class_id)
            .all()
        )
        ids.update(row[0] for row in teachers)
    elif current_user.role == UserRole.TEACHER:
        class_ids = [
            row[0]
            for row in db.query(TeacherAssignment.class_id)
            .filter(TeacherAssignment.teacher_id == current_user.id)
            .all()
        ]
        if class_ids:
            students = (
                db.query(User.id)
                .filter(User.role == UserRole.STUDENT, User.class_id.in_(class_ids))
                .all()
            )
            ids.update(row[0] for row in students)

    if not ids:
        return []
    return (
        db.query(User)
        .filter(User.id.in_(ids), User.is_active.is_(True))
        .order_by(User.last_name, User.first_name)
        .all()
    )


def list_messages(db: Session, conversation_id: int, current_user: User) -> list[Message]:
    _get_conversation_or_404(db, conversation_id)
    ensure_is_member(db, conversation_id, current_user)
    return (
        db.query(Message)
        .options(joinedload(Message.sender))
        .filter(Message.conversation_id == conversation_id)
        .order_by(Message.created_at)
        .all()
    )


def send_message(db: Session, conversation_id: int, content: str, current_user: User) -> Message:
    _get_conversation_or_404(db, conversation_id)
    ensure_is_member(db, conversation_id, current_user)

    message = Message(conversation_id=conversation_id, sender_id=current_user.id, content=content)
    db.add(message)
    db.commit()
    db.refresh(message)
    _ = message.sender

    recipient_ids = [
        row[0]
        for row in db.query(ConversationMember.user_id)
        .filter(
            ConversationMember.conversation_id == conversation_id,
            ConversationMember.user_id != current_user.id,
        )
        .all()
    ]
    notify_users(
        db,
        recipient_ids,
        NotificationType.NOUVEAU_MESSAGE,
        title=f"Nouveau message de {current_user.first_name} {current_user.last_name}",
        message=content[:200],
        reference_type="conversation",
        reference_id=conversation_id,
    )

    return message


def mark_conversation_read(db: Session, conversation_id: int, current_user: User) -> None:
    _get_conversation_or_404(db, conversation_id)
    membership = ensure_is_member(db, conversation_id, current_user)
    membership.last_read_at = datetime.now(timezone.utc)
    db.commit()
