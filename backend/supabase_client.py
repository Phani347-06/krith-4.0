import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

def get_supabase_client() -> Client:
    """
    Initializes and returns a Supabase client.
    Ensure SUPABASE_URL and SUPABASE_ANON_KEY are set in your .env file.
    """
    url: str = os.environ.get("SUPABASE_URL")
    key: str = os.environ.get("SUPABASE_ANON_KEY")
    
    if not url or not key:
        raise ValueError("SUPABASE_URL or SUPABASE_ANON_KEY not found in environment variables.")
        
    return create_client(url, key)

# Single instance of the client
supabase: Client = get_supabase_client()
