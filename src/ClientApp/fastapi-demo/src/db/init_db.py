from sqlalchemy.orm import Session

from src import crud, schemas
from config import config


def init_db(db: Session) -> None:
    user = crud.user.get_by_username(db, username=config.FIRST_SUPERUSER)
    if not user:
        user_in = schemas.UserCreate(
            username=config.FIRST_SUPERUSER,
            password=config.FIRST_SUPERUSER_PASSWORD
        )
        user = crud.user.create(db, obj_in=user_in)  # noqa:F841