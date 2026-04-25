import os
from supabase_client import supabase

questions = [
    {'subject': 'Python', 'chapter': 'Level 4', 'topic': 'Data Structures', 'difficulty': 'easy', 'question_text': 'Which data structure is used to store an ordered collection of items in square brackets?', 'question_type': 'mcq', 'option_a': 'List', 'option_b': 'Dictionary', 'option_c': 'Set', 'option_d': 'Tuple', 'correct_answer': 'List'},
    {'subject': 'Python', 'chapter': 'Level 4', 'topic': 'Data Structures', 'difficulty': 'easy', 'question_text': 'What is the index of the first element in a Python list?', 'question_type': 'mcq', 'option_a': '1', 'option_b': '0', 'option_c': '-1', 'option_d': 'first', 'correct_answer': '0'},
    {'subject': 'Python', 'chapter': 'Level 4', 'topic': 'Data Structures', 'difficulty': 'medium', 'question_text': 'Which method is used to add an item to the end of a list?', 'question_type': 'mcq', 'option_a': 'add()', 'option_b': 'insert()', 'option_c': 'append()', 'option_d': 'extend()', 'correct_answer': 'append()'},
    {'subject': 'Python', 'chapter': 'Level 4', 'topic': 'Data Structures', 'difficulty': 'medium', 'question_text': 'Which data structure stores key-value pairs?', 'question_type': 'mcq', 'option_a': 'List', 'option_b': 'Dictionary', 'option_c': 'Tuple', 'option_d': 'Set', 'correct_answer': 'Dictionary'},
    {'subject': 'Python', 'chapter': 'Level 4', 'topic': 'Data Structures', 'difficulty': 'hard', 'question_text': 'Which of these is immutable (cannot be changed after creation)?', 'question_type': 'mcq', 'option_a': 'List', 'option_b': 'Tuple', 'option_c': 'Dictionary', 'option_d': 'Set', 'correct_answer': 'Tuple'}
]

try:
    res = supabase.table('questions').insert(questions).execute()
    print(f"Successfully inserted {len(questions)} Data Structures questions.")
except Exception as e:
    print(f"Error: {e}")
