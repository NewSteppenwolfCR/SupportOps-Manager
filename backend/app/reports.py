from datetime import date
from pathlib import Path
from uuid import uuid4

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    UploadFile,
    status,
)
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from . import models
from .auth import require_admin
from .database import get_db


router = APIRouter(
    prefix="/reports",
    tags=["Reports"],
)


# =========================================================
# CONFIGURATION
# =========================================================

BASE_DIR = Path(__file__).resolve().parent.parent
UPLOAD_DIR = BASE_DIR / "uploads"

UPLOAD_DIR.mkdir(
    parents=True,
    exist_ok=True,
)


MAX_FILE_SIZE = 10 * 1024 * 1024
# 10 MB per file


ALLOWED_FILE_TYPES = {
    "application/pdf": ".pdf",
    "image/png": ".png",
    "image/jpeg": ".jpg",
}


ALLOWED_CATEGORIES = {
    "Written Warning",
    "Quality Feedback",
    "Customer Feedback",
    "Performance Note",
    "Email Record",
    "HR Document",
    "General",
}


# =========================================================
# HELPERS
# =========================================================

def get_admin_id(
    current_admin,
) -> int:
    try:
        return int(
            current_admin["subject"]
        )

    except (
        KeyError,
        TypeError,
        ValueError,
    ):
        raise HTTPException(
            status_code=401,
            detail=(
                "Invalid administrator "
                "authentication"
            ),
        )


def serialize_attachment(
    attachment: models.ReportAttachment,
):
    return {
        "id": attachment.id,
        "original_filename":
            attachment.original_filename,
        "mime_type":
            attachment.mime_type,
        "file_size":
            attachment.file_size,
        "uploaded_at":
            attachment.uploaded_at,
        "download_url": (
            f"/reports/attachments/"
            f"{attachment.id}"
        ),
    }


def serialize_report(
    report: models.ReportRecord,
):
    return {
        "id": report.id,
        "agent_id": report.agent_id,
        "agent_name": (
            f"{report.agent.first_name} "
            f"{report.agent.last_name}"
        ),
        "category": report.category,
        "date": report.date,
        "title": report.title,
        "note": report.note,
        "created_by_admin_id":
            report.created_by_admin_id,
        "created_by_admin": (
            f"{report.created_by_admin.first_name} "
            f"{report.created_by_admin.last_name}"
        ),
        "created_at": report.created_at,
        "updated_at": report.updated_at,
        "attachments": [
            serialize_attachment(
                attachment
            )
            for attachment
            in report.attachments
        ],
    }


# =========================================================
# FILE VALIDATION
# =========================================================

def validate_file_signature(
    content_type: str,
    first_chunk: bytes,
    filename: str,
):
    """
    Validate the actual file signature
    instead of trusting Content-Type only.
    """

    if not first_chunk:
        raise HTTPException(
            status_code=400,
            detail=(
                f"{filename} is empty."
            ),
        )


    if content_type == "application/pdf":
        if not first_chunk.startswith(
            b"%PDF-"
        ):
            raise HTTPException(
                status_code=400,
                detail=(
                    f"{filename} is not "
                    "a valid PDF file."
                ),
            )

        return


    if content_type == "image/png":
        png_signature = (
            b"\x89PNG\r\n\x1a\n"
        )

        if not first_chunk.startswith(
            png_signature
        ):
            raise HTTPException(
                status_code=400,
                detail=(
                    f"{filename} is not "
                    "a valid PNG file."
                ),
            )

        return


    if content_type == "image/jpeg":
        if not first_chunk.startswith(
            b"\xff\xd8\xff"
        ):
            raise HTTPException(
                status_code=400,
                detail=(
                    f"{filename} is not "
                    "a valid JPEG file."
                ),
            )

        return


    raise HTTPException(
        status_code=400,
        detail=(
            f"Unsupported file type: "
            f"{filename}."
        ),
    )


# =========================================================
# SAVE ATTACHMENT
# =========================================================

async def save_attachment(
    upload: UploadFile,
    report_id: int,
    db: Session,
):
    original_filename = (
        upload.filename
        or "attachment"
    )

    content_type = (
        upload.content_type
        or ""
    )


    # -----------------------------------------------------
    # MIME TYPE VALIDATION
    # -----------------------------------------------------

    if (
        content_type
        not in ALLOWED_FILE_TYPES
    ):
        await upload.close()

        raise HTTPException(
            status_code=400,
            detail=(
                f"Unsupported file type: "
                f"{original_filename}. "
                "Only PDF, PNG, JPG and "
                "JPEG are allowed."
            ),
        )


    extension = ALLOWED_FILE_TYPES[
        content_type
    ]


    stored_filename = (
        f"{uuid4().hex}{extension}"
    )


    destination = (
        UPLOAD_DIR
        / stored_filename
    )


    size = 0


    try:
        # Read the first chunk before
        # creating the final file.
        first_chunk = await upload.read(
            1024 * 1024
        )


        # -------------------------------------------------
        # REAL FILE SIGNATURE VALIDATION
        # -------------------------------------------------

        validate_file_signature(
            content_type,
            first_chunk,
            original_filename,
        )


        size += len(first_chunk)


        if size > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"{original_filename} "
                    "exceeds the 10 MB "
                    "file limit."
                ),
            )


        # -------------------------------------------------
        # WRITE VALIDATED FILE
        # -------------------------------------------------

        with destination.open(
            "wb"
        ) as file:

            file.write(
                first_chunk
            )


            while True:
                chunk = await upload.read(
                    1024 * 1024
                )


                if not chunk:
                    break


                size += len(chunk)


                if size > MAX_FILE_SIZE:
                    raise HTTPException(
                        status_code=400,
                        detail=(
                            f"{original_filename} "
                            "exceeds the 10 MB "
                            "file limit."
                        ),
                    )


                file.write(
                    chunk
                )


    except Exception:
        if destination.exists():
            destination.unlink()

        raise


    finally:
        await upload.close()


    attachment = (
        models.ReportAttachment(
            report_id=report_id,
            original_filename=
                original_filename,
            stored_filename=
                stored_filename,
            mime_type=
                content_type,
            file_size=size,
            storage_path=
                str(destination),
        )
    )


    db.add(
        attachment
    )

    return attachment


# =========================================================
# CREATE REPORT
# =========================================================

@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
)
async def create_report(
    agent_id: int = Form(...),
    category: str = Form(...),
    report_date: date = Form(...),
    title: str = Form(...),
    note: str | None = Form(None),
    files: list[UploadFile] = File(
        default=[]
    ),
    current_admin=Depends(
        require_admin
    ),
    db: Session = Depends(
        get_db
    ),
):
    # -----------------------------------------------------
    # CATEGORY VALIDATION
    # -----------------------------------------------------

    if (
        category
        not in ALLOWED_CATEGORIES
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "Invalid report category"
            ),
        )


    # -----------------------------------------------------
    # TITLE VALIDATION
    # -----------------------------------------------------

    clean_title = title.strip()


    if not clean_title:
        raise HTTPException(
            status_code=400,
            detail="Title is required",
        )


    # -----------------------------------------------------
    # AGENT VALIDATION
    # -----------------------------------------------------

    agent = (
        db.query(
            models.Agent
        )
        .filter(
            models.Agent.id
            == agent_id
        )
        .first()
    )


    if not agent:
        raise HTTPException(
            status_code=404,
            detail="Agent not found",
        )


    # -----------------------------------------------------
    # ADMIN VALIDATION
    # -----------------------------------------------------

    admin_id = get_admin_id(
        current_admin
    )


    admin = (
        db.query(
            models.Admin
        )
        .filter(
            models.Admin.id
            == admin_id
        )
        .first()
    )


    if not admin:
        raise HTTPException(
            status_code=404,
            detail=(
                "Administrator not found"
            ),
        )


    # -----------------------------------------------------
    # CREATE REPORT RECORD
    # -----------------------------------------------------

    report = models.ReportRecord(
        agent_id=agent.id,
        category=category,
        date=report_date,
        title=clean_title,
        note=(
            note.strip()
            if note
            else None
        ),
        created_by_admin_id=
            admin.id,
    )


    db.add(
        report
    )

    db.flush()


    saved_files = []


    try:
        # -------------------------------------------------
        # SAVE ATTACHMENTS
        # -------------------------------------------------

        for upload in files:
            attachment = (
                await save_attachment(
                    upload,
                    report.id,
                    db,
                )
            )


            saved_files.append(
                attachment
            )


        db.commit()
        db.refresh(
            report
        )


    except Exception:
        db.rollback()


        # Remove any files that were
        # written before the failure.
        for attachment in saved_files:
            path = Path(
                attachment.storage_path
            )


            if path.exists():
                path.unlink()


        raise


    return {
        "message":
            "Report created successfully",
        "report":
            serialize_report(
                report
            ),
    }


# =========================================================
# GET ALL REPORTS
# =========================================================

@router.get("")
def get_reports(
    current_admin=Depends(
        require_admin
    ),
    db: Session = Depends(
        get_db
    ),
):
    reports = (
        db.query(
            models.ReportRecord
        )
        .order_by(
            models.ReportRecord
            .date.desc(),

            models.ReportRecord
            .created_at.desc(),
        )
        .all()
    )


    return {
        "total": len(
            reports
        ),
        "reports": [
            serialize_report(
                report
            )
            for report
            in reports
        ],
    }


# =========================================================
# GET AGENT REPORTS
# =========================================================

@router.get(
    "/agent/{agent_id}"
)
def get_agent_reports(
    agent_id: int,
    current_admin=Depends(
        require_admin
    ),
    db: Session = Depends(
        get_db
    ),
):
    agent = (
        db.query(
            models.Agent
        )
        .filter(
            models.Agent.id
            == agent_id
        )
        .first()
    )


    if not agent:
        raise HTTPException(
            status_code=404,
            detail="Agent not found",
        )


    reports = (
        db.query(
            models.ReportRecord
        )
        .filter(
            models.ReportRecord
            .agent_id
            == agent_id
        )
        .order_by(
            models.ReportRecord
            .date.desc(),

            models.ReportRecord
            .created_at.desc(),
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

        "total": len(
            reports
        ),

        "reports": [
            serialize_report(
                report
            )
            for report
            in reports
        ],
    }


# =========================================================
# GET SINGLE REPORT
# =========================================================

@router.get(
    "/{report_id}"
)
def get_report(
    report_id: int,
    current_admin=Depends(
        require_admin
    ),
    db: Session = Depends(
        get_db
    ),
):
    report = (
        db.query(
            models.ReportRecord
        )
        .filter(
            models.ReportRecord.id
            == report_id
        )
        .first()
    )


    if not report:
        raise HTTPException(
            status_code=404,
            detail="Report not found",
        )


    return serialize_report(
        report
    )


# =========================================================
# DOWNLOAD / VIEW ATTACHMENT
# =========================================================

@router.get(
    "/attachments/{attachment_id}"
)
def get_attachment(
    attachment_id: int,
    current_admin=Depends(
        require_admin
    ),
    db: Session = Depends(
        get_db
    ),
):
    attachment = (
        db.query(
            models.ReportAttachment
        )
        .filter(
            models.ReportAttachment.id
            == attachment_id
        )
        .first()
    )


    if not attachment:
        raise HTTPException(
            status_code=404,
            detail=(
                "Attachment not found"
            ),
        )


    path = Path(
        attachment.storage_path
    )


    if not path.exists():
        raise HTTPException(
            status_code=404,
            detail=(
                "Attachment file "
                "not found"
            ),
        )


    return FileResponse(
        path=path,
        media_type=
            attachment.mime_type,
        filename=
            attachment.original_filename,
    )

# =========================================================
# DELETE REPORT
# =========================================================

@router.delete("/{report_id}")
def delete_report(
    report_id: int,
    current_admin=Depends(require_admin),
    db: Session = Depends(get_db),
):
    report = (
        db.query(models.ReportRecord)
        .filter(
            models.ReportRecord.id
            == report_id
        )
        .first()
    )

    if not report:
        raise HTTPException(
            status_code=404,
            detail="Report not found",
        )

    # Save attachment paths before deleting
    # the database records.
    attachment_paths = [
        Path(attachment.storage_path)
        for attachment in report.attachments
        if attachment.storage_path
    ]

    try:
        db.delete(report)
        db.commit()

    except Exception:
        db.rollback()
        raise

    # Delete physical files only after the
    # database transaction succeeds.
    for path in attachment_paths:
        try:
            if path.exists():
                path.unlink()
        except OSError:
            # The report is already deleted from
            # the database. A missing/unavailable
            # file should not make the API fail.
            pass

    return {
        "message":
            "Report deleted successfully",
        "report_id":
            report_id,
    }