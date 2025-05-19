import datetime

from sqlalchemy import Column, Integer, String, DateTime

from app.db.base_class import Base


class GameAudit(Base):
    def __gt__(self, other):
        return self.publish_date > other.publish_date

    def __lt__(self, other):
        return self.publish_date < other.publish_date

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(512), unique=True, index=True)
    url = Column(String(512), unique=True, index=True)
    publish_date = Column(DateTime)

    def __init__(self, title: str, url: str, publish_date: datetime):
        self.title = title
        self.url = url
        self.publish_date = publish_date
