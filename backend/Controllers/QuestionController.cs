using Backend.Data;
using Backend.Models;
using Backend.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.Controllers;

[ApiController]
[Route("api/teacher/quizzes/{quizId}/questions")]
[Authorize(Roles = "Teacher")]
public class QuestionController : ControllerBase
{
    private readonly AppDbContext _context;

    public QuestionController(AppDbContext context)
    {
        _context = context;
    }

    private int GetTeacherId()
    {
        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
        return int.Parse(userIdClaim!.Value);
    }

    private async Task<Quiz?> GetOwnedQuizAsync(int quizId, int teacherId)
    {
        return await _context.Quizzes
            .Include(q => q.Questions)
                .ThenInclude(q => q.Choices)
            .FirstOrDefaultAsync(q => q.Id == quizId && q.CreatedByTeacherId == teacherId);
    }

    [HttpGet]
    public async Task<ActionResult<List<QuestionForTeacherDto>>> GetQuestions(int quizId)
    {
        var teacherId = GetTeacherId();
        var quiz = await GetOwnedQuizAsync(quizId, teacherId);
        if (quiz == null)
            return NotFound(new ErrorResponse("Quiz not found"));

        var questions = quiz.Questions
            .OrderBy(q => q.Order)
            .Select(MapToTeacherDto)
            .ToList();

        return Ok(questions);
    }

    [HttpGet("{questionId}")]
    public async Task<ActionResult<QuestionForTeacherDto>> GetQuestion(int quizId, int questionId)
    {
        var teacherId = GetTeacherId();
        var quiz = await GetOwnedQuizAsync(quizId, teacherId);
        if (quiz == null)
            return NotFound(new ErrorResponse("Quiz not found"));

        var question = quiz.Questions.FirstOrDefault(q => q.Id == questionId);
        if (question == null)
            return NotFound(new ErrorResponse("Question not found"));

        return Ok(MapToTeacherDto(question));
    }

    [HttpPost]
    public async Task<ActionResult<QuestionForTeacherDto>> CreateQuestion(int quizId, CreateQuestionRequest request)
    {
        var teacherId = GetTeacherId();
        var quiz = await GetOwnedQuizAsync(quizId, teacherId);
        if (quiz == null)
            return NotFound(new ErrorResponse("Quiz not found"));

        var status = GetQuizStatus(quiz);
        if (status == QuizStatus.Live || status == QuizStatus.Closed)
            return BadRequest(new ErrorResponse("Cannot add questions to a live or closed quiz"));

        ValidateQuestionRequest(request);

        var maxOrder = quiz.Questions.Any() ? quiz.Questions.Max(q => q.Order) : 0;

        var question = new Question
        {
            QuizId = quizId,
            Text = request.Text,
            Points = request.Points,
            Order = request.Order > 0 ? request.Order : maxOrder + 1,
            Choices = request.Choices.Select((c, i) => new Choice
            {
                Text = c.Text,
                IsCorrect = c.IsCorrect,
                Order = c.Order > 0 ? c.Order : i + 1
            }).ToList()
        };

        _context.Questions.Add(question);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetQuestion), new { quizId, questionId = question.Id }, MapToTeacherDto(question));
    }

    [HttpPut("{questionId}")]
    public async Task<ActionResult<QuestionForTeacherDto>> UpdateQuestion(int quizId, int questionId, UpdateQuestionRequest request)
    {
        var teacherId = GetTeacherId();
        var quiz = await GetOwnedQuizAsync(quizId, teacherId);
        if (quiz == null)
            return NotFound(new ErrorResponse("Quiz not found"));

        var status = GetQuizStatus(quiz);
        if (status == QuizStatus.Live || status == QuizStatus.Closed)
            return BadRequest(new ErrorResponse("Cannot edit questions in a live or closed quiz"));

        var question = quiz.Questions.FirstOrDefault(q => q.Id == questionId);
        if (question == null)
            return NotFound(new ErrorResponse("Question not found"));

        ValidateQuestionRequest(request);

        question.Text = request.Text;
        question.Points = request.Points;
        question.Order = request.Order;

        var choiceDict = question.Choices.ToDictionary(c => c.Id);

        foreach (var choiceRequest in request.Choices)
        {
            if (choiceRequest.Id.HasValue && choiceDict.TryGetValue(choiceRequest.Id.Value, out var existingChoice))
            {
                existingChoice.Text = choiceRequest.Text;
                existingChoice.IsCorrect = choiceRequest.IsCorrect;
                existingChoice.Order = choiceRequest.Order;
            }
            else
            {
                question.Choices.Add(new Choice
                {
                    Text = choiceRequest.Text,
                    IsCorrect = choiceRequest.IsCorrect,
                    Order = choiceRequest.Order
                });
            }
        }

        await _context.SaveChangesAsync();
        return Ok(MapToTeacherDto(question));
    }

    [HttpDelete("{questionId}")]
    public async Task<ActionResult> DeleteQuestion(int quizId, int questionId)
    {
        var teacherId = GetTeacherId();
        var quiz = await GetOwnedQuizAsync(quizId, teacherId);
        if (quiz == null)
            return NotFound(new ErrorResponse("Quiz not found"));

        var status = GetQuizStatus(quiz);
        if (status == QuizStatus.Live || status == QuizStatus.Closed)
            return BadRequest(new ErrorResponse("Cannot delete questions from a live or closed quiz"));

        var question = quiz.Questions.FirstOrDefault(q => q.Id == questionId);
        if (question == null)
            return NotFound(new ErrorResponse("Question not found"));

        _context.Questions.Remove(question);
        await _context.SaveChangesAsync();
        return NoContent();
    }

    private void ValidateQuestionRequest(CreateQuestionRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Text))
            throw new ArgumentException("Question text is required");

        if (request.Points <= 0)
            throw new ArgumentException("Points must be positive");

        if (request.Choices.Count < 2 || request.Choices.Count > 6)
            throw new ArgumentException("Question must have 2-6 choices");

        var correctCount = request.Choices.Count(c => c.IsCorrect);
        if (correctCount != 1)
            throw new ArgumentException("Question must have exactly one correct choice");

        foreach (var choice in request.Choices)
        {
            if (string.IsNullOrWhiteSpace(choice.Text))
                throw new ArgumentException("Choice text is required");
        }
    }

    private void ValidateQuestionRequest(UpdateQuestionRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Text))
            throw new ArgumentException("Question text is required");

        if (request.Points <= 0)
            throw new ArgumentException("Points must be positive");

        if (request.Choices.Count < 2 || request.Choices.Count > 6)
            throw new ArgumentException("Question must have 2-6 choices");

        var correctCount = request.Choices.Count(c => c.IsCorrect);
        if (correctCount != 1)
            throw new ArgumentException("Question must have exactly one correct choice");

        foreach (var choice in request.Choices)
        {
            if (string.IsNullOrWhiteSpace(choice.Text))
                throw new ArgumentException("Choice text is required");
        }
    }

    private static QuestionForTeacherDto MapToTeacherDto(Question question)
    {
        return new QuestionForTeacherDto(
            question.Id,
            question.Text,
            question.Points,
            question.Order,
            question.Choices
                .OrderBy(c => c.Order)
                .Select(c => new ChoiceWithCorrectDto(c.Id, c.Text, c.Order, c.IsCorrect))
                .ToList()
        );
    }

    private QuizStatus GetQuizStatus(Quiz quiz)
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