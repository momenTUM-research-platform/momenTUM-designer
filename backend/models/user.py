from pydantic import BaseModel

class User(BaseModel):
    email: str
    password_hash: str