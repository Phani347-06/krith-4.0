from db import conn
from services.attendance_service import get_attendance
from services.llm_service import generate_feedback


def generate_parent_feedback(parent_id):
    cur = conn.cursor()

    cur.execute("""
        SELECT student_id
        FROM parent_student_link
        WHERE parent_id=%s
    """, (parent_id,))

    student_id = cur.fetchone()[0]

    cur.execute("""
        SELECT a.title,s.percentage
        FROM assignment_submission s
        JOIN assignment a
        ON a.id=s.assignment_id
        WHERE s.user_id=%s
    """, (student_id,))

    results = cur.fetchall()

    low_topics = []

    for title, score in results:
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
