from db import conn

def get_attendance(student_id):
    cur = conn.cursor()

    cur.execute("""
        SELECT status
        FROM attendance
        WHERE student_id=%s
    """, (student_id,))

    return cur.fetchall()
