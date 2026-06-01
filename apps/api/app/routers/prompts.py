from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.db.session import get_db
from app.models.prompt import PromptVersion, PromptVersionStats
from app.schemas.prompt import PromptVersionOut, PromptVersionCreate, PromptSummary
from typing import List

router = APIRouter()


@router.get("", response_model=List[PromptSummary])
async def list_prompts(db: AsyncSession = Depends(get_db)):
    q = select(PromptVersion.name, func.count(PromptVersion.id).label("version_count")).group_by(PromptVersion.name)
    rows = (await db.execute(q)).all()
    return [PromptSummary(name=r.name, version_count=r.version_count) for r in rows]


@router.get("/{name}/versions", response_model=List[PromptVersionOut])
async def get_prompt_versions(name: str, db: AsyncSession = Depends(get_db)):
    q = select(PromptVersion).where(PromptVersion.name == name).order_by(PromptVersion.version.desc())
    rows = (await db.execute(q)).scalars().all()
    return rows


@router.post("/{name}/versions", status_code=201)
async def create_prompt_version(name: str, body: PromptVersionCreate, db: AsyncSession = Depends(get_db)):
    max_v = (await db.execute(select(func.max(PromptVersion.version)).where(PromptVersion.name == name))).scalar_one() or 0
    pv = PromptVersion(name=name, version=max_v + 1, content=body.content)
    db.add(pv)
    await db.commit()
    await db.refresh(pv)
    return {"id": str(pv.id), "version": pv.version}
