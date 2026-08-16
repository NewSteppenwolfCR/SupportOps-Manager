from datetime import datetime

from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    Date,
    Time,
    Numeric,
    ForeignKey,
    DateTime,
)

from sqlalchemy.orm import relationship

from .database import Base


# =========================================================
# AGENTS
# =========================================================

class Agent(Base):
    __tablename__ = "agents"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    first_name = Column(
        String,
        nullable=False,
    )

    last_name = Column(
        String,
        nullable=False,
    )

    email = Column(
        String,
        unique=True,
        nullable=False,
        index=True,
    )

    schedule = Column(
        String,
        nullable=False,
    )

    status = Column(
        String,
        nullable=False,
        default="Active",
    )

    access_code_hash = Column(
        String,
        nullable=True,
    )

    overtime_requests = relationship(
        "OvertimeRequest",
        back_populates="agent",
    )

    attendance_records = relationship(
        "AttendanceRecord",
        back_populates="agent",
    )

    follow_up_records = relationship(
        "FollowUpRecord",
        back_populates="agent",
    )

    time_off_records = relationship(
        "TimeOffRecord",
        back_populates="agent",
    )

    report_records = relationship(
        "ReportRecord",
        back_populates="agent",
    )


# =========================================================
# ADMINS
# =========================================================

class Admin(Base):
    __tablename__ = "admins"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    first_name = Column(
        String,
        nullable=False,
    )

    last_name = Column(
        String,
        nullable=False,
    )

    email = Column(
        String,
        unique=True,
        nullable=False,
        index=True,
    )

    password_hash = Column(
        String,
        nullable=False,
    )

    status = Column(
        String,
        nullable=False,
        default="Active",
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    attendance_records = relationship(
        "AttendanceRecord",
        back_populates="created_by_admin",
    )

    follow_up_records = relationship(
        "FollowUpRecord",
        back_populates="created_by_admin",
    )

    time_off_records = relationship(
        "TimeOffRecord",
        back_populates="created_by_admin",
    )

    report_records = relationship(
        "ReportRecord",
        back_populates="created_by_admin",
    )


# =========================================================
# OVERTIME REQUESTS
# =========================================================

class OvertimeRequest(Base):
    __tablename__ = "overtime_requests"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    agent_id = Column(
        Integer,
        ForeignKey("agents.id"),
        nullable=False,
        index=True,
    )

    date = Column(
        Date,
        nullable=False,
    )

    start_time = Column(
        Time,
        nullable=False,
    )

    end_time = Column(
        Time,
        nullable=False,
    )

    total_hours = Column(
        Numeric(5, 2),
        nullable=False,
    )

    justification = Column(
        String,
        nullable=False,
    )

    status = Column(
        String,
        nullable=False,
        default="Pending",
    )

    admin_comment = Column(
        String,
        nullable=True,
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    agent = relationship(
        "Agent",
        back_populates="overtime_requests",
    )


# =========================================================
# ATTENDANCE RECORDS
# =========================================================

class AttendanceRecord(Base):
    __tablename__ = "attendance_records"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    agent_id = Column(
        Integer,
        ForeignKey("agents.id"),
        nullable=False,
        index=True,
    )

    record_type = Column(
        String,
        nullable=False,
    )

    date = Column(
        Date,
        nullable=False,
    )

    minutes = Column(
        Integer,
        nullable=True,
    )

    reference = Column(
        String,
        nullable=True,
    )

    note = Column(
        String,
        nullable=False,
    )

    created_by_admin_id = Column(
        Integer,
        ForeignKey("admins.id"),
        nullable=False,
        index=True,
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )

    agent = relationship(
        "Agent",
        back_populates="attendance_records",
    )

    created_by_admin = relationship(
        "Admin",
        back_populates="attendance_records",
    )


# =========================================================
# FOLLOW-UP RECORDS
# =========================================================

class FollowUpRecord(Base):
    __tablename__ = "follow_up_records"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    agent_id = Column(
        Integer,
        ForeignKey("agents.id"),
        nullable=False,
        index=True,
    )

    category = Column(
        String,
        nullable=False,
    )

    date = Column(
        Date,
        nullable=False,
    )

    title = Column(
        String,
        nullable=False,
    )

    note = Column(
        String,
        nullable=False,
    )

    status = Column(
        String,
        nullable=False,
        default="Open",
    )

    due_date = Column(
        Date,
        nullable=True,
    )

    created_by_admin_id = Column(
        Integer,
        ForeignKey("admins.id"),
        nullable=False,
        index=True,
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )

    agent = relationship(
        "Agent",
        back_populates="follow_up_records",
    )

    created_by_admin = relationship(
        "Admin",
        back_populates="follow_up_records",
    )


# =========================================================
# TIME OFF RECORDS
# =========================================================

class TimeOffRecord(Base):
    __tablename__ = "time_off_records"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    agent_id = Column(
        Integer,
        ForeignKey("agents.id"),
        nullable=False,
        index=True,
    )

    start_date = Column(
        Date,
        nullable=False,
    )

    end_date = Column(
        Date,
        nullable=False,
    )

    total_days = Column(
        Numeric(5, 2),
        nullable=False,
    )

    leave_type = Column(
        String,
        nullable=False,
    )

    reference = Column(
        String,
        nullable=True,
        default="Bamboo HR",
    )

    note = Column(
        String,
        nullable=True,
    )

    created_by_admin_id = Column(
        Integer,
        ForeignKey("admins.id"),
        nullable=False,
        index=True,
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )

    agent = relationship(
        "Agent",
        back_populates="time_off_records",
    )

    created_by_admin = relationship(
        "Admin",
        back_populates="time_off_records",
    )


# =========================================================
# REPORT RECORDS
# =========================================================

class ReportRecord(Base):
    __tablename__ = "report_records"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    agent_id = Column(
        Integer,
        ForeignKey("agents.id"),
        nullable=False,
        index=True,
    )

    category = Column(
        String,
        nullable=False,
    )

    date = Column(
        Date,
        nullable=False,
    )

    title = Column(
        String,
        nullable=False,
    )

    note = Column(
        Text,
        nullable=True,
    )

    created_by_admin_id = Column(
        Integer,
        ForeignKey("admins.id"),
        nullable=False,
        index=True,
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )

    agent = relationship(
        "Agent",
        back_populates="report_records",
    )

    created_by_admin = relationship(
        "Admin",
        back_populates="report_records",
    )

    attachments = relationship(
        "ReportAttachment",
        back_populates="report",
        cascade="all, delete-orphan",
    )


# =========================================================
# REPORT ATTACHMENTS
# =========================================================

class ReportAttachment(Base):
    __tablename__ = "report_attachments"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    report_id = Column(
        Integer,
        ForeignKey("report_records.id"),
        nullable=False,
        index=True,
    )

    original_filename = Column(
        String,
        nullable=False,
    )

    stored_filename = Column(
        String,
        nullable=False,
        unique=True,
    )

    mime_type = Column(
        String,
        nullable=False,
    )

    file_size = Column(
        Integer,
        nullable=False,
    )

    storage_path = Column(
        String,
        nullable=False,
    )

    uploaded_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    report = relationship(
        "ReportRecord",
        back_populates="attachments",
    )