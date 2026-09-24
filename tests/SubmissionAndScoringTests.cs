using Backend.DTOs;
using Backend.Services;
using Backend.Tests.Helpers;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace Backend.Tests;

public class SubmissionAndScoringTests
{
    [Fact]
    public async Task StartQuizAsync_ReturnsResponseWithDeadlineAndQuiz()
    {
        using var db = new TestDb();
        var teacher = await TestData.CreateTeacherAsync(db.Context);
        var cls = await TestData.CreateClassAsync(db.Context, "ClassA");
        var student = await TestData.CreateStudentAsync(db.Context, cls.Id);
        var quizService = new QuizService(db.Context);
        var (quizId, _, _) = await TestData.SeedLiveQuizWithTwoQuestionsAsync(db.Context, quizService, teacher.Id, cls.Id);
        var submissionService = new SubmissionService(db.Context, quizService);

        var result = await submissionService.StartQuizAsync(quizId, student.Id);

        result.Should().NotBeNull();
        result.SubmissionId.Should().BeGreaterThan(0);
        result.EffectiveDeadline.Should().BeAfter(result.StartedAt);
        result.Quiz.Questions.Should().HaveCount(2);
    }

    [Fact]
    public async Task SubmitQuizAsync_AllCorrect_ScoresFullMarks()
    {
        using var db = new TestDb();
        var teacher = await TestData.CreateTeacherAsync(db.Context);
        var cls = await TestData.CreateClassAsync(db.Context, "ClassA");
        var student = await TestData.CreateStudentAsync(db.Context, cls.Id);
        var quizService = new QuizService(db.Context);
        var (quizId, q1, q2) = await TestData.SeedLiveQuizWithTwoQuestionsAsync(db.Context, quizService, teacher.Id, cls.Id);
        var submissionService = new SubmissionService(db.Context, quizService);

        var start = await submissionService.StartQuizAsync(quizId, student.Id);
        var correct1 = await db.Context.Choices.FirstAsync(c => c.QuestionId == q1.Id && c.IsCorrect);
        var correct2 = await db.Context.Choices.FirstAsync(c => c.QuestionId == q2.Id && c.IsCorrect);

        var result = await submissionService.SubmitQuizAsync(start.SubmissionId, student.Id, new SubmitQuizRequest(
            new List<SubmitAnswerRequest>
            {
                new(q1.Id, correct1.Id),
                new(q2.Id, correct2.Id)
            }));

        result.Score.Should().Be(10);
        result.MaxPossibleScore.Should().Be(10);
        result.Answers.Should().OnlyContain(a => a.IsCorrect);
        result.Answers.Should().OnlyContain(a => a.AwardedPoints == 5);
    }

    [Fact]
    public async Task SubmitQuizAsync_PartialCorrect_NoNegativeMarking_ScoresPartial()
    {
        using var db = new TestDb();
        var teacher = await TestData.CreateTeacherAsync(db.Context);
        var cls = await TestData.CreateClassAsync(db.Context, "ClassA");
        var student = await TestData.CreateStudentAsync(db.Context, cls.Id);
        var quizService = new QuizService(db.Context);
        var (quizId, q1, q2) = await TestData.SeedLiveQuizWithTwoQuestionsAsync(db.Context, quizService, teacher.Id, cls.Id, negativeMarking: false);
        var submissionService = new SubmissionService(db.Context, quizService);

        var start = await submissionService.StartQuizAsync(quizId, student.Id);
        var correct1 = await db.Context.Choices.FirstAsync(c => c.QuestionId == q1.Id && c.IsCorrect);
        var wrong2 = await db.Context.Choices.FirstAsync(c => c.QuestionId == q2.Id && !c.IsCorrect);

        var result = await submissionService.SubmitQuizAsync(start.SubmissionId, student.Id, new SubmitQuizRequest(
            new List<SubmitAnswerRequest>
            {
                new(q1.Id, correct1.Id),
                new(q2.Id, wrong2.Id)
            }));

        result.Score.Should().Be(5);
        var wrongAnswer = result.Answers.First(a => a.QuestionId == q2.Id);
        wrongAnswer.IsCorrect.Should().BeFalse();
        wrongAnswer.AwardedPoints.Should().Be(0);
    }

    [Fact]
    public async Task SubmitQuizAsync_WrongAnswer_WithNegativeMarking_FloorsScoreAtZero()
    {
        using var db = new TestDb();
        var teacher = await TestData.CreateTeacherAsync(db.Context);
        var cls = await TestData.CreateClassAsync(db.Context, "ClassA");
        var student = await TestData.CreateStudentAsync(db.Context, cls.Id);
        var quizService = new QuizService(db.Context);
        var (quizId, q1, q2) = await TestData.SeedLiveQuizWithTwoQuestionsAsync(db.Context, quizService, teacher.Id, cls.Id, negativeMarking: true);
        var submissionService = new SubmissionService(db.Context, quizService);

        var start = await submissionService.StartQuizAsync(quizId, student.Id);
        var correct1 = await db.Context.Choices.FirstAsync(c => c.QuestionId == q1.Id && c.IsCorrect);
        var wrong2 = await db.Context.Choices.FirstAsync(c => c.QuestionId == q2.Id && !c.IsCorrect);

        var result = await submissionService.SubmitQuizAsync(start.SubmissionId, student.Id, new SubmitQuizRequest(
            new List<SubmitAnswerRequest>
            {
                new(q1.Id, correct1.Id),
                new(q2.Id, wrong2.Id)
            }));

        result.Score.Should().Be(0);
        var wrongAnswer = result.Answers.First(a => a.QuestionId == q2.Id);
        wrongAnswer.IsCorrect.Should().BeFalse();
        wrongAnswer.AwardedPoints.Should().Be(-5);
    }

    [Fact]
    public async Task SubmitQuizAsync_WithSkippedQuestion_UnderNegativeMarking_OnlyCountsCorrect()
    {
        using var db = new TestDb();
        var teacher = await TestData.CreateTeacherAsync(db.Context);
        var cls = await TestData.CreateClassAsync(db.Context, "ClassA");
        var student = await TestData.CreateStudentAsync(db.Context, cls.Id);
        var quizService = new QuizService(db.Context);
        var (quizId, q1, q2) = await TestData.SeedLiveQuizWithTwoQuestionsAsync(db.Context, quizService, teacher.Id, cls.Id, negativeMarking: true);
        var submissionService = new SubmissionService(db.Context, quizService);

        var start = await submissionService.StartQuizAsync(quizId, student.Id);
        var correct1 = await db.Context.Choices.FirstAsync(c => c.QuestionId == q1.Id && c.IsCorrect);

        var result = await submissionService.SubmitQuizAsync(start.SubmissionId, student.Id, new SubmitQuizRequest(
            new List<SubmitAnswerRequest>
            {
                new(q1.Id, correct1.Id),
                new(q2.Id, null)
            }));

        result.Score.Should().Be(5);
        var skipped = result.Answers.First(a => a.QuestionId == q2.Id);
        skipped.AwardedPoints.Should().Be(0);
        skipped.IsCorrect.Should().BeFalse();
    }

    [Fact]
    public async Task SubmitQuizAsync_WhenAlreadyCompleted_Throws()
    {
        using var db = new TestDb();
        var teacher = await TestData.CreateTeacherAsync(db.Context);
        var cls = await TestData.CreateClassAsync(db.Context, "ClassA");
        var student = await TestData.CreateStudentAsync(db.Context, cls.Id);
        var quizService = new QuizService(db.Context);
        var (quizId, q1, q2) = await TestData.SeedLiveQuizWithTwoQuestionsAsync(db.Context, quizService, teacher.Id, cls.Id);
        var submissionService = new SubmissionService(db.Context, quizService);

        var start = await submissionService.StartQuizAsync(quizId, student.Id);
        var correct1 = await db.Context.Choices.FirstAsync(c => c.QuestionId == q1.Id && c.IsCorrect);
        var correct2 = await db.Context.Choices.FirstAsync(c => c.QuestionId == q2.Id && c.IsCorrect);

        await submissionService.SubmitQuizAsync(start.SubmissionId, student.Id, new SubmitQuizRequest(
            new List<SubmitAnswerRequest> { new(q1.Id, correct1.Id), new(q2.Id, correct2.Id) }));

        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            submissionService.SubmitQuizAsync(start.SubmissionId, student.Id, new SubmitQuizRequest(
                new List<SubmitAnswerRequest> { new(q1.Id, correct1.Id), new(q2.Id, correct2.Id) })));
        ex.Message.Should().Contain("already submitted");
    }

    [Fact]
    public async Task StartQuizAsync_WhenSubmissionAlreadyExists_ReturnsNull()
    {
        using var db = new TestDb();
        var teacher = await TestData.CreateTeacherAsync(db.Context);
        var cls = await TestData.CreateClassAsync(db.Context, "ClassA");
        var student = await TestData.CreateStudentAsync(db.Context, cls.Id);
        var quizService = new QuizService(db.Context);
        var (quizId, _, _) = await TestData.SeedLiveQuizWithTwoQuestionsAsync(db.Context, quizService, teacher.Id, cls.Id);
        var submissionService = new SubmissionService(db.Context, quizService);

        await submissionService.StartQuizAsync(quizId, student.Id);
        var secondAttempt = await submissionService.StartQuizAsync(quizId, student.Id);

        secondAttempt.Should().BeNull();
    }
}
