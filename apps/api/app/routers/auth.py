from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()


class TokenRequest(BaseModel):
    email: str
    password: str


@router.post("/token")
async def get_token(body: TokenRequest):
    # Stub: replace with real user lookup and JWT signing
    if body.password == "prism":
        return {"access_token": "dev-token", "token_type": "bearer"}
    raise HTTPException(status_code=401, detail="Invalid credentials")


@router.get("/me")
async def me():
    return {"id": "00000000-0000-0000-0000-000000000001", "email": "admin@prism.dev", "is_admin": True}
