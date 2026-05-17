from fastapi import APIRouter, HTTPException
import os
from models.analysis_result import AnalysisResponse
from services.code_parser import parse_codebase
from services.complexity import calculate_heatmap, build_heatmap_tree
from services.dependency_graph import build_dependency_graph
from services.onboarding import generate_onboarding_data
from services.scale_simulator import compute_scale_profile
from utils.cache import get_session
import traceback

router = APIRouter()

def extract_all_routes(file_tree, current_path=""):
    routes = []
    for node in file_tree:
        node_path = f"{current_path}/{node['name']}" if current_path else f"/{node['name']}"
        if node["type"] == "folder":
            routes.extend(extract_all_routes(node["children"], node_path))
        else:
            api_routes = node.get("api_routes", [])
            for r in api_routes:
                routes.append({
                    "method": r["method"],
                    "path": r["path"],
                    "file": node_path,
                    "line": 1
                })
    return routes

@router.get("/api/analysis/{session_id}", response_model=AnalysisResponse)
def get_analysis(session_id: str):
    session_data = get_session(session_id)
    if not session_data:
        raise HTTPException(status_code=404, detail="Session not found")
        
    repo_path = session_data["repo_path"]
    try:
        file_tree_root = parse_codebase(repo_path)
        file_tree = file_tree_root["children"]
        
        heatmap_files = calculate_heatmap(file_tree)
        heatmap_tree = {"name": "root", "children": build_heatmap_tree(file_tree)}
        dependency_graph = build_dependency_graph(file_tree)
        api_routes = extract_all_routes(file_tree)
        onboarding_path, suggested_questions = generate_onboarding_data(file_tree)
        
        total_files = len(heatmap_files)
        avg_complexity = int(sum(f["complexity"] for f in heatmap_files) / total_files) if total_files else 0
        health_score = max(0, 100 - (avg_complexity // 2))
        
        # Calculate languages
        lang_map = {}
        ext_to_lang = {
            '.py': 'Python',
            '.js': 'JavaScript',
            '.ts': 'TypeScript',
            '.tsx': 'TypeScript',
            '.jsx': 'JavaScript',
            '.html': 'HTML',
            '.css': 'CSS',
            '.go': 'Go',
            '.rs': 'Rust',
            '.java': 'Java',
            '.cpp': 'C++',
            '.c': 'C'
        }
        for f in heatmap_files:
            ext = os.path.splitext(f["name"])[1].lower()
            lang = ext_to_lang.get(ext, 'Other')
            lang_map[lang] = lang_map.get(lang, 0) + 1
        
        # Convert to percentages
        total_lang = sum(lang_map.values())
        languages = {k: (v / total_lang) * 100 for k, v in lang_map.items()} if total_lang else {}

        # Compute scale simulation profile
        scale_profile = compute_scale_profile(
            heatmap_files, api_routes, dependency_graph, 
            total_files, avg_complexity, languages
        )

        return AnalysisResponse(
            health_score=health_score,
            heatmap_files=heatmap_files,
            heatmap_tree=heatmap_tree,
            directory_tree=file_tree,
            languages=languages,
            dependency_graph=dependency_graph,
            api_routes=api_routes,
            total_files=total_files,
            avg_complexity=avg_complexity,
            onboarding_path=onboarding_path,
            suggested_questions=suggested_questions,
            scale_profile=scale_profile
        )
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Internal server error during analysis")

from models.git_result import GitHistoryResponse
from services.git_history import parse_git_history

@router.get("/api/analysis/{session_id}/git-history", response_model=GitHistoryResponse)
def get_git_history(session_id: str):
    session_data = get_session(session_id)
    if not session_data:
        raise HTTPException(status_code=404, detail="Session not found")
        
    repo_path = session_data["repo_path"]
    try:
        history_data = parse_git_history(repo_path)
        return GitHistoryResponse(**history_data)
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Internal server error extracting git history")

@router.post("/api/analysis/{session_id}/embed")
def embed_repo(session_id: str):
    session_data = get_session(session_id)
    if not session_data:
        raise HTTPException(status_code=404, detail="Session not found")
    from services.embeddings import build_repo_embeddings
    build_repo_embeddings(session_id, session_data["repo_path"])
    return {"status": "success", "message": "Embeddings created"}

@router.get("/api/analysis/{session_id}/summary")
def get_repo_summary(session_id: str):
    session_data = get_session(session_id)
    if not session_data:
        raise HTTPException(status_code=404, detail="Session not found")
        
    prompt = "Provide a high-level 3-paragraph summary of this repository for onboarding a new developer. What does it do, what are the key technologies, and how is it structured?"
    from services.embeddings import retrieve_context
    from services.watsonx_client import chat_with_granite
    sources, context = retrieve_context(session_id, "architecture overview main entry point")
    
    response = chat_with_granite(prompt, context)
    return {"summary": response}
