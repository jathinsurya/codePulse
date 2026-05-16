import requests
import os

WATSONX_URL = "https://us-south.ml.cloud.ibm.com"
MODEL_ID = "ibm/granite-3-8b-instruct"

def get_iam_token(api_key: str) -> str:
    resp = requests.post(
        "https://iam.cloud.ibm.com/identity/token",
        data={
            "grant_type": "urn:ibm:params:oauth:grant-type:apikey",
            "apikey": api_key
        },
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        timeout=15
    )
    if resp.status_code != 200:
        print(f"[WatsonX] IAM Token Error: {resp.status_code} - {resp.text}")
    resp.raise_for_status()
    return resp.json()["access_token"]

def chat_with_granite(prompt: str, context: str) -> str:
    api_key = os.getenv("WATSONX_API_KEY", "").strip()
    project_id = os.getenv("WATSONX_PROJECT_ID", "").strip()

    if not api_key or api_key == "your_api_key_here":
        return "Mock Response: I found some interesting context. Please set WATSONX_API_KEY to chat."

    try:
        token = get_iam_token(api_key)

        system_msg = (
            "You are RepoMind AI, an expert code analyst. "
            "Answer the user's question using ONLY the code context below. "
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

        resp = requests.post(
            f"{WATSONX_URL}/ml/v1/text/chat?version=2024-03-13",
            json=payload,
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json"
            },
            timeout=30
        )

        # Print full response for debugging
        print(f"[WatsonX] Status: {resp.status_code}")
        if resp.status_code != 200:
            print(f"[WatsonX] Error body: {resp.text}")
            return f"IBM Granite returned an error ({resp.status_code}). Check the backend terminal for details."

        data = resp.json()

        # WatsonX chat endpoint returns choices[].message.content
        choices = data.get("choices", [])
        if choices:
            return choices[0].get("message", {}).get("content", "No response from model.")

        # Fallback: try results[] path (text generation endpoint format)
        results = data.get("results", [])
        if results:
            return results[0].get("generated_text", "No response from model.")

        print(f"[WatsonX] Unexpected response shape: {data}")
        return "Received an unexpected response format from IBM Granite."

    except requests.exceptions.HTTPError as e:
        print(f"[WatsonX] HTTP Error: {e}")
        if e.response is not None:
            print(f"[WatsonX] Response body: {e.response.text}")
        return "HTTP error communicating with IBM Granite. Check backend logs."
    except requests.exceptions.RequestException as e:
        print(f"[WatsonX] Request failed: {e}")
        return "Network error communicating with IBM Granite."
    except Exception as e:
        print(f"[WatsonX] Unexpected error: {e}")
        return "An unexpected error occurred while calling IBM Granite."
