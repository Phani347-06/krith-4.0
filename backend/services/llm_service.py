import os
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

# Initialize the xAI client (using the OpenAI-compatible SDK)
# Base URL for xAI: https://api.x.ai/v1
client = OpenAI(
    api_key=os.getenv("XAI_API_KEY"),
    base_url="https://api.x.ai/v1",
)

def generate_feedback(strengths, weaknesses, recommendation):
    """
    Generates personalized learning feedback using xAI's Grok.
    """
    prompt = f"""
    You are a high-level academic advisor for a student on the CortexAI platform.
    
    Student strengths: {', '.join(strengths) if strengths else 'Data not yet available'}
    Student weaknesses: {', '.join(weaknesses) if weaknesses else 'None identified'}
    Strategic Recommendation: {recommendation}

    Based on the above tactical data, provide a short, highly motivating, and personalized 
    feedback message. Focus on growth and the student's personal mastery path.
    Keep it under 3 sentences.
    """

    try:
        completion = client.chat.completions.create(
            model="grok-beta",
            messages=[
                {"role": "system", "content": "You are a motivating academic AI assistant named Krith."},
                {"role": "user", "content": prompt},
            ],
        )
        return completion.choices[0].message.content
    except Exception as e:
        print(f"Error generating feedback with Grok: {e}")
        return "Keep pushing forward! Your mastery path is looking strong."
