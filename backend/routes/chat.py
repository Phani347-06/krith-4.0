from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Dict, Optional
from services.llm_service import chat_with_agent
from db import db as supabase

router = APIRouter()

class ChatRequest(BaseModel):
    messages: List[Dict[str, str]]
    userContext: Optional[Dict] = None

@router.post("/")
async def chat_endpoint(request: ChatRequest):
    """
    Handles chat messages from the frontend and returns the AI's reply.
    Also extracts RL insights to dynamically update student mastery.
    """
    response_data = chat_with_agent(request.messages, request.userContext)
    
    # Handle legacy strings if LLM failed to return JSON
    if isinstance(response_data, str):
        return {"reply": response_data}
        
    reply = response_data.get("reply", "I'm processing that...")
    rl_insight = response_data.get("rl_insight")
    
    # Process RL Insight
    if rl_insight:
        topic_id = rl_insight.get("detected_topic_id")
        mastery_delta = rl_insight.get("mastery_delta", 0.0)
        
        if topic_id and topic_id > 0 and mastery_delta != 0.0:
            student_id = 1 # Default student ID (matching the Novice profile)
            try:
                # Fetch current mastery
                m_res = supabase.table("student_mastery").select("mastery_score").eq("student_id", student_id).eq("topic_id", topic_id).execute()
                old_mastery = 0.5
                if m_res.data:
                    old_mastery = m_res.data[0].get("mastery_score", 0.5)
                
                # Update mastery safely bounded between 0 and 1
                new_mastery = max(0.0, min(1.0, old_mastery + mastery_delta))
                
                supabase.table("student_mastery").upsert({
                    "student_id": student_id,
                    "topic_id": topic_id,
                    "mastery_score": new_mastery,
                    "last_updated": "now()"
                }, on_conflict="student_id,topic_id").execute()
                
                print(f"🧠 RL Insight Applied: Topic {topic_id} changed by {mastery_delta} (Now {new_mastery})")
            except Exception as e:
                print(f"Failed to apply RL Insight: {e}")

    return {"reply": reply}
