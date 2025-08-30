# Crawler App

A Vue 3 application built with Vite for managing and visualizing crawler data. This frontend application provides a user interface for interacting with the Crawler API, displaying crawled data, and managing crawling tasks.

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
  - [TypeScript Support](#typescript-support)
- [Project Configuration](#project-configuration)
- [Deployment](#deployment)
- [License](#license)

## Overview

The Crawler App is a Vue 3 frontend application designed to work with the Crawler API. It provides a modern, responsive user interface for viewing crawled data, managing crawling tasks, and visualizing results. The application is built with Vite for fast development and optimized builds.

## Features

- Vue 3 Composition API with `<script setup>`
- Vite for fast development and building
- TypeScript support
- Responsive design
- Component-based architecture
- Hot Module Replacement (HMR)
- Vue DevTools support

## Technology Stack

- [Vue 3](https://vuejs.org/) - Progressive JavaScript framework
- [Vite](https://vitejs.dev/) - Next generation frontend tooling
- [TypeScript](https://www.typescriptlang.org/) - Typed JavaScript
- [PNPM](https://pnpm.io/) - Fast, disk space efficient package manager

## Project Structure

```
src/
├── assets/                 # Static assets
├── components/             # Vue components
│   └── HelloWorld.vue     # Sample component
├── App.vue                # Root component
├── main.ts                # Application entry point
├── style.css              # Global styles
└── vite-env.d.ts          # Vite environment types
```

## Getting Started

### Prerequisites

- Node.js (version 16 or higher)
- PNPM (package manager)

### Installation

```bash
# Navigate to the crawler-app directory
cd src/crawler-app

# Install dependencies
pnpm install
```

### Running the Application

```bash
# Development server with hot reload
pnpm dev

# The application will be available at http://localhost:5173/
```

## Development

### Building

```bash
# Build for production
pnpm build

# Preview the production build locally
pnpm preview
```

The build artifacts will be stored in the `dist/` directory.

### TypeScript Support

The application uses TypeScript for type safety. The TypeScript configuration is defined in:
- `tsconfig.json` - Base TypeScript configuration
- `tsconfig.app.json` - Application-specific TypeScript configuration
- `tsconfig.node.json` - Node.js-specific TypeScript configuration

## Project Configuration

The application uses Vite as the build tool with the following configuration files:

- `vite.config.ts` - Vite configuration
- `package.json` - Dependencies and scripts
- `.gitignore` - Ignored files and directories

Key features of the configuration:
- Vue 3 Single File Components (SFC) support
- TypeScript compilation
- Development server with HMR
- Production build optimization

## Deployment

To deploy the application:

1. Build the application for production:
   ```bash
   pnpm build
   ```

2. The production-ready files will be in the `dist/` directory, which can be deployed to any static hosting service.

## License

This project is licensed under the MIT License.