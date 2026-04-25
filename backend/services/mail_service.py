import os
import resend
from dotenv import load_dotenv

load_dotenv()

# Initialize Resend with the provided API Key
resend.api_key = os.getenv("RESEND_API_KEY")

def send_email(to_email, subject, html_content):
    """
    Sends a custom HTML email using Resend.
    """
    try:
        params = {
            "from": "CortexAI <onboarding@resend.dev>",
            "to": [to_email],
            "subject": subject,
            "html": html_content,
        }

        email = resend.Emails.send(params)
        return email
    except Exception as e:
        print(f"Error sending email: {e}")
        return None

def send_welcome_email(user_email, username):
    """
    Sends a themed welcome email to new students.
    """
    subject = "🚀 Welcome to Campus Cortex AI!"
    html = f"""
    <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h1 style="color: #078a52;">Hello, {username}!</h1>
        <p>Welcome to <b>Campus Cortex AI</b>. Your academic quest begins now.</p>
        <p>We've successfully set up your profile. You can now start earning XP and leveling up your skill trees.</p>
        <div style="background: #fcfaf2; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0;"><b>Next Step:</b> Log in to your dashboard to view your personalized learning path.</p>
        </div>
        <p>Happy Learning!</p>
        <hr style="border: none; border-top: 1px dashed #ccc; margin: 20px 0;" />
        <p style="font-size: 12px; color: #888;">© 2024 Campus Cortex AI. All rights reserved.</p>
    </div>
    """
    return send_email(user_email, subject, html)

def send_verification_code(to_email, code):
    """
    Sends a 6-digit verification code to the user's email.
    """
    subject = "🔑 Your CortexAI Verification Code"
    html = f"""
    <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 40px; border: 1px solid #e0e0e0; border-radius: 16px; text-align: center;">
        <h2 style="color: #1a1a1a; margin-bottom: 8px;">Verification Code</h2>
        <p style="color: #666; margin-bottom: 32px;">Please use the code below to complete your sign-up process.</p>
        <div style="background: #f4f4f4; padding: 24px; border-radius: 12px; font-size: 32px; font-weight: bold; letter-spacing: 12px; color: #d9206b; display: inline-block; margin-bottom: 32px;">
            {code}
        </div>
        <p style="color: #999; font-size: 12px;">This code will expire in 10 minutes. If you did not request this, please ignore this email.</p>
    </div>
    """
    return send_email(to_email, subject, html)
