# Decisions & Product Specification

This document is the source of truth for the product decisions, business rules, assumptions, scope boundaries, and implementation expectations for the tutoring-centre quiz platform.

The original client brief is intentionally incomplete and written from the perspective of a fictional client. Where the brief does not specify a behavior, this document records the decision made for this assessment rather than leaving the behavior implicit.

---

## 1. Project Context

Nour runs a small tutoring centre in Amman with approximately:

- 300 students
- 12 teachers
- 3 classes initially: `10A`, `10B`, and `11A`
- Approximately 20 students per class
- 4 teachers initially

The centre currently uses paper quizzes, which creates administrative overhead.

The requested system is a simple website where:

### Students can

- Log in.
- See quizzes available to them.
- Take a timed multiple-choice quiz.
- See their score after submitting.
- Take each quiz only once.

### Teachers can

- Log in.
- Create quizzes.
- Add questions and answer choices.
- Configure quiz timing.
- Configure negative marking.
- Specify when a quiz is available.
- Publish quizzes.
- See how students performed.

The system should be clean, simple, phone-friendly, and support Arabic names and quiz content.

The assessment brief expects a working implementation rather than a complete production system.

---

# 2. Explicit Requirements From the Client Brief

These are requirements explicitly stated in the brief rather than assumptions made by the developer.

## 2.1 Authentication

Users must be able to log in.

The system has at least two user roles:

- Student
- Teacher

The assessment requires demo login details to be provided in the README.

---

## 2.2 Students

Students must be able to:

1. Log in.
2. See quizzes available to them.
3. Start a quiz.
4. Answer multiple-choice questions.
5. Complete the quiz within its time limit.
6. Submit their answers.
7. See their score.
8. Be prevented from taking the same quiz twice.

The brief specifically states that a student can take a quiz only once.

---

## 2.3 Teachers

Teachers must be able to:

1. Log in.
2. Enter/create quizzes.
3. Configure quiz questions.
4. Configure the quiz time limit.
5. Configure negative marking.
6. Define the date range during which the quiz is open.
7. See how students performed.

The initial centre has four teachers.

---

## 2.4 Quiz Structure

The typical quiz described by the client has:

- Approximately 15 questions.
- Multiple-choice questions.
- Four answer options per question.
- A point value for each question.
- A time limit, usually 20 minutes.
- A configurable availability period.

The system will make the number of choices configurable rather than hard-code four choices, while retaining four as the default.

---

## 2.5 Negative Marking

Negative marking varies by quiz/teacher.

The brief does not define a separate penalty value or formula.

The chosen interpretation is documented in Section 8.

---

## 2.6 Data

The client expects that real student, teacher, and quiz information will eventually come from spreadsheets.

No real files are provided for this assessment, so realistic sample data must be created and made loadable.

Spreadsheet importing itself is outside the current implementation scope.

---

## 2.7 Language and UI

The system must support:

- Arabic names.
- Arabic quiz content.
- Phone-friendly usage.

The student experience should therefore be designed mobile-first, with appropriate RTL support.

---

# 3. High-Level Product Scope

The assessment implementation will be a small quiz platform consisting of:

- Authentication
- Role-based access
- Student quiz discovery
- Student quiz taking
- Timed submissions
- Automatic submission on expiration
- One submission per student per quiz
- Teacher quiz creation/editing
- Quiz publishing
- Configurable availability dates
- Configurable duration
- Configurable number of choices
- Per-question points
- Per-quiz negative marking
- Teacher results
- Student results
- Arabic/RTL support
- Sample data
- Automated tests for important business behavior

The application should remain intentionally simple and should not introduce architecture or functionality that is not justified by the assessment.

---

# 4. Technology & Architecture Decisions

## 4.1 Backend

Use:

- ASP.NET Core Web API
- Entity Framework Core
- SQLite

ASP.NET Core is appropriate because it matches the developer's existing backend experience and supports authentication, authorization, REST APIs, validation, and EF Core efficiently within the assessment timeframe.

SQLite is appropriate because:

- The assessment requires easy local setup.
- The database is small.
- No external database server is necessary.
- It works well with Docker.
- It keeps the project easy for an evaluator to run.

---

## 4.2 Frontend

Use:

- React
- Vite

The frontend should be a single-page application communicating with the ASP.NET Core API.

The student experience should be mobile-first.

The UI should prioritize clarity over visual complexity.

---

## 4.3 Architecture

Use a simple modular/layered architecture.

The project should not introduce unnecessary:

- Microservices
- CQRS
- Event buses
- Generic repository abstractions
- MediatR
- Domain-event infrastructure
- Excessive design patterns

The assessment is evaluating product decisions, code quality, correctness, and ability to handle ambiguity. Overengineering would increase implementation complexity without providing meaningful value for this system.

---

# 5. Core Data Model

The core entities are:

```text
User
Class
Quiz
QuizClass
Question
Choice
Submission
Answer
```

Relationships:

```text
User (Teacher)
    1
    |
    | creates
    *
Quiz
    |
    | 1
    |
    * Question
          |
          | 1
          |
          * Choice


Quiz
    *
    |
    | *
    |
QuizClass
    |
    | *
    |
    * Class


Student User
    1
    |
    | has
    *
Submission
    |
    | 1
    |
    * Answer


Quiz
    1
    |
    | has
    *
Submission
```

---

# 6. User

A `User` represents both students and teachers.

Suggested fields:

```text
Id
Name
Email
PasswordHash
Role
ClassId (nullable)
```

## Role

The initial roles are:

```text
Student
Teacher
```

Students belong to a class.

Teachers do not need a class assignment.

---

# 7. Class

A `Class` represents a student group such as:

```text
10A
10B
11A
```

Suggested fields:

```text
Id
Name
```

A student belongs to one class for this version.

A quiz may target one or more classes.

---

# 8. Quiz

Suggested fields:

```text
Id
Title
Description (optional)
StartAt
EndAt
DurationMinutes
NegativeMarkingEnabled
IsPublished
CreatedByTeacherId
CreatedAt
```

## 8.1 Duration

`DurationMinutes` is configurable per quiz.

Default:

```text
20 minutes
```

The default reflects the client's statement that quizzes are usually 20 minutes.

The value should not be hard-coded.

---

## 8.2 Availability Window

Each quiz has:

```text
StartAt
EndAt
```

A quiz can only be started while it is within its availability window.

The normal active condition is:

```text
IsPublished = true
AND
CurrentTime >= StartAt
AND
CurrentTime < EndAt
```

A quiz whose `EndAt` has been reached is closed.

---

## 8.3 Publication

A quiz can exist as a draft before it is published.

This allows the teacher to prepare the entire quiz before students can see it.

A draft is not available to students.

Publishing makes the quiz visible according to its configured timeline.

---

# 9. Quiz Lifecycle

A quiz conceptually moves through:

```text
Draft
  ↓
Published / Upcoming
  ↓
Live
  ↓
Closed
```

These states are primarily derived from the quiz's publication flag and dates rather than requiring a separate status field.

## Draft

```text
IsPublished = false
```

Students cannot access the quiz.

Teachers can continue preparing it.

---

## Upcoming

```text
IsPublished = true
CurrentTime < StartAt
```

Students may see that a quiz is upcoming, but cannot start it.

---

## Live

```text
IsPublished = true
StartAt <= CurrentTime < EndAt
```

Students who belong to a target class and have not already submitted can start it.

Once a published quiz reaches `StartAt`, its substantive content is locked.

---

## Closed

```text
CurrentTime >= EndAt
```

Students can no longer start or continue the quiz.

Existing incomplete submissions are automatically finalized when their effective deadline is reached.

---

# 10. Quiz Editing Rules

## 10.1 Before the Quiz Goes Live

A teacher can edit the quiz while it is still a draft/upcoming quiz.

This includes:

- Title
- Description
- Start date/time
- End date/time
- Duration
- Negative marking
- Target classes
- Questions
- Question points
- Choices
- Correct answers

---

## 10.2 Once the Quiz Goes Live

Once a published quiz reaches `StartAt`, substantive quiz configuration is locked.

The teacher cannot change:

- Title
- Description
- StartAt
- Duration
- Negative marking
- Target classes
- Questions
- Question points
- Choices
- Correct answers

This prevents students from answering one version of a quiz while the teacher changes the underlying quiz used to calculate results.

---

## 10.3 Deadline Extension Exception

`EndAt` is intentionally treated differently.

A teacher may **extend the deadline after a quiz has gone live**.

This is a realistic operational requirement: a teacher may need to give students more time because of a class delay, technical problem, scheduling change, or another real-world circumstance.

Rules:

- `EndAt` can be moved later.
- `EndAt` cannot be moved earlier after the quiz is live.
- The new `EndAt` must be in the future.
- Extending the quiz does not reset or recreate student submissions.
- The extension applies to students who have not yet reached their own effective deadline.

The API must enforce these rules; the frontend must not be the only protection.

---

# 11. Draft With a Past Start Date

A draft that has passed its configured `StartAt` has never actually gone live because it was not published.

Therefore:

```text
Draft + StartAt in the past + EndAt in the future
```

is still editable.

The teacher may correct the dates or publish it.

If the teacher chooses to publish it while:

```text
StartAt <= CurrentTime < EndAt
```

the quiz will become immediately live.

However, the UI should warn the teacher first.

Example:

> This quiz's start time has already passed. Publishing it now will make it available to students immediately, giving them less time than originally planned. Publish anyway?

The teacher can:

- Cancel
- Publish anyway

---

# 12. Publishing a Closed Draft

If:

```text
CurrentTime >= EndAt
```

the quiz cannot simply be published.

The teacher must first modify its timeline while it is still a draft.

The application should explain why publication is unavailable.

---

# 13. Question

Suggested fields:

```text
Id
QuizId
Text
Points
Order
```

Each question:

- Belongs to exactly one quiz.
- Has a positive point value.
- Has an explicit ordering.
- Has multiple choices.

---

# 14. Choices

Each question has a configurable number of choices.

Allowed range:

```text
Minimum: 2
Maximum: 6
Default: 4
```

The default of four reflects the typical quiz format described by the client.

The number of choices is configurable **per question**, rather than being a single setting for the entire quiz.

For example:

```text
Question 1 → 4 choices
Question 2 → 4 choices
Question 3 → 3 choices
Question 4 → 6 choices
```

Each question must have exactly one correct choice.

Suggested fields:

```text
Id
QuestionId
Text
IsCorrect
Order
```

`IsCorrect` must never be exposed to a student through the quiz-taking API.

---

# 15. Question Points

Every question has its own positive point value.

Example:

```text
Question 1 → 1 point
Question 2 → 2 points
Question 3 → 5 points
```

Points must be greater than zero.

---

# 16. Negative Marking

Negative marking is configured per quiz:

```text
NegativeMarkingEnabled
```

When disabled:

```text
Correct answer   → +question points
Incorrect answer → 0
Unanswered       → 0
```

When enabled:

```text
Correct answer   → +question points
Incorrect answer → -question points
Unanswered       → 0
```

Therefore, for a 5-point question:

```text
Correct   = +5
Incorrect = -5
Unanswered = 0
```

No separate negative-mark value is stored because the client's brief does not specify one.

The question's own point value is used for both the positive and negative value.

---

# 17. Final Score

The calculated score should not be allowed to become negative.

Therefore:

```text
FinalScore = max(0, calculatedScore)
```

For example, if negative marking produces:

```text
-3
```

the student's displayed final score is:

```text
0
```

This prevents a student from receiving a negative final quiz score while still preserving the intended penalty for incorrect answers.

---

# 18. Submission

The entity previously considered an `Attempt` is named:

```text
Submission
```

This terminology better reflects the client's requirement that a student can take a quiz only once.

`Attempt` can imply multiple attempts such as:

```text
Attempt 1
Attempt 2
Attempt 3
```

whereas `Submission` represents the student's single participation/submission for that quiz.

Suggested fields:

```text
Id
QuizId
StudentId
StartedAt
SubmittedAt
Status
Score
```

Possible statuses:

```text
InProgress
Completed
```

There is no need for a separate `Expired` status.

Expiration automatically finalizes the submission as completed.

---

# 19. One Submission Per Student

A student may have at most one submission for a quiz.

This must be enforced at multiple levels.

### Application rule

Before starting a quiz:

```text
if submission exists for student + quiz
    do not allow another submission
```

### Database rule

Create a unique constraint/index on:

```text
(StudentId, QuizId)
```

This protects the business rule even if multiple requests reach the backend concurrently.

---

# 20. Starting a Quiz

The timer begins when the student explicitly starts the quiz.

It does not begin when the quiz becomes available.

When the student starts:

```text
Submission.StartedAt = server current time
```

The server is authoritative for time.

The frontend must not be trusted to decide whether time has expired.

---

# 21. Submission Deadline

A student's effective deadline is:

```text
min(
    Submission.StartedAt + Quiz.DurationMinutes,
    Quiz.EndAt
)
```

This means both limits apply:

1. The student's individual quiz duration.
2. The quiz's overall closing time.

Example:

```text
Quiz opens:       09:00
Quiz closes:      10:00
Duration:         20 minutes

Student starts:   09:45
Effective end:    10:00
```

The student does not receive another 20 minutes after the quiz closes.

---

# 22. Resuming a Submission

If a student closes their browser or leaves the page while their submission is still active:

- The submission remains in progress.
- The student can return to it.
- The server recalculates the remaining time.
- The student cannot reset the timer by refreshing the browser.

If the effective deadline has passed, the submission is finalized.

---

# 23. Automatic Submission

When the effective deadline is reached:

- The submission is automatically finalized.
- The currently saved answers are scored.
- `SubmittedAt` is recorded.
- The submission becomes `Completed`.

The frontend may trigger a final submission request when its countdown reaches zero, but the backend must independently enforce expiration.

This prevents client-side timer manipulation.

---

# 24. Answers

Each `Submission` has one or more `Answer` records.

Suggested fields:

```text
Id
SubmissionId
QuestionId
SelectedChoiceId (nullable)
AwardedPoints
```

`SelectedChoiceId` can be null when a question is unanswered.

`AwardedPoints` should be persisted when the submission is finalized.

This preserves the historical result even if the scoring implementation changes later.

---

# 25. Student Access Rules

A student may start a quiz only when all relevant conditions are satisfied:

```text
User is authenticated
AND
User is a Student
AND
Quiz is published
AND
CurrentTime >= StartAt
AND
CurrentTime < EndAt
AND
Student belongs to a class targeted by the quiz
AND
No Submission exists for Student + Quiz
```

The backend must enforce all of these rules.

---

# 26. Student Quiz Visibility

The frontend should distinguish between different states instead of showing invalid actions.

For example:

### Upcoming

```text
Quiz: Algebra Basics

Starts: Tomorrow at 10:00

Upcoming
```

There should be no Start button.

### Already submitted

```text
Algebra Basics

Already submitted
You can only submit this quiz once.

View result
```

There should be no Retake button.

### Closed

```text
Algebra Basics

Quiz closed
```

There should be no Start button.

### Active

```text
Algebra Basics

20 minutes
15 questions

Start Quiz
```

The Start button is shown only when starting is valid.

---

# 27. Frontend Action Visibility

The frontend should not merely disable actions that the current user cannot perform.

Where practical, invalid actions should **not be presented as buttons at all**.

Instead, the UI should communicate the relevant state.

Examples:

Instead of:

```text
[ Edit Quiz ]  disabled
```

show:

```text
This quiz is live and can no longer be edited.
```

Instead of:

```text
[ Retake Quiz ] disabled
```

show:

```text
Already submitted.
You can only submit this quiz once.
```

Instead of showing:

```text
[ Publish ] disabled
```

when a quiz is already closed, show:

```text
This quiz has already closed and cannot be published.
```

This is a UX decision, not a security mechanism.

---

# 28. Backend Authorization

The backend remains authoritative.

Even if the frontend hides an action, the API must independently reject an invalid request.

For example, a malicious/manual API request attempting to edit a live quiz must still fail.

The frontend should provide good UX.

The backend should provide correctness and security.

---

# 29. Teacher Authorization

Teachers may manage quizzes they created.

A teacher should not be able to edit another teacher's quiz.

Teacher-facing quiz operations must verify ownership.

The backend must enforce ownership rather than relying on frontend filtering.

---

# 30. Teacher Results

Teachers should be able to see how students performed on their quizzes.

At minimum, results should provide useful information such as:

- Student
- Score
- Submission status
- Submission/completion time

The implementation may expose additional useful result information if it fits within the assessment timeframe.

---

# 31. Student Results

Students may see their own result after completing a quiz.

A student must not be able to access another student's result.

The API must enforce ownership.

---

# 32. Correct Answer Security

The student quiz payload must never expose which choice is correct before submission.

In particular, the student-facing API must not return:

```text
IsCorrect
```

for choices.

The correct answer should remain server-side.

Scoring must be performed by the backend.

---

# 33. No Delete Functionality

There will be **no delete functionality in this version**.

No DELETE operations are required for:

- Users
- Classes
- Quizzes
- Questions
- Choices
- Submissions
- Answers

This is intentional.

Historical quiz/submission data should not be casually removed, and implementing deletion correctly would introduce additional questions around historical integrity, ownership, and cascading relationships that are outside the assessment's core requirements.

No soft-delete system is required.

---

# 34. Quiz Editing and Historical Integrity

Once a quiz is live, its scoring-related content is immutable.

This protects historical submissions from becoming ambiguous.

For example, a teacher cannot:

1. Publish a question worth 5 points.
2. Students answer it.
3. Change it to 10 points.
4. Cause existing results to silently change meaning.

The only post-live quiz modification allowed is extending `EndAt`.

---

# 35. Validation Rules

The backend should validate at minimum:

## Quiz

- Title is required.
- StartAt must precede EndAt.
- DurationMinutes must be positive.
- A quiz cannot be published without questions.
- A published quiz must have valid timing.
- A live quiz cannot have its substantive configuration changed.
- A live quiz's EndAt can only be extended.
- A closed quiz cannot be started.
- A closed draft cannot be published without first correcting its dates.

## Question

- Text is required.
- Points must be greater than zero.
- Question must belong to a quiz.
- Question must have 2–6 choices.
- Exactly one choice must be correct.

## Choice

- Text is required.
- Choice must belong to its question.

## Submission

- Student must be eligible for the quiz.
- Student may have only one submission.
- Submission cannot be started after the quiz closes.
- Answers must belong to the submission's quiz.
- A student cannot submit after the server considers the submission expired.

---

# 36. Quiz Publication Validation

A teacher cannot publish a quiz with zero questions.

Before publication, the system should validate that the quiz is structurally valid.

At minimum:

```text
Title exists
StartAt < EndAt
Duration > 0
At least one question
Every question has 2–6 choices
Every question has exactly one correct choice
Every question has positive points
At least one target class
```

The precise target-class requirement is an implementation assumption needed to make student eligibility meaningful.

---

# 37. Quiz/Class Assignment

A quiz can target one or more classes.

This is represented using:

```text
QuizClass
```

rather than putting a single `ClassId` directly on `Quiz`.

This allows a teacher to assign the same quiz to:

```text
10A
10B
```

without creating duplicate quizzes.

Students can access a quiz only if their class is among its target classes.

---

# 38. Time Handling

The backend is authoritative for all business time calculations.

The frontend countdown is a display/UX mechanism.

The frontend must not be trusted for:

- Whether a quiz is open.
- Whether a submission has expired.
- Whether a submission can be finalized.
- Whether a quiz can be edited.
- Whether a deadline extension is valid.

All important time comparisons happen on the server.

---

# 39. Time Zone

The tutoring centre is in Amman.

For this assessment, the application should consistently use the centre's intended local time for quiz scheduling and display.

The implementation should avoid mixing local and UTC values inconsistently.

If the backend stores timestamps in UTC, conversions must be handled consistently when displaying and comparing quiz times.

The important requirement is that teacher-entered quiz times and student-visible times must refer to the same intended schedule.

---

# 40. Arabic & RTL

Arabic text must be supported correctly.

The frontend should support RTL layouts where appropriate.

This includes:

- Arabic names
- Arabic quiz titles
- Arabic question text
- Arabic answer choices
- Student-facing quiz screens

The UI should not assume English-only content.

Sample data should include realistic Arabic names and at least some Arabic quiz content to verify the behavior.

---

# 41. Mobile-First Student Experience

Students are expected to use the quiz system on phones.

The student quiz-taking experience should therefore prioritize:

- Large touch targets.
- Clear question/choice hierarchy.
- Readable text.
- Visible timer.
- Easy navigation.
- Minimal unnecessary UI.
- RTL compatibility.
- Responsive layouts.

Teacher screens may be optimized for desktop as well, but should remain usable on smaller screens.

---

# 42. Timer UX

The active quiz screen should clearly display remaining time.

The timer should:

- Update continuously.
- Be derived from server-authoritative timing information.
- Survive browser refreshes.
- Never reset simply because the page is refreshed.
- Trigger submission behavior when time expires.

The backend remains authoritative if the frontend countdown and server time disagree.

---

# 43. Sample Data

Because no real spreadsheet data is supplied, the project must include realistic sample data.

Sample data should include:

- Students.
- Teachers.
- Classes.
- Quizzes.
- Questions.
- Choices.
- At least some Arabic names/content.
- Different quiz states where useful for demonstration.

The seed data should make it easy for an evaluator to try:

- Student login.
- Teacher login.
- Upcoming quiz.
- Active quiz.
- Completed/submitted quiz.
- Teacher results.

---

# 44. Seeded Passwords

Demo accounts may use a known password:

```text
pa$$1234
```

However, the database must never store this plaintext password.

The seeded password must be passed through the same password-hashing mechanism used by the application.

The resulting hash is what is stored in the database.

The README should provide the plaintext demo password so the evaluator can log in.

---

# 45. Spreadsheet Import

The client expects real data to eventually come from spreadsheets.

Spreadsheet importing is **not part of this assessment implementation**.

Instead:

- Realistic sample data will be provided.
- The sample data must be loadable.
- The project should be structured so future spreadsheet import can be added without requiring the entire application to be redesigned.

This is a deliberate scope decision.

---

# 46. Registration & Password Recovery

The following are outside the current scope:

- Public registration.
- Password reset.
- Email verification.
- Email-based account recovery.
- Social login.
- Multi-factor authentication.

Users are assumed to be provisioned by the tutoring centre.

---

# 47. Other Out-of-Scope Features

Unless required to complete the core workflow, the following are deliberately omitted:

- Spreadsheet upload UI.
- Email notifications.
- SMS notifications.
- Advanced analytics.
- Question banks.
- Randomized question ordering.
- Randomized choice ordering.
- Multiple quiz versions.
- Multiple submissions per student.
- Student account self-management.
- Teacher account self-management.
- Public registration.
- Password recovery.
- Audit-log UI.
- Quiz deletion.
- User deletion.
- Class deletion.
- Complex reporting/export.
- Real-time collaboration.
- Notifications.
- Payment functionality.

These omissions keep the assessment focused on the client's core problem.

---

# 48. No Randomization

Questions and choices will retain their configured order.

Randomizing questions or choices could be useful in a larger production system, but it is not required by the brief and would add complexity to result/debugging behavior.

---

# 49. No Multiple Attempts

A student cannot restart or retake a quiz after creating/submitting their single submission.

The database uniqueness constraint ensures that:

```text
Student + Quiz
```

can have only one `Submission`.

---

# 50. Submission Scoring

Scoring is performed server-side.

For each answered question:

```text
Correct:
    +Question.Points

Incorrect + NegativeMarkingEnabled:
    -Question.Points

Incorrect + NegativeMarkingDisabled:
    0

Unanswered:
    0
```

Then:

```text
FinalScore = max(0, sum(AwardedPoints))
```

The score is stored on the `Submission`.

---

# 51. Submission State

A submission starts as:

```text
InProgress
```

and eventually becomes:

```text
Completed
```

A submission becomes completed when:

- The student manually submits it.
- The effective deadline expires.
- The quiz closes before the student's individual duration expires.

There is no separate expired state.

---

# 52. Answers During an Active Submission

Answers should be persisted during the active quiz rather than relying entirely on the browser's memory.

This allows:

- Browser refresh.
- Temporary navigation away.
- Recovery from a page reload.
- Server-side authoritative submission.

The implementation should avoid making the browser the only source of the student's answers.

---

# 53. Security Principle

The client-side application is never considered trusted.

The backend must protect:

- Authentication.
- Authorization.
- Quiz availability.
- Teacher ownership.
- One-submission enforcement.
- Timer enforcement.
- Correct-answer secrecy.
- Scoring.
- Result access.
- Quiz immutability.

Frontend restrictions are for UX and convenience, not security.

---

# 54. Error Handling & User Feedback

The application should provide understandable messages for invalid operations.

Examples:

### Student already submitted

> You have already submitted this quiz. Each quiz can only be taken once.

### Quiz not yet open

> This quiz is not open yet.

### Quiz closed

> This quiz is closed and can no longer be started.

### Teacher editing live quiz

> You can't edit a live quiz.

### Invalid publication

> This quiz cannot be published until it has at least one valid question.

### Past-start publication

> This quiz's start time has already passed. Publishing it now will make it available immediately and give students less time than originally planned.

Messages should explain the reason rather than simply returning a generic error.

---

# 55. API Authority

All business rules must be enforced at the API layer.

The frontend should never be responsible for deciding whether an operation is valid.

For example, hiding:

```text
Edit
```

does not replace an API authorization/business-rule check.

Likewise, displaying a countdown of zero does not itself submit a quiz.

The backend remains the final authority.

---

# 56. Testing Priorities

Automated tests should focus on business-critical behavior rather than superficial UI coverage.

High-priority tests include:

## Authentication & authorization

- Student can authenticate.
- Teacher can authenticate.
- Student cannot access teacher-only endpoints.
- Teacher cannot manage another teacher's quiz.
- Student cannot access another student's submission/result.

## Quiz availability

- Draft cannot be started.
- Upcoming quiz cannot be started.
- Active quiz can be started by an eligible student.
- Closed quiz cannot be started.
- Student outside the target class cannot start the quiz.

## One-submission rule

- Student can create one submission.
- Second submission is rejected.
- Database uniqueness protects against duplicate submissions.

## Scoring

- Correct answer receives question points.
- Incorrect answer receives zero without negative marking.
- Incorrect answer receives negative question points with negative marking.
- Unanswered question receives zero.
- Final score cannot be negative.

## Timing

- Submission expires at the effective deadline.
- Student cannot extend the timer by refreshing.
- Quiz `EndAt` can cut an active submission short.
- Extending `EndAt` is allowed while live.
- Shortening `EndAt` after going live is rejected.

## Quiz editing

- Draft/upcoming quiz can be edited.
- Live quiz cannot have substantive configuration changed.
- Live quiz's deadline can be extended.
- Live quiz's deadline cannot be shortened.
- Closed quiz cannot be edited as though it were live.

## Security

- Correct answers are not returned to students.
- Students cannot modify scoring.
- Students cannot submit answers belonging to another quiz.
- Students cannot access another student's result.

---

# 57. Documentation Requirements

The repository must contain:

```text
README.md
DECISIONS.md
AI_USAGE.md
CLAUDE.md
```

The assessment explicitly requests these supporting documents.

---

# 58. README Requirements

The README must explain:

- What the project is.
- How to run it.
- How to load sample data.
- Demo login credentials.
- Student workflow.
- Teacher workflow.
- Any required environment variables.
- Any relevant setup assumptions.

The project should be runnable from a clean machine with one primary command, as required by the brief. Docker Compose is preferred for making this straightforward.

---

# 59. AI Usage

Claude Code or a similar AI coding assistant is expected to be used substantially.

`AI_USAGE.md` should honestly document:

- Tools used.
- What the AI was asked to build.
- Important directions given to the AI.
- Where the AI generated code.
- How generated code was reviewed.
- How functionality was tested.
- Where manual decisions were made.

The assessment specifically asks candidates to explain their AI workflow.

---

# 60. CLAUDE.md

`CLAUDE.md` should provide Claude with the project's working rules.

It should summarize:

- Stack.
- Architecture.
- Business rules.
- Naming conventions.
- Testing expectations.
- Security expectations.
- Important decisions.
- Things that must not be changed without explicit approval.

`DECISIONS.md` remains the detailed product/business source of truth.

---

# 61. Commit History

The repository should contain meaningful incremental commits.

Commits should reflect logical milestones such as:

```text
Initialize project structure
Add authentication and roles
Add quiz domain and persistence
Implement teacher quiz management
Implement student quiz flow
Add scoring and submissions
Add automated tests
Add responsive/RTL UI
Add sample data and Docker setup
Complete documentation
```

Avoid making the entire project appear as one unexplained commit.

The brief explicitly asks for meaningful commit history.

---

# 62. Deployment/Execution Principle

The evaluator should be able to clone the repository and run the application without needing undocumented manual setup.

The preferred path is:

```text
docker compose up --build
```

The exact command may differ if the final implementation requires it, but the project must provide one clear primary local-run command.

The brief explicitly states that the project should run from the README with one command on a clean machine.

---

# 63. Deliberate Simplicity

This is an assessment project, not a complete production platform.

Implementation decisions should favor:

1. Correctness.
2. Clear business behavior.
3. Security.
4. Testability.
5. Understandable code.
6. Good mobile UX.
7. Clear documentation.

Over:

- Architectural complexity.
- Feature count.
- Abstractions without a current need.
- Cosmetic polish that hides incomplete business behavior.

If time becomes limited, a smaller honest implementation with clearly documented remaining work is preferable to silently incomplete functionality. This aligns with the assessment's explicit guidance.

---

# 64. Final Data Model Summary

The final relational model is:

```text
User
├── Id
├── Name
├── Email
├── PasswordHash
├── Role
└── ClassId?

Class
├── Id
└── Name

Quiz
├── Id
├── Title
├── Description?
├── StartAt
├── EndAt
├── DurationMinutes
├── NegativeMarkingEnabled
├── IsPublished
├── CreatedByTeacherId
└── CreatedAt

QuizClass
├── QuizId
└── ClassId

Question
├── Id
├── QuizId
├── Text
├── Points
└── Order

Choice
├── Id
├── QuestionId
├── Text
├── IsCorrect
└── Order

Submission
├── Id
├── QuizId
├── StudentId
├── StartedAt
├── SubmittedAt?
├── Status
└── Score

Answer
├── Id
├── SubmissionId
├── QuestionId
├── SelectedChoiceId?
└── AwardedPoints
```

Important constraints:

```text
Submission:
    UNIQUE(StudentId, QuizId)

Question:
    2–6 choices
    exactly 1 correct choice
    Points > 0

Quiz:
    StartAt < EndAt
    DurationMinutes > 0
    at least 1 question before publication

Choice:
    belongs to exactly 1 question

Answer:
    belongs to exactly 1 submission and 1 question
```

---

# 65. Final Business Rules Checklist

Before considering the core product complete, the implementation should satisfy all of the following:

- [ ] Students and teachers can log in.
- [ ] Roles are enforced server-side.
- [ ] Students belong to classes.
- [ ] Teachers own their quizzes.
- [ ] Quizzes can target multiple classes.
- [ ] Teachers can create drafts.
- [ ] Teachers can publish valid quizzes.
- [ ] Students cannot see unpublished quizzes as available.
- [ ] Students can see upcoming quizzes without starting them.
- [ ] Students can only start quizzes during their availability window.
- [ ] Students outside target classes cannot start quizzes.
- [ ] A student can submit a quiz only once.
- [ ] One-submission rule is enforced at database level.
- [ ] Timer starts when the student starts the quiz.
- [ ] Server time is authoritative.
- [ ] Students can resume an unfinished submission.
- [ ] Expired submissions are automatically finalized.
- [ ] Quiz closing time can end a submission.
- [ ] Duration defaults to 20 minutes but is configurable.
- [ ] Questions support 2–6 choices.
- [ ] Four choices are the default.
- [ ] Each question has its own point value.
- [ ] Each question has exactly one correct choice.
- [ ] Negative marking can be enabled per quiz.
- [ ] Incorrect answers receive negative question points when enabled.
- [ ] Incorrect answers receive zero when disabled.
- [ ] Unanswered questions receive zero.
- [ ] Final score cannot be negative.
- [ ] Correct answers are never exposed to students before submission.
- [ ] Students can see their own results.
- [ ] Teachers can see results for their quizzes.
- [ ] Students cannot see other students' results.
- [ ] Draft/upcoming quizzes can be edited.
- [ ] Live quiz content is locked.
- [ ] Live quiz deadline can be extended.
- [ ] Live quiz deadline cannot be shortened.
- [ ] Publishing a past-start draft triggers a warning.
- [ ] A closed draft cannot simply be published.
- [ ] Invalid frontend actions are hidden rather than merely disabled where practical.
- [ ] Backend still rejects invalid actions.
- [ ] No delete functionality is implemented.
- [ ] Arabic content works.
- [ ] RTL layout works.
- [ ] Student experience is mobile-friendly.
- [ ] Realistic sample data is included.
- [ ] Seeded passwords are stored as proper password hashes.
- [ ] Demo credentials are documented.
- [ ] Important business rules have automated tests.
- [ ] README supports one-command setup.
- [ ] AI usage is documented.
- [ ] Claude-specific project guidance is documented.
- [ ] Commit history is meaningful.
- [ ] Deliberate omissions and future work are documented.

---

# 66. Intentionally Deferred / Next-Week Possibilities

The following are reasonable future improvements but should not distract from the assessment implementation:

- Spreadsheet import.
- Bulk student/teacher creation.
- Password reset.
- Email notifications.
- Quiz analytics and charts.
- Exportable results.
- Audit history for quiz changes.
- Question banks.
- Randomized questions/choices.
- More sophisticated teacher permissions.
- Student profile management.
- More advanced reporting.
- Production-grade observability.
- More comprehensive accessibility work.
- Richer quiz authoring experience.

These can be documented as future work rather than partially implementing them now.

---

# 67. Decision Philosophy

When an unspecified requirement is encountered during implementation, follow these principles:

1. Protect the integrity of existing submissions.
2. Keep the behavior predictable for teachers and students.
3. Enforce important rules on the backend.
4. Prefer explicit user feedback over silent behavior.
5. Avoid destructive operations.
6. Avoid unnecessary complexity.
7. Preserve historical scoring correctness.
8. Prefer the simplest behavior that satisfies the client's stated need.
9. Document meaningful assumptions rather than hiding them.
10. If a new requirement materially conflicts with these decisions, stop and document the conflict rather than silently changing the product behavior.

The goal is not to build every feature a real tutoring platform might eventually need. The goal is to build a coherent, reliable first version that solves the client's stated problem and demonstrates thoughtful handling of the requirements the brief intentionally leaves unspecified.