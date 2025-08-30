# FastAPI Demo

This is a backend service example project built with FastAPI, used for managing books, authors, users, game audits and other data.

## Configuration

The project supports loading different YAML configuration files based on environment variables, and uses Pydantic models for configuration validation.

### Configuration Structure

The configuration file uses the following structure:

```yaml
sqlserver:
  server: "Database server address"
  port: Database port
  user_name: "Username"
  password: "Password"
  database: "Database name"

pwd_salt: "Password salt value"

cors_origins:
  - "Allowed CORS origin 1"
  - "Allowed CORS origin 2"

api_version: "API version"
api_base_url: "API base path"
database: "Database type"
host: "Server host"
port: Server port

nppa:
  base_url: "National Press and Publication Administration base URL"
  data_url: "Data page path"
  suffix: "Page suffix"
```

### Environment Configuration

Use the `ENVIRONMENT` variable in the `.env` file to determine which configuration file to load:

- `ENVIRONMENT=local` -> Load `config/appsettings.local.yaml`
- `ENVIRONMENT=dev` -> Load `config/appsettings.dev.yaml`
- `ENVIRONMENT=prod` -> Load `config/appsettings.prod.yaml`
- Default -> Load `config/appsettings.yaml`

If the configuration file for the specified environment does not exist, it will fall back to the default `config/appsettings.yaml` file.

### Usage

Copy the [.env.example](file:///D:/Code/ModernCSharp/src/ClientApp/fastapi-demo/.env.example) file and rename it to `.env`, then modify the configuration items as needed.

```bash
cp .env.example .env
```

Modify the `ENVIRONMENT` variable according to your environment requirements, and create the corresponding `appsettings.{environment}.yaml` configuration file in the `config` directory.

Access the configuration in code as follows:

```python
from config import config

# Access configuration items
print(config.host)
print(config.port)
print(config.sqlserver.server)
```

## Install Dependencies

```bash
uv sync
```

## Run Database Migrations

```bash
alembic upgrade head
```

## Start Service

```bash
uv run main.py
```


## Testing

```bash
uv run coverage_report.py
```