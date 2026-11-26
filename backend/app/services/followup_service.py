
import json

from google import genai
from google.genai import types

from app.services.gemini_service import (
    API_KEY,
    PRIMARY_MODEL,
    FALLBACK_MODEL
)


def generate_followup(lead: dict):
    """
    Generates a personalized follow-up recommendation
    using the existing Gemini configuration.
    """

    if not API_KEY:
        raise ValueError(
            "GEMINI_API_KEY is missing from the .env file"
        )

    client = genai.Client(api_key=API_KEY)

    ai_analysis = lead.get("ai_analysis", {})

    prompt = f"""
    You are an expert sales follow-up assistant.

    Generate a personalized follow-up recommendation
    for the following customer.

    Customer name: {lead.get("name", "Unknown")}
    Customer email: {lead.get("email", "Unknown")}
    Customer message: {lead.get("message", "Not provided")}
    Current lead status: {lead.get("status", "new")}

    Lead quality: {ai_analysis.get("lead_quality", "Unknown")}
    Lead priority: {ai_analysis.get("priority", "Unknown")}
    Lead category: {ai_analysis.get("category", "Unknown")}
    AI summary: {ai_analysis.get("summary", "Not available")}

    Generate:
    1. follow_up_message: A professional, friendly, personalized message the business can send.
    2. recommended_action: Next practical action.
    3. reason: Briefly explain why appropriate.
    4. suggested_timing: Reasonable timeframe.

    Rules: address by name, use original requirements, no invented promises/prices/business details, don't claim customer agreed, professional natural.
    """

    config = types.GenerateContentConfig(
        temperature=0.4,
        response_mime_type="application/json",
        response_schema={
            "type": "OBJECT",
            "properties": {
                "follow_up_message": {"type": "STRING"},
                "recommended_action": {"type": "STRING"},
                "reason": {"type": "STRING"},
                "suggested_timing": {"type": "STRING"}
            },
            "required": [
                "follow_up_message",
                "recommended_action",
                "reason",
                "suggested_timing"
            ]
        }
    )

    last_error = None

    for model in [PRIMARY_MODEL, FALLBACK_MODEL]:
        try:
            print(f"Generating follow-up using: {model}")

            response = client.models.generate_content(
                model=model,
                contents=prompt,
                config=config
            )

            return json.loads(response.text)

        except Exception as error:
            last_error = error

            status_code = (
                getattr(error, "code", None)
                or getattr(error, "status_code", None)
            )

            if status_code not in (429, 503):
                raise

            print(
                f"{model} unavailable due to quota or overload. "
                "Trying fallback model..."
            )

    raise last_error
