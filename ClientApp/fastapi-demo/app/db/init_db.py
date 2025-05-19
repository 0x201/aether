from sqlalchemy.orm import Session

from app import crud, schemas
from appsettings import appsettings


def init_db(db: Session) -> None:
    user = crud.user.get_by_email(db, email=appsettings.FIRST_SUPERUSER)
    if not user:
        user_in = schemas.UserCreate(
            email=appsettings.FIRST_SUPERUSER,
            password=appsettings.FIRST_SUPERUSER_PASSWORD,
            is_superuser=True,
        )
        user = crud.user.create(db, obj_in=user_in)  # noqa:F841
