import json
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, HTTPException, Path
from pydantic import BaseModel
from db import db as supabase
from services.rl_engine import get_next_action, process_answer, get_student_progress
from services.llm_service import generate_survival_mission

router = APIRouter()

class RLRequest(BaseModel):
    student_id: int
    last_question_id: int | None = None

class AnswerSubmitRequest(BaseModel):
    student_id: int
    topic_id: int
    question_id: int
    action: str
    correct: bool

@router.post("/next-action")
async def next_action_endpoint(request: RLRequest):
    """
    Evaluates the student's mastery and returns an RL-driven next action,
    wrapped in a survival game narrative.
    """
    try:
        # 1. RL Engine determines topic, action, and fetches base question
        rl_decision = get_next_action(request.student_id, request.last_question_id)
        
        # 2. LLM wraps it in a narrative
        story_json_str = generate_survival_mission(
            rl_decision["topic"],
            rl_decision["action"],
            rl_decision["question_data"]["question_text"]
        )
        
        story_data = json.loads(story_json_str)

        # 3. Construct final response
        return {
            "topic": rl_decision["topic"],
            "topic_id": rl_decision["topic_id"],
            "mission_story": story_data.get("mission_story", "Survive the night."),
            "action": rl_decision["action"],
            "question_data": rl_decision["question_data"],
            "reward": story_data.get("reward", "Survival")
        }
    except Exception as e:
        print(f"RL Endpoint Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/submit-answer")
async def submit_answer_endpoint(request: AnswerSubmitRequest):
    """
    Submits an answer to trigger the Bellman Q-value update, mastery clamping, and interaction logging.
    """
    try:
        consequences = process_answer(
            request.student_id,
            request.topic_id,
            request.question_id,
            request.action,
            request.correct
        )
        return consequences
    except Exception as e:
        print(f"Submit Answer Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/weekly-activity/{student_id}")
async def weekly_activity_endpoint(student_id: int = Path(...)):
    """
    Returns XP earned per day for the last 7 days — used for the Guardian Portal engagement chart.
    """
    try:
        today = datetime.now(timezone.utc).date()
        start_date = today - timedelta(days=6)
        
        base_xp = 100
        xp_by_date = {}

        res = (
            supabase.table("interaction_logs")
            .select("reward,created_at")
            .eq("student_id", student_id)
            .execute()
        )

        if res.data:
            for log in res.data:
                reward = log.get("reward", 0)
                try:
                    dt = datetime.fromisoformat(log["created_at"].replace("Z", "+00:00")).date()
                    if dt < start_date:
                        base_xp += reward
                    else:
                        xp_by_date[dt] = xp_by_date.get(dt, 0) + reward
                except Exception:
                    pass

        current_cumulative_xp = max(0, base_xp)
        chart_data = []
        
        for i in range(6, -1, -1):
            d = today - timedelta(days=i)
            day_reward = xp_by_date.get(d, 0)
            current_cumulative_xp = max(0, current_cumulative_xp + day_reward)
            chart_data.append({"day": d.strftime("%a"), "xp": current_cumulative_xp})

        return chart_data
    except Exception as e:
        print(f"Weekly Activity Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


class XPLogRequest(BaseModel):
    student_id: int
    xp_earned: int
    source: str = "lesson"  # "lesson", "survival", etc.
    topic_id: int | None = 1
    mastery_score: float | None = None

@router.post("/log-xp")
async def log_xp_endpoint(request: XPLogRequest):
    """
    Logs XP earned from lessons directly into the database.
    Also updates mastery_score if provided.
    """
    try:
        if request.mastery_score is not None:
            supabase.table("student_mastery").upsert({
                "student_id": request.student_id,
                "topic_id": request.topic_id,
                "mastery_score": request.mastery_score,
                "last_updated": "now()"
            }, on_conflict="student_id,topic_id").execute()

        supabase.table("interaction_logs").insert({
            "student_id": request.student_id,
            "topic_id": request.topic_id,
            "question_id": 1,
            "action_taken": f"{request.source}_complete",
            "result": "correct",
            "reward": request.xp_earned,
            "mastery_after": request.mastery_score if request.mastery_score is not None else 0.5
        }).execute()
        
        return {"status": "ok", "xp_logged": request.xp_earned}
    except Exception as e:
        print(f"XP Log Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/purge-progress/{student_id}")
async def purge_progress_endpoint(student_id: int = Path(...)):
    """
    Physically wipes all progress data for a student from the database.
    """
    try:
        # 1. Delete all interaction logs (XP/History)
        supabase.table("interaction_logs").delete().eq("student_id", student_id).execute()
        
        # 2. Delete all mastery records
        supabase.table("student_mastery").delete().eq("student_id", student_id).execute()
        
        return {"status": "success", "message": f"All progress data for student {student_id} has been purged."}
    except Exception as e:
        print(f"Purge Progress Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/student-progress/{student_id}")
async def student_progress_endpoint(student_id: int = Path(...)):
    """
    Returns the student's current survival stats based on their gameplay history.
    """
    try:
        stats = get_student_progress(student_id)
        return stats
    except Exception as e:
        print(f"Progress Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
