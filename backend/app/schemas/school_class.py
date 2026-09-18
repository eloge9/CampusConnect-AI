from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ClassBase(BaseModel):
    name: str = Field(min_length=1, max_length=150)
    code: str = Field(min_length=1, max_length=30)
    description: str | None = Field(default=None, max_length=500)


class ClassCreate(ClassBase):
    pass


class ClassUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=150)
    code: str | None = Field(default=None, min_length=1, max_length=30)
    description: str | None = Field(default=None, max_length=500)


class ClassResponse(ClassBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
