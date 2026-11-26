
from uuid import uuid4
from datetime import datetime, timezone

from app.database.connection import leads_collection


def save_lead(lead_data: dict):
    """Saves a lead document into MongoDB."""

    lead_data["created_at"] = datetime.now(timezone.utc)

    result = leads_collection.insert_one(lead_data)

    saved_lead = leads_collection.find_one(
        {"_id": result.inserted_id}
    )

    saved_lead["_id"] = str(saved_lead["_id"])

    return saved_lead


def get_all_leads():
    """Retrieves all leads, newest first."""

    leads = list(
        leads_collection.find().sort("created_at", -1)
    )

    for lead in leads:
        lead["_id"] = str(lead["_id"])

    return leads


def update_lead_status(lead_id: str, new_status: str):
    """Updates the status of an existing lead."""

    updated_lead = leads_collection.find_one_and_update(
        {"lead_id": lead_id},
        {
            "$set": {
                "status": new_status,
                "updated_at": datetime.now(timezone.utc)
            }
        },
        return_document=True
    )

    if updated_lead:
        updated_lead["_id"] = str(updated_lead["_id"])

    return updated_lead


def get_lead_by_id(lead_id: str):
    """Retrieves one lead using its unique ID."""

    lead = leads_collection.find_one(
        {"lead_id": lead_id}
    )

    if lead:
        lead["_id"] = str(lead["_id"])

    return lead


def delete_lead(lead_id: str):
    """Deletes a lead using its unique ID."""

    result = leads_collection.delete_one(
        {"lead_id": lead_id}
    )

    return result.deleted_count > 0


def filter_leads(status=None, priority=None, quality=None):
    """Filters leads using status, AI priority and AI quality."""

    filters = {}

    if status:
        filters["status"] = status

    if priority:
        filters["ai_analysis.priority"] = priority

    if quality:
        filters["ai_analysis.lead_quality"] = quality

    leads = list(
        leads_collection.find(filters).sort("created_at", -1)
    )

    for lead in leads:
        lead["_id"] = str(lead["_id"])

    return leads


def save_followup(lead_id: str, followup_data: dict):
    """Save a new follow-up recommendation for a lead."""

    followup = {
        "followup_id": str(uuid4()),
        "lead_id": lead_id,
        **followup_data,
        "status": "pending",
        "created_at": datetime.now(timezone.utc),
        "completed_at": None
    }

    result = leads_collection.update_one(
        {"lead_id": lead_id},
        {
            "$push": {
                "followups": followup
            }
        }
    )

    if result.matched_count == 0:
        return None

    return followup


def get_lead_followups(lead_id: str):
    """Retrieve all follow-ups belonging to a lead."""

    lead = leads_collection.find_one(
        {"lead_id": lead_id},
        {"followups": 1, "_id": 0}
    )

    if lead is None:
        return None

    return lead.get("followups", [])


def update_followup_status(
    lead_id: str,
    followup_id: str,
    new_status: str
):
    """Update a follow-up's tracking status."""

    completed_at = (
        datetime.now(timezone.utc)
        if new_status == "completed"
        else None
    )

    result = leads_collection.update_one(
        {
            "lead_id": lead_id,
            "followups.followup_id": followup_id
        },
        {
            "$set": {
                "followups.$.status": new_status,
                "followups.$.completed_at": completed_at
            }
        }
    )

    if result.matched_count == 0:
        return None

    lead = leads_collection.find_one(
        {"lead_id": lead_id},
        {"followups": 1, "_id": 0}
    )

    return next(
        (
            followup
            for followup in lead.get("followups", [])
            if followup["followup_id"] == followup_id
        ),
        None
    )
