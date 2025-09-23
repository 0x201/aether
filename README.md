# ModernCSharp

ModernCSharp is a comprehensive solution showcasing modern C# development practices with a focus on .NET, ASP.NET Core, and various client technologies. This project demonstrates microservices architecture, event-driven systems, desktop applications, and modern web development techniques.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Key Components](#key-components)
  - [Backend Services](#backend-services)
  - [Desktop Applications](#desktop-applications)
  - [Web Applications](#web-applications)
  - [Infrastructure](#infrastructure)
- [Technologies Used](#technologies-used)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Service Port Allocations](#service-port-allocations)
- [License](#license)

## Overview

ModernCSharp is a multi-module solution that demonstrates various modern software development practices using C# and .NET technologies. The project includes microservices, desktop applications (WPF, WinUI, WinForms), web applications (Angular, React, Vue), and supporting infrastructure components.

The solution showcases:
- Microservices architecture with .NET
- Event-driven systems with RabbitMQ
- Domain-Driven Design (DDD) principles
- Modern web development with various frontend frameworks
- Desktop application development with multiple technologies
- Integration patterns and best practices

## Architecture

The solution follows a microservices architecture with the following key patterns:
- API Gateways
- Event-driven communication via EventBus and RabbitMQ
- Domain-Driven Design for business logic
- Separation of concerns with layered architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        API Gateway                          │
├─────────────────────────────────────────────────────────────┤
│  Web Clients  │  Desktop Apps  │  Mobile Apps  │  Services  │
└─────────┬─────────────────────────────────────────────┬─────┘
          │                                             │
          ▼                                             ▼
┌────────────────────┐                      ┌──────────────────────┐
│   Event Bus        │◄─────────────────────┤   Microservices      │
│  (RabbitMQ)        │                      │ (Catalog, Ordering,  │
└─────────┬──────────┘                      │  Identity, etc.)     │
          │                                 └──────────────────────┘
          ▼
┌────────────────────┐
│   Shared Libraries │
└────────────────────┘
```

## Key Components

### Backend Services

#### Catalog.API
Manages product catalog information with full CRUD operations.

#### Identity.API
Provides authentication and authorization services using ASP.NET Core Identity.

#### Ordering.API
Handles order processing with a complete domain model including:
- Ordering.Application (CQRS pattern implementation)
- Ordering.Domain (Domain entities and business logic)
- Ordering.Infrastructure (Data access and external service integrations)

#### Workflow.API
ETL (Extract, Transform, Load) system with workflow management capabilities:
- Data extraction from multiple sources
- Data transformation and enrichment
- Data loading to various targets
- Workflow scheduling and monitoring
- Real-time status updates via SignalR

#### EventBus / EventBusRabbitMQ
Event-driven communication infrastructure enabling loose coupling between services.

#### OrderProcessor
Background service for processing orders and handling related events.

### Desktop Applications

#### ModernCSharp.WPFApp
Modern WPF application demonstrating MVVM pattern and best practices.

#### ModernCSharp.WinUIApp
WinUI 3 application showcasing modern Windows desktop development.

#### WinFormsApp
Traditional WinForms application with modernized architecture patterns.

### Web Applications

#### Angular App (bookstore-app)
Angular-based frontend application with TypeScript.

#### React/Vue Applications
Modern frontend applications using React and Vue with Vite tooling.

### Infrastructure

#### ModernCSharp.AppHost
Orchestration layer for managing multiple services.

#### IntegrationEventLogEF
Entity Framework implementation for integration event logging.

#### Shared Libraries
Common components, utilities, and base classes used across the solution.

## Technologies Used

### Backend
- .NET 9
- ASP.NET Core
- Entity Framework Core
- SignalR
- RabbitMQ
- SQL Server
- OpenAPI/Swagger

### Frontend
- Angular 20
- React (with Vite)
- Vue (with Vite)
- TypeScript
- Styled Components

### Desktop
- WPF
- WinUI 3
- WinForms

### Development Practices
- Domain-Driven Design (DDD)
- CQRS
- Event-Driven Architecture
- Microservices
- Dependency Injection
- Unit Testing

## Getting Started

### Prerequisites
- .NET 9 SDK
- Node.js (for frontend applications)
- SQL Server or LocalDB
- RabbitMQ (for event-driven features)

### Building the Solution

```bash
# Clone the repository
git clone <repository-url>
cd ModernCSharp

# Restore NuGet packages
dotnet restore

# Build the solution
dotnet build
```

### Running Services

```bash
# Run a specific service
dotnet run --project src/Catalog.API

# Run with AppHost (if configured)
dotnet run --project src/ModernCSharp.AppHost
```

### Running Frontend Applications

```bash
# For Angular app
cd src/bookstore-app
npm install
npm start

# For React/Vue apps (similar pattern)
cd src/<app-directory>
npm install
npm run dev
```

## Project Structure

```
ModernCSharp/
├── src/
│   ├── Catalog.API/              # Product catalog microservice
│   ├── Ordering.API/             # Order processing microservice
│   │   ├── Ordering.Application/ # Application logic and CQRS
│   │   ├── Ordering.Domain/      # Domain model and entities
│   │   └── Ordering.Infrastructure/ # Data access and external services
│   ├── Identity.API/             # Authentication service
│   ├── Workflow.API/             # ETL and workflow management
│   ├── EventBus/                 # Event bus abstraction
│   ├── EventBusRabbitMQ/         # RabbitMQ implementation
│   ├── ModernCSharp.AppHost/     # Service orchestration
│   ├── ModernCSharp.WPFApp/      # WPF desktop application
│   ├── ModernCSharp.WinUIApp/    # WinUI desktop application
│   ├── bookstore-app/            # Angular frontend application
│   └── ...                       # Additional services and applications
├── test/
│   └── ...                       # Unit and integration tests
├── Directory.Build.props         # Common build properties
└── Directory.Packages.props      # Central package management
```

## Service Port Allocations

The following table shows the port allocations for services managed by the AppHost:

| Service | Https Port | Http Port | Type |
|---------|------|------|------|
| Redis | N.A | 6379 | Database |
| Redis Insight | N.A | 6378 | Management UI |
| RabbitMQ | N.A | 5672 | Message Broker |
| RabbitMQ Management | N.A  | 15672 | Management UI |
| SQL Server | N.A  | 14330 | Database |
| Keycloak | N.A  | 8080 | Identity Provider |
| Catalog API | 5003  | 5002 | Backend API |
| Ordering API | 5005 | 5004 | Backend API |
| Workflow API | 5007 | 5006 | Backend API |
| Web App | 5009 | 5008 | Frontend |
| Order Processor | 5011 | 5010 | Frontend |
| Workflow App (Vue) | 3010 | Frontend |
| Bookstore API (Node.js) | 3011 | Backend API |
| Bookstore App (Angular) | 3012 | Frontend |
| Crawler API (Python) | 3013 | Backend API |
| Crawler App (Vite) | 3014 | Frontend |

All backend APIs now have corresponding clients configured in Keycloak with the naming pattern `{service-name}-api` (e.g., `catalog-api`, `ordering-api`, etc.). Frontend applications use the naming pattern `{service-name}-app` (e.g., `bookstore-app`, `crawler-app`, etc.).

## License

This project is licensed under the MIT License - see the [LICENSE.txt](LICENSE.txt) file for details.