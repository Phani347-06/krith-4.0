from fastapi import APIRouter
from services.parent_service import generate_parent_feedback

router = APIRouter()

@router.get("/parent-feedback/{parent_id}")
def parent_feedback(parent_id: int):
    return generate_parent_feedback(parent_id)
