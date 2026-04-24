from db import db as supabase

def get_coding_scores(student_id):
    # Using Supabase SDK for relational data fetching
    response = supabase.table('coding_submissions') \
        .select('status, passed_test_cases, total_test_cases, questions(topic)') \
        .eq('student_id', student_id) \
        .execute()
    
    # Format to match [(topic, status, passed, total)]
    return [(r['questions']['topic'], r['status'], r['passed_test_cases'], r['total_test_cases']) for r in response.data]
