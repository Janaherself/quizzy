using Backend.Models;

namespace Backend.DTOs;

public record LoginRequest(string Email, string Password);
public record LoginResponse(string Token, UserDto User);

public record UserDto(int Id, string Name, string Email, string Role, int? ClassId, string? ClassName);

public record CreateQuizRequest(
    string Title,
    string? Description,
    DateTime StartAt,
    DateTime EndAt,
    int DurationMinutes,
    bool NegativeMarkingEnabled,
    List<int> TargetClassIds
);

public record UpdateQuizRequest(
    string Title,
    string? Description,
    DateTime StartAt,
    DateTime EndAt,
    int DurationMinutes,
    bool NegativeMarkingEnabled,
    List<int> TargetClassIds
);

public record ExtendQuizDeadlineRequest(DateTime NewEndAt);

public record QuizDto(
    int Id,
    string Title,
    string? Description,
    DateTime StartAt,
    DateTime EndAt,
    int DurationMinutes,
    bool NegativeMarkingEnabled,
    bool IsPublished,
    int CreatedByTeacherId,
    string TeacherName,
    DateTime CreatedAt,
    List<int> TargetClassIds,
    List<QuestionDto> Questions,
    string Status
);

public record QuizSummaryDto(
    int Id,
    string Title,
    string? Description,
    DateTime StartAt,
    DateTime EndAt,
    int DurationMinutes,
    bool NegativeMarkingEnabled,
    bool IsPublished,
    List<int> TargetClassIds,
    int QuestionCount,
    string Status
);

public record QuestionDto(
    int Id,
    string Text,
    int Points,
    int Order,
    List<ChoiceDto> Choices
);

public record ChoiceDto(
    int Id,
    string Text,
    int Order
);

public record ChoiceWithCorrectDto(
    int Id,
    string Text,
    int Order,
    bool IsCorrect
);

public record QuestionForTeacherDto(
    int Id,
    string Text,
    int Points,
    int Order,
    List<ChoiceWithCorrectDto> Choices
);

public record CreateQuestionRequest(
    string Text,
    int Points,
    int Order,
    List<CreateChoiceRequest> Choices
);

public record CreateChoiceRequest(
    string Text,
    bool IsCorrect,
    int Order
);

public record UpdateQuestionRequest(
    string Text,
    int Points,
    int Order,
    List<UpdateChoiceRequest> Choices
);

public record UpdateChoiceRequest(
    int? Id,
    string Text,
    bool IsCorrect,
    int Order
);

public record PublishQuizRequest();

public record StartQuizResponse(
    int SubmissionId,
    DateTime StartedAt,
    DateTime EffectiveDeadline,
    QuizForTakingDto Quiz
);

public record QuizForTakingDto(
    int Id,
    string Title,
    string? Description,
    int DurationMinutes,
    bool NegativeMarkingEnabled,
    List<QuestionForTakingDto> Questions
);

public record QuestionForTakingDto(
    int Id,
    string Text,
    int Points,
    int Order,
    List<ChoiceForTakingDto> Choices
);

public record ChoiceForTakingDto(
    int Id,
    string Text,
    int Order
);

public record SubmitAnswerRequest(
    int QuestionId,
    int? SelectedChoiceId
);

public record SubmitQuizRequest(
    List<SubmitAnswerRequest> Answers
);

public record QuizResultDto(
    int SubmissionId,
    int QuizId,
    string QuizTitle,
    int Score,
    int MaxPossibleScore,
    int CorrectCount,
    DateTime StartedAt,
    DateTime SubmittedAt,
    string Status,
    List<AnswerResultDto> Answers
);

public record AnswerResultDto(
    int QuestionId,
    string QuestionText,
    int QuestionPoints,
    int? SelectedChoiceId,
    string? SelectedChoiceText,
    int CorrectChoiceId,
    string CorrectChoiceText,
    int AwardedPoints,
    bool IsCorrect
);

public record TeacherQuizResultDto(
    int SubmissionId,
    int StudentId,
    string StudentName,
    string? ClassName,
    int Score,
    int MaxPossibleScore,
    DateTime StartedAt,
    DateTime? SubmittedAt,
    string Status
);

public record ClassDto(int Id, string Name);

public record ErrorResponse(string Message, string? Details = null);