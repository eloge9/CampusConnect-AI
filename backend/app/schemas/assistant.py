from pydantic import BaseModel, Field


class AssistantAskRequest(BaseModel):
    question: str = Field(min_length=1, max_length=500)


class AssistantResponse(BaseModel):
    intent: str
    answer: str
    data: list[dict] = []
