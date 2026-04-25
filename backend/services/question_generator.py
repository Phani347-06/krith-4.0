import json
import os
import traceback
from openai import OpenAI
from db import db as supabase

# Initialize Groq client using OpenAI-compatible SDK
client = OpenAI(
    api_key=os.getenv("XAI_API_KEY"),
    base_url="https://api.groq.com/openai/v1",
)

def generate_and_save_question(topic, difficulty, question_type):
    """
    Generates a single question using Grok, saves it to the database, and returns the result.
    """
    try:
        prompt = f"""
        Generate a {difficulty} level {question_type} question about {topic} for a Python learning app.
        Return ONLY a raw JSON object with NO markdown formatting or commentary.
        
        If question_type is 'mcq':
        {{
            "question_text": "...",
            "options": ["opt1", "opt2", "opt3", "opt4"],
            "correct_answer": "the exact text of the correct option"
        }}
        
        If question_type is 'fill_blank':
        {{
            "question_text": "Use ___ for the blank in this code snippet...",
            "correct_answer": "the missing word/token"
        }}
        
        If question_type is 'coding':
        {{
            "question_text": "Write a function to...",
            "starter_code": "def solve():\n    pass",
            "test_cases": [
                {{"input": "input1", "output": "output1"}},
                {{"input": "input2", "output": "output2"}}
            ]
        }}
        """

        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": "You are a Python curriculum expert that outputs only raw JSON formatted strictly for database ingestion."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            response_format={"type": "json_object"}
        )

        raw_content = response.choices[0].message.content.strip()
        if raw_content.startswith("```json"):
            raw_content = raw_content[7:-3].strip()
        elif raw_content.startswith("```"):
            raw_content = raw_content[3:-3].strip()
            
        question_data = json.loads(raw_content)

        options_array = question_data.get("options", [])
        db_question = {
            "topic": topic,
            "subject": "Python",
            "chapter": "General",
            "difficulty": difficulty,
            "question_type": question_type,
            "question_text": question_data["question_text"],
            "correct_answer": question_data.get("correct_answer") if question_type != 'coding' else None,
            "option_a": options_array[0] if len(options_array) > 0 else None,
            "option_b": options_array[1] if len(options_array) > 1 else None,
            "option_c": options_array[2] if len(options_array) > 2 else None,
            "option_d": options_array[3] if len(options_array) > 3 else None,
            "starter_code": question_data.get("starter_code")
        }

        res = supabase.table("questions").insert(db_question).execute()
        if not res.data:
            print(f"Supabase Error: {res}")
            raise Exception("Failed to insert question")
            
        saved_q = res.data[0]

        if question_type == 'coding' and "test_cases" in question_data:
            tc_list = []
            for tc in question_data["test_cases"]:
                tc_list.append({
                    "question_id": saved_q["id"],
                    "input_data": str(tc["input"]),
                    "expected_output": str(tc["output"])
                })
            tc_res = supabase.table("coding_test_cases").insert(tc_list).execute()
            saved_q["test_cases"] = tc_res.data

        return saved_q
    except Exception as e:
        print(f"Error in generate_and_save_question: {e}")
        traceback.print_exc()
        raise e

def generate_full_lesson(topic, difficulty):
    """
    Generates a theory lesson followed by 5 questions of mixed types.
    """
    try:
        print(f"Generating lesson for: {topic} ({difficulty})")
        prompt = f"""
        Create a comprehensive lesson for the topic "{topic}" at a {difficulty} level.
        Return ONLY a raw JSON object with NO markdown formatting or commentary.
        
        Structure:
        {{
            "theory": "A concise, engaging explanation of the topic (max 300 words). Use markdown for code snippets.",
            "questions": [
                {{ "type": "mcq", "question_text": "...", "options": ["A", "B", "C", "D"], "correct_answer": "A" }},
                {{ "type": "mcq", "question_text": "...", "options": ["A", "B", "C", "D"], "correct_answer": "B" }},
                {{ "type": "fill_blank", "question_text": "...", "correct_answer": "..." }},
                {{ "type": "fill_blank", "question_text": "...", "correct_answer": "..." }},
                {{ "type": "coding", "question_text": "...", "starter_code": "...", "test_cases": [ {{"input": "..", "output": ".."}}, {{"input": "..", "output": ".."}} ] }}
            ]
        }}
        """

        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": "You are a Python curriculum architect. You output ONLY valid JSON for a lesson plan."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            response_format={"type": "json_object"}
        )

        raw_content = response.choices[0].message.content.strip()
        print(f"Grok Raw Response: {raw_content[:200]}...") # Log start of response
        
        if raw_content.startswith("```json"):
            raw_content = raw_content[7:-3].strip()
        elif raw_content.startswith("```"):
            raw_content = raw_content[3:-3].strip()
            
        lesson_data = json.loads(raw_content)
        print("JSON parsed successfully.")
        
        saved_questions = []
        for q_data in lesson_data["questions"]:
            options_array = q_data.get("options", [])
            db_question = {
                "topic": topic,
                "subject": "Python",
                "chapter": "General",
                "difficulty": difficulty,
                "question_type": q_data["type"],
                "question_text": q_data["question_text"],
                "correct_answer": q_data.get("correct_answer") if q_data["type"] != 'coding' else None,
                "option_a": options_array[0] if len(options_array) > 0 else None,
                "option_b": options_array[1] if len(options_array) > 1 else None,
                "option_c": options_array[2] if len(options_array) > 2 else None,
                "option_d": options_array[3] if len(options_array) > 3 else None,
                "starter_code": q_data.get("starter_code")
            }
            
            try:
                res = supabase.table("questions").insert(db_question).execute()
                if not res.data:
                    print(f"Database Insert Failed for question: {db_question}")
                else:
                    saved_q = res.data[0]
                    
                    if q_data["type"] == 'coding' and "test_cases" in q_data:
                        tc_list = []
                        for tc in q_data["test_cases"]:
                            tc_list.append({
                                "question_id": saved_q["id"],
                                "input_data": str(tc["input"]),
                                "expected_output": str(tc["output"])
                            })
                        tc_res = supabase.table("coding_test_cases").insert(tc_list).execute()
                        saved_q["test_cases"] = tc_res.data
            except Exception as db_err:
                print(f"Skipping DB save due to error: {db_err}")
                
            # Always append the question to the frontend payload, even if DB fails
            saved_questions.append(q_data)

        print("Lesson generated and saved successfully.")
        return {
            "theory": lesson_data["theory"],
            "questions": saved_questions
        }
    except Exception as e:
        print(f"Error in generate_full_lesson: {e}")
        traceback.print_exc()
        raise e

def generate_bulk_topic_questions(topic: str):
    """
    Generates 10 real-world, scenario-based questions for a given topic:
    4 Easy (MCQ), 3 Medium (Fill-in/Output), 3 Hard (Coding).
    Automatically inserts them into the database while avoiding duplicates.
    """
    prompt = f"""
    You are an expert curriculum designer for a gamified adaptive learning platform.
    Generate EXACTLY 10 questions for the topic: "{topic}".

    DISTRIBUTION:
    - 4 "easy" questions (type: "mcq")
    - 3 "medium" questions (type: "fill_blank")
    - 3 "hard" questions (type: "coding")

    DESIGN RULES:
    - DO NOT use generic, boring textbook phrasing like "What is a variable?".
    - USE simple, practical, real-world scenarios. (e.g., "You need to store a user's age in a game...").
    - Keep sentences short and beginner-friendly.

    FORMAT SPECIFICATIONS:
    For MCQ (easy):
    Must include "question_text", "option_a", "option_b", "option_c", "option_d", and "correct_answer".

    For Fill Blank (medium):
    Must include "question_text" and "correct_answer".

    For Coding (hard):
    Must include "question_text", "starter_code", and a "test_cases" array containing EXACTLY 2 test cases with "input_data" and "expected_output".

    Return ONLY raw JSON in this exact structure:
    {{
      "questions": [
        {{
          "difficulty": "easy",
          "question_type": "mcq",
          "question_text": "...",
          "option_a": "...",
          "option_b": "...",
          "option_c": "...",
          "option_d": "...",
          "correct_answer": "..."
        }},
        ...
      ]
    }}
    """
    
    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": "You are an expert curriculum designer that outputs only raw JSON."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            response_format={"type": "json_object"}
        )

        raw_content = response.choices[0].message.content.strip()
        data = json.loads(raw_content)
        questions_list = data.get("questions", [])

        # Fetch existing questions to prevent exact duplicates
        existing_res = supabase.table("questions").select("question_text").eq("topic", topic).execute()
        existing_texts = {q["question_text"] for q in existing_res.data} if existing_res.data else set()

        inserted_count = 0

        for q in questions_list:
            if q["question_text"] in existing_texts:
                continue

            # Prepare insertion payload matching strict schema constraints
            db_question = {
                "topic": topic,
                "subject": "Python",
                "chapter": "General",
                "difficulty": q.get("difficulty", "easy"),
                "question_type": q.get("question_type", "mcq"),
                "question_text": q.get("question_text"),
                "correct_answer": q.get("correct_answer"),
                "option_a": q.get("option_a"),
                "option_b": q.get("option_b"),
                "option_c": q.get("option_c"),
                "option_d": q.get("option_d"),
                "starter_code": q.get("starter_code")
            }

            try:
                res = supabase.table("questions").insert(db_question).execute()
                if res.data:
                    saved_q = res.data[0]
                    inserted_count += 1
                    existing_texts.add(q["question_text"])

                    # If it's a coding question, insert its test cases
                    if q.get("question_type") == "coding" and "test_cases" in q:
                        tc_list = []
                        for tc in q["test_cases"]:
                            tc_list.append({
                                "question_id": saved_q["id"],
                                "input_data": str(tc.get("input_data", "")),
                                "expected_output": str(tc.get("expected_output", ""))
                            })
                        if tc_list:
                            supabase.table("coding_test_cases").insert(tc_list).execute()

            except Exception as insert_err:
                print(f"Skipping question insertion due to error: {insert_err}")

        return inserted_count

    except Exception as e:
        print(f"Error in generate_bulk_topic_questions: {e}")
        traceback.print_exc()
        raise e
