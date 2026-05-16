from typing import Dict

# Simple in-memory cache for session data
# Maps session_id -> { "repo_path": str, ... }
SESSION_CACHE: Dict[str, Dict[str, str]] = {}

def get_session(session_id: str) -> Dict[str, str]:
    return SESSION_CACHE.get(session_id)

def set_session(session_id: str, data: Dict[str, str]) -> None:
    SESSION_CACHE[session_id] = data
