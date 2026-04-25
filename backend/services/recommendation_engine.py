from services.assignment_service import get_assignment_scores
from services.coding_service import get_coding_scores
from services.attendance_service import get_attendance
from services.curriculum_service import (
    get_next_core_topic,
    get_next_advanced_topic,
    get_specialization_tracks
)
from services.llm_service import generate_feedback


def generate_recommendation(student_id):
    assignments = get_assignment_scores(student_id)
    coding = get_coding_scores(student_id)
    attendance = get_attendance(student_id)

    strengths = []
    weaknesses = []

    weak_topics = []
    total_score = 0
    latest_topic = None

    # Assignment Analysis
    if len(assignments) > 0:
        for title, score in assignments:
            topic = (
                title.replace(" Assessment","")
                     .replace(" Coding Challenge","")
            )
    
            latest_topic = topic
            total_score += score
    
            if score >= 80:
                strengths.append(topic)
    
            if score < 60:
                weak_topics.append(topic)
                weaknesses.append(topic)
    
        avg_score = total_score / len(assignments)
    else:
        avg_score = 0

    # Coding Analysis
    coding_failed_topics = []

    for topic, status, passed, total in coding:
        if passed == 0:
            coding_failed_topics.append(topic)

    # Attendance Analysis
    absent_count = 0
    late_count = 0

    for record in attendance:
        status = record[0]

        if status == "ABSENT":
            absent_count += 1

        elif status == "LATE":
            late_count += 1

    if absent_count >= 2:
        weaknesses.append("Attendance Consistency")

    # Recommendation Logic
    if avg_score < 60:
        # Remedial
        if weak_topics:
            primary_weak_topic = weak_topics[0]
            upcoming_focus = weak_topics[1:]

            if primary_weak_topic in coding_failed_topics:
                recommendation = f"{primary_weak_topic} Debugging Quest"
            else:
                recommendation = f"{primary_weak_topic} Reinforcement Quest"
        else:
            recommendation = f"{latest_topic} Remedial Quest"
            upcoming_focus = []

    elif avg_score >= 60 and avg_score < 75:
        # Next topic + extra practice
        recommendation = get_next_core_topic(latest_topic)
        if isinstance(recommendation, str):
            recommendation = f"{recommendation} + Extra Practice"
        elif not recommendation:
            recommendation = "Extra Practice on Core Topics"
        upcoming_focus = []

    elif avg_score >= 75 and avg_score < 85:
        # Normal progression
        recommendation = get_next_core_topic(latest_topic)
        upcoming_focus = []

    elif avg_score >= 85:
        # Advanced
        next_advanced = get_next_advanced_topic(latest_topic)

        if next_advanced:
            recommendation = next_advanced
            upcoming_focus = []
        else:
            recommendation = {
                "message": "Choose Specialization Track",
                "tracks": get_specialization_tracks()
            }
            upcoming_focus = []

    if absent_count >= 2:
        attendance_message = "Student should attend classes regularly."
    else:
        attendance_message = None

    # AI Feedback
    ai_feedback = generate_feedback(
        strengths,
        weaknesses,
        recommendation
    )

    return {
        "strengths": strengths,
        "weaknesses": weaknesses,
        "recommendation": recommendation,
        "upcoming_focus": upcoming_focus,
        "attendance_warning": attendance_message,
        "ai_feedback": ai_feedback
    }
