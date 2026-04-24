from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.question_generator import generate_and_save_question, generate_full_lesson

router = APIRouter()

class QuestionRequest(BaseModel):
    topic: str
    difficulty: str
    question_type: str # 'mcq', 'fill_blank', 'coding'

class LessonRequest(BaseModel):
    topic: str
    difficulty: str

@router.post("/generate-question")
async def generate_question(request: QuestionRequest):
    """
    Endpoint to trigger AI generation of a question and store it in the database.
    """
    try:
        result = generate_and_save_question(
            request.topic, 
            request.difficulty, 
            request.question_type
        )
        return result
    except Exception as e:
        print(f"Generation Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/generate-lesson")
async def generate_lesson(request: LessonRequest):
    """
    Endpoint to generate a theory lesson followed by 5 questions.
    """
    try:
        result = generate_full_lesson(request.topic, request.difficulty)
        return result
    except Exception as e:
        print(f"Lesson Generation Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
