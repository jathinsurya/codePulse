from pydantic import BaseModel
from typing import Dict, Any, List, Optional

class ScanRequest(BaseModel):
    repo_url: str

class RepoMetadata(BaseModel):
    owner: str
    name: str
    branch: str
    commit_hash: str
    url: str
    total_files: int
    languages: Dict[str, int]

class ScanResponse(BaseModel):
    session_id: str
    repo: RepoMetadata
    file_tree: Dict[str, Any]
    status: str
