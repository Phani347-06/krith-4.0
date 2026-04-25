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
    base_prompt = """You are Krith, an elite AI learning assistant on the CortexAI gamified platform. Your tone is supportive, energetic, concise, and futuristic. 
    CRITICAL RESTRICTIONS:
    1. STRICTLY limit your scope to educational topics (Python, Web Dev, SQL), coding concepts, and the CortexAI curriculum.
    2. If the user asks about off-topic subjects (e.g., politics, movies, general trivia), politely but firmly refuse to answer and redirect them back to their coding quests.
    3. DO NOT write full code solutions for the user. Instead, provide hints, pseudo-code, and explanations to guide them to the answer.
    4. Keep all responses very concise (under 4 sentences if possible) and format code snippets neatly.
    """
    
    if user_context:
        context_str = f"""
        [USER PERFORMANCE DATABASE]
        Total XP: {user_context.get('xp', 0)}
        Current Level: {user_context.get('level', 1)}
        Current Rank: {user_context.get('rank', 'Novice')}
        Total Modules Mastered: {user_context.get('modulesCompleted', 0)}
        Currently Focused Topic: {user_context.get('currentTopic', 'Exploring Map')}
        Exact Completed Subtopics: {', '.join(user_context.get('completedModulesList', [])) or 'None yet'}
        Current Struggle Areas (Failed Quizzes): {', '.join(user_context.get('struggleAreas', [])) or 'None. Performing flawlessly.'}
        
        Use this complete database context to deeply personalize your responses. If they ask about their points or progress, cite these exact numbers. If they are struggling with a topic listed above, offer targeted encouragement.
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

    Generate a short 1-2 sentence narrative context in English that is 'Professional but Entertaining.' 
    Use a high-octane 'Mass' TFI (Telugu Film Industry) cinematic style, but keep the language polished and technical.
    The narrative should frame the student as a 'Professional Hero' taking down a sophisticated digital empire. 
    Use cinematic metaphors like 'High-Stakes Elevation' or 'Strategic Takedown' to build excitement while staying focused on the {topic} learning objective.
    Generate a creative reward (e.g., 'Heroic Elevation +50 XP', 'Strategic Logic Core', 'Mastery Credential').

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
