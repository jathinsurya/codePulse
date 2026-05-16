from pydantic import BaseModel
from typing import List, Optional

class ChatRequest(BaseModel):
    session_id: str
    message: str
    active_tab: Optional[str] = None

class ChatSource(BaseModel):
    file: str
    lines: str

class ChatResponse(BaseModel):
    response: str
    sources: List[ChatSource]
    model: str = "ibm/granite-3-8b-instruct"
