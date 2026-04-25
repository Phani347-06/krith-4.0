from db import db as supabase

def get_attendance(student_id):
    # Using the Supabase SDK instead of psycopg2 to bypass connection issues
    response = supabase.table('attendance').select('status').eq('student_id', student_id).execute()
    
    # Format the result to match the expected list of tuples [(status,)]
    return [(r['status'],) for r in response.data]
