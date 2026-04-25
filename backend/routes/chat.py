from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Dict, Optional
from services.llm_service import chat_with_agent

router = APIRouter()

class ChatRequest(BaseModel):
    messages: List[Dict[str, str]]
    userContext: Optional[Dict] = None

@router.post("/")
async def chat_endpoint(request: ChatRequest):
    """
    Handles chat messages from the frontend and returns the AI's reply.
    """
    reply = chat_with_agent(request.messages, request.userContext)
    return {"reply": reply}
