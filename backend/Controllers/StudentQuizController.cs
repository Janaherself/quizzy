using Backend.DTOs;
using Backend.Models;
using Backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers;

[ApiController]
[Route("api/student/quizzes")]
[Authorize(Roles = "Student")]
public class StudentQuizController : ControllerBase
{
    private readonly IQuizService _quizService;
    private readonly ISubmissionService _submissionService;

    public StudentQuizController(IQuizService quizService, ISubmissionService submissionService)
    {
        _quizService = quizService;
        _submissionService = submissionService;
    }

    private int GetStudentId()
    {
        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier) ?? User.FindFirst("sub");
        return int.Parse(userIdClaim!.Value);
    }

    [HttpGet]
    public async Task<ActionResult<List<QuizSummaryDto>>> GetAvailableQuizzes()
    {
        var studentId = GetStudentId();
        await _submissionService.AutoFinalizeExpiredSubmissionsForStudentAsync(studentId);
        var quizzes = await _quizService.GetStudentQuizzesAsync(studentId);
        return Ok(quizzes);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<QuizForTakingDto>> GetQuizForTaking(int id)
    {
        var studentId = GetStudentId();
        var quiz = await _quizService.GetQuizForTakingAsync(id, studentId);
        if (quiz == null)
            return NotFound(new ErrorResponse("Quiz not available"));
        return Ok(quiz);
    }

    [HttpPost("{id}/start")]
    public async Task<ActionResult<StartQuizResponse>> StartQuiz(int id)
    {
        var studentId = GetStudentId();
        var result = await _submissionService.StartQuizAsync(id, studentId);
        if (result == null)
            return BadRequest(new ErrorResponse("Cannot start this quiz"));
        return Ok(result);
    }

    [HttpGet("submissions/{submissionId}")]
    public async Task<ActionResult<object>> GetSubmission(int submissionId)
    {
        var studentId = GetStudentId();
        var submission = await _submissionService.GetSubmissionAsync(submissionId, studentId);
        if (submission == null)
            return NotFound(new ErrorResponse("Submission not found"));
        return Ok(new { submission.Id, submission.QuizId, submission.StartedAt, submission.SubmittedAt, submission.Status, submission.Score });
    }

    [HttpPost("submissions/{submissionId}/answers")]
    public async Task<ActionResult<object>> SaveAnswer(int submissionId, [FromBody] SubmitAnswerRequest request)
    {
        var studentId = GetStudentId();
        var submission = await _submissionService.SaveAnswerAsync(submissionId, studentId, request.QuestionId, request.SelectedChoiceId);
        if (submission == null)
            return NotFound(new ErrorResponse("Submission not found or already completed"));
        return Ok(new { submission.Id, submission.Status });
    }

    [HttpPost("submissions/{submissionId}/submit")]
    public async Task<ActionResult<QuizResultDto>> SubmitQuiz(int submissionId, SubmitQuizRequest request)
    {
        var studentId = GetStudentId();
        try
        {
            var result = await _submissionService.SubmitQuizAsync(submissionId, studentId, request);
            if (result == null)
                return NotFound(new ErrorResponse("Submission not found"));
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new ErrorResponse(ex.Message));
        }
    }

    [HttpGet("{quizId}/result")]
    public async Task<ActionResult<QuizResultDto>> GetQuizResult(int quizId)
    {
        var studentId = GetStudentId();
        var result = await _submissionService.GetQuizResultAsync(quizId, studentId);
        if (result == null)
            return NotFound(new ErrorResponse("No submission found for this quiz"));
        return Ok(result);
    }
}