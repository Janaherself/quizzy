# AI Usage Documentation

## Tools Used

- Kilo (AI coding assistant)
- GitHub Copilot (code completion)

## What the AI Was Asked to Build

A complete quiz platform called "Quizzy" for an AI-assisted developer role assessment, built in 5 phases:

1. **Phase 1**: Project structure with Docker, backend, frontend, and tests directories
2. **Phase 2**: Backend implementation (ASP.NET Core, EF Core, SQLite)
3. **Phase 3**: Frontend implementation (React, Vite, dark theme, RTL support)
4. **Phase 4**: Backend tests (xUnit)
4. **Phase 5**: Integration testing and final verification

## Important Directions Given to the AI

- Follow DECISIONS.md exactly as the source of truth
- Build in phases, not all at once
- Don't rush or jump phases without confidence
- Ask questions when requirements are vague
- Don't invent rules without clearing them first
- Use deliberate simplicity over architectural complexity
- Enforce all business rules at the API layer
- Support Arabic/RTL and mobile-first design
- Use SQLite for easy local setup
- No delete functionality
- One submission per student enforced at DB level

## Where the AI Generated Code

- Project structure and configuration files
- Backend: Models, Data, Controllers, Services, DTOs
- Frontend: React components, pages, hooks, services
- Tests: xUnit test cases for core business logic
- Docker configuration
- Documentation files

## How Generated Code Was Reviewed

- Verified against DECISIONS.md requirements
- Checked for business rule enforcement at API layer
- Validated data model matches specification
- Confirmed security principles (backend authority, no client trust)
- Verified Arabic/RTL support approach
- Checked test coverage priorities

## How Functionality Was Tested

- Docker Compose build verification
- Backend API endpoint testing
- Frontend integration with backend
- xUnit test execution
- Manual verification of key user flows

## Where Manual Decisions Were Made

- Technology stack selection (per DECISIONS.md)
- Data model field names and relationships
- API endpoint design
- UI/UX decisions for mobile-first RTL experience
- Sample data creation strategy
- Error message wording
- Project structure organization