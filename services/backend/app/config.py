from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_env: str = "local"
    log_level: str = "INFO"

    cors_origins: str = "http://localhost:5173"

    ollama_base_url: str = "https://ollama.com/v1"
    ollama_api_key: str = ""
    ollama_chat_model: str = "qwen3.5:397b-cloud"

    # xAI Realtime Voice — server-side only; never expose to the frontend.
    xai_api_key: str = ""

    # Apache AGE graph (runs inside Postgres). The graph data shares the
    # DATABASE_URL connection; only the graph name is configurable.
    age_graph: str = "ziyada"

    # Postgres / auth
    database_url: str = ""
    jwt_secret: str = ""
    jwt_algorithm: str = "HS256"
    jwt_expire_days: int = 7

    # Bootstrap admin
    admin_bootstrap_email: str = ""
    admin_bootstrap_password: str = ""
    admin_bootstrap_name: str = "Admin"

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()
