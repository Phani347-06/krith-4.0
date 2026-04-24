from db import db as supabase

def get_assignment_scores(student_id):
    # Using Supabase SDK relation fetching to replace the SQL JOIN
    response = supabase.table('assignment_submission') \
        .select('percentage, assignment(title)') \
        .eq('user_id', student_id) \
        .order('id') \
        .execute()
    
    # Format to match [(title, percentage)]
    return [(r['assignment']['title'], r['percentage']) for r in response.data]
