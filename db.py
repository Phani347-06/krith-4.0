import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

# Using environment variable for API keys as requested
conn = psycopg2.connect(os.getenv("SUPABASE_DATABASE_URL"))
