import os
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

# The user's XAI_API_KEY is actually a Groq API key (starts with gsk_)
# We use Groq for ultra-fast Llama 3 inference
client = OpenAI(
    api_key=os.getenv("XAI_API_KEY"),
    base_url="https://api.groq.com/openai/v1",
)

def generate_feedback(strengths, weaknesses, recommendation):
    """
    Generates personalized learning feedback using Groq's Llama 3.
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
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": "You are a motivating academic AI assistant named Krith."},
                {"role": "user", "content": prompt},
            ],
        )
        return completion.choices[0].message.content
    except Exception as e:
        print(f"Error generating feedback with Groq: {e}")
        return "Keep pushing forward! Your mastery path is looking strong."

def chat_with_agent(messages, user_context=None):
    """
    Handles a multi-turn conversation with the user.
    `messages` is a list of dicts: [{'role': 'user', 'content': '...'}]
    `user_context` contains stats like XP, streaks, etc.
    """
    base_prompt = "You are Krith, an elite AI companion and learning assistant on the CortexAI gamified learning platform. Your tone is supportive, energetic, concise, and slightly futuristic/tactical. Help the user learn Python, answer their coding questions, and encourage them to complete their quests on the map. Keep responses very concise and format code snippets neatly."
    
    if user_context:
        context_str = f"""
        [USER PERFORMANCE DATA]
        Total XP: {user_context.get('totalXP', 0)}
        Current Streak: {user_context.get('streak', 0)} days
        Questions Answered: {user_context.get('questionsAnswered', 0)}
        Modules Completed: {user_context.get('completedModules', 0)}
        
        Use this data to personalize your responses. If they have a high streak or XP, praise them. If they ask about their progress, reference these exact numbers.
        """
        base_prompt += "\n" + context_str

    system_prompt = {
        "role": "system", 
        "content": base_prompt
    }
    
    try:
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[system_prompt] + messages,
            temperature=0.7,
            max_tokens=1024,
        )
        return completion.choices[0].message.content
    except Exception as e:
        print(f"Chat error: {e}")
        return "Warning: Core logic offline. Please try again in a moment."

def generate_survival_mission(topic: str, action: str, question_text: str):
    """
    Wraps the RL-selected question in a gamified narrative.
    Returns a JSON string containing mission_story and reward.
    """
    prompt = f"""
    You are the game master for an elite gamified learning platform called CortexAI.
    The current topic is: {topic}
    The difficulty action selected is: {action}
    The core question to ask is: "{question_text}"

    Generate a short 1-2 sentence narrative context setting up a hacking or futuristic mission scenario. 
    Make it feel engaging and tactical.
    Also generate a creative reward for solving it (e.g., '+50 XP', 'Data Key unlocked').

    Return ONLY a raw JSON object:
    {{
        "mission_story": "The narrative...",
        "reward": "The reward..."
    }}
    """
    
    try:
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.8,
            response_format={"type": "json_object"}
        )
        return completion.choices[0].message.content
    except Exception as e:
        print(f"Mission Gen error: {e}")
        return '{"mission_story": "Mission critical. Solve this to proceed.", "reward": "+50 XP"}'
