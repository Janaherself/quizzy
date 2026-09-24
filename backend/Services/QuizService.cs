using Backend.Data;
using Backend.Models;
using Backend.DTOs;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services;

public interface IQuizService
{
    Task<QuizDto?> CreateQuizAsync(int teacherId, CreateQuizRequest request);
    Task<QuizDto?> GetQuizByIdAsync(int quizId, int teacherId);
    Task<List<QuizSummaryDto>> GetTeacherQuizzesAsync(int teacherId);
    Task<QuizDto?> UpdateQuizAsync(int quizId, int teacherId, UpdateQuizRequest request);
    Task<QuizDto?> ExtendDeadlineAsync(int quizId, int teacherId, ExtendQuizDeadlineRequest request);
    Task<QuizDto?> PublishQuizAsync(int quizId, int teacherId);
    Task<bool> DeleteQuizAsync(int quizId, int teacherId);
    Task<List<QuizSummaryDto>> GetStudentQuizzesAsync(int studentId);
    Task<QuizForTakingDto?> GetQuizForTakingAsync(int quizId, int studentId);
    Task<bool> CanStudentStartQuizAsync(int quizId, int studentId);
    QuizStatus GetQuizStatus(Quiz quiz);
}

public class QuizService : IQuizService
{
    private readonly AppDbContext _context;

    public QuizService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<QuizDto?> CreateQuizAsync(int teacherId, CreateQuizRequest request)
    {
        var teacher = await _context.Users.FindAsync(teacherId);
        if (teacher == null || teacher.Role != UserRole.Teacher)
            return null;

        if (request.StartAt >= request.EndAt)
            throw new ArgumentException("StartAt must be before EndAt");

        if (request.DurationMinutes <= 0)
            throw new ArgumentException("DurationMinutes must be positive");

        if (!request.TargetClassIds.Any())
            throw new ArgumentException("At least one target class is required");

        var classes = await _context.Classes
            .Where(c => request.TargetClassIds.Contains(c.Id))
            .ToListAsync();

        if (classes.Count != request.TargetClassIds.Count)
            throw new ArgumentException("One or more target classes not found");

        var quiz = new Quiz
        {
            Title = request.Title,
            Description = request.Description,
            StartAt = request.StartAt,
            EndAt = request.EndAt,
            DurationMinutes = request.DurationMinutes,
            NegativeMarkingEnabled = request.NegativeMarkingEnabled,
            IsPublished = false,
            CreatedByTeacherId = teacherId,
            CreatedAt = DateTime.UtcNow,
            QuizClasses = classes.Select(c => new QuizClass { ClassId = c.Id }).ToList()
        };

        _context.Quizzes.Add(quiz);
        await _context.SaveChangesAsync();

        return await GetQuizByIdAsync(quiz.Id, teacherId);
    }

    public async Task<QuizDto?> GetQuizByIdAsync(int quizId, int teacherId)
    {
        var quiz = await _context.Quizzes
            .Include(q => q.Questions.OrderBy(q => q.Order))
                .ThenInclude(q => q.Choices.OrderBy(c => c.Order))
            .Include(q => q.QuizClasses)
                .ThenInclude(qc => qc.Class)
            .Include(q => q.CreatedByTeacher)
            .FirstOrDefaultAsync(q => q.Id == quizId && q.CreatedByTeacherId == teacherId);

        return quiz != null ? MapToQuizDto(quiz) : null;
    }

    public async Task<List<QuizSummaryDto>> GetTeacherQuizzesAsync(int teacherId)
    {
        var quizzes = await _context.Quizzes
            .Include(q => q.Questions)
            .Include(q => q.QuizClasses)
                .ThenInclude(qc => qc.Class)
            .Where(q => q.CreatedByTeacherId == teacherId)
            .OrderByDescending(q => q.CreatedAt)
            .ToListAsync();

        return quizzes.Select(q => MapToQuizSummaryDto(q)).ToList();
    }

    public async Task<QuizDto?> UpdateQuizAsync(int quizId, int teacherId, UpdateQuizRequest request)
    {
        var quiz = await _context.Quizzes
            .Include(q => q.QuizClasses)
            .FirstOrDefaultAsync(q => q.Id == quizId && q.CreatedByTeacherId == teacherId);

        if (quiz == null)
            return null;

        var status = GetQuizStatus(quiz);
        if (status == QuizStatus.Live || status == QuizStatus.Closed)
            throw new InvalidOperationException("Cannot edit a live or closed quiz");

        if (request.StartAt >= request.EndAt)
            throw new ArgumentException("StartAt must be before EndAt");

        if (request.DurationMinutes <= 0)
            throw new ArgumentException("DurationMinutes must be positive");

        if (!request.TargetClassIds.Any())
            throw new ArgumentException("At least one target class is required");

        var classes = await _context.Classes
            .Where(c => request.TargetClassIds.Contains(c.Id))
            .ToListAsync();

        if (classes.Count != request.TargetClassIds.Count)
            throw new ArgumentException("One or more target classes not found");

        quiz.Title = request.Title;
        quiz.Description = request.Description;
        quiz.StartAt = request.StartAt;
        quiz.EndAt = request.EndAt;
        quiz.DurationMinutes = request.DurationMinutes;
        quiz.NegativeMarkingEnabled = request.NegativeMarkingEnabled;

        quiz.QuizClasses.Clear();
        foreach (var c in classes)
        {
            quiz.QuizClasses.Add(new QuizClass { ClassId = c.Id });
        }

        await _context.SaveChangesAsync();

        return await GetQuizByIdAsync(quizId, teacherId);
    }

    public async Task<QuizDto?> ExtendDeadlineAsync(int quizId, int teacherId, ExtendQuizDeadlineRequest request)
    {
        var quiz = await _context.Quizzes
            .FirstOrDefaultAsync(q => q.Id == quizId && q.CreatedByTeacherId == teacherId);

        if (quiz == null)
            return null;

        var status = GetQuizStatus(quiz);
        if (status != QuizStatus.Live)
            throw new InvalidOperationException("Can only extend deadline for live quizzes");

        if (request.NewEndAt <= quiz.EndAt)
            throw new ArgumentException("New EndAt must be later than current EndAt");

        if (request.NewEndAt <= DateTime.UtcNow)
            throw new ArgumentException("New EndAt must be in the future");

        quiz.EndAt = request.NewEndAt;
        await _context.SaveChangesAsync();

        return await GetQuizByIdAsync(quizId, teacherId);
    }

    public async Task<QuizDto?> PublishQuizAsync(int quizId, int teacherId)
    {
        var quiz = await _context.Quizzes
            .Include(q => q.Questions)
                .ThenInclude(q => q.Choices)
            .Include(q => q.QuizClasses)
            .FirstOrDefaultAsync(q => q.Id == quizId && q.CreatedByTeacherId == teacherId);

        if (quiz == null)
            return null;

        if (quiz.IsPublished)
            throw new InvalidOperationException("Quiz is already published");

        ValidateQuizForPublication(quiz);

        quiz.IsPublished = true;
        await _context.SaveChangesAsync();

        return await GetQuizByIdAsync(quizId, teacherId);
    }

    public async Task<bool> DeleteQuizAsync(int quizId, int teacherId)
    {
        var quiz = await _context.Quizzes
            .FirstOrDefaultAsync(q => q.Id == quizId && q.CreatedByTeacherId == teacherId);

        if (quiz == null)
            return false;

        if (quiz.IsPublished)
            throw new InvalidOperationException("Cannot delete a published quiz");

        _context.Quizzes.Remove(quiz);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<List<QuizSummaryDto>> GetStudentQuizzesAsync(int studentId)
    {
        var student = await _context.Users
            .Include(u => u.Class)
            .FirstOrDefaultAsync(u => u.Id == studentId);

        if (student == null || student.Role != UserRole.Student || student.ClassId == null)
            return new List<QuizSummaryDto>();

        var now = DateTime.UtcNow;

        var quizzes = await _context.Quizzes
            .Include(q => q.Questions)
            .Include(q => q.QuizClasses)
                .ThenInclude(qc => qc.Class)
            .Where(q => q.IsPublished
                && q.EndAt > now
                && q.QuizClasses.Any(qc => qc.ClassId == student.ClassId))
            .ToListAsync();

        var submissions = await _context.Submissions
            .Where(s => s.StudentId == studentId && quizzes.Select(q => q.Id).Contains(s.QuizId))
            .ToDictionaryAsync(s => s.QuizId);

        return quizzes.Select(q => MapToQuizSummaryDto(q, submissions.GetValueOrDefault(q.Id))).ToList();
    }

    public async Task<QuizForTakingDto?> GetQuizForTakingAsync(int quizId, int studentId)
    {
        var canStart = await CanStudentStartQuizAsync(quizId, studentId);
        if (!canStart)
            return null;

        var quiz = await _context.Quizzes
            .Include(q => q.Questions.OrderBy(q => q.Order))
                .ThenInclude(q => q.Choices.OrderBy(c => c.Order))
            .FirstOrDefaultAsync(q => q.Id == quizId);

        if (quiz == null)
            return null;

        return new QuizForTakingDto(
            quiz.Id,
            quiz.Title,
            quiz.Description,
            quiz.DurationMinutes,
            quiz.NegativeMarkingEnabled,
            quiz.Questions.Select(q => new QuestionForTakingDto(
                q.Id,
                q.Text,
                q.Points,
                q.Order,
                q.Choices.Select(c => new ChoiceForTakingDto(c.Id, c.Text, c.Order)).ToList()
            )).ToList()
        );
    }

    public async Task<bool> CanStudentStartQuizAsync(int quizId, int studentId)
    {
        var student = await _context.Users.FindAsync(studentId);
        if (student == null || student.Role != UserRole.Student || student.ClassId == null)
            return false;

        var quiz = await _context.Quizzes
            .Include(q => q.QuizClasses)
            .FirstOrDefaultAsync(q => q.Id == quizId);

        if (quiz == null)
            return false;

        var now = DateTime.UtcNow;
        if (!quiz.IsPublished || now < quiz.StartAt || now >= quiz.EndAt)
            return false;

        if (!quiz.QuizClasses.Any(qc => qc.ClassId == student.ClassId))
            return false;

        var existingSubmission = await _context.Submissions
            .AnyAsync(s => s.QuizId == quizId && s.StudentId == studentId);

        if (existingSubmission)
            return false;

        return true;
    }

    public QuizStatus GetQuizStatus(Quiz quiz)
    {
        var now = DateTime.UtcNow;

        if (!quiz.IsPublished)
            return QuizStatus.Draft;

        if (now < quiz.StartAt)
            return QuizStatus.Upcoming;

        if (now >= quiz.EndAt)
            return QuizStatus.Closed;

        return QuizStatus.Live;
    }

    private void ValidateQuizForPublication(Quiz quiz)
    {
        if (string.IsNullOrWhiteSpace(quiz.Title))
            throw new ArgumentException("Title is required");

        if (quiz.StartAt >= quiz.EndAt)
            throw new ArgumentException("StartAt must be before EndAt");

        if (quiz.DurationMinutes <= 0)
            throw new ArgumentException("DurationMinutes must be positive");

        if (!quiz.Questions.Any())
            throw new ArgumentException("Quiz must have at least one question");

        if (!quiz.QuizClasses.Any())
            throw new ArgumentException("Quiz must have at least one target class");

        foreach (var question in quiz.Questions)
        {
            if (string.IsNullOrWhiteSpace(question.Text))
                throw new ArgumentException($"Question {question.Order}: Text is required");

            if (question.Points <= 0)
                throw new ArgumentException($"Question {question.Order}: Points must be positive");

            var choices = question.Choices.ToList();
            if (choices.Count < 2 || choices.Count > 6)
                throw new ArgumentException($"Question {question.Order}: Must have 2-6 choices");

            var correctCount = choices.Count(c => c.IsCorrect);
            if (correctCount != 1)
                throw new ArgumentException($"Question {question.Order}: Must have exactly one correct choice");

            foreach (var choice in choices)
            {
                if (string.IsNullOrWhiteSpace(choice.Text))
                    throw new ArgumentException($"Question {question.Order}: Choice text is required");
            }
        }
    }

    private static QuizDto MapToQuizDto(Quiz quiz)
    {
        return new QuizDto(
            quiz.Id,
            quiz.Title,
            quiz.Description,
            quiz.StartAt,
            quiz.EndAt,
            quiz.DurationMinutes,
            quiz.NegativeMarkingEnabled,
            quiz.IsPublished,
            quiz.CreatedByTeacherId,
            quiz.CreatedByTeacher?.Name ?? "",
            quiz.CreatedAt,
            quiz.QuizClasses.Select(qc => qc.ClassId).ToList(),
            quiz.Questions.Select(MapToQuestionDto).ToList(),
            GetQuizStatusStatic(quiz).ToString()
        );
    }

    private static QuizSummaryDto MapToQuizSummaryDto(Quiz quiz, Submission? submission = null)
    {
        var status = GetQuizStatusStatic(quiz);
        string displayStatus;

        if (submission != null)
        {
            displayStatus = submission.Status == SubmissionStatus.Completed ? "Completed" : "InProgress";
        }
        else
        {
            displayStatus = status.ToString();
        }

        return new QuizSummaryDto(
            quiz.Id,
            quiz.Title,
            quiz.Description,
            quiz.StartAt,
            quiz.EndAt,
            quiz.DurationMinutes,
            quiz.NegativeMarkingEnabled,
            quiz.IsPublished,
            quiz.QuizClasses.Select(qc => qc.ClassId).ToList(),
            quiz.Questions.Count,
            displayStatus
        );
    }

    private static QuestionDto MapToQuestionDto(Question question)
    {
        return new QuestionDto(
            question.Id,
            question.Text,
            question.Points,
            question.Order,
            question.Choices.Select(c => new ChoiceDto(c.Id, c.Text, c.Order)).ToList()
        );
    }

    private static QuizStatus GetQuizStatusStatic(Quiz quiz)
    {
        var now = DateTime.UtcNow;

        if (!quiz.IsPublished)
            return QuizStatus.Draft;

        if (now < quiz.StartAt)
            return QuizStatus.Upcoming;

        if (now >= quiz.EndAt)
            return QuizStatus.Closed;

        return QuizStatus.Live;
    }
}

public enum QuizStatus
{
    Draft,
    Upcoming,
    Live,
    Closed
}