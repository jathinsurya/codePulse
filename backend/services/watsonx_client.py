import requests
import os

MODEL_ID = os.getenv("WATSONX_MODEL_ID", "meta-llama/llama-3-3-70b-instruct")

def get_iam_token(api_key: str) -> str:
    print(f"[WatsonX] Fetching IAM token for key (len={len(api_key)})...")
    resp = requests.post(
        "https://iam.cloud.ibm.com/identity/token",
        data={
            "grant_type": "urn:ibm:params:oauth:grant-type:apikey",
            "apikey": api_key
        },
        headers={
            "Content-Type": "application/x-www-form-urlencoded",
            "Accept": "application/json"
        },
        timeout=15
    )
    if resp.status_code != 200:
        print(f"[WatsonX] IAM Token Error ({resp.status_code}): {resp.text}")
    resp.raise_for_status()
    return resp.json()["access_token"]

def chat_with_granite(prompt: str, context: str) -> str:
    # Force reload .env on every request to ensure we aren't using stale IDs
    env_path = os.path.join(os.path.dirname(__file__), "../../.env")
    from dotenv import load_dotenv
    load_dotenv(env_path, override=True)

    # Read environment variables dynamically
    api_key = os.getenv("WATSONX_API_KEY", "").strip()
    project_id = os.getenv("WATSONX_PROJECT_ID", "").strip()
    region = os.getenv("WATSONX_REGION", "us-south").strip()
    url = f"https://{region}.ml.cloud.ibm.com"

    print(f"[WatsonX] Using Model: {MODEL_ID}")
    print(f"[WatsonX] Using Region: {region}, URL: {url}")
    print(f"[WatsonX] Using Project ID: {project_id}")

    if not api_key or api_key == "your_api_key_here":
        return "Mock Response: I found some interesting context. Please set WATSONX_API_KEY in your .env file to enable live AI chat."

    try:
        print("[WatsonX] Requesting IAM token...")
        token = get_iam_token(api_key)
        print("[WatsonX] IAM token received successfully.")

        system_msg = (
            "You are CodePulse AI, an expert code analyst. "
            "The user is currently looking at the dashboard. "
            "Use the provided code context to answer technical questions accurately. "
            "If the user asks about the UI (like the MRI Scan or Heatmap), use your knowledge that you are part of the CodePulse platform. "
            "Be specific, cite file names and line numbers when possible.\n\n"
            f"CODE CONTEXT:\n{context}"
        )

        payload = {
            "model_id": MODEL_ID,
            "project_id": project_id,
            "messages": [
                {"role": "system", "content": system_msg},
                {"role": "user", "content": prompt}
            ],
            "parameters": {
                "max_new_tokens": 600,
                "temperature": 0.3
            }
        }

        print(f"[WatsonX] Sending request to {url}...")
        resp = requests.post(
            f"{url}/ml/v1/text/chat?version=2024-03-13",
            json=payload,
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json"
            },
            timeout=30
        )

        # Print full response for debugging
        print(f"[WatsonX] Response Status: {resp.status_code}")
        if resp.status_code != 200:
            print(f"[WatsonX] Error Details: {resp.text}")
            return f"IBM WatsonX Error ({resp.status_code}): {resp.text[:200]}..."

        data = resp.json()
        choices = data.get("choices", [])
        if choices:
            return choices[0].get("message", {}).get("content", "No response from model.")

        return "Received an unexpected response format from IBM WatsonX."

    except Exception as e:
        import traceback
        print(f"[WatsonX] Exception: {str(e)}")
        traceback.print_exc()
        return f"System Error: {str(e)}"
