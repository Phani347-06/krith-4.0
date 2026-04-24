from db import conn

def get_coding_scores(student_id):
    cur = conn.cursor()

    cur.execute("""
        SELECT q.topic,
               c.status,
               c.passed_test_cases,
               c.total_test_cases
        FROM coding_submissions c
        JOIN questions q
        ON q.id=c.question_id
        WHERE c.student_id=%s
    """, (student_id,))

    return cur.fetchall()
