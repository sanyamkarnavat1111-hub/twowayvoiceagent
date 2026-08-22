import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    DEFAULT_MODEL: str = "gemini-2.5-flash"
    DEFAULT_EMBEDDING_MODEL: str = "text-embedding-004"
    DEFAULT_VOICE: str = "Kore"
    PORT: int = 8000
    HOST: str = "0.0.0.0"

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()
