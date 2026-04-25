from db import db as supabase
from services.attendance_service import get_attendance
from services.llm_service import generate_feedback

def generate_parent_feedback(parent_id):
    # Step 1: Get student_id linked to this parent
    link_res = supabase.table('parent_student_link').select('student_id').eq('parent_id', parent_id).execute()
    if not link_res.data:
        return {"error": "No student linked to this parent"}
    
    student_id = link_res.data[0]['student_id']

    # Step 2: Get assignment results
    res = supabase.table('assignment_submission') \
        .select('percentage, assignment(title)') \
        .eq('user_id', student_id) \
        .execute()

    low_topics = []
    for r in res.data:
        title = r['assignment']['title']
        score = r['percentage']
        topic = title.replace(" Assessment","")

        if score < 60:
            low_topics.append(topic)

    attendance = get_attendance(student_id)
    absent_count = 0
    for record in attendance:
        if record[0] == "ABSENT":
            absent_count += 1

    attendance_issue = absent_count >= 2

    feedback = generate_feedback(
        [],
        low_topics,
        "Parental support recommended"
    )

    return {
        "low_performance_topics": low_topics,
        "attendance_issue": attendance_issue,
        "parent_feedback": feedback
    }
