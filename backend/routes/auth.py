import random
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.mail_service import send_welcome_email, send_verification_code

router = APIRouter()

# Temporary in-memory storage for OTPs (In production, use Redis or a DB table)
otp_storage = {}

class OnboardingRequest(BaseModel):
    email: str
    username: str

class OTPRequest(BaseModel):
    email: str

class OTPVerifyRequest(BaseModel):
    email: str
    code: str

@router.post("/welcome")
async def welcome_user(request: OnboardingRequest):
    """
    Endpoint called after successful signup/OTP verification to send the welcome email.
    """
    try:
        send_welcome_email(request.email, request.username)
        return {"status": "success", "message": "Welcome email sent"}
    except Exception as e:
        print(f"Failed to send welcome email: {e}")
        return {"status": "error", "message": str(e)}

@router.post("/send-otp")
async def send_otp(request: OTPRequest):
    """
    Generates and sends a 6-digit OTP to the user's email.
    """
    try:
        # Generate a 6-digit code
        code = str(random.randint(100000, 999999))
        otp_storage[request.email] = code
        
        # Send via Resend
        send_verification_code(request.email, code)
        
        return {"status": "success", "message": "6-digit OTP sent successfully"}
    except Exception as e:
        print(f"Failed to send OTP: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/verify-otp")
async def verify_otp(request: OTPVerifyRequest):
    """
    Verifies the 6-digit OTP provided by the user.
    """
    stored_code = otp_storage.get(request.email)
    
    if not stored_code:
        raise HTTPException(status_code=404, detail="No OTP found for this email. Please request a new one.")
    
    if request.code == stored_code:
        # Clean up the OTP after successful verification
        del otp_storage[request.email]
        return {"status": "success", "message": "OTP verified successfully"}
    else:
        raise HTTPException(status_code=400, detail="Invalid verification code. Please check and try again.")
