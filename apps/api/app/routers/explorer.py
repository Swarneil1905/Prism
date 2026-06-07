from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.services.nl2sql import (
    ExplorerConfigError,
    ExplorerLlmError,
    ExplorerSqlError,
    NL2SQLService,
)
from pydantic import BaseModel
from typing import Optional

router = APIRouter()


class ExplorerQuery(BaseModel):
    question: str
    database_url: Optional[str] = None


@router.post("/query")
async def run_query(body: ExplorerQuery, db: AsyncSession = Depends(get_db)):
    service = NL2SQLService(db)
    try:
        return await service.run(body.question, body.database_url)
    except ExplorerConfigError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except ExplorerLlmError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    except ExplorerSqlError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/schema")
async def get_schema():
    return await NL2SQLService().get_schema()


@router.get("/preview/{table_name}")
async def preview_table(table_name: str, limit: int = Query(1000, le=1000), db: AsyncSession = Depends(get_db)):
    service = NL2SQLService(db)
    return await service.get_preview(table_name, limit)


@router.get("/history")
async def get_history(db: AsyncSession = Depends(get_db)):
    service = NL2SQLService(db)
    return await service.get_history()
