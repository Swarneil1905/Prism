from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.services.nl2sql import NL2SQLService
from pydantic import BaseModel
from typing import Optional

router = APIRouter()


class ExplorerQuery(BaseModel):
    question: str
    database_url: Optional[str] = None


@router.post("/query")
async def run_query(body: ExplorerQuery, db: AsyncSession = Depends(get_db)):
    service = NL2SQLService(db)
    result = await service.run(body.question, body.database_url)
    return result


@router.get("/schema")
async def get_schema(db: AsyncSession = Depends(get_db)):
    service = NL2SQLService(db)
    return await service.get_schema()


@router.get("/preview/{table_name}")
async def preview_table(table_name: str, limit: int = Query(1000, le=1000), db: AsyncSession = Depends(get_db)):
    service = NL2SQLService(db)
    return await service.get_preview(table_name, limit)


@router.get("/history")
async def get_history(db: AsyncSession = Depends(get_db)):
    service = NL2SQLService(db)
    return await service.get_history()
