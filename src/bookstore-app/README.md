# Bookstore App

A modern Angular-based frontend application for the bookstore system. This application provides a user interface for browsing books, managing authors, and handling user accounts in a bookstore environment.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Running the Application](#running-the-application)
- [Development](#development)
  - [Building](#building)
  - [Testing](#testing)
- [Project Configuration](#project-configuration)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

## Overview

The Bookstore App is an Angular frontend application designed to work with the Bookstore API. It provides a responsive, modern user interface for customers to browse books, view author information, and manage their accounts. The application follows modern Angular best practices and uses the latest Angular features.

## Features

- Modern Angular application with standalone components
- Responsive design using SCSS
- Routing capabilities
- Zone.js-free change detection (zoneless)
- TypeScript for type safety
- Modular architecture

## Technology Stack

- [Angular 20](https://angular.io/) - Frontend framework
- [TypeScript](https://www.typescriptlang.org/) - Typed JavaScript
- [SCSS](https://sass-lang.com/) - CSS preprocessor
- [RxJS](https://rxjs.dev/) - Reactive programming library
- [PNPM](https://pnpm.io/) - Fast, disk space efficient package manager

## Project Structure

```
src/
├── app/                    # Main application folder
│   ├── app.config.ts      # Application configuration
│   ├── app.html           # Root component template
│   ├── app.routes.ts      # Application routing
│   ├── app.scss           # Root component styles
│   ├── app.spec.ts        # Root component tests
│   └── app.ts             # Root component
├── index.html             # Main HTML file
├── main.ts                # Application entry point
└── styles.scss            # Global styles
```

## Getting Started

### Prerequisites

- Node.js (version 16 or higher)
- PNPM (package manager)

### Installation

```bash
# Navigate to the bookstore-app directory
cd src/bookstore-app

# Install dependencies
pnpm install
```

### Running the Application

```bash
# Development server
pnpm start

# The application will be available at http://localhost:4200/
```

## Development

### Building

```bash
# Development build
pnpm build

# Production build
pnpm build --prod

# Watch mode
pnpm watch
```

The build artifacts will be stored in the `dist/` directory.

### Testing

```bash
# Run unit tests
pnpm test

# Run tests with code coverage
pnpm test --code-coverage
```

## Project Configuration

The application uses Angular CLI for project management and follows the standard Angular project structure. Key configuration files include:

- `angular.json` - Angular CLI configuration
- `tsconfig.json` - TypeScript configuration
- `tsconfig.app.json` - TypeScript configuration for the application
- `tsconfig.spec.json` - TypeScript configuration for tests

The application is configured with:
- Zoneless change detection for better performance
- SCSS for styling
- Standalone components (Angular 19+ approach)

## Deployment

To deploy the application:

1. Build the application for production:
   ```bash
   pnpm build --prod
   ```

2. The production-ready files will be in the `dist/` directory, which can be deployed to any static hosting service.

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Commit your changes
5. Push to the branch
6. Create a pull request

## License

This project is licensed under the MIT License.
