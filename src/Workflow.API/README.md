# Workflow.API

This is a workflow engine API based on ASP.NET Core, inspired by Apache Airflow's design concepts, implementing core components including nodes, node executors, and scheduler.

## Features

1. **Node Management**:
   - Support for multiple node types (start node, end node, task node, decision node, etc.)
   - Node data persistence (currently using in-memory storage)
   - Node connection management

2. **Node Executor**:
   - Execution logic for different node types
   - Data passing between nodes
   - Decision node condition evaluation

3. **Workflow Scheduler**:
   - Workflow instance management
   - Asynchronous workflow execution
   - Running status tracking

## Supported Node Types

- `start` - Start node
- `end` - End node
- `dummy` - Task node (placeholder)
- `branch` - Decision node
- `bash` - Bash command execution node
- `python` - Python script execution node
- `email` - Email sending node
- `http` - HTTP request node
- `sql` - SQL execution node
- `subdag` - Sub-workflow node
- `sensor` - Sensor node
- `custom` - Custom node
- `extract` - Data extraction node (ETL)
- `validate` - Data validation node (ETL)
- `load` - Data loading node (ETL)

## API Endpoints

- `GET /api/workflows` - Get all workflows
- `GET /api/workflows/{id}` - Get workflow by ID
- `POST /api/workflows` - Create new workflow
- `PUT /api/workflows/{id}` - Update workflow
- `DELETE /api/workflows/{id}` - Delete workflow
- `POST /api/workflows/{id}/execute` - Execute workflow
- `GET /api/workflows/running` - Get running workflows
- `GET /api/etl/data` - Get ETL processed data

## CORS Configuration

To support cross-domain requests from frontend applications, CORS policy has been configured for the API. By default, requests from all origins, methods, and headers are allowed.

```csharp
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

app.UseCors("AllowAll");
```

In production environments, it is recommended to restrict allowed origins to improve security:

```csharp
builder.Services.AddCors(options =>
{
    options.AddPolicy("ProductionPolicy", policy =>
    {
        policy.WithOrigins("https://yourdomain.com")
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});
```

## Architecture Design

### Core Components

1. **Models** - Data models
   - `WorkflowModel` - Workflow model
   - `WorkflowNode` - Workflow node
   - `WorkflowConnection` - Node connection
   - `NodeData` - Node data configuration
   - `Position` - Node position information

2. **Services** - Core services
   - `IWorkflowRepository` - Workflow data storage interface
   - `InMemoryWorkflowRepository` - In-memory data storage implementation
   - `INodeExecutor` - Node executor interface
   - `NodeExecutor` - Node executor implementation
   - `IWorkflowScheduler` - Workflow scheduler interface
   - `WorkflowScheduler` - Workflow scheduler implementation

## Sample Workflows

The API includes four sample workflows to demonstrate different scenarios:

### 1. Simple Linear Workflow (ID: 1)
Contains a simple linear execution flow:
Start → Process Data → Validate Results → End

### 2. Decision Workflow (ID: 2)
Contains a decision node that selects different execution paths based on conditions:
Start → Data Analysis → Check Value → (High Value Path / Low Value Path) → End

### 3. Complex Workflow (ID: 3)
A complex flow with multiple parallel processing paths and decision nodes:
Start → Data Ingestion → (ETL Process & Data Validation) → Quality Check → (High Quality Processing / Error Handling) → Data Storage → End

### 4. ETL Workflow (ID: 4)
A dedicated workflow for ETL (Extract, Transform, Load) data processing:
Start → Extract Data → Validate Data → Load to Database → End

## ETL Function Description

ETL workflows include three specialized node types for handling data extraction, validation, and loading:

### Extract Node
- Extracts data from the file system
- Supports JSON format files
- Configurable file path and other parameters
- Actually reads and parses the specified JSON file

### Validate Node
- Validates whether extracted data conforms to expected format
- Checks if required fields exist
- Validates data types and ranges
- Validates email format and other business rules

### Load Node
- Loads validated data into an in-memory database
- Supports configurable table names
- Provides load row count statistics
- Data is stored in memory and can be accessed via API

Data is stored in an in-memory database and can be accessed via the `GET /api/etl/data` endpoint.

## Frontend Integration

The frontend application is located in the `src/workflow-app` directory and includes the following features:

1. **Visual Workflow Editor** - A React-based visual workflow editor
2. **Workflow List** - Displays all available workflows and supports execution
3. **API Service Integration** - Interacts with backend API through `workflowService.ts`

### Frontend Components

- `WorkflowEditor` - Visual workflow editor
- `WorkflowList` - Workflow list and detail view
- `WorkflowService` - Service for communicating with backend API

## Usage Examples

```bash
# Get all workflows
curl -X GET http://localhost:5207/api/workflows

# Get specific workflow
curl -X GET http://localhost:5207/api/workflows/4

# Execute ETL workflow
curl -X POST http://localhost:5207/api/workflows/4/execute

# Get ETL processed data
curl -X GET http://localhost:5207/api/etl/data

# Get running workflows
curl -X GET http://localhost:5207/api/workflows/running
```

## Extensibility

This workflow engine is designed with good extensibility:

1. New node types can be easily added
2. Data storage implementation can be replaced (e.g., using a database)
3. Node executor functionality can be enhanced
4. Scheduler's scheduling strategy can be improved

## References

This project draws inspiration from the following open-source projects:
- [Apache Airflow](https://airflow.apache.org/) - Workflow scheduling and monitoring platform