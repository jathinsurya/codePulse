from fastapi import APIRouter, HTTPException
from models.chat_result import ChatRequest, ChatResponse
from services.embeddings import retrieve_context
from services.watsonx_client import chat_with_granite

router = APIRouter()

@router.post("/api/chat", response_model=ChatResponse)
def handle_chat(request: ChatRequest):
    # 1. Retrieve RAG context
    sources, context = retrieve_context(request.session_id, request.message)
    
    if not context:
        context = "No direct codebase context found for this query."
        sources = []
        
    # 2. Add active tab context
    prompt = request.message
    if request.active_tab:
        prompt = f"[User is currently viewing the {request.active_tab} tab] {prompt}"
        
    # 3. Ask WatsonX
    response_text = chat_with_granite(prompt, context)
    
    return ChatResponse(
        response=response_text,
        sources=sources,
        model="meta-llama/llama-3-3-70b-instruct"
    )
