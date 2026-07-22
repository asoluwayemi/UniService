# UniService Architecture

## Architecture
- Modular Monolith
- React + TypeScript frontend
- Spring Boot backend
- PostgreSQL
- JWT Authentication
- Flyway

## Backend Modules
- auth
- core
- shared
- audit
- configuration

## Coding Rules
- Controllers return DTOs only.
- Business logic lives in Services.
- Repositories contain persistence only.
- Every entity contains audit fields.
