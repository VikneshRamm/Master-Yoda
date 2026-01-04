from typing import Literal
from pydantic import BaseModel

class Project(BaseModel):
    id: str
    name: str

class CreateConversationRequest(BaseModel):
    designation_id: str
    project: Project
    start_date: str
    end_date: str
    feedback_document_path: str

# ----------- Response Model -----------

class Designation(BaseModel):
    id: str
    name: str
    description: str

class Conversation(BaseModel):
    id: str
    user_id: str
    designation_id: str
    project_id: str
    start_date: str
    end_date: str
    created_at: str
    updated_at: str
    designation: Designation
    project: Project
    feedback_document_path: str
    clockify_user_id: str

EventType = Literal["status", "message", "complete", "full_text", "state_update"]

class StreamingResponseChunk(BaseModel):
    data: str
    type: EventType
    current_step: str
