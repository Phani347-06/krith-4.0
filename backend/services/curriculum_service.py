from db import db as supabase

def get_next_core_topic(current_topic):
    # Step 1: Get the ID of the current topic
    topic_res = supabase.table('curriculum_tree').select('id').eq('topic_name', current_topic).execute()
    if not topic_res.data:
        return None
    
    current_id = topic_res.data[0]['id']

    # Step 2: Get the next core topic
    next_res = supabase.table('curriculum_tree').select('topic_name') \
        .eq('prerequisite_topic_id', current_id) \
        .eq('track_type', 'core') \
        .limit(1) \
        .execute()
    
    return next_res.data[0]['topic_name'] if next_res.data else None

def get_next_advanced_topic(current_topic):
    # Step 1: Get the ID of the current topic
    topic_res = supabase.table('curriculum_tree').select('id').eq('topic_name', current_topic).execute()
    if not topic_res.data:
        return None
    
    current_id = topic_res.data[0]['id']

    # Step 2: Get the next advanced topic
    next_res = supabase.table('curriculum_tree').select('topic_name') \
        .eq('prerequisite_topic_id', current_id) \
        .eq('track_type', 'advanced') \
        .limit(1) \
        .execute()
    
    return next_res.data[0]['topic_name'] if next_res.data else None

def get_specialization_tracks():
    response = supabase.table('curriculum_tree') \
        .select('topic_name') \
        .in_('track_type', ['frontend', 'sql', 'ai_ml']) \
        .execute()
    
    return [r['topic_name'] for r in response.data]
