from sqlalchemy.orm import Session

from app import crud, schemas
from appsettings import appsettings


def init_db(db: Session) -> None:
    user = crud.user.get_by_username(db, username=appsettings.FIRST_SUPERUSER)
    if not user:
        user_in = schemas.UserCreate(
            username=appsettings.FIRST_SUPERUSER,
            password=appsettings.FIRST_SUPERUSER_PASSWORD
        )
        user = crud.user.create(db, obj_in=user_in)  # noqa:F841
