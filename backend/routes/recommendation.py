from fastapi import APIRouter
from services.recommendation_engine import generate_recommendation

router = APIRouter()

@router.get("/recommend/{student_id}")
def recommend(student_id: int):
    return generate_recommendation(student_id)
