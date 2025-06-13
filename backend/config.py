from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

class Settings(BaseSettings):
    redcap_url: str = Field(..., alias="REDCAP_API_URL")
    redcap_super_api_token: str = Field(..., alias="REDCAP_SUPER_API_TOKEN")
    mongo_url: str = Field(..., alias="MONGO_URL")
    mongo_db: str = Field(..., alias="MONGO_DB")
    huggingface_token: str = Field(..., alias="HUGGINGFACE_TOKEN")
    openai_api_key: str = Field(..., alias="OPENAI_API_KEY")
    model_config = SettingsConfigDict(env_file=".env", extra="allow")

settings = Settings()