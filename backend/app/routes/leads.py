
from fastapi import APIRouter, status, HTTPException
from pydantic import BaseModel
from typing import Literal
from uuid import uuid4

from app.models.lead import LeadCreate
from app.services.gemini_service import analyze_lead
from app.services.followup_service import generate_followup

from app.database.operations import (
    save_lead,
    get_all_leads,
    update_lead_status,
    get_lead_by_id,
    delete_lead,
    filter_leads,
    save_followup,
    get_lead_followups,
    update_followup_status
)


router = APIRouter(
    prefix="/leads",
    tags=["Leads"]
)


class LeadStatusUpdate(BaseModel):
    status: Literal[
        "new",
        "contacted",
        "qualified",
        "converted",
        "lost"
    ]


class FollowupStatusUpdate(BaseModel):
    status: Literal["pending", "completed"]


# Create a new lead
@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_lead(lead: LeadCreate):

    lead_id = str(uuid4())

    try:
        ai_analysis = analyze_lead(
            name=lead.name,
            email=str(lead.email),
            message=lead.message
        )

    except Exception as error:
        raise HTTPException(
            status_code=502,
            detail=f"AI lead analysis failed: {str(error)}"
        )

    lead_data = {
        "lead_id": lead_id,
        "name": lead.name,
        "email": str(lead.email),
        "message": lead.message,
        "status": "new",
        "ai_analysis": ai_analysis
    }

    try:
        saved_lead = save_lead(lead_data)

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to save lead: {str(error)}"
        )

    return {
        "message": "Lead submitted, analyzed and saved successfully!",
        "lead": saved_lead
    }


# Retrieve all saved leads
@router.get("/")
async def retrieve_leads():

    try:
        leads = get_all_leads()

        return {
            "total_leads": len(leads),
            "leads": leads
        }

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve leads: {str(error)}"
        )


# Filter leads by status, AI priority or AI quality
@router.get("/filter")
async def search_leads(
    status: Literal[
        "new",
        "contacted",
        "qualified",
        "converted",
        "lost"
    ] | None = None,
    priority: Literal["High", "Medium", "Low"] | None = None,
    quality: Literal["High", "Medium", "Low"] | None = None
):

    try:
        leads = filter_leads(
            status=status,
            priority=priority,
            quality=quality
        )

        return {
            "total_leads": len(leads),
            "filters_applied": {
                "status": status,
                "priority": priority,
                "quality": quality
            },
            "leads": leads
        }

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to filter leads: {str(error)}"
        )


# Generate and save an AI follow-up recommendation
@router.post("/{lead_id}/followups/generate")
async def create_followup_recommendation(lead_id: str):

    try:
        lead = get_lead_by_id(lead_id)

        if lead is None:
            raise HTTPException(
                status_code=404,
                detail="Lead not found"
            )

        recommendation = generate_followup(lead)

    except HTTPException:
        raise

    except Exception as error:
        raise HTTPException(
            status_code=502,
            detail=f"Failed to generate AI follow-up: {str(error)}"
        )

    try:
        saved_followup = save_followup(
            lead_id,
            recommendation
        )

        if saved_followup is None:
            raise HTTPException(
                status_code=404,
                detail="Lead not found while saving follow-up"
            )

        return {
            "message": "AI follow-up generated and saved successfully!",
            "followup": saved_followup
        }

    except HTTPException:
        raise

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to save follow-up: {str(error)}"
        )


# Retrieve follow-up history for a lead
@router.get("/{lead_id}/followups")
async def retrieve_followups(lead_id: str):

    try:
        followups = get_lead_followups(lead_id)

        if followups is None:
            raise HTTPException(
                status_code=404,
                detail="Lead not found"
            )

        return {
            "lead_id": lead_id,
            "total_followups": len(followups),
            "followups": followups
        }

    except HTTPException:
        raise

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve follow-ups: {str(error)}"
        )


# Update follow-up tracking status
@router.patch("/{lead_id}/followups/{followup_id}")
async def change_followup_status(
    lead_id: str,
    followup_id: str,
    status_update: FollowupStatusUpdate
):

    try:
        updated_followup = update_followup_status(
            lead_id,
            followup_id,
            status_update.status
        )

        if updated_followup is None:
            raise HTTPException(
                status_code=404,
                detail="Lead or follow-up not found"
            )

        return {
            "message": "Follow-up status updated successfully!",
            "followup": updated_followup
        }

    except HTTPException:
        raise

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update follow-up status: {str(error)}"
        )


# Update lead status
@router.patch("/{lead_id}/status")
async def change_lead_status(
    lead_id: str,
    status_update: LeadStatusUpdate
):

    try:
        updated_lead = update_lead_status(
            lead_id,
            status_update.status
        )

        if updated_lead is None:
            raise HTTPException(
                status_code=404,
                detail="Lead not found"
            )

        return {
            "message": "Lead status updated successfully!",
            "lead": updated_lead
        }

    except HTTPException:
        raise

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update lead status: {str(error)}"
        )


# Retrieve one lead
@router.get("/{lead_id}")
async def retrieve_single_lead(lead_id: str):

    try:
        lead = get_lead_by_id(lead_id)

        if lead is None:
            raise HTTPException(
                status_code=404,
                detail="Lead not found"
            )

        return {
            "message": "Lead retrieved successfully!",
            "lead": lead
        }

    except HTTPException:
        raise

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve lead: {str(error)}"
        )


# Delete one lead
@router.delete("/{lead_id}")
async def remove_lead(lead_id: str):

    try:
        deleted = delete_lead(lead_id)

        if not deleted:
            raise HTTPException(
                status_code=404,
                detail="Lead not found"
            )

        return {
            "message": "Lead deleted successfully!",
            "lead_id": lead_id
        }

    except HTTPException:
        raise

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete lead: {str(error)}"
        )
