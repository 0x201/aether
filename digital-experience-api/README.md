# Bookstore API

A modern bookstore API built with NestJS, TypeScript, and TypeORM. This API provides comprehensive functionality for managing books, authors, users, and roles in a bookstore system.

## Table of Contents

- [Bookstore API](#bookstore-api)
  - [Table of Contents](#table-of-contents)
  - [Overview](#overview)
  - [Features](#features)
  - [Technology Stack](#technology-stack)
  - [Architecture](#architecture)
  - [Project Structure](#project-structure)
  - [Getting Started](#getting-started)
    - [Prerequisites](#prerequisites)
    - [Installation](#installation)
    - [Database Setup](#database-setup)
    - [Running the Application](#running-the-application)
  - [API Endpoints](#api-endpoints)
    - [Authentication](#authentication)
    - [Books](#books)
    - [Authors](#authors)
    - [Users](#users)
    - [Roles](#roles)
  - [Authentication](#authentication-1)
  - [Testing](#testing)
  - [Deployment](#deployment)
    - [Docker](#docker)
    - [Production Deployment](#production-deployment)
  - [License](#license)

## Overview

The Bookstore API is a RESTful API service that provides backend functionality for a bookstore application. It includes features for managing books, authors, users, and roles with a complete authentication system.

## Features

- User authentication (signup, login) with JWT tokens
- Role-based access control
- CRUD operations for books and authors
- Data seeding for initial setup
- TypeORM migrations for database management
- Comprehensive test coverage
- Docker support for containerization

## Technology Stack

- [NestJS](https://nestjs.com/) - Progressive Node.js framework
- [TypeScript](https://www.typescriptlang.org/) - Typed superset of JavaScript
- [TypeORM](https://typeorm.io/) - ORM for TypeScript and JavaScript
- [JWT](https://jwt.io/) - JSON Web Token implementation for authentication
- [Jest](https://jestjs.io/) - Testing framework
- [PNPM](https://pnpm.io/) - Fast, disk space efficient package manager
- [Docker](https://www.docker.com/) - Containerization platform

## Architecture

The API follows a modular architecture pattern with NestJS, where each domain entity has its own module with associated controllers, services, and entities. The architecture promotes separation of concerns and maintainability.

```
src/
├── auth/              # Authentication module
├── authors/           # Authors management module
├── books/             # Books management module
├── common/            # Shared components and utilities
├── data-seed/         # Data seeding functionality
├── database/          # Database configuration and migrations
├── roles/             # Roles management module
├── shared/            # Shared utilities and constants
├── users/             # Users management module
└── app.*              # Application entry point and root module
```

## Project Structure

```
src/
├── auth/
│   ├── auth.controller.ts       # Authentication endpoints
│   ├── auth.guard.ts            # JWT authentication guard
│   ├── auth.module.ts           # Authentication module definition
│   ├── auth.service.ts          # Authentication business logic
│   ├── jwt-payload.interface.ts # JWT payload interface
│   └── jwt.config.ts            # JWT configuration
├── authors/
│   ├── commands/                # CQRS commands for authors
│   ├── entities/                # Author entity definition
│   ├── queries/                 # CQRS queries for authors
│   ├── authors.controller.ts    # Authors endpoints
│   ├── authors.module.ts        # Authors module definition
│   └── authors.service.ts       # Authors business logic
├── books/
│   ├── commands/                # CQRS commands for books
│   ├── dtos/                    # Data transfer objects
│   ├── entities/                # Book entity definition
│   ├── queries/                 # CQRS queries for books
│   ├── books.controller.ts      # Books endpoints
│   ├── books.module.ts          # Books module definition
│   └── books.service.ts         # Books business logic
├── common/
│   ├── interface/               # Shared interfaces
│   ├── queries/                 # Common query objects
│   ├── response/                # Response objects
│   └── BaseAuditableEntity.ts   # Base entity with audit fields
├── data-seed/
│   ├── data-seed.module.ts      # Data seeding module
│   └── data-seed.service.ts     # Data seeding service
├── database/
│   ├── migrations/              # TypeORM migrations
│   ├── database.module.ts       # Database module definition
│   └── typeorm-migration.config.ts # TypeORM migration config
├── roles/
│   ├── commands/                # CQRS commands for roles
│   ├── dtos/                    # Role data transfer objects
│   ├── entities/                # Role entity definition
│   ├── roles.controller.ts      # Roles endpoints
│   ├── roles.module.ts          # Roles module definition
│   └── roles.service.ts         # Roles business logic
├── shared/
│   ├── constants/               # Application constants
│   ├── shared.module.ts         # Shared module definition
│   └── utils.ts                 # Utility functions
├── users/
│   ├── commands/                # CQRS commands for users
│   ├── dtos/                    # User data transfer objects
│   ├── entities/                # User entity definition
│   ├── user.controller.ts       # User endpoints
│   ├── users.module.ts          # Users module definition
│   └── users.service.ts         # Users business logic
├── app.module.ts                # Root application module
└── main.ts                      # Application entry point
```

## Getting Started

### Prerequisites

- Node.js (version 14 or higher)
- PNPM (package manager)
- Database (PostgreSQL, MySQL, or SQLite)

### Installation

```bash
# Navigate to the bookstore-api directory
cd bookstore-api

# Install dependencies
pnpm install
```

### Database Setup

> Note: Update the database configs in yaml file (e.g. `local.yaml`) before migrating the database.

```bash
# Run database migrations
TYPEORM_ENV=local pnpm run migration:run
```

New migrations can be generated using the following command:

Bash

```bash
TYPEORM_ENV=local pnpm run migration:generate -- <migration-name>
```

PowerShell

```powershell
$env:TYPEORM_ENV="local"; pnpm run migration:generate -- <migration-name>
```

Apply migrations:

```bash
pnpm run migration:run
```

Revert migrations:

```bash
pnpm run migration:revert
```

### Running the Application

```bash
# Development mode
pnpm run start

# Watch mode
pnpm run start:dev

# Production mode
pnpm run start:prod
```

## API Endpoints

### Authentication

- `POST /auth/signup` - User registration
- `POST /auth/login` - User login

### Books

- `GET /books` - Get all books (paginated)
- `GET /books/:id` - Get a specific book
- `POST /books` - Create a new book
- `PUT /books/:id` - Update a book
- `DELETE /books/:id` - Delete a book

### Authors

- `GET /authors` - Get all authors
- `GET /authors/:id` - Get a specific author
- `POST /authors` - Create a new author
- `PUT /authors/:id` - Update an author
- `DELETE /authors/:id` - Delete an author

### Users

- `GET /users` - Get all users (admin only)
- `GET /users/:id` - Get a specific user
- `PUT /users/:id` - Update a user
- `DELETE /users/:id` - Delete a user

### Roles

- `GET /roles` - Get all roles
- `POST /roles` - Create a new role

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. To access protected endpoints:

1. Register a new user with `POST /auth/signup`
2. Login with `POST /auth/login` to receive a JWT token
3. Include the token in the Authorization header:
   ```
   Authorization: Bearer <your-token>
   ```

Some endpoints require specific roles which are checked with role-based guards.

## Testing

```bash
# Run unit tests
pnpm run test

# Run end-to-end tests
pnpm run test:e2e

# Run tests with coverage
pnpm run test:cov
```

## Deployment

### Docker

```bash
# Build the Docker image
docker build -t bookstore-api .

# Run the container
docker run -p 3000:3000 bookstore-api
```

### Production Deployment

```bash
# Build for production
pnpm run build

# Start in production mode
pnpm run start:prod
```

## License

This project is licensed under the MIT License.
