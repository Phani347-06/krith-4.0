import os
from supabase_client import supabase

questions = [
    {'subject': 'Python', 'chapter': 'Logic Building', 'topic': 'Conditions', 'difficulty': 'easy', 'question_text': 'Which keyword is used to start a conditional statement in Python?', 'question_type': 'mcq', 'option_a': 'if', 'option_b': 'when', 'option_c': 'loop', 'option_d': 'def', 'correct_answer': 'if'},
    {'subject': 'Python', 'chapter': 'Logic Building', 'topic': 'Conditions', 'difficulty': 'easy', 'question_text': 'What symbol is used to check for equality in Python?', 'question_type': 'mcq', 'option_a': '=', 'option_b': '==', 'option_c': '===', 'option_d': '!=', 'correct_answer': '=='},
    {'subject': 'Python', 'chapter': 'Logic Building', 'topic': 'Conditions', 'difficulty': 'medium', 'question_text': 'Which keyword is used to check another condition if the first IF statement is False?', 'question_type': 'mcq', 'option_a': 'else if', 'option_b': 'elif', 'option_c': 'case', 'option_d': 'switch', 'correct_answer': 'elif'},
    {'subject': 'Python', 'chapter': 'Logic Building', 'topic': 'Conditions', 'difficulty': 'medium', 'question_text': "What is the output of: if 5 > 3: print('Yes') else: print('No')?", 'question_type': 'mcq', 'option_a': 'Yes', 'option_b': 'No', 'option_c': 'Error', 'option_d': 'Nothing', 'correct_answer': 'Yes'},
    {'subject': 'Python', 'chapter': 'Logic Building', 'topic': 'Conditions', 'difficulty': 'hard', 'question_text': 'How do you check if x is between 10 and 20 (inclusive) in Python?', 'question_type': 'mcq', 'option_a': '10 <= x <= 20', 'option_b': 'x > 10 and x < 20', 'option_c': 'x in range(10, 20)', 'option_d': 'x between 10 and 20', 'correct_answer': '10 <= x <= 20'}
]

try:
    res = supabase.table('questions').insert(questions).execute()
    print(f"Successfully inserted {len(questions)} questions.")
except Exception as e:
    print(f"Error: {e}")
