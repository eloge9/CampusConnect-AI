from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass


# Les futurs modèles seront importés ici pour être détectés par Alembic.
