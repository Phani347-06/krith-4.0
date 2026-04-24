import os
from supabase_client import supabase

# This module now serves as the primary data access bridge using the Supabase SDK.
# The SDK uses HTTPS (Port 443), which is much more stable than direct SQL connections on most networks.

def get_db():
    """Returns the initialized Supabase client."""
    return supabase

# Re-export the client for easy access
db = get_db()
