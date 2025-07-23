import secrets
from typing import Any, Dict, List, Union, Annotated

from pydantic import AnyHttpUrl, EmailStr, HttpUrl, field_validator, BeforeValidator
from pydantic_core.core_schema import ValidationInfo
from pydantic_settings import BaseSettings

def parse_cors(v: Any) -> Union[List[str], str]:
    if isinstance(v, str) and not v.startswith("["):
        return [i.strip() for i in v.split(",")]
    elif isinstance(v, (list, str)):
        return v
    raise ValueError(v)

class Settings(BaseSettings):
    model_config = {"env_file": ".env", "extra": "ignore"}

    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = secrets.token_urlsafe(32)
    TOTP_SECRET_KEY: str = secrets.token_urlsafe(32)
    # 60 seconds * 60 minutes * 24 hours * 30 days = 30 days
    ACCESS_TOKEN_EXPIRE_SECONDS: int = 60 * 60 * 24 * 30
    REFRESH_TOKEN_EXPIRE_SECONDS: int = 60 * 60 * 24 * 60  # 60 days
    JWT_ALGO: str = "HS512"
    TOTP_ALGO: str = "SHA-1"
    SERVER_NAME: str
    SERVER_HOST: AnyHttpUrl
    SERVER_BOT: str = "Symona"
    # BACKEND_CORS_ORIGINS is a JSON-formatted list of origins
    # e.g: '["http://localhost", "http://localhost:4200", "http://localhost:3000", \
    # "http://localhost:8080", "http://local.dockertoolbox.tiangolo.com"]'
    BACKEND_CORS_ORIGINS: Annotated[
        list[AnyHttpUrl] | str, BeforeValidator(parse_cors)
    ] = []

    PROJECT_NAME: str
    SENTRY_DSN: HttpUrl | None = None

    @field_validator("SENTRY_DSN", mode="before")
    def sentry_dsn_can_be_blank(cls, v: str) -> str | None:
        if isinstance(v, str) and len(v) == 0:
            return None
        return v

    # GENERAL SETTINGS

    MULTI_MAX: int = 20

    # COMPONENT SETTINGS
    MONGO_DATABASE: str
    MONGO_DATABASE_URI: str

    SMTP_TLS: bool = True
    SMTP_PORT: int = 587
    SMTP_HOST: str | None = None
    SMTP_USER: str | None = None
    SMTP_PASSWORD: str | None = None
    EMAILS_FROM_EMAIL: EmailStr | None = None
    EMAILS_FROM_NAME: str | None = None
    EMAILS_TO_EMAIL: EmailStr | None = None

    @field_validator("EMAILS_FROM_NAME")
    def get_project_name(cls, v: str | None, info: ValidationInfo) -> str:
        if not v:
            return info.data["PROJECT_NAME"]
        return v

    EMAIL_RESET_TOKEN_EXPIRE_HOURS: int = 48
    EMAIL_TEMPLATES_DIR: str = "/app/app/email-templates/build"
    EMAILS_ENABLED: bool = False

    @field_validator("EMAILS_ENABLED", mode="before")
    def get_emails_enabled(cls, v: bool, info: ValidationInfo) -> bool:
        return bool(info.data.get("SMTP_HOST") and info.data.get("SMTP_PORT") and info.data.get("EMAILS_FROM_EMAIL"))

    EMAIL_TEST_USER: EmailStr = "test@example.com"  # type: ignore
    FIRST_SUPERUSER: EmailStr
    FIRST_SUPERUSER_PASSWORD: str
    USERS_OPEN_REGISTRATION: bool = True

    # API Keys for AI Models
    OPENAI_API_KEY: str | None = None
    ANTHROPIC_API_KEY: str | None = None
    GEMINI_API_KEY: str | None = None

    # RAG Optimization Settings
    ENABLE_SEMANTIC_CHUNKING: bool = True
    ENABLE_AGENTIC_CHUNKING: bool = True
    DEFAULT_CHUNK_SIZE: int = 5000
    DEFAULT_OVERLAP: int = 100
    MAX_CHUNK_SIZE: int = 10000
    MIN_CHUNK_SIZE: int = 500

    # Performance Monitoring Settings
    ENABLE_PERFORMANCE_MONITORING: bool = True
    METRICS_RETENTION_DAYS: int = 30
    PERFORMANCE_ALERT_THRESHOLD: float = 10.0
    MAX_METRICS_IN_MEMORY: int = 10000

    # User Tier Limits
    FREE_TIER_MONTHLY_LIMIT: int = 50
    FREE_TIER_MAX_FILE_SIZE_MB: int = 10
    FREE_TIER_MAX_STORAGE_GB: int = 1

    PREMIUM_TIER_MONTHLY_LIMIT: int = 500
    PREMIUM_TIER_MAX_FILE_SIZE_MB: int = 50
    PREMIUM_TIER_MAX_STORAGE_GB: int = 10

    ENTERPRISE_TIER_MONTHLY_LIMIT: int = -1  # Unlimited
    ENTERPRISE_TIER_MAX_FILE_SIZE_MB: int = 100
    ENTERPRISE_TIER_MAX_STORAGE_GB: int = 100

    # Chunking Strategy Settings
    SEMANTIC_CHUNKING_SIMILARITY_THRESHOLD: float = 0.6
    AGENTIC_CHUNKING_MODEL: str | None = None  # Will use default OpenAI model
    MARKDOWN_CHUNKING_PRESERVE_HEADERS: bool = True

    # Content Analysis Settings
    ENABLE_CONTENT_ANALYSIS: bool = True
    CONTENT_ANALYSIS_TIMEOUT_SECONDS: int = 30
    AUTO_STRATEGY_SELECTION: bool = True

    # Feature Flags
    ENABLE_PARALLEL_PROCESSING: bool = True
    ENABLE_ANALYTICS_DASHBOARD: bool = True
    ENABLE_ADVANCED_CHUNKING: bool = True

    @field_validator("GEMINI_API_KEY")
    def validate_gemini_key_for_semantic(cls, v: str | None, info: ValidationInfo) -> str | None:
        """Validate Gemini API key is available when semantic chunking is enabled"""
        if info.data.get("ENABLE_SEMANTIC_CHUNKING", True) and not v:
            import logging
            logging.getLogger(__name__).warning(
                "GEMINI_API_KEY not set - semantic chunking will be limited"
            )
        return v

    @field_validator("OPENAI_API_KEY")
    def validate_openai_key_for_agentic(cls, v: str | None, info: ValidationInfo) -> str | None:
        """Validate OpenAI API key is available when agentic chunking is enabled"""
        if info.data.get("ENABLE_AGENTIC_CHUNKING", True) and not v:
            import logging
            logging.getLogger(__name__).warning(
                "OPENAI_API_KEY not set - agentic chunking will be disabled"
            )
        return v


settings = Settings()
