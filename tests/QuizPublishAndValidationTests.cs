using Backend.DTOs;
using Backend.Services;
using Backend.Tests.Helpers;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace Backend.Tests;

public class QuizPublishAndValidationTests
{
    [Fact]
    public async Task CreateQuizAsync_ValidRequest_ReturnsDraftQuiz()
    {
        using var db = new TestDb();
        var teacher = await TestData.CreateTeacherAsync(db.Context);
        var cls = await TestData.CreateClassAsync(db.Context, "ClassA");
        var quizService = new QuizService(db.Context);

        var quiz = await quizService.CreateQuizAsync(teacher.Id, new CreateQuizRequest(
            "New Quiz", "desc", DateTime.UtcNow.AddDays(-1), DateTime.UtcNow.AddDays(5),
            20, false, new List<int> { cls.Id }));

        quiz.Should().NotBeNull();
        quiz.IsPublished.Should().BeFalse();
        quiz.Status.Should().Be("Draft");
        quiz.TargetClassIds.Should().Contain(cls.Id);
    }

    [Fact]
    public async Task CreateQuizAsync_StartAtNotBeforeEndAt_Throws()
    {
        using var db = new TestDb();
        var teacher = await TestData.CreateTeacherAsync(db.Context);
        var cls = await TestData.CreateClassAsync(db.Context, "ClassA");
        var quizService = new QuizService(db.Context);

        var ex = await Assert.ThrowsAsync<ArgumentException>(() => quizService.CreateQuizAsync(teacher.Id, new CreateQuizRequest(
            "Bad", null, DateTime.UtcNow.AddDays(5), DateTime.UtcNow.AddDays(-1),
            20, false, new List<int> { cls.Id })));
        ex.Message.Should().Contain("StartAt must be before EndAt");
    }

    [Fact]
    public async Task CreateQuizAsync_NoTargetClasses_Throws()
    {
        using var db = new TestDb();
        var teacher = await TestData.CreateTeacherAsync(db.Context);
        var quizService = new QuizService(db.Context);

        var ex = await Assert.ThrowsAsync<ArgumentException>(() => quizService.CreateQuizAsync(teacher.Id, new CreateQuizRequest(
            "No Classes", null, DateTime.UtcNow.AddDays(-1), DateTime.UtcNow.AddDays(5),
            20, false, new List<int>())));
        ex.Message.Should().Contain("At least one target class is required");
    }

    [Fact]
    public async Task CreateQuizAsync_TargetClassNotFound_Throws()
    {
        using var db = new TestDb();
        var teacher = await TestData.CreateTeacherAsync(db.Context);
        var cls = await TestData.CreateClassAsync(db.Context, "ClassA");
        var quizService = new QuizService(db.Context);

        var ex = await Assert.ThrowsAsync<ArgumentException>(() => quizService.CreateQuizAsync(teacher.Id, new CreateQuizRequest(
            "Missing Class", null, DateTime.UtcNow.AddDays(-1), DateTime.UtcNow.AddDays(5),
            20, false, new List<int> { 999 })));
        ex.Message.Should().Contain("One or more target classes not found");
    }

    [Fact]
    public async Task CreateQuizAsync_NonPositiveDuration_Throws()
    {
        using var db = new TestDb();
        var teacher = await TestData.CreateTeacherAsync(db.Context);
        var cls = await TestData.CreateClassAsync(db.Context, "ClassA");
        var quizService = new QuizService(db.Context);

        var ex = await Assert.ThrowsAsync<ArgumentException>(() => quizService.CreateQuizAsync(teacher.Id, new CreateQuizRequest(
            "Zero Duration", null, DateTime.UtcNow.AddDays(-1), DateTime.UtcNow.AddDays(5),
            0, false, new List<int> { cls.Id })));
        ex.Message.Should().Contain("DurationMinutes must be positive");
    }

    [Fact]
    public async Task PublishQuizAsync_WithoutQuestions_Throws()
    {
        using var db = new TestDb();
        var teacher = await TestData.CreateTeacherAsync(db.Context);
        var cls = await TestData.CreateClassAsync(db.Context, "ClassA");
        var quizService = new QuizService(db.Context);

        var quiz = await quizService.CreateQuizAsync(teacher.Id, new CreateQuizRequest(
            "No Questions", null, DateTime.UtcNow.AddDays(-1), DateTime.UtcNow.AddDays(5),
            20, false, new List<int> { cls.Id }));

        var ex = await Assert.ThrowsAsync<ArgumentException>(() => quizService.PublishQuizAsync(quiz.Id, teacher.Id));
        ex.Message.Should().Contain("at least one question");
    }

    [Fact]
    public async Task PublishQuizAsync_PublishesAndDoublePublishThrows()
    {
        using var db = new TestDb();
        var teacher = await TestData.CreateTeacherAsync(db.Context);
        var cls = await TestData.CreateClassAsync(db.Context, "ClassA");
        var quizService = new QuizService(db.Context);

        var quiz = await quizService.CreateQuizAsync(teacher.Id, new CreateQuizRequest(
            "To Publish", null, DateTime.UtcNow.AddDays(-1), DateTime.UtcNow.AddDays(5),
            20, false, new List<int> { cls.Id }));
        await TestData.AddQuestionAsync(db.Context, quiz.Id, 5, 1);

        var published = await quizService.PublishQuizAsync(quiz.Id, teacher.Id);
        published.Should().NotBeNull();
        published.IsPublished.Should().BeTrue();
        published.Status.Should().Be("Live");

        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() => quizService.PublishQuizAsync(quiz.Id, teacher.Id));
        ex.Message.Should().Contain("already published");
    }
}
