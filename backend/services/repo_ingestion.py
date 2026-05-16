import os
import uuid
import tempfile
import requests
from git import Repo
from utils.cache import set_session

def parse_github_url(url: str):
    parts = url.rstrip('/').split('/')
    if len(parts) >= 2:
        return parts[-2], parts[-1]
    raise ValueError("Invalid GitHub URL")

def ingest_repository(repo_url: str):
    owner, name = parse_github_url(repo_url)
    
    # Use GitHub REST API directly (no PyGitHub, no rate-limit auth needed for public repos)
    github_token = os.getenv("GITHUB_TOKEN", "")
    headers = {"Authorization": f"token {github_token}"} if github_token else {}
    
    api_resp = requests.get(
        f"https://api.github.com/repos/{owner}/{name}",
        headers=headers,
        timeout=10
    )
    
    if api_resp.status_code == 404:
        raise ValueError(f"Repository '{owner}/{name}' not found or is private.")
    elif api_resp.status_code == 403:
        raise ValueError("GitHub API rate limit exceeded. Please try again in a minute or add a GITHUB_TOKEN to your .env file.")
    elif api_resp.status_code != 200:
        raise ValueError(f"GitHub API error: {api_resp.status_code}")
    
    repo_data = api_resp.json()
    default_branch = repo_data.get("default_branch", "main")
    
    # Get language breakdown
    lang_resp = requests.get(
        f"https://api.github.com/repos/{owner}/{name}/languages",
        headers=headers,
        timeout=10
    )
    languages = lang_resp.json() if lang_resp.status_code == 200 else {}
    
    # Generate session and path
    session_id = str(uuid.uuid4())
    tmp_base = os.path.join(tempfile.gettempdir(), "repos")
    os.makedirs(tmp_base, exist_ok=True)
    repo_path = os.path.join(tmp_base, f"{owner}_{name}_{session_id}")
    
    # Clone repository — limit depth to 100 for speed; still enough for git history
    cloned_repo = Repo.clone_from(repo_url, repo_path, depth=100)
    commit_hash = cloned_repo.head.commit.hexsha
    
    set_session(session_id, {"repo_path": repo_path})
    
    # Quick count of files (skip .git)
    total_files = sum(
        len(files) for root, dirs, files in os.walk(repo_path)
        if '.git' not in root
    )
    
    return {
        "session_id": session_id,
        "repo": {
            "owner": owner,
            "name": name,
            "branch": default_branch,
            "commit_hash": commit_hash[:7],
            "url": repo_url,
            "total_files": total_files,
            "languages": languages
        },
        "repo_path": repo_path
    }
