# coding=utf-8

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from appsettings import appsettings

mysql_engine = create_engine(
    appsettings.MYSQL_CONNECTION_STRING,
    future=True
    # echo=True
)

sqlserver_engine = create_engine(
    appsettings.SQLSERVER_CONNECTION_STRING,
    future=True,
    # echo=True
)

MysqlSession = sessionmaker(
    autocommit=False, autoflush=False, bind=mysql_engine, future=True
)
SqlServerSession = sessionmaker(
    autocommit=False, autoflush=False, bind=sqlserver_engine, future=True
)
