from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.parent_service import generate_parent_feedback, verify_and_link_child

router = APIRouter()

class LinkChildRequest(BaseModel):
    parent_id: str
    child_email: str
    child_password: str

@router.get("/parent-feedback/{parent_id}")
def parent_feedback(parent_id: str):
    return generate_parent_feedback(parent_id)

@router.post("/verify-and-link")
async def verify_link(request: LinkChildRequest):
    """
    Verifies child credentials and creates a link in the parent_student_link table.
    Ensures compliance with Part A, Point 3 of the Additional Requirements.
    """
    try:
        result = verify_and_link_child(request.parent_id, request.child_email, request.child_password)
        if result["status"] == "error":
            raise HTTPException(status_code=400, detail=result["message"])
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
