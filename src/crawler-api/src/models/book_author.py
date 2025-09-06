from sqlalchemy import Column, Integer, ForeignKey, Index

from src.db.base_class import Base


class BookAuthor(Base):
    __tablename__ = "book_author"
    book_id = Column('book_id', Integer, ForeignKey('books.id', name='FK_BOOK_AUTHOR_BOOK_ID'), primary_key=True)
    author_id = Column('author_id', Integer, ForeignKey('authors.id', name='FK_BOOK_AUTHOR_AUTHOR_ID'), primary_key=True)
