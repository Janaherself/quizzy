using Backend.Data;
using Backend.DTOs;
using Backend.Services;
using Backend.Tests.Helpers;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace Backend.Tests;

public class QuizAvailabilityTests
{
    private static async Task PublishAsync(AppDbContext ctx, int quizId)
    {
        var quiz = await ctx.Quizzes.FirstAsync(q => q.Id == quizId);
        quiz.IsPublished = true;
        await ctx.SaveChangesAsync();
    }

    [Fact]
    public async Task GetStudentQuizzesAsync_ReturnsPublishedLiveQuizInStudentsClass()
    {
        using var db = new TestDb();
        var teacher = await TestData.CreateTeacherAsync(db.Context);
        var cls = await TestData.CreateClassAsync(db.Context, "ClassA");
        var student = await TestData.CreateStudentAsync(db.Context, cls.Id);
        var quizService = new QuizService(db.Context);

        var quiz = await quizService.CreateQuizAsync(teacher.Id, new CreateQuizRequest(
            "Live Quiz", null, DateTime.UtcNow.AddDays(-1), DateTime.UtcNow.AddDays(5),
            20, false, new List<int> { cls.Id }));
        await TestData.AddQuestionAsync(db.Context, quiz.Id, 5, 1);
        await PublishAsync(db.Context, quiz.Id);

        var result = await quizService.GetStudentQuizzesAsync(student.Id);

        result.Should().ContainSingle();
        result[0].Id.Should().Be(quiz.Id);
        result[0].QuestionCount.Should().Be(1);
    }

    [Fact]
    public async Task GetStudentQuizzesAsync_ExcludesUnpublishedDraft()
    {
        using var db = new TestDb();
        var teacher = await TestData.CreateTeacherAsync(db.Context);
        var cls = await TestData.CreateClassAsync(db.Context, "ClassA");
        var student = await TestData.CreateStudentAsync(db.Context, cls.Id);
        var quizService = new QuizService(db.Context);

        var quiz = await quizService.CreateQuizAsync(teacher.Id, new CreateQuizRequest(
            "Draft", null, DateTime.UtcNow.AddDays(-1), DateTime.UtcNow.AddDays(5),
            20, false, new List<int> { cls.Id }));
        await TestData.AddQuestionAsync(db.Context, quiz.Id, 5, 1);

        var result = await quizService.GetStudentQuizzesAsync(student.Id);

        result.Should().BeEmpty();
    }

    [Fact]
    public async Task GetStudentQuizzesAsync_ExcludesClosedQuizzes()
    {
        using var db = new TestDb();
        var teacher = await TestData.CreateTeacherAsync(db.Context);
        var cls = await TestData.CreateClassAsync(db.Context, "ClassA");
        var student = await TestData.CreateStudentAsync(db.Context, cls.Id);
        var quizService = new QuizService(db.Context);

        var quiz = await quizService.CreateQuizAsync(teacher.Id, new CreateQuizRequest(
            "Closed", null, DateTime.UtcNow.AddDays(-5), DateTime.UtcNow.AddDays(-1),
            20, false, new List<int> { cls.Id }));
        await TestData.AddQuestionAsync(db.Context, quiz.Id, 5, 1);
        await PublishAsync(db.Context, quiz.Id);

        var result = await quizService.GetStudentQuizzesAsync(student.Id);

        result.Should().BeEmpty();
    }

    [Fact]
    public async Task GetStudentQuizzesAsync_ExcludesQuizzesOutsideStudentsClass()
    {
        using var db = new TestDb();
        var teacher = await TestData.CreateTeacherAsync(db.Context);
        var clsA = await TestData.CreateClassAsync(db.Context, "ClassA");
        var clsB = await TestData.CreateClassAsync(db.Context, "ClassB");
        var student = await TestData.CreateStudentAsync(db.Context, clsA.Id);
        var quizService = new QuizService(db.Context);

        var quiz = await quizService.CreateQuizAsync(teacher.Id, new CreateQuizRequest(
            "Other Class", null, DateTime.UtcNow.AddDays(-1), DateTime.UtcNow.AddDays(5),
            20, false, new List<int> { clsB.Id }));
        await TestData.AddQuestionAsync(db.Context, quiz.Id, 5, 1);
        await PublishAsync(db.Context, quiz.Id);

        var result = await quizService.GetStudentQuizzesAsync(student.Id);

        result.Should().BeEmpty();
    }

    [Fact]
    public async Task GetQuizForTaking_ReturnsChoicesAndBlocksStartAfterSubmissionExists()
    {
        using var db = new TestDb();
        var teacher = await TestData.CreateTeacherAsync(db.Context);
        var cls = await TestData.CreateClassAsync(db.Context, "ClassA");
        var student = await TestData.CreateStudentAsync(db.Context, cls.Id);
        var quizService = new QuizService(db.Context);

        var quiz = await quizService.CreateQuizAsync(teacher.Id, new CreateQuizRequest(
            "Takeable", null, DateTime.UtcNow.AddDays(-1), DateTime.UtcNow.AddDays(5),
            20, false, new List<int> { cls.Id }));
        await TestData.AddQuestionAsync(db.Context, quiz.Id, 5, 1);
        await PublishAsync(db.Context, quiz.Id);

        var forTaking = await quizService.GetQuizForTakingAsync(quiz.Id, student.Id);
        forTaking.Should().NotBeNull();
        forTaking.Questions.Should().HaveCount(1);
        // choices are returned WITHOUT the IsCorrect flag
        forTaking.Questions[0].Choices.Should().HaveCount(2);

        (await quizService.CanStudentStartQuizAsync(quiz.Id, student.Id)).Should().BeTrue();

        var submissionService = new SubmissionService(db.Context, quizService);
        await submissionService.StartQuizAsync(quiz.Id, student.Id);

        (await quizService.CanStudentStartQuizAsync(quiz.Id, student.Id)).Should().BeFalse();
    }
}
