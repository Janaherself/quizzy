# Quizzy

A quiz platform for AI-assisted developer role assessment.

## Overview

Quizzy is a tutoring-centre quiz platform that allows teachers to create and manage quizzes, and students to take timed multiple-choice quizzes. The system supports Arabic content, RTL layouts, and mobile-first student experience.

## Tech Stack

- **Backend**: ASP.NET Core Web API with Entity Framework Core and SQLite
- **Frontend**: React with Vite
- **Database**: SQLite
- **Containerization**: Docker Compose

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and Docker Compose (included with Docker Desktop)
- That's it — no .NET SDK or Node.js required to run via Docker

## Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/your-org/quizzy.git
cd quizzy

# 2. Start the application
docker compose up --build

# 3. Open your browser
# Frontend: http://localhost:3000
# Backend API: http://localhost:5000
```

The database is automatically seeded with demo data on first run. Subsequent starts reuse the same data (persisted via Docker volume).

### Stopping the Application

```bash
# Stop containers (keep database)
docker compose down

# Full reset (remove database too)
docker compose down -v
```

### Reset Everything (optional)

If you need to start fresh:

```bash
docker compose down -v    # stop containers and delete the database volume
docker compose up --build # restart with fresh seed data
```

## Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Teacher | teacher1@quizzy.local | pa$$1234 |
| Teacher | teacher2@quizzy.local | pa$$1234 |
| Student | student1@quizzy.local | pa$$1234 |
| Student | student2@quizzy.local | pa$$1234 |

## Project Structure

```
quizzy/
├── .gitignore
├── README.md
├── docker-compose.yml
├── DECISIONS.md
├── AI_USAGE.md
├── CLAUDE.md
├── backend/
│   ├── Backend.sln
│   ├── Backend.csproj
│   ├── Controllers/
│   ├── Services/
│   ├── Models/
│   ├── Data/
│   └── DTOs/
├── frontend/
│   ├── package.json
│   ├── src/
│   └── ...
└── tests/
    ├── Backend.Tests.csproj
    └── ...
```

## Development

### Backend

```bash
cd backend
dotnet restore
dotnet run
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Features

- **Authentication**: JWT-based auth with role-based access control
- **Quiz Management**: Teachers can create, edit, and publish quizzes
- **Quiz Taking**: Students can take timed quizzes with automatic submission
- **Scoring**: Configurable negative marking per quiz
- **Results**: Teachers and students can view results
- **Arabic/RTL Support**: Full RTL layout for Arabic content
- **Mobile-First**: Responsive design optimized for phones

## Documentation

- [DECISIONS.md](DECISIONS.md) - Product decisions and business rules
- [AI_USAGE.md](AI_USAGE.md) - AI assistance documentation
- [CLAUDE.md](CLAUDE.md) - Project guidance for Claude

## License

MIT