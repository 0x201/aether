# ETL Workflow System

This is a modern ETL (Extract, Transform, Load) workflow system built with .NET and React. The system allows users to create, manage, and execute data processing workflows through a visual interface.

## Features

### Backend (Workflow.API)
- Workflow management with visual editor
- ETL-specific node types (Extract, Validate, Load)
- Real-time monitoring with SignalR
- SQL Server database integration
- RESTful API for workflow operations
- Sample workflows for demonstration

### Frontend (Vite + React)
- Visual workflow editor with drag-and-drop interface
- Dashboard with system overview and status
- Workflow list and management
- Real-time monitoring of job executions
- ETL data viewer with database/table navigation
- Data visualization with D3.js (bar, pie, and line charts)
- Responsive design with styled-components

## Architecture

The system consists of two main components:

1. **Backend API** - Built with ASP.NET Core, provides RESTful endpoints and SignalR for real-time communication
2. **Frontend UI** - Built with React, TypeScript, and Vite, provides a rich user interface for workflow management

## ETL Workflow Types

The system includes several predefined workflow templates:

1. **Simple Linear Workflow** - Basic sequential execution
2. **Decision Workflow** - Conditional execution paths
3. **Complex Workflow** - Multiple parallel paths with decision nodes
4. **ETL Workflow** - Specialized for data extraction, validation, and loading

## Node Types

- `start` - Workflow start node
- `end` - Workflow end node
- `dummy` - Generic task node
- `branch` - Decision/conditional node
- `extract` - Data extraction node (ETL)
- `validate` - Data validation node (ETL)
- `load` - Data loading node (ETL)

## Getting Started

### Prerequisites

- .NET 8.0 SDK or later
- Node.js 16.x or later
- SQL Server LocalDB
- PNPM (for frontend package management)

### Backend Setup

1. Navigate to the `Workflow.API` directory
2. Update the connection strings in `appsettings.json` if needed
3. Run the application:
   ```bash
   dotnet run
   ```

### Frontend Setup

1. Navigate to the `ClientApp/vite-react-app` directory
2. Install dependencies:
   ```bash
   pnpm install
   ```
3. Start the development server:
   ```bash
   pnpm dev
   ```

## API Endpoints

### Workflow Endpoints
- `GET /api/workflows` - Get all workflows
- `GET /api/workflows/{id}` - Get a specific workflow
- `POST /api/workflows` - Create a new workflow
- `PUT /api/workflows/{id}` - Update a workflow
- `DELETE /api/workflows/{id}` - Delete a workflow
- `POST /api/workflows/{id}/execute` - Execute a workflow

### ETL Endpoints
- `POST /api/etl/execute/{workflowId}` - Execute an ETL workflow
- `GET /api/etl/databases` - Get list of databases
- `GET /api/etl/databases/{databaseName}/tables` - Get tables in a database
- `GET /api/etl/databases/{databaseName}/tables/{tableName}` - Get data from a table

### Monitoring Endpoints
- `GET /api/workflows/running` - Get running workflows
- `GET /api/workflows/logs` - Get all execution logs
- `GET /api/workflows/logs/{workflowInstanceId}` - Get logs for a specific workflow instance

## Real-time Monitoring

The system uses SignalR for real-time updates:
- `/jobstatus` - Hub for job status updates

## Technologies Used

### Backend
- ASP.NET Core
- Entity Framework Core
- SQL Server
- SignalR
- Scalar.AspNetCore (for API documentation)

### Frontend
- React 18+
- TypeScript
- Vite
- Styled Components
- React Router
- D3.js (for data visualization)
- @microsoft/signalr (for real-time updates)

## Development

### Project Structure

```
src/
├── Workflow.API/           # Backend API
│   ├── Controllers/        # API controllers
│   ├── Models/             # Data models
│   ├── Services/           # Business logic
│   ├── Data/               # Database context and migrations
│   └── ...
├── ClientApp/
│   └── vite-react-app/    # Frontend application
│       ├── src/
│       │   ├── components/ # React components
│       │   ├── services/   # API service clients
│       │   ├── contexts/   # React contexts
│       │   └── ...
│       └── ...
└── ...
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License.