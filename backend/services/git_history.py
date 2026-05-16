from git import Repo
from datetime import datetime
import re

def parse_git_history(repo_path: str):
    try:
        repo = Repo(repo_path)
    except Exception:
        return {"commits": [], "commit_frequency": [], "author_stats": {}}
        
    commits = []
    author_stats = {}
    weekly_stats = {}
    
    # Bug keywords
    bug_pattern = re.compile(r'\b(fix|bug|revert|patch|hotfix)\b', re.IGNORECASE)
    
    try:
        # Get up to 50 commits to build solid stats
        # Try different ways to iterate commits if HEAD fails
        try:
            all_commits = list(repo.iter_commits(max_count=50))
        except Exception:
            try:
                all_commits = list(repo.iter_commits('HEAD', max_count=50))
            except Exception:
                try:
                    # Try main or master if HEAD is problematic
                    all_commits = list(repo.iter_commits('main', max_count=50))
                except Exception:
                    all_commits = list(repo.iter_commits('master', max_count=50))
    except Exception as e:
        print(f"Error iterating commits: {e}")
        all_commits = []
        
    for commit in all_commits:
        author = commit.author.name or "Unknown"
        date_obj = datetime.fromtimestamp(commit.committed_date)
        date_str = date_obj.isoformat() + "Z"
        week_str = f"{date_obj.year}-W{date_obj.isocalendar()[1]:02d}"
        
        message = commit.message.strip()
        is_bug_fix = bool(bug_pattern.search(message))
        
        # Stats
        stats = commit.stats.total
        files_changed = stats.get('files', 0)
        insertions = stats.get('insertions', 0)
        deletions = stats.get('deletions', 0)
        
        # Author stats
        if author not in author_stats:
            author_stats[author] = 0
        author_stats[author] += insertions + deletions
        
        # Weekly stats
        if week_str not in weekly_stats:
            weekly_stats[week_str] = {"commits": 0, "bugFixes": 0}
        weekly_stats[week_str]["commits"] += 1
        if is_bug_fix:
            weekly_stats[week_str]["bugFixes"] += 1
            
        risk_introduced = min(100, int((insertions + deletions) / 10) + (20 if is_bug_fix else 0))
        
        commit_data = {
            "hash": commit.hexsha,
            "short_hash": commit.hexsha[:7],
            "author": author,
            "date": date_str,
            "message": message,
            "files_changed": files_changed,
            "insertions": insertions,
            "deletions": deletions,
            "is_bug_fix": is_bug_fix,
            "risk_introduced": risk_introduced,
            "diff": None,
            "commit_obj": commit # keep for diff extraction later
        }
        commits.append(commit_data)
        
    # Process only top 20 for returning
    top_20 = commits[:20]
    
    # Sort by risk to find top 5 risky commits to extract diffs
    top_risky = sorted(top_20, key=lambda c: c["risk_introduced"], reverse=True)[:5]
    risky_hashes = {c["hash"] for c in top_risky}
    
    for c in top_20:
        if c["hash"] in risky_hashes:
            try:
                if c["commit_obj"].parents:
                    diff_str = repo.git.diff(c["commit_obj"].parents[0], c["commit_obj"])
                else:
                    diff_str = repo.git.show(c["commit_obj"].hexsha)
                # Trim huge diffs
                c["diff"] = diff_str[:2000] + ("..." if len(diff_str) > 2000 else "")
            except Exception:
                c["diff"] = "Diff extraction failed"
        del c["commit_obj"] # remove non-serializable object
        
    freq_list = [{"week": w, "commits": d["commits"], "bugFixes": d["bugFixes"]} for w, d in weekly_stats.items()]
    # Sort chronological
    freq_list.sort(key=lambda x: x["week"])
    
    return {
        "commits": top_20,
        "commit_frequency": freq_list,
        "author_stats": author_stats
    }
