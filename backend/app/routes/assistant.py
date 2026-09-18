from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.database import get_db
from app.models.user import User
from app.schemas.assistant import AssistantAskRequest, AssistantResponse
from app.services import assistant_ai

router = APIRouter(prefix="/assistant", tags=["Assistant IA"])


@router.post("/question", response_model=AssistantResponse)
def poser_question(
    data: AssistantAskRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    intent, answer, response_data = assistant_ai.answer_question(db, current_user, data.question)
    return AssistantResponse(intent=intent, answer=answer, data=response_data)
