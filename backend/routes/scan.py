from fastapi import APIRouter, HTTPException, BackgroundTasks
from models.scan_result import ScanRequest, ScanResponse
from services.repo_ingestion import ingest_repository
from services.code_parser import parse_codebase
import traceback
from utils.cache import get_session, set_session

router = APIRouter()

def _embed_in_background(session_id: str, repo_path: str):
    """Run embedding asynchronously after scan returns."""
    try:
        from services.embeddings import build_repo_embeddings
        build_repo_embeddings(session_id, repo_path)
        set_session(session_id, {"repo_path": repo_path, "embedded": True})
        print(f"[Embeddings] ✅ Session {session_id} embedded successfully.")
    except Exception as e:
        print(f"[Embeddings] ⚠️ Failed for session {session_id}: {e}")

@router.post("/api/scan", response_model=ScanResponse)
def scan_repository(request: ScanRequest, background_tasks: BackgroundTasks):
    try:
        # Step 1: Ingest Repo (clone + metadata)
        ingest_data = ingest_repository(request.repo_url)
        session_id = ingest_data["session_id"]
        repo_metadata = ingest_data["repo"]
        repo_path = ingest_data["repo_path"]

        # Step 2: Parse Codebase (file tree)
        file_tree = parse_codebase(repo_path)

        # Step 3: Embed in background — don't block the response!
        background_tasks.add_task(_embed_in_background, session_id, repo_path)

        return ScanResponse(
            session_id=session_id,
            repo=repo_metadata,
            file_tree=file_tree,
            status="scan_complete"
        )
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Scan error: {str(e)}")

@router.get("/api/scan/{session_id}/status")
def get_scan_status(session_id: str):
    session_data = get_session(session_id)
    if session_data:
        embedded = session_data.get("embedded", False)
        return {
            "session_id": session_id,
            "status": "scan_complete",
            "progress": 100,
            "ai_ready": embedded   # frontend can check this
        }
    else:
        return {"session_id": session_id, "status": "scanning", "progress": 50, "ai_ready": False}
