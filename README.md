# Larn Remake

A small remake/reimagining of the classic roguelike **Larn**, built as a software-engineering and test-driven development practice project.

The repository is intended to grow as a monorepo with a Spring Boot backend and React/TypeScript frontend. Development is organized as small vertical slices so new game behavior can be designed and implemented incrementally.

## Backend

The backend currently uses:

- Java 21
- Spring Boot 4.1.1
- Gradle (wrapper included)
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

The Gradle wrapper is committed to the repository, so a separate Gradle installation is not required.

## Project documentation

- [`docs/definition-of-done.md`](docs/definition-of-done.md) — completion and quality expectations for stories.
- [`docs/ai-working-agreement.md`](docs/ai-working-agreement.md) — boundaries for how AI is used during development.

## Status

Early development. The backend application skeleton is initialized; game-domain behavior and the frontend will be added incrementally through GitHub issues.
