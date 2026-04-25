from db import db as supabase
from services.attendance_service import get_attendance
from services.llm_service import generate_feedback

def verify_and_link_child(parent_id, child_email, child_password):
    """
    Verifies child credentials and links them to the parent.
    Complies with Part A, Point 3 of the Additional Requirements.
    """
    try:
        # 1. Attempt to sign in as the child to verify credentials
        # (This is the most secure way to 'verify password' using Supabase Auth)
        auth_res = supabase.auth.sign_in_with_password({"email": child_email, "password": child_password})
        
        if not auth_res.user:
            return {"status": "error", "message": "Invalid child credentials."}
        
        child_id = auth_res.user.id

        # 2. Check if the child is actually a 'student'
        # We can't use 'id' directly if it's a UUID, so we rely on the email match or similar
        # In this project, student_id is often treated as a number or string
        
        # 3. Create the link in parent_student_link table
        # We'll use a numeric conversion if necessary, or just use the UUID string
        link_data = {
            "parent_id": parent_id,
            "student_id": child_id
        }
        
        # We use upsert to avoid duplicate links
        supabase.table('parent_student_link').upsert(link_data, on_conflict='parent_id,student_id').execute()
        
        return {
            "status": "success", 
            "message": "Child linked successfully!",
            "student_id": child_id
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}

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
