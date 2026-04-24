from db import conn

def get_assignment_scores(student_id):
    cur = conn.cursor()

    cur.execute("""
        SELECT a.title,s.percentage
        FROM assignment_submission s
        JOIN assignment a
        ON a.id=s.assignment_id
        WHERE s.user_id=%s
        ORDER BY s.id
    """, (student_id,))

    return cur.fetchall()
