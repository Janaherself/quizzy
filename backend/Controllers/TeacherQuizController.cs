using Backend.DTOs;
using Backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers;

[ApiController]
[Route("api/teacher/quizzes")]
[Authorize(Roles = "Teacher")]
public class TeacherQuizController : ControllerBase
{
    private readonly IQuizService _quizService;
    private readonly ISubmissionService _submissionService;

    public TeacherQuizController(IQuizService quizService, ISubmissionService submissionService)
    {
        _quizService = quizService;
        _submissionService = submissionService;
    }

    private int GetTeacherId()
    {
        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier) ?? User.FindFirst("sub");
        return int.Parse(userIdClaim!.Value);
    }

    [HttpGet]
    public async Task<ActionResult<List<QuizSummaryDto>>> GetMyQuizzes()
    {
        var teacherId = GetTeacherId();
        var quizzes = await _quizService.GetTeacherQuizzesAsync(teacherId);
        return Ok(quizzes);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<QuizDto>> GetQuiz(int id)
    {
        var teacherId = GetTeacherId();
        var quiz = await _quizService.GetQuizByIdAsync(id, teacherId);
        if (quiz == null)
            return NotFound(new ErrorResponse("Quiz not found"));
        return Ok(quiz);
    }

    [HttpPost]
    public async Task<ActionResult<QuizDto>> CreateQuiz(CreateQuizRequest request)
    {
        var teacherId = GetTeacherId();
        try
        {
            var quiz = await _quizService.CreateQuizAsync(teacherId, request);
            if (quiz == null)
                return BadRequest(new ErrorResponse("Failed to create quiz"));
            return CreatedAtAction(nameof(GetQuiz), new { id = quiz.Id }, quiz);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new ErrorResponse(ex.Message));
        }
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<QuizDto>> UpdateQuiz(int id, UpdateQuizRequest request)
    {
        var teacherId = GetTeacherId();
        try
        {
            var quiz = await _quizService.UpdateQuizAsync(id, teacherId, request);
            if (quiz == null)
                return NotFound(new ErrorResponse("Quiz not found"));
            return Ok(quiz);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new ErrorResponse(ex.Message));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new ErrorResponse(ex.Message));
        }
    }

    [HttpPatch("{id}/extend-deadline")]
    public async Task<ActionResult<QuizDto>> ExtendDeadline(int id, ExtendQuizDeadlineRequest request)
    {
        var teacherId = GetTeacherId();
        try
        {
            var quiz = await _quizService.ExtendDeadlineAsync(id, teacherId, request);
            if (quiz == null)
                return NotFound(new ErrorResponse("Quiz not found"));
            return Ok(quiz);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new ErrorResponse(ex.Message));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new ErrorResponse(ex.Message));
        }
    }

    [HttpPost("{id}/publish")]
    public async Task<ActionResult<QuizDto>> PublishQuiz(int id)
    {
        var teacherId = GetTeacherId();
        try
        {
            var quiz = await _quizService.PublishQuizAsync(id, teacherId);
            if (quiz == null)
                return NotFound(new ErrorResponse("Quiz not found"));
            return Ok(quiz);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new ErrorResponse(ex.Message));
        }
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteQuiz(int id)
    {
        var teacherId = GetTeacherId();
        try
        {
            var result = await _quizService.DeleteQuizAsync(id, teacherId);
            if (!result)
                return NotFound(new ErrorResponse("Quiz not found"));
            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new ErrorResponse(ex.Message));
        }
    }

    [HttpGet("{id}/results")]
    public async Task<ActionResult<List<TeacherQuizResultDto>>> GetQuizResults(int id)
    {
        var teacherId = GetTeacherId();
        var results = await _submissionService.GetTeacherQuizResultsAsync(id, teacherId);
        return Ok(results);
    }
}