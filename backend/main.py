import os
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import scan, analysis, chat

# Load environment variables from the root .env file
load_dotenv(os.path.join(os.path.dirname(__file__), "../.env"))

app = FastAPI(title="RepoMind AI API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(scan.router)
app.include_router(analysis.router)
app.include_router(chat.router)

@app.get("/health")
def health(): 
    return {"status": "ok", "ibm_bob": "active"}
