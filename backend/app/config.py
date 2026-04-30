from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str
    REDIS_URL: str = "redis://redis:6379"
    SECRET_KEY: str = "wordlens-secret-key-change-in-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080  # 7 hari

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()