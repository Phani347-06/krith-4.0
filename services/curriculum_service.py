from db import conn


def get_next_core_topic(current_topic):
    cur = conn.cursor()

    cur.execute("""
        SELECT topic_name
        FROM curriculum_tree
        WHERE prerequisite_topic_id=(
            SELECT id
            FROM curriculum_tree
            WHERE topic_name=%s
        )
        AND track_type='core'
        LIMIT 1
    """, (current_topic,))

    result = cur.fetchone()

    if result:
        return result[0]

    return None


def get_next_advanced_topic(current_topic):
    cur = conn.cursor()

    cur.execute("""
        SELECT topic_name
        FROM curriculum_tree
        WHERE prerequisite_topic_id=(
            SELECT id
            FROM curriculum_tree
            WHERE topic_name=%s
        )
        AND track_type='advanced'
        LIMIT 1
    """, (current_topic,))

    result = cur.fetchone()

    if result:
        return result[0]

    return None


def get_specialization_tracks():
    cur = conn.cursor()

    cur.execute("""
        SELECT topic_name
        FROM curriculum_tree
        WHERE track_type IN (
            'frontend',
            'sql',
            'ai_ml'
        )
    """)

    return [row[0] for row in cur.fetchall()]
