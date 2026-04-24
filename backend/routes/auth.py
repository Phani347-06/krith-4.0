from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.mail_service import send_welcome_email

router = APIRouter()

class OnboardingRequest(BaseModel):
    email: str
    username: str

@router.post("/welcome")
async def welcome_user(request: OnboardingRequest):
    """
    Endpoint called after successful signup/OTP verification to send the welcome email.
    """
    try:
        send_welcome_email(request.email, request.username)
        return {"status": "success", "message": "Welcome email sent"}
    except Exception as e:
        # We don't want to break the UI if email fails, so we just log it
        print(f"Failed to send welcome email: {e}")
        return {"status": "error", "message": str(e)}
