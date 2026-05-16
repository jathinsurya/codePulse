import os
from dotenv import load_dotenv

# Load environment variables from the root .env file at the VERY BEGINNING
load_dotenv(os.path.join(os.path.dirname(__file__), "../.env"), override=True)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import scan, analysis, chat

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
