
import os
import json
import time

from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("GEMINI_API_KEY")

PRIMARY_MODEL = "gemini-3.8-flash"
FALLBACK_MODEL = "gemini-3.5-flash-lite"


def analyze_lead(name: str, email: str, message: str):

    if not API_KEY:
        raise ValueError("GEMINI_API_KEY is missing from the .env file")

    client = genai.Client(api_key=API_KEY)

    prompt = f"""
    You are an expert sales lead qualification assistant.

    Analyze this potential customer:

    Name: {name}
    Email: {email}
    Message: {message}

    Determine:
    1. Lead quality: High, Medium, or Low.
    2. Priority: High, Medium, or Low.
    3. Category: Service or product they want.
    4. Summary: Short summary of requirements.
    5. Suggested action: What the business should do next.

    Only use the information provided.
    Do not invent details.
    """

    config = types.GenerateContentConfig(
        temperature=0.2,
        response_mime_type="application/json",
        response_schema={
            "type": "OBJECT",
            "properties": {
                "lead_quality": {
                    "type": "STRING",
                    "enum": ["High", "Medium", "Low"]
                },
                "priority": {
                    "type": "STRING",
                    "enum": ["High", "Medium", "Low"]
                },
                "category": {"type": "STRING"},
                "summary": {"type": "STRING"},
                "suggested_action": {"type": "STRING"}
            },
            "required": [
                "lead_quality",
                "priority",
                "category",
                "summary",
                "suggested_action"
            ]
        }
    )

    models = [PRIMARY_MODEL, FALLBACK_MODEL]
    last_error = None

    for model in models:

        for attempt in range(2):

            try:
                print(f"Trying Gemini model: {model}")

                response = client.models.generate_content(
                    model=model,
                    contents=prompt,
                    config=config
                )

                return json.loads(response.text)

            except Exception as error:

                status_code = (
                    getattr(error, "code", None)
                    or getattr(error, "status_code", None)
                )

                if status_code != 503:
                    raise

                last_error = error

                if attempt < 1:
                    wait_time = 2 ** (attempt + 1)

                    print(
                        f"Gemini overloaded. "
                        f"Retrying in {wait_time} seconds..."
                    )

                    time.sleep(wait_time)

                else:
                    print(f"{model} unavailable. Trying fallback...")

    raise last_error
