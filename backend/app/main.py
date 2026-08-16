from datetime import datetime, date, time

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from .database import get_db
from . import models
from .security import (
    generate_access_code,
    hash_access_code,
    verify_access_code,
)
from .admin_security import verify_password
from .auth import (
    create_access_token,
    require_agent,
    require_admin,
)

from .attendance import router as attendance_router
from .followups import router as followups_router
from .timeoff import router as timeoff_router
from .reports import router as reports_router

app = FastAPI(
    
    title="SupportOps Manager API",
    description="Support Operations Management Platform",
    version="1.1.0",
)

app.include_router(attendance_router)
app.include_router(followups_router)
app.include_router(timeoff_router)
app.include_router(reports_router)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://supportops-manager.onrender.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================================================
# PYDANTIC MODELS
# =========================================================

class AgentCreate(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    schedule: str
    status: str = "Active"


class AgentAccess(BaseModel):
    access_code: str


class AdminLogin(BaseModel):
    email: EmailStr
    password: str


class OvertimeCreate(BaseModel):
    agent_id: int
    date: date
    start_time: time
    end_time: time
    justification: str


class AgentOvertimeCreate(BaseModel):
    date: date
    start_time: time
    end_time: time
    justification: str


class OvertimeDecision(BaseModel):
    admin_comment: str | None = None


# =========================================================
# ROOT
# =========================================================

@app.get("/")
def root():
    return {
        "application": "SupportOps Manager",
        "status": "running",
        "version": "1.1.0",
    }


# =========================================================
# ADMIN LOGIN - PUBLIC
# =========================================================

@app.post("/admin/login")
def admin_login(
    credentials: AdminLogin,
    db: Session = Depends(get_db),
):
    admin = (
        db.query(models.Admin)
        .filter(
            models.Admin.email
            == credentials.email.lower()
        )
        .first()
    )

    if not admin:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password",
        )

    if admin.status != "Active":
        raise HTTPException(
            status_code=403,
            detail="Administrator account is inactive",
        )

    if not verify_password(
        credentials.password,
        admin.password_hash,
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password",
        )

    token = create_access_token(
        subject=str(admin.id),
        role="admin",
    )

    return {
        "authenticated": True,
        "access_token": token,
        "token_type": "bearer",
        "admin": {
            "id": admin.id,
            "first_name": admin.first_name,
            "last_name": admin.last_name,
            "email": admin.email,
            "status": admin.status,
        },
    }


# =========================================================
# AGENTS - ADMIN ONLY
# =========================================================

@app.post(
    "/agents",
    status_code=status.HTTP_201_CREATED,
)
def create_agent(
    agent: AgentCreate,
    current_admin=Depends(require_admin),
    db: Session = Depends(get_db),
):
    existing_agent = (
        db.query(models.Agent)
        .filter(models.Agent.email == agent.email)
        .first()
    )

    if existing_agent:
        raise HTTPException(
            status_code=409,
            detail="An agent with this email already exists",
        )

    db_agent = models.Agent(
        first_name=agent.first_name,
        last_name=agent.last_name,
        email=agent.email,
        schedule=agent.schedule,
        status=agent.status,
    )

    try:
        db.add(db_agent)
        db.commit()
        db.refresh(db_agent)

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=409,
            detail="An agent with this email already exists",
        )

    return {
        "message": "Agent created successfully",
        "agent": {
            "id": db_agent.id,
            "first_name": db_agent.first_name,
            "last_name": db_agent.last_name,
            "email": db_agent.email,
            "schedule": db_agent.schedule,
            "status": db_agent.status,
        },
    }


@app.get("/agents")
def get_agents(
    current_admin=Depends(require_admin),
    db: Session = Depends(get_db),
):
    agents = db.query(models.Agent).all()

    return {
        "total": len(agents),
        "agents": [
            {
                "id": agent.id,
                "first_name": agent.first_name,
                "last_name": agent.last_name,
                "email": agent.email,
                "schedule": agent.schedule,
                "status": agent.status,
            }
            for agent in agents
        ],
    }


@app.get("/agents/{agent_id}")
def get_agent(
    agent_id: int,
    current_admin=Depends(require_admin),
    db: Session = Depends(get_db),
):
    agent = (
        db.query(models.Agent)
        .filter(models.Agent.id == agent_id)
        .first()
    )

    if not agent:
        raise HTTPException(
            status_code=404,
            detail="Agent not found",
        )

    return {
        "id": agent.id,
        "first_name": agent.first_name,
        "last_name": agent.last_name,
        "email": agent.email,
        "schedule": agent.schedule,
        "status": agent.status,
    }


# =========================================================
# AGENT ACCESS CODE - ADMIN ONLY
# =========================================================

@app.post("/agents/{agent_id}/access-code")
def create_agent_access_code(
    agent_id: int,
    current_admin=Depends(require_admin),
    db: Session = Depends(get_db),
):
    agent = (
        db.query(models.Agent)
        .filter(models.Agent.id == agent_id)
        .first()
    )

    if not agent:
        raise HTTPException(
            status_code=404,
            detail="Agent not found",
        )

    active_agents = (
        db.query(models.Agent)
        .filter(
            models.Agent.status == "Active"
        )
        .all()
    )

    access_code = None

    for _ in range(20):
        candidate = generate_access_code()

        collision = any(
            verify_access_code(
                candidate,
                existing_agent.access_code_hash,
            )
            for existing_agent in active_agents
            if (
                existing_agent.id != agent.id
                and existing_agent.access_code_hash
            )
        )

        if not collision:
            access_code = candidate
            break

    if access_code is None:
        raise HTTPException(
            status_code=500,
            detail=(
                "Could not generate "
                "a unique access code"
            ),
        )

    agent.access_code_hash = hash_access_code(
        access_code
    )

    db.commit()

    return {
        "message":
            "Access code generated successfully",
        "agent_id":
            agent.id,
        "agent_name": (
            f"{agent.first_name} "
            f"{agent.last_name}"
        ),
        "access_code":
            access_code,
    }

# =========================================================
# AGENT PORTAL LOGIN - PUBLIC
# =========================================================

@app.post("/agent-portal/login")
def agent_portal_login(
    credentials: AgentAccess,
    db: Session = Depends(get_db),
):
    agents = (
        db.query(models.Agent)
        .filter(models.Agent.status == "Active")
        .all()
    )

    for agent in agents:
        if verify_access_code(
            credentials.access_code,
            agent.access_code_hash,
        ):
            token = create_access_token(
                subject=str(agent.id),
                role="agent",
            )

            return {
                "authenticated": True,
                "access_token": token,
                "token_type": "bearer",
                "agent": {
                    "id": agent.id,
                    "first_name": agent.first_name,
                    "last_name": agent.last_name,
                    "email": agent.email,
                    "schedule": agent.schedule,
                    "status": agent.status,
                },
            }

    raise HTTPException(
        status_code=401,
        detail="Invalid access code",
    )


# =========================================================
# OVERTIME UTILITIES
# =========================================================

def calculate_overtime_hours(
    overtime_date: date,
    start_time: time,
    end_time: time,
):
    start_datetime = datetime.combine(
        overtime_date,
        start_time,
    )

    end_datetime = datetime.combine(
        overtime_date,
        end_time,
    )

    if end_datetime <= start_datetime:
        raise HTTPException(
            status_code=400,
            detail="End time must be later than start time",
        )

    duration = end_datetime - start_datetime
    total_hours = duration.total_seconds() / 3600

    return round(total_hours, 2)


# =========================================================
# AGENT OVERTIME - AGENT ONLY
# =========================================================

@app.post(
    "/agent/overtime",
    status_code=status.HTTP_201_CREATED,
)
def create_agent_overtime(
    overtime: AgentOvertimeCreate,
    current_agent=Depends(require_agent),
    db: Session = Depends(get_db),
):
    try:
        agent_id = int(current_agent["subject"])

    except (TypeError, ValueError):
        raise HTTPException(
            status_code=401,
            detail="Invalid agent authentication",
        )

    agent = (
        db.query(models.Agent)
        .filter(models.Agent.id == agent_id)
        .first()
    )

    if not agent:
        raise HTTPException(
            status_code=404,
            detail="Agent not found",
        )

    if agent.status != "Active":
        raise HTTPException(
            status_code=403,
            detail="Agent account is inactive",
        )

    total_hours = calculate_overtime_hours(
        overtime.date,
        overtime.start_time,
        overtime.end_time,
    )

    db_overtime = models.OvertimeRequest(
        agent_id=agent.id,
        date=overtime.date,
        start_time=overtime.start_time,
        end_time=overtime.end_time,
        total_hours=total_hours,
        justification=overtime.justification,
        status="Pending",
    )

    db.add(db_overtime)
    db.commit()
    db.refresh(db_overtime)

    return {
        "message": "Overtime request created successfully",
        "overtime": {
            "id": db_overtime.id,
            "agent_id": agent.id,
            "agent_name": (
                f"{agent.first_name} "
                f"{agent.last_name}"
            ),
            "date": db_overtime.date,
            "start_time": db_overtime.start_time,
            "end_time": db_overtime.end_time,
            "total_hours": float(
                db_overtime.total_hours
            ),
            "justification": db_overtime.justification,
            "status": db_overtime.status,
        },
    }


# =========================================================
# CREATE OVERTIME - ADMIN ONLY
# =========================================================

@app.post(
    "/overtime",
    status_code=status.HTTP_201_CREATED,
)
def create_overtime(
    overtime: OvertimeCreate,
    current_admin=Depends(require_admin),
    db: Session = Depends(get_db),
):
    agent = (
        db.query(models.Agent)
        .filter(models.Agent.id == overtime.agent_id)
        .first()
    )

    if not agent:
        raise HTTPException(
            status_code=404,
            detail="Agent not found",
        )

    total_hours = calculate_overtime_hours(
        overtime.date,
        overtime.start_time,
        overtime.end_time,
    )

    db_overtime = models.OvertimeRequest(
        agent_id=overtime.agent_id,
        date=overtime.date,
        start_time=overtime.start_time,
        end_time=overtime.end_time,
        total_hours=total_hours,
        justification=overtime.justification,
        status="Pending",
    )

    db.add(db_overtime)
    db.commit()
    db.refresh(db_overtime)

    return {
        "message": "Overtime request created successfully",
        "overtime": {
            "id": db_overtime.id,
            "agent_id": db_overtime.agent_id,
            "agent_name": (
                f"{agent.first_name} "
                f"{agent.last_name}"
            ),
            "date": db_overtime.date,
            "start_time": db_overtime.start_time,
            "end_time": db_overtime.end_time,
            "total_hours": float(
                db_overtime.total_hours
            ),
            "justification": db_overtime.justification,
            "status": db_overtime.status,
            "admin_comment": db_overtime.admin_comment,
        },
    }


# =========================================================
# GET ALL OVERTIME - ADMIN ONLY
# =========================================================

@app.get("/overtime")
def get_overtime(
    current_admin=Depends(require_admin),
    db: Session = Depends(get_db),
):
    requests = (
        db.query(models.OvertimeRequest)
        .order_by(
            models.OvertimeRequest.created_at.desc()
        )
        .all()
    )

    return {
        "total": len(requests),
        "requests": [
            {
                "id": request.id,
                "agent_id": request.agent_id,
                "agent_name": (
                    f"{request.agent.first_name} "
                    f"{request.agent.last_name}"
                ),
                "date": request.date,
                "start_time": request.start_time,
                "end_time": request.end_time,
                "total_hours": float(
                    request.total_hours
                ),
                "justification": request.justification,
                "status": request.status,
                "admin_comment": request.admin_comment,
                "created_at": request.created_at,
            }
            for request in requests
        ],
    }


# =========================================================
# GET AGENT OVERTIME - ADMIN ONLY
# =========================================================

@app.get("/agents/{agent_id}/overtime")
def get_agent_overtime(
    agent_id: int,
    current_admin=Depends(require_admin),
    db: Session = Depends(get_db),
):
    agent = (
        db.query(models.Agent)
        .filter(models.Agent.id == agent_id)
        .first()
    )

    if not agent:
        raise HTTPException(
            status_code=404,
            detail="Agent not found",
        )

    requests = (
        db.query(models.OvertimeRequest)
        .filter(
            models.OvertimeRequest.agent_id
            == agent_id
        )
        .order_by(
            models.OvertimeRequest.created_at.desc()
        )
        .all()
    )

    return {
        "agent": {
            "id": agent.id,
            "name": (
                f"{agent.first_name} "
                f"{agent.last_name}"
            ),
        },
        "total": len(requests),
        "requests": [
            {
                "id": request.id,
                "date": request.date,
                "start_time": request.start_time,
                "end_time": request.end_time,
                "total_hours": float(
                    request.total_hours
                ),
                "justification": request.justification,
                "status": request.status,
                "admin_comment": request.admin_comment,
            }
            for request in requests
        ],
    }


# =========================================================
# APPROVE OVERTIME - ADMIN ONLY
# =========================================================

@app.patch(
    "/overtime/{overtime_id}/approve"
)
def approve_overtime(
    overtime_id: int,
    decision: OvertimeDecision,
    current_admin=Depends(require_admin),
    db: Session = Depends(get_db),
):
    overtime_request = (
        db.query(models.OvertimeRequest)
        .filter(
            models.OvertimeRequest.id
            == overtime_id
        )
        .first()
    )

    if not overtime_request:
        raise HTTPException(
            status_code=404,
            detail="Overtime request not found",
            
        )
    
    if overtime_request.status != "Pending":
        raise HTTPException(
        status_code=409,
        detail="Overtime request has already been reviewed",
    )


    overtime_request.status = "Approved"
    overtime_request.admin_comment = (
        decision.admin_comment
    )

    db.commit()
    db.refresh(overtime_request)

    return {
        "message": "Overtime request approved",
        "id": overtime_request.id,
        "status": overtime_request.status,
        "admin_comment": (
            overtime_request.admin_comment
        ),
    }


# =========================================================
# REJECT OVERTIME - ADMIN ONLY
# =========================================================

@app.patch(
    "/overtime/{overtime_id}/reject"
)
def reject_overtime(
    overtime_id: int,
    decision: OvertimeDecision,
    current_admin=Depends(require_admin),
    db: Session = Depends(get_db),
):
    overtime_request = (
        db.query(models.OvertimeRequest)
        .filter(
            models.OvertimeRequest.id
            == overtime_id
        )
        .first()
    )

    if not overtime_request:
        raise HTTPException(
            status_code=404,
            detail="Overtime request not found",
        )

    if overtime_request.status != "Pending":
        raise HTTPException(
        status_code=409,
        detail="Overtime request has already been reviewed",
    )

    overtime_request.status = "Rejected"
    overtime_request.admin_comment = (
        decision.admin_comment
    )

    db.commit()
    db.refresh(overtime_request)

    return {
        "message": "Overtime request rejected",
        "id": overtime_request.id,
        "status": overtime_request.status,
        "admin_comment": (
            overtime_request.admin_comment
        ),
    }