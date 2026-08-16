from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from . import models
from .auth import require_admin
from .database import get_db


router = APIRouter(
    prefix="/timeoff",
    tags=["Time Off"],
)


ALLOWED_LEAVE_TYPES = {
    "Vacation",
    "Sick Leave",
    "Personal Leave",
    "Unpaid Leave",
    "Other",
}


class TimeOffCreate(BaseModel):
    agent_id: int
    start_date: date
    end_date: date
    leave_type: str
    reference: str | None = "Bamboo HR"
    note: str | None = None


def calculate_total_days(
    start_date: date,
    end_date: date,
) -> float:
    if end_date < start_date:
        raise HTTPException(
            status_code=400,
            detail="End date cannot be earlier than start date",
        )

    difference = end_date - start_date

    # Inclusive count:
    # Aug 15 to Aug 15 = 1 day
    # Aug 15 to Aug 17 = 3 days
    return float(difference.days + 1)


def serialize_timeoff(
    record: models.TimeOffRecord,
):
    return {
        "id": record.id,
        "agent_id": record.agent_id,
        "agent_name": (
            f"{record.agent.first_name} "
            f"{record.agent.last_name}"
        ),
        "start_date": record.start_date,
        "end_date": record.end_date,
        "total_days": float(record.total_days),
        "leave_type": record.leave_type,
        "reference": record.reference,
        "note": record.note,
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
def create_timeoff_record(
    timeoff: TimeOffCreate,
    current_admin=Depends(require_admin),
    db: Session = Depends(get_db),
):
    if timeoff.leave_type not in ALLOWED_LEAVE_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Invalid leave type",
        )

    agent = (
        db.query(models.Agent)
        .filter(
            models.Agent.id == timeoff.agent_id
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
            detail="Invalid administrator authentication",
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

    total_days = calculate_total_days(
        timeoff.start_date,
        timeoff.end_date,
    )

    record = models.TimeOffRecord(
        agent_id=agent.id,
        start_date=timeoff.start_date,
        end_date=timeoff.end_date,
        total_days=total_days,
        leave_type=timeoff.leave_type,
        reference=(
            timeoff.reference.strip()
            if timeoff.reference
            else None
        ),
        note=(
            timeoff.note.strip()
            if timeoff.note
            else None
        ),
        created_by_admin_id=admin.id,
    )

    db.add(record)
    db.commit()
    db.refresh(record)

    return {
        "message": "Time off record created successfully",
        "record": serialize_timeoff(record),
    }


@router.get("")
def get_timeoff_records(
    current_admin=Depends(require_admin),
    db: Session = Depends(get_db),
):
    records = (
        db.query(models.TimeOffRecord)
        .order_by(
            models.TimeOffRecord.start_date.desc(),
            models.TimeOffRecord.created_at.desc(),
        )
        .all()
    )

    return {
        "total": len(records),
        "records": [
            serialize_timeoff(record)
            for record in records
        ],
    }


@router.get("/agent/{agent_id}")
def get_agent_timeoff(
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
        db.query(models.TimeOffRecord)
        .filter(
            models.TimeOffRecord.agent_id
            == agent_id
        )
        .order_by(
            models.TimeOffRecord.start_date.desc(),
            models.TimeOffRecord.created_at.desc(),
        )
        .all()
    )

    total_days = sum(
        float(record.total_days)
        for record in records
    )

    vacation_days = sum(
        float(record.total_days)
        for record in records
        if record.leave_type == "Vacation"
    )

    sick_days = sum(
        float(record.total_days)
        for record in records
        if record.leave_type == "Sick Leave"
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
            "total_records": len(records),
            "total_days": total_days,
            "vacation_days": vacation_days,
            "sick_days": sick_days,
        },
        "records": [
            serialize_timeoff(record)
            for record in records
        ],
    }