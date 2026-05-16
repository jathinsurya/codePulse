const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

async function apiFetch(url: string, options?: RequestInit) {
  const res = await fetch(url, options);
  if (!res.ok) {
    // Try to extract a FastAPI error detail message
    let detail = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      detail = body.detail || detail;
    } catch {}
    throw new Error(detail);
  }
  return res.json();
}

export async function scanRepo(repoUrl: string) {
  return apiFetch(`${BASE_URL}/api/scan`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ repo_url: repoUrl }),
  });
  // Returns: { session_id, repo, file_tree, status }
}

export async function getScanStatus(sessionId: string) {
  return apiFetch(`${BASE_URL}/api/scan/${sessionId}/status`);
  // Returns: { session_id, status, progress, ai_ready }
}

export async function getAnalysis(sessionId: string) {
  return apiFetch(`${BASE_URL}/api/analysis/${sessionId}`);
  // Returns: { health_score, heatmap, dependency_graph, api_routes }
}

export async function getGitHistory(sessionId: string) {
  return apiFetch(`${BASE_URL}/api/analysis/${sessionId}/git-history`);
  // Returns: { commits, commit_frequency, author_stats }
}

export async function getRepoSummary(sessionId: string) {
  return apiFetch(`${BASE_URL}/api/analysis/${sessionId}/summary`);
  // Returns: { summary }
}

export async function sendChat(sessionId: string, message: string, tab: string) {
  return apiFetch(`${BASE_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_id: sessionId, message, active_tab: tab }),
  });
  // Returns: { response, sources, model }
}

export async function triggerEmbed(sessionId: string) {
  return apiFetch(`${BASE_URL}/api/analysis/${sessionId}/embed`, {
    method: "POST",
  });
  // Returns: { status, message }
}
