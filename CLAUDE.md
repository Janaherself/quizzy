# CLAUDE.md - Project Guidance for AI Assistant

## Stack

- **Backend**: ASP.NET Core 8 Web API, Entity Framework Core, SQLite
- **Frontend**: React 18, Vite, React Router, Axios
- **Testing**: xUnit, Moq, FluentAssertions
- **Containerization**: Docker Compose
- **Database**: SQLite (file-based, easy local setup)

## Architecture

- Simple modular/layered architecture (no overengineering)
- Backend: Controllers → Services → Data (EF Core)
- Frontend: Pages → Components → Hooks → API Services
- No microservices, CQRS, MediatR, generic repositories, or domain events

## Business Rules (Critical)

### Authentication & Authorization
- JWT-based auth with roles: Student, Teacher
- Teachers own their quizzes (enforced at API)
- Students belong to classes
- Backend is authoritative; frontend hides invalid actions for UX

### Quiz Lifecycle
- Draft → Published/Upcoming → Live → Closed
- Draft: editable, not visible to students
- Upcoming: published but not started, visible but not startable
- Live: published, StartAt ≤ now < EndAt, startable by eligible students
- Closed: now ≥ EndAt, not startable

### Quiz Editing Rules
- Before Live: fully editable
- Once Live: substantive content locked (title, description, dates, duration, negative marking, target classes, questions, points, choices, correct answers)
- Exception: EndAt can be extended (not shortened) while live
- Closed draft cannot be published without fixing dates first

### Student Access
- Must be authenticated student
- Quiz published AND StartAt ≤ now < EndAt
- Student's class is targeted by quiz
- No existing submission for this quiz

### Submissions
- One submission per student per quiz (DB unique constraint)
- Timer starts when student explicitly starts quiz (server time)
- Effective deadline = min(StartedAt + DurationMinutes, Quiz.EndAt)
- Auto-finalize on deadline expiry
- Resume supported (browser refresh doesn't reset timer)

### Scoring
- Correct: +question points
- Incorrect + negative marking: -question points
- Incorrect + no negative marking: 0
- Unanswered: 0
- Final score = max(0, sum)

### Security
- Never expose IsCorrect to students
- Scoring server-side only
- Backend enforces all rules independently

## Naming Conventions

- C#: PascalCase for types/methods, camelCase for parameters/fields
- Database: PascalCase for tables, PascalCase for columns
- TypeScript: camelCase for variables/functions, PascalCase for components/types
- API: camelCase for JSON properties

## Testing Expectations

- Focus on business-critical behavior (see DECISIONS.md #56)
- High priority: auth/authorization, quiz availability, one-submission rule, scoring, timing, quiz editing, security
- Use xUnit with in-memory SQLite or EF Core InMemory
- Test edge cases, not superficial UI coverage

## Security Expectations

- Password hashing with BCrypt
- JWT tokens with proper expiration
- Validate all inputs server-side
- Unique constraint on (StudentId, QuizId) for submissions
- Never trust client for time, authorization, or scoring

## Important Decisions (from DECISIONS.md)

- No delete functionality
- No randomization of questions/choices
- No multiple attempts
- Negative marking uses question's point value for penalty
- Default duration: 20 minutes, default choices: 4
- Choices per question: 2-6, configurable per question
- Arabic/RTL support required
- Mobile-first student experience
- Sample data with Arabic content
- Seeded passwords hashed, plaintext in README

## Things That Must Not Change Without Explicit Approval

- Core data model relationships
- Business rules in DECISIONS.md
- Security principles (backend authority)
- One-submission rule
- Quiz editing locks
- Scoring formula