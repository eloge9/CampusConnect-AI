from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "CampusConnect AI"
    environment: str = "development"
    debug: bool = True
    database_url: str

    jwt_secret_key: str
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60

    seed_admin_email: str = "admin@campusconnect.dev"
    seed_admin_password: str = "AdminDemo123!"
    seed_teacher_email: str = "enseignant@campusconnect.dev"
    seed_teacher_password: str = "TeacherDemo123!"
    seed_student_email: str = "etudiant@campusconnect.dev"
    seed_student_password: str = "StudentDemo123!"

    cors_allowed_origins: str = "*"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


settings = Settings()
