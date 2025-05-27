import os
import hashlib
import base64
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from motor.motor_asyncio import AsyncIOMotorDatabase
from models.user import User
from db import get_db

router = APIRouter(prefix="/users", tags=["users"])
security = HTTPBasic()

SALT = os.getenv("PASSWORD_SALT", "VERY_STRONG_SALT")

async def get_current_user(
    credentials: HTTPBasicCredentials = Depends(security),
    db: AsyncIOMotorDatabase      = Depends(get_db),
) -> User:
    # 1) Salt+hash the supplied password
    digest = hashlib.sha256((SALT + credentials.password).encode()).digest()
    password_hash = base64.b64encode(digest).decode()

    # 2) Look up in MongoDB
    query = {"email": credentials.username, "password_hash": password_hash}
    user_doc = await db["users"].find_one(query)

    if not user_doc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Basic"},
        )

    return User(**user_doc)

@router.get("/me", response_model=User)
async def read_my_user(current: User = Depends(get_current_user)):
    return current