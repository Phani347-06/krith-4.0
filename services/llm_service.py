import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

# Using environment variable for Gemini API key
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

model = genai.GenerativeModel("gemini-pro")


def generate_feedback(strengths, weaknesses, recommendation):
    prompt = f"""
    Student strengths: {strengths}
    Weaknesses: {weaknesses}
    Recommendation: {recommendation}

    Give short personalized learning feedback.
    """

    response = model.generate_content(prompt)

    return response.text
