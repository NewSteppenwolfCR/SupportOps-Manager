from datetime import date as Date

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from . import models
from .auth import require_admin
from .database import get_db


router = APIRouter(
    prefix="/followups",
    tags=["Follow-ups"],
)


ALLOWED_CATEGORIES = {
    "Coaching",
    "Performance",
    "Quality",
    "Attendance",
    "Behavior",
    "Commitment",
    "General",
}


ALLOWED_STATUSES = {
    "Open",
    "Completed",
    "Cancelled",
}


class FollowUpCreate(BaseModel):
    agent_id: int
    category: str
    date: Date
    title: str
    note: str
    due_date: Date | None = None


class FollowUpStatusUpdate(BaseModel):
    status: str


def serialize_followup(
    record: models.FollowUpRecord,
):
    return {
        "id": record.id,
        "agent_id": record.agent_id,
        "agent_name": (
            f"{record.agent.first_name} "
            f"{record.agent.last_name}"
        ),
        "category": record.category,
        "date": record.date,
        "title": record.title,
        "note": record.note,
        "status": record.status,
        "due_date": record.due_date,
        "created_by_admin_id": (
            record.created_by_admin_id
        ),
        "created_by_admin": (
            f"{record.created_by_admin.first_name} "
            f"{record.created_by_admin.last_name}"
        ),
        "created_at": record.created_at,
        "updated_at": record.updated_at,
    }


@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
)
def create_followup(
    followup: FollowUpCreate,
    current_admin=Depends(require_admin),
    db: Session = Depends(get_db),
):
    if followup.category not in ALLOWED_CATEGORIES:
        raise HTTPException(
            status_code=400,
            detail="Invalid follow-up category",
        )

    if not followup.title.strip():
        raise HTTPException(
            status_code=400,
            detail="Title is required",
        )

    if not followup.note.strip():
        raise HTTPException(
            status_code=400,
            detail="Note is required",
        )

    agent = (
        db.query(models.Agent)
        .filter(
            models.Agent.id == followup.agent_id
        )
        .first()
    )

    if not agent:
        raise HTTPException(
            status_code=404,
            detail="Agent not found",
        )

    try:
        admin_id = int(
            current_admin["subject"]
        )
    except (TypeError, ValueError):
        raise HTTPException(
            status_code=401,
            detail=(
                "Invalid administrator "
                "authentication"
            ),
        )

    admin = (
        db.query(models.Admin)
        .filter(
            models.Admin.id == admin_id
        )
        .first()
    )

    if not admin:
        raise HTTPException(
            status_code=404,
            detail="Administrator not found",
        )

    record = models.FollowUpRecord(
        agent_id=agent.id,
        category=followup.category,
        date=followup.date,
        title=followup.title.strip(),
        note=followup.note.strip(),
        status="Open",
        due_date=followup.due_date,
        created_by_admin_id=admin.id,
    )

    db.add(record)
    db.commit()
    db.refresh(record)

    return {
        "message": (
            "Follow-up created successfully"
        ),
        "record": serialize_followup(
            record
        ),
    }


@router.get("")
def get_followups(
    current_admin=Depends(require_admin),
    db: Session = Depends(get_db),
):
    records = (
        db.query(models.FollowUpRecord)
        .order_by(
            models.FollowUpRecord.date.desc(),
            models.FollowUpRecord.created_at.desc(),
        )
        .all()
    )

    return {
        "total": len(records),
        "records": [
            serialize_followup(record)
            for record in records
        ],
    }


@router.get("/agent/{agent_id}")
def get_agent_followups(
    agent_id: int,
    current_admin=Depends(require_admin),
    db: Session = Depends(get_db),
):
    agent = (
        db.query(models.Agent)
        .filter(
            models.Agent.id == agent_id
        )
        .first()
    )

    if not agent:
        raise HTTPException(
            status_code=404,
            detail="Agent not found",
        )

    records = (
        db.query(models.FollowUpRecord)
        .filter(
            models.FollowUpRecord.agent_id
            == agent_id
        )
        .order_by(
            models.FollowUpRecord.date.desc(),
            models.FollowUpRecord.created_at.desc(),
        )
        .all()
    )

    open_count = sum(
        1
        for record in records
        if record.status == "Open"
    )

    completed_count = sum(
        1
        for record in records
        if record.status == "Completed"
    )

    cancelled_count = sum(
        1
        for record in records
        if record.status == "Cancelled"
    )

    return {
        "agent": {
            "id": agent.id,
            "name": (
                f"{agent.first_name} "
                f"{agent.last_name}"
            ),
        },
        "summary": {
            "open": open_count,
            "completed": completed_count,
            "cancelled": cancelled_count,
            "total": len(records),
        },
        "records": [
            serialize_followup(record)
            for record in records
        ],
    }


@router.patch(
    "/{followup_id}/status"
)
def update_followup_status(
    followup_id: int,
    update: FollowUpStatusUpdate,
    current_admin=Depends(require_admin),
    db: Session = Depends(get_db),
):
    if update.status not in ALLOWED_STATUSES:
        raise HTTPException(
            status_code=400,
            detail="Invalid follow-up status",
        )

    record = (
        db.query(models.FollowUpRecord)
        .filter(
            models.FollowUpRecord.id
            == followup_id
        )
        .first()
    )

    if not record:
        raise HTTPException(
            status_code=404,
            detail="Follow-up not found",
        )

    # A closed follow-up cannot be changed again.
    if record.status != "Open":
        raise HTTPException(
            status_code=409,
            detail=(
                "Follow-up has already "
                "been closed"
            ),
        )

    # An open record can only move to
    # Completed or Cancelled.
    if update.status == "Open":
        raise HTTPException(
            status_code=400,
            detail=(
                "Open follow-ups can only "
                "be completed or cancelled"
            ),
        )

    record.status = update.status

    db.commit()
    db.refresh(record)

    return {
        "message": (
            "Follow-up status updated "
            "successfully"
        ),
        "record": serialize_followup(
            record
        ),
    }