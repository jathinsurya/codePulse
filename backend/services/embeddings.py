import os
import chromadb
from sentence_transformers import SentenceTransformer

# Initialize model and client globally to reuse
embed_model = SentenceTransformer("all-MiniLM-L6-v2")
chroma_client = chromadb.Client()

def chunk_file(path, content, chunk_size=50, overlap=10):
    lines = content.split("\n")
    chunks = []
    for i in range(0, len(lines), chunk_size - overlap):
        chunk = "\n".join(lines[i:i+chunk_size])
        if chunk.strip():
            chunks.append({
                "text": chunk,
                "file": path,
                "start_line": i + 1,
                "end_line": min(i+chunk_size, len(lines))
            })
    return chunks

def build_repo_embeddings(session_id: str, repo_path: str):
    collection = chroma_client.create_collection(name=session_id)
    
    skip_dirs = {'node_modules', '.git', '__pycache__', 'dist', 'build'}
    valid_exts = {'.py', '.js', '.ts', '.jsx', '.tsx', '.md'}
    
    all_chunks = []
    
    for root, dirs, files in os.walk(repo_path):
        dirs[:] = [d for d in dirs if d not in skip_dirs]
        for file in files:
            ext = os.path.splitext(file)[1].lower()
            if ext not in valid_exts:
                continue
            
            full_path = os.path.join(root, file)
            rel_path = os.path.relpath(full_path, repo_path)
            
            try:
                with open(full_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                chunks = chunk_file(rel_path, content)
                all_chunks.extend(chunks)
            except Exception:
                pass
                
    if not all_chunks:
        return
        
    texts = [c["text"] for c in all_chunks]
    metadatas = [{"file": c["file"], "start_line": c["start_line"], "end_line": c["end_line"]} for c in all_chunks]
    ids = [f"{c['file']}_{c['start_line']}" for c in all_chunks]
    
    embeddings = embed_model.encode(texts).tolist()
    
    batch_size = 100
    for i in range(0, len(texts), batch_size):
        collection.add(
            embeddings=embeddings[i:i+batch_size],
            documents=texts[i:i+batch_size],
            metadatas=metadatas[i:i+batch_size],
            ids=ids[i:i+batch_size]
        )

def retrieve_context(session_id: str, query: str, top_k=5):
    try:
        collection = chroma_client.get_collection(name=session_id)
    except Exception:
        return [], ""
        
    query_embedding = embed_model.encode([query]).tolist()
    
    results = collection.query(
        query_embeddings=query_embedding,
        n_results=top_k
    )
    
    if not results['documents'] or not results['documents'][0]:
        return [], ""
        
    docs = results['documents'][0]
    metas = results['metadatas'][0]
    
    context_str = ""
    sources = []
    
    for i, (doc, meta) in enumerate(zip(docs, metas)):
        file_path = meta['file']
        start_line = meta['start_line']
        end_line = meta['end_line']
        
        context_str += f"\n--- File: {file_path} (Lines {start_line}-{end_line}) ---\n"
        context_str += doc + "\n"
        
        sources.append({
            "file": file_path,
            "lines": f"{start_line}-{end_line}"
        })
        
    return sources, context_str
