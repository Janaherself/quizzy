using Backend.Data;
using Backend.Models;
using Backend.DTOs;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services;

public interface ISubmissionService
{
    Task<StartQuizResponse?> StartQuizAsync(int quizId, int studentId);
    Task<Submission?> GetSubmissionAsync(int submissionId, int studentId);
    Task<QuizResultDto?> SubmitQuizAsync(int submissionId, int studentId, SubmitQuizRequest request);
    Task<QuizResultDto?> GetQuizResultAsync(int quizId, int studentId);
    Task<List<TeacherQuizResultDto>> GetTeacherQuizResultsAsync(int quizId, int teacherId);
    Task<Submission?> SaveAnswerAsync(int submissionId, int studentId, int questionId, int? selectedChoiceId);
    Task<Submission?> AutoFinalizeExpiredSubmissionsAsync();
    Task AutoFinalizeExpiredSubmissionsForStudentAsync(int studentId);
}

public class SubmissionService : ISubmissionService
{
    private readonly AppDbContext _context;
    private readonly IQuizService _quizService;

    public SubmissionService(AppDbContext context, IQuizService quizService)
    {
        _context = context;
        _quizService = quizService;
    }

    public async Task<StartQuizResponse?> StartQuizAsync(int quizId, int studentId)
    {
        var canStart = await _quizService.CanStudentStartQuizAsync(quizId, studentId);
        if (!canStart)
            return null;

        var quiz = await _context.Quizzes
            .Include(q => q.Questions.OrderBy(q => q.Order))
                .ThenInclude(q => q.Choices.OrderBy(c => c.Order))
            .FirstOrDefaultAsync(q => q.Id == quizId);

        if (quiz == null)
            return null;

        var now = DateTime.UtcNow;
        var effectiveDeadline = now.AddMinutes(quiz.DurationMinutes);
        if (quiz.EndAt < effectiveDeadline)
            effectiveDeadline = quiz.EndAt;

        var submission = new Submission
        {
            QuizId = quizId,
            StudentId = studentId,
            StartedAt = now,
            Status = SubmissionStatus.InProgress,
            Score = 0
        };

        _context.Submissions.Add(submission);
        await _context.SaveChangesAsync();

        var quizForTaking = new QuizForTakingDto(
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

        return new StartQuizResponse(submission.Id, now, effectiveDeadline, quizForTaking);
    }

    public async Task<Submission?> GetSubmissionAsync(int submissionId, int studentId)
    {
        return await _context.Submissions
            .Include(s => s.Answers)
            .Include(s => s.Quiz)
                .ThenInclude(q => q.Questions)
                    .ThenInclude(q => q.Choices)
            .FirstOrDefaultAsync(s => s.Id == submissionId && s.StudentId == studentId);
    }

    public async Task<QuizResultDto?> SubmitQuizAsync(int submissionId, int studentId, SubmitQuizRequest request)
    {
        var submission = await _context.Submissions
            .Include(s => s.Quiz)
                .ThenInclude(q => q.Questions)
                    .ThenInclude(q => q.Choices)
            .Include(s => s.Answers)
            .FirstOrDefaultAsync(s => s.Id == submissionId && s.StudentId == studentId);

        if (submission == null)
            return null;

        if (submission.Status == SubmissionStatus.Completed)
            throw new InvalidOperationException("Quiz already submitted");

        var now = DateTime.UtcNow;
        var effectiveDeadline = submission.StartedAt.AddMinutes(submission.Quiz.DurationMinutes);
        if (submission.Quiz.EndAt < effectiveDeadline)
            effectiveDeadline = submission.Quiz.EndAt;

        if (now > effectiveDeadline)
        {
            await FinalizeSubmissionAsync(submission);
            return BuildQuizResult(submission);
        }

        foreach (var answerRequest in request.Answers)
        {
            var question = submission.Quiz.Questions.FirstOrDefault(q => q.Id == answerRequest.QuestionId);
            if (question == null)
                continue;

            var existingAnswer = submission.Answers.FirstOrDefault(a => a.QuestionId == answerRequest.QuestionId);
            int? selectedChoiceId = answerRequest.SelectedChoiceId;

            if (selectedChoiceId.HasValue)
            {
                var choice = question.Choices.FirstOrDefault(c => c.Id == selectedChoiceId.Value);
                if (choice == null)
                    continue;
            }

            if (existingAnswer != null)
            {
                existingAnswer.SelectedChoiceId = selectedChoiceId;
            }
            else
            {
                submission.Answers.Add(new Answer
                {
                    QuestionId = answerRequest.QuestionId,
                    SelectedChoiceId = selectedChoiceId
                });
            }
        }

        await FinalizeSubmissionAsync(submission);
        return BuildQuizResult(submission);
    }

    public async Task<QuizResultDto?> GetQuizResultAsync(int quizId, int studentId)
    {
        var submission = await _context.Submissions
            .Include(s => s.Quiz)
                .ThenInclude(q => q.Questions)
                    .ThenInclude(q => q.Choices)
            .Include(s => s.Answers)
            .FirstOrDefaultAsync(s => s.QuizId == quizId && s.StudentId == studentId);

        return submission != null ? BuildQuizResult(submission) : null;
    }

    public async Task<List<TeacherQuizResultDto>> GetTeacherQuizResultsAsync(int quizId, int teacherId)
    {
        var quiz = await _context.Quizzes
            .Include(q => q.Questions)
            .FirstOrDefaultAsync(q => q.Id == quizId && q.CreatedByTeacherId == teacherId);

        if (quiz == null)
            return new List<TeacherQuizResultDto>();

        var submissions = await _context.Submissions
            .Include(s => s.Student)
                .ThenInclude(u => u.Class)
            .Where(s => s.QuizId == quizId)
            .OrderByDescending(s => s.StartedAt)
            .ToListAsync();

        var results = new List<TeacherQuizResultDto>();

        foreach (var submission in submissions)
        {
            var maxScore = quiz.Questions.Sum(q => q.Points);
            results.Add(new TeacherQuizResultDto(
                submission.Id,
                submission.StudentId,
                submission.Student.Name,
                submission.Student.Class?.Name,
                submission.Score,
                maxScore,
                submission.StartedAt,
                submission.SubmittedAt,
                submission.Status.ToString()
            ));
        }

        return results;
    }

    public async Task<Submission?> SaveAnswerAsync(int submissionId, int studentId, int questionId, int? selectedChoiceId)
    {
        var submission = await _context.Submissions
            .Include(s => s.Quiz)
                .ThenInclude(q => q.Questions)
                    .ThenInclude(q => q.Choices)
            .Include(s => s.Answers)
            .FirstOrDefaultAsync(s => s.Id == submissionId && s.StudentId == studentId);

        if (submission == null || submission.Status == SubmissionStatus.Completed)
            return null;

        var now = DateTime.UtcNow;
        var effectiveDeadline = submission.StartedAt.AddMinutes(submission.Quiz.DurationMinutes);
        if (submission.Quiz.EndAt < effectiveDeadline)
            effectiveDeadline = submission.Quiz.EndAt;

        if (now > effectiveDeadline)
        {
            await FinalizeSubmissionAsync(submission);
            return submission;
        }

        var question = submission.Quiz.Questions.FirstOrDefault(q => q.Id == questionId);
        if (question == null)
            return null;

        if (selectedChoiceId.HasValue)
        {
            var choice = question.Choices.FirstOrDefault(c => c.Id == selectedChoiceId.Value);
            if (choice == null)
                return null;
        }

        var existingAnswer = submission.Answers.FirstOrDefault(a => a.QuestionId == questionId);
        if (existingAnswer != null)
        {
            existingAnswer.SelectedChoiceId = selectedChoiceId;
        }
        else
        {
            submission.Answers.Add(new Answer
            {
                QuestionId = questionId,
                SelectedChoiceId = selectedChoiceId
            });
        }

        await _context.SaveChangesAsync();
        return submission;
    }

    public async Task<Submission?> AutoFinalizeExpiredSubmissionsAsync()
    {
        var now = DateTime.UtcNow;

        var expiredSubmissions = await _context.Submissions
            .Include(s => s.Quiz)
            .Include(s => s.Answers)
            .Where(s => s.Status == SubmissionStatus.InProgress)
            .ToListAsync();

        foreach (var submission in expiredSubmissions)
        {
            var effectiveDeadline = submission.StartedAt.AddMinutes(submission.Quiz.DurationMinutes);
            if (submission.Quiz.EndAt < effectiveDeadline)
                effectiveDeadline = submission.Quiz.EndAt;

            if (now >= effectiveDeadline)
            {
                await FinalizeSubmissionAsync(submission);
            }
        }

        await _context.SaveChangesAsync();
        return null;
    }

    public async Task AutoFinalizeExpiredSubmissionsForStudentAsync(int studentId)
    {
        var now = DateTime.UtcNow;

        var expiredSubmissions = await _context.Submissions
            .Include(s => s.Quiz)
            .Include(s => s.Answers)
            .Where(s => s.StudentId == studentId && s.Status == SubmissionStatus.InProgress)
            .ToListAsync();

        foreach (var submission in expiredSubmissions)
        {
            var effectiveDeadline = submission.StartedAt.AddMinutes(submission.Quiz.DurationMinutes);
            if (submission.Quiz.EndAt < effectiveDeadline)
                effectiveDeadline = submission.Quiz.EndAt;

            if (now >= effectiveDeadline)
            {
                await FinalizeSubmissionAsync(submission);
            }
        }

        await _context.SaveChangesAsync();
    }

    private async Task FinalizeSubmissionAsync(Submission submission)
    {
        if (submission.Status == SubmissionStatus.Completed)
            return;

        var quiz = submission.Quiz;
        int totalScore = 0;

        foreach (var answer in submission.Answers)
        {
            var question = quiz.Questions.FirstOrDefault(q => q.Id == answer.QuestionId);
            if (question == null)
            {
                answer.AwardedPoints = 0;
                continue;
            }

            var correctChoice = question.Choices.FirstOrDefault(c => c.IsCorrect);
            bool isCorrect = answer.SelectedChoiceId.HasValue && 
                            correctChoice != null && 
                            answer.SelectedChoiceId.Value == correctChoice.Id;

            if (!answer.SelectedChoiceId.HasValue)
            {
                answer.AwardedPoints = 0;
            }
            else if (isCorrect)
            {
                answer.AwardedPoints = question.Points;
            }
            else if (quiz.NegativeMarkingEnabled)
            {
                answer.AwardedPoints = -question.Points;
            }
            else
            {
                answer.AwardedPoints = 0;
            }

            totalScore += answer.AwardedPoints;
        }

        submission.Score = Math.Max(0, totalScore);
        submission.SubmittedAt = DateTime.UtcNow;
        submission.Status = SubmissionStatus.Completed;

        await _context.SaveChangesAsync();
    }

    private QuizResultDto BuildQuizResult(Submission submission)
    {
        var quiz = submission.Quiz;
        var maxScore = quiz.Questions.Sum(q => q.Points);

        var answers = new List<AnswerResultDto>();
        var correctCount = 0;

        foreach (var question in quiz.Questions.OrderBy(q => q.Order))
        {
            var answer = submission.Answers.FirstOrDefault(a => a.QuestionId == question.Id);
            var correctChoice = question.Choices.FirstOrDefault(c => c.IsCorrect);
            var selectedChoice = answer?.SelectedChoiceId.HasValue == true
                ? question.Choices.FirstOrDefault(c => c.Id == answer.SelectedChoiceId.Value)
                : null;

            bool isCorrect = answer?.SelectedChoiceId.HasValue == true &&
                            correctChoice != null &&
                            answer.SelectedChoiceId.Value == correctChoice.Id;

            if (isCorrect)
                correctCount++;

            answers.Add(new AnswerResultDto(
                question.Id,
                question.Text,
                question.Points,
                answer?.SelectedChoiceId,
                selectedChoice?.Text,
                correctChoice?.Id ?? 0,
                correctChoice?.Text ?? "",
                answer?.AwardedPoints ?? 0,
                isCorrect
            ));
        }

        return new QuizResultDto(
            submission.Id,
            quiz.Id,
            quiz.Title,
            submission.Score,
            maxScore,
            correctCount,
            submission.StartedAt,
            submission.SubmittedAt ?? DateTime.UtcNow,
            submission.Status.ToString(),
            answers
        );
    }
}