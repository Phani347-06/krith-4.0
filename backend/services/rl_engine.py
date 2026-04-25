import random
from db import db as supabase

# Actions available to the RL engine
ACTIONS = ["easy_question", "medium_question", "hard_question", "remedial_content", "skip_forward"]

def get_next_action(student_id: int, last_question_id: int = None):
    """
    RL Decision: Epsilon-Greedy to select difficulty + Rule Engine for Topic.
    """
    topic_mapping = {
        1: "Variables",
        2: "Conditions",
        3: "Loops",
        4: "Functions",
        5: "Data Structures",
        6: "Recursion",
        7: "Frontend",
        8: "SQL",
        9: "AI/ML"
    }
    
    # 1. Gather Context (Rule Engine)
    target_topic = 1 
    mastery_score = 0.5
    attendance_issues = False

    try:
        # Check Attendance
        attendance_res = supabase.table("attendance").select("*").eq("student_id", student_id).execute()
        if attendance_res.data:
            absences = sum(1 for a in attendance_res.data if a.get("status") == "absent")
            if absences > 3:
                attendance_issues = True

        # Check for mastery-based progression
        mastery_levels = supabase.table("student_mastery").select("*").eq("student_id", student_id).execute()
        if mastery_levels.data:
            # Find the highest topic ID that is mastered (> 0.6)
            mastered_ids = [m["topic_id"] for m in mastery_levels.data if m.get("mastery_score", 0) >= 0.6]
            if mastered_ids:
                max_id = max(mastered_ids)
                # If there's a next topic in our mapping, move to it
                if (max_id + 1) in topic_mapping:
                    target_topic = max_id + 1
                    mastery_score = 0.3 # Start low for new topic
            else:
                # Find the lowest topic they have started
                target_topic = min([m["topic_id"] for m in mastery_levels.data])
                mastery_score = min([m.get("mastery_score", 0.5) for m in mastery_levels.data])

        db_target_topic = topic_mapping.get(target_topic, "Variables")

        # ADAPTIVE JUMP: If mastery is decent (>0.5), give a 20% chance to preview the NEXT topic
        if mastery_score > 0.5 and random.random() < 0.2:
            next_topic_id = target_topic + 1
            if next_topic_id in topic_mapping:
                target_topic = next_topic_id
                db_target_topic = topic_mapping[target_topic]

    except Exception as e:
        print(f"Rule Engine DB Error: {e}. Using defaults.")

    # 2. Determine State
    state = "medium"
    if mastery_score < 0.4:
        state = "weak"
    elif mastery_score > 0.7:
        state = "strong"

    # 3. RL Engine: Epsilon Greedy
    epsilon = 0.2
    roll = random.random()
    
    selected_action = ""
    
    if roll < epsilon:
        # EXPLORE (20%)
        selected_action = random.choice(ACTIONS)
    else:
        # EXPLOIT (80%)
        if attendance_issues and state == "weak":
            selected_action = "remedial_content"
        elif state == "weak":
            selected_action = "easy_question"
        elif state == "medium":
            selected_action = "medium_question"
        elif state == "strong":
            selected_action = "hard_question"

    # 4. Fetch Question from DB
    difficulty_map = {
        "easy_question": "easy",
        "medium_question": "medium",
        "hard_question": "hard",
        "remedial_content": "easy",
        "skip_forward": "hard"
    }
    
    db_difficulty = difficulty_map.get(selected_action, "medium")
    
    # Generate a dynamic mission story based on topic
    stories = {
        "Variables": "Infiltrate the data vault and secure the core memory units by labeling them correctly.",
        "Loops": "The security drones are patrolling in a pattern. Hack their navigation loops to slip past.",
        "Functions": "The mainframe requires a modular bypass. Deploy the correct logic function to proceed.",
        "Data Structures": "The encrypted archives are organized in complex arrays. Sort through them to find the key.",
        "Recursion": "You've entered a hall of mirrors. Find the base case to escape the infinite loop."
    }
    mission_story = stories.get(db_target_topic, f"Complete the {db_target_topic} challenge to advance.")

    question_data = {
        "id": "gen_1",
        "question_text": f"Solve this {db_difficulty} challenge regarding {db_target_topic}.",
        "question_type": "mcq",
        "option_a": "A",
        "option_b": "B",
        "option_c": "C",
        "option_d": "D",
        "correct_answer": "A",
        "starter_code": None
    }

    try:
        # Fetch up to 100 questions for this topic to ensure variety
        query = supabase.table("questions").select("*").eq("topic", db_target_topic)
            
        if last_question_id is not None:
            query = query.neq("id", last_question_id)
            
        # Try specific difficulty first
        q_res = query.eq("difficulty", db_difficulty).limit(50).execute()
        
        if not q_res.data:
            # Fallback to any difficulty for this topic
            q_res = supabase.table("questions").select("*").eq("topic", db_target_topic).limit(100).execute()
            
        if q_res.data:
            question_data = random.choice(q_res.data)
    except Exception as e:
        print(f"Question fetch error: {e}")

    return {
        "topic": db_target_topic,
        "topic_id": target_topic,
        "action": selected_action,
        "mission_story": mission_story,
        "reward": f"+50 XP and '{db_target_topic} Specialist' badge",
        "question_data": question_data
    }

def process_answer(student_id: int, topic_id: int, question_id: int, action: str, correct: bool):
    """
    Handles the mathematical RL updates: Q-values, Mastery clamping, and Logs.
    Returns the survival consequences.
    """
    reward = 1 if correct else -1
    alpha = 0.1
    
    # 1. Update Q-Values: Q = Q + alpha(reward - Q)
    try:
        q_res = supabase.table("q_values").select("*").eq("student_id", student_id).eq("topic_id", topic_id).eq("action_type", action).execute()
        current_q = 0.0
        q_record_id = None
        
        if q_res.data:
            current_q = q_res.data[0].get("q_value", 0.0)
            q_record_id = q_res.data[0].get("id")
            
        new_q = current_q + alpha * (reward - current_q)
        
        if q_record_id:
            supabase.table("q_values").update({"q_value": new_q}).eq("id", q_record_id).execute()
        else:
            supabase.table("q_values").insert({
                "student_id": student_id,
                "topic_id": topic_id,
                "action_type": action,
                "q_value": new_q
            }).execute()
    except Exception as e:
        print(f"Q-Value Update Error: {e}")

    # 2. Update Mastery
    mastery_change = 0.2 if correct else -0.1
    old_mastery = 0.5
    try:
        m_res = supabase.table("student_mastery").select("mastery_score").eq("student_id", student_id).eq("topic_id", topic_id).execute()
        if m_res.data:
            old_mastery = m_res.data[0].get("mastery_score", 0.5)
        
        new_mastery = max(0.0, min(1.0, old_mastery + mastery_change))

        # Use on_conflict to ensure the record for this student+topic is updated correctly
        supabase.table("student_mastery").upsert({
            "student_id": student_id,
            "topic_id": topic_id,
            "mastery_score": new_mastery,
            "last_updated": "now()"
        }, on_conflict="student_id,topic_id").execute()
    except Exception as e:
        print(f"Mastery Update Error: {e}")

    # 3. Store Logs
    reward = 50 if correct else -10
    try:
        supabase.table("interaction_logs").insert({
            "student_id": student_id,
            "topic_id": topic_id,
            "question_id": question_id,
            "action_taken": action,
            "result": "correct" if correct else "incorrect",
            "reward": reward,
            "mastery_before": old_mastery,
            "mastery_after": new_mastery
        }).execute()
    except Exception as e:
        print(f"Log Insert Error: {e}")

    # 4. Survival Consequences
    # Get latest total progress to return to frontend
    current_stats = get_student_progress(student_id)
    
    if correct:
        return {
            "result": "success",
            "reward": "+50 XP",
            "xp_change": 50,
            "total_xp": current_stats["xp"],
            "mastery_updated": round(new_mastery, 2),
            "topic_id": topic_id
        }
    else:
        return {
            "result": "failed",
            "penalty": "-10 XP",
            "xp_change": -10,
            "total_xp": current_stats["xp"],
            "mastery_updated": round(new_mastery, 2),
            "topic_id": topic_id
        }

def get_student_progress(student_id: int):
    """
    Dynamically calculates gamified stats and retrieves mastery levels.
    """
    # Base stats
    total_xp = 100
    rank = "Novice"
    current_level = 1
    
    # Calculate dynamic stats based on interaction logs
    try:
        logs_res = supabase.table("interaction_logs").select("reward").eq("student_id", student_id).execute()
        if logs_res.data:
            total_correct = sum(1 for log in logs_res.data if log.get("reward", 0) > 0)
            total_wrong = sum(1 for log in logs_res.data if log.get("reward", 0) < 0)
            
            # Sum up actual rewards from logs
            session_xp = sum(log.get("reward", 0) for log in logs_res.data)
            total_xp = max(0, 100 + session_xp)
            
            if total_xp >= 1000:
                rank = "Elite Hacker"
            elif total_xp >= 500:
                rank = "Code Ninja"
            elif total_xp >= 200:
                rank = "Apprentice"
                
    except Exception as e:
        print(f"Error calculating dynamic stats: {e}")

    # Fetch mastery
    mastery_levels = []
    completed_topics = []
    try:
        m_res = supabase.table("student_mastery").select("*").eq("student_id", student_id).execute()
        if m_res.data:
            for record in m_res.data:
                score = record.get("mastery_score", 0.0)
                topic_id = record.get("topic_id", "Unknown")
                mastery_levels.append({"topic_id": topic_id, "score": score})
                if score >= 0.8:
                    completed_topics.append(topic_id)
            
            current_level = max(1, len(completed_topics) + 1)
    except Exception as e:
        print(f"Error fetching mastery for stats: {e}")

    return {
        "xp": total_xp,
        "rank": rank,
        "current_level": current_level,
        "mastery": mastery_levels,
        "completed_topics": completed_topics
    }
