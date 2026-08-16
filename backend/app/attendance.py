from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from . import models
from .auth import require_admin
from .database import get_db


router = APIRouter(
    prefix="/attendance",
    tags=["Attendance"],
)


ALLOWED_RECORD_TYPES = {
    "Tardiness",
    "Permission",
    "Absence",
    "Early Leave",
    "Schedule Exception",
    "Other",
}


class AttendanceCreate(BaseModel):
    agent_id: int
    record_type: str
    date: date
    minutes: int | None = None
    reference: str | None = None
    note: str


def serialize_record(
    record: models.AttendanceRecord,
):
    return {
        "id": record.id,
        "agent_id": record.agent_id,
        "agent_name": (
            f"{record.agent.first_name} "
            f"{record.agent.last_name}"
        ),
        "record_type": record.record_type,
        "date": record.date,
        "minutes": record.minutes,
        "reference": record.reference,
        "note": record.note,
        "created_by_admin_id":
            record.created_by_admin_id,
        "created_by_admin": (
            f"{record.created_by_admin.first_name} "
            f"{record.created_by_admin.last_name}"
        ),
        "created_at": record.created_at,
        "updated_at": record.updated_at,
    }


# =========================================================
# CREATE ATTENDANCE RECORD
# =========================================================

@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
)
def create_attendance_record(
    attendance: AttendanceCreate,
    current_admin=Depends(require_admin),
    db: Session = Depends(get_db),
):
    if (
        attendance.record_type
        not in ALLOWED_RECORD_TYPES
    ):
        raise HTTPException(
            status_code=400,
            detail="Invalid attendance record type",
        )

    if (
        attendance.minutes is not None
        and attendance.minutes < 0
    ):
        raise HTTPException(
            status_code=400,
            detail="Minutes cannot be negative",
        )

    if not attendance.note.strip():
        raise HTTPException(
            status_code=400,
            detail="Note is required",
        )

    agent = (
        db.query(models.Agent)
        .filter(
            models.Agent.id
            == attendance.agent_id
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

    record = models.AttendanceRecord(
        agent_id=agent.id,
        record_type=attendance.record_type,
        date=attendance.date,
        minutes=attendance.minutes,
        reference=(
            attendance.reference.strip()
            if attendance.reference
            else None
        ),
        note=attendance.note.strip(),
        created_by_admin_id=admin.id,
    )

    db.add(record)
    db.commit()
    db.refresh(record)

    return {
        "message":
            "Attendance record created successfully",
        "record":
            serialize_record(record),
    }


# =========================================================
# GET ALL ATTENDANCE RECORDS
# =========================================================

@router.get("")
def get_attendance_records(
    current_admin=Depends(require_admin),
    db: Session = Depends(get_db),
):
    records = (
        db.query(models.AttendanceRecord)
        .order_by(
            models.AttendanceRecord.date.desc(),
            models.AttendanceRecord
            .created_at.desc(),
        )
        .all()
    )

    return {
        "total": len(records),
        "records": [
            serialize_record(record)
            for record in records
        ],
    }


# =========================================================
# GET AGENT ATTENDANCE
# =========================================================

@router.get("/agent/{agent_id}")
def get_agent_attendance(
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
        db.query(models.AttendanceRecord)
        .filter(
            models.AttendanceRecord.agent_id
            == agent_id
        )
        .order_by(
            models.AttendanceRecord.date.desc(),
            models.AttendanceRecord
            .created_at.desc(),
        )
        .all()
    )

    tardiness_count = sum(
        1
        for record in records
        if record.record_type == "Tardiness"
    )

    permission_count = sum(
        1
        for record in records
        if record.record_type == "Permission"
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
            "tardiness": tardiness_count,
            "permissions": permission_count,
            "total": len(records),
        },
        "records": [
            serialize_record(record)
            for record in records
        ],
    }


# =========================================================
# DELETE ATTENDANCE RECORD
# =========================================================

@router.delete("/{record_id}")
def delete_attendance_record(
    record_id: int,
    current_admin=Depends(require_admin),
    db: Session = Depends(get_db),
):
    record = (
        db.query(models.AttendanceRecord)
        .filter(
            models.AttendanceRecord.id
            == record_id
        )
        .first()
    )

    if not record:
        raise HTTPException(
            status_code=404,
            detail="Attendance record not found",
        )

    db.delete(record)
    db.commit()

    return {
        "message":
            "Attendance record deleted successfully",
        "record_id":
            record_id,
    }