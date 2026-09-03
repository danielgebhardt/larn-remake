# Larn Remake

A small remake/reimagining of the classic roguelike **Larn**, built as a software-engineering and test-driven development practice project.

The repository is a monorepo with a Spring Boot backend and React/TypeScript frontend. Development is organized as small vertical slices so new game behavior can be designed and implemented incrementally.

## Repository layout

```text
larn-remake/
├── backend/   # Spring Boot backend
├── frontend/  # React + TypeScript frontend
├── docs/      # Project working agreements and development standards
└── README.md
```

## Prerequisites

- Java 21
- Node.js with pnpm 11.25.0

The backend uses the committed Gradle wrapper, so a separate Gradle installation is not required.

## Backend

The backend currently uses:

- Java 21
- Spring Boot 4.1.1
- Gradle 9.7.1 wrapper
- Spring Web MVC
- Spring Validation
- Spring Boot DevTools

### Run the backend

From the repository root:

```bash
cd backend
./gradlew bootRun
```

On Windows:

```powershell
cd backend
.\gradlew.bat bootRun
```

### Run backend tests

From `backend/`:

```bash
./gradlew test
```

On Windows:

```powershell
.\gradlew.bat test
```

## Frontend

The frontend currently uses:

- React 19
- TypeScript 6
- Vite 8
- Vitest
- React Testing Library
- Biome for formatting and linting
- pnpm workspace commands from the repository root

### Install frontend dependencies

From the repository root:

```bash
pnpm install
```

### Run the frontend

From the repository root:

```bash
pnpm frontend:dev
```

Or from `frontend/`:

```bash
pnpm dev
```

### Run frontend checks

From the repository root:

```bash
pnpm frontend:check
pnpm frontend:test
```

Or from `frontend/`:

```bash
pnpm check
pnpm test:run
```

### Apply frontend formatting and safe fixes

From the repository root:

```bash
pnpm frontend:check:fix
```

Or from `frontend/`:

```bash
pnpm check:fix
```

## Git hooks

Husky is configured at the repository root. The pre-commit hook currently runs:

```bash
pnpm frontend:check
pnpm frontend:test
```

This blocks commits when Biome finds frontend issues or the frontend test suite fails.

## Project documentation

- [`docs/definition-of-done.md`](docs/definition-of-done.md) — completion and quality expectations for stories.
- [`docs/ai-working-agreement.md`](docs/ai-working-agreement.md) — boundaries for how AI is used during development.

## Status

Early development. The backend and frontend application skeletons are initialized. Game-domain behavior will be added incrementally through GitHub issues.
