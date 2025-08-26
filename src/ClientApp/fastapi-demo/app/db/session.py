# coding=utf-8

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from config import config

if config.sqlserver.trusted_connection:
    conn_str = f'mssql+pymssql://{config.sqlserver.user_name}@{config.sqlserver.server}:{config.sqlserver.port}/{config.sqlserver.database}?charset=ut8&trusted_connection={config.sqlserver.trusted_connection}'
elif config.sqlserver.integrated_security:
    conn_str = f'mssql+pymssql://{config.sqlserver.user_name}@{config.sqlserver.server}:{config.sqlserver.port}/{config.sqlserver.database}?charset=ut8&authentication={config.sqlserver.integrated_security}'
else:
    conn_str = f'mssql+pymssql://{config.sqlserver.user_name}:{config.sqlserver.password}@{config.sqlserver.server}:{config.sqlserver.port}/{config.sqlserver.database}?charset=utf8'

print(f'Connect to SQL Server: {conn_str}')

sqlserver_engine = create_engine(
    conn_str,
    future=True
    # echo=True
)

SqlServerSession = sessionmaker(
    autocommit=False, autoflush=False, bind=sqlserver_engine, future=True
)