from pydantic import BaseModel
from typing import List, Dict, Optional

class GitCommit(BaseModel):
    hash: str
    short_hash: str
    author: str
    date: str
    message: str
    files_changed: int
    insertions: int
    deletions: int
    is_bug_fix: bool
    risk_introduced: int
    diff: Optional[str] = None

class CommitFrequency(BaseModel):
    week: str
    commits: int
    bugFixes: int

class GitHistoryResponse(BaseModel):
    commits: List[GitCommit]
    commit_frequency: List[CommitFrequency]
    author_stats: Dict[str, int]
