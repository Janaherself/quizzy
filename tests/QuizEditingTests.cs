using Backend.DTOs;
using Backend.Services;
using Backend.Tests.Helpers;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace Backend.Tests;

public class QuizEditingTests
{
    [Fact]
    public async Task UpdateQuizAsync_UpdatesTitleAndTargetClasses()
    {
        using var db = new TestDb();
        var teacher = await TestData.CreateTeacherAsync(db.Context);
        var classA = await TestData.CreateClassAsync(db.Context, "ClassA");
        var classB = await TestData.CreateClassAsync(db.Context, "ClassB");
        var quizService = new QuizService(db.Context);

        var quiz = await quizService.CreateQuizAsync(teacher.Id, new CreateQuizRequest(
            "Original", null, DateTime.UtcNow.AddDays(-1), DateTime.UtcNow.AddDays(5),
            20, false, new List<int> { classA.Id }));

        var updated = await quizService.UpdateQuizAsync(quiz.Id, teacher.Id, new UpdateQuizRequest(
            "Updated Title", "updated desc", DateTime.UtcNow.AddDays(-1), DateTime.UtcNow.AddDays(5),
            30, true, new List<int> { classA.Id, classB.Id }));

        updated.Should().NotBeNull();
        updated.Title.Should().Be("Updated Title");
        updated.DurationMinutes.Should().Be(30);
        updated.NegativeMarkingEnabled.Should().BeTrue();
        updated.TargetClassIds.Should().BeEquivalentTo(new[] { classA.Id, classB.Id });
    }

    [Fact]
    public async Task UpdateQuizAsync_ThrowsOnLiveQuiz()
    {
        using var db = new TestDb();
        var teacher = await TestData.CreateTeacherAsync(db.Context);
        var cls = await TestData.CreateClassAsync(db.Context, "ClassA");
        var quizService = new QuizService(db.Context);
        var (quizId, _, _) = await TestData.SeedLiveQuizWithTwoQuestionsAsync(db.Context, quizService, teacher.Id, cls.Id);

        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            quizService.UpdateQuizAsync(quizId, teacher.Id, new UpdateQuizRequest(
                "T", null, DateTime.UtcNow.AddDays(-1), DateTime.UtcNow.AddDays(5),
                20, false, new List<int> { cls.Id })));
        ex.Message.Should().Contain("live or closed");
    }

    [Fact]
    public async Task UpdateQuizAsync_ThrowsWhenStartAtNotBeforeEndAt()
    {
        using var db = new TestDb();
        var teacher = await TestData.CreateTeacherAsync(db.Context);
        var cls = await TestData.CreateClassAsync(db.Context, "ClassA");
        var quizService = new QuizService(db.Context);

        var quiz = await quizService.CreateQuizAsync(teacher.Id, new CreateQuizRequest(
            "T", null, DateTime.UtcNow.AddDays(-1), DateTime.UtcNow.AddDays(5),
            20, false, new List<int> { cls.Id }));

        var ex = await Assert.ThrowsAsync<ArgumentException>(() =>
            quizService.UpdateQuizAsync(quiz.Id, teacher.Id, new UpdateQuizRequest(
                "T", null, DateTime.UtcNow.AddDays(5), DateTime.UtcNow.AddDays(-1),
                20, false, new List<int> { cls.Id })));
        ex.Message.Should().Contain("StartAt must be before EndAt");
    }

    [Fact]
    public async Task ExtendDeadlineAsync_ExtendsEndAtForLiveQuiz()
    {
        using var db = new TestDb();
        var teacher = await TestData.CreateTeacherAsync(db.Context);
        var cls = await TestData.CreateClassAsync(db.Context, "ClassA");
        var quizService = new QuizService(db.Context);
        var (quizId, _, _) = await TestData.SeedLiveQuizWithTwoQuestionsAsync(db.Context, quizService, teacher.Id, cls.Id);

        var originalEndAt = (await db.Context.Quizzes.FirstAsync(q => q.Id == quizId)).EndAt;
        var newEndAt = DateTime.UtcNow.AddDays(10);

        var extended = await quizService.ExtendDeadlineAsync(quizId, teacher.Id, new ExtendQuizDeadlineRequest(newEndAt));

        extended.Should().NotBeNull();
        extended.EndAt.Should().Be(newEndAt);
        extended.EndAt.Should().BeAfter(originalEndAt);
    }

    [Fact]
    public async Task DeleteQuizAsync_RemovesDraft_AndThrowsOnPublished()
    {
        using var db = new TestDb();
        var teacher = await TestData.CreateTeacherAsync(db.Context);
        var cls = await TestData.CreateClassAsync(db.Context, "ClassA");
        var quizService = new QuizService(db.Context);

        var draft = await quizService.CreateQuizAsync(teacher.Id, new CreateQuizRequest(
            "Draft", null, DateTime.UtcNow.AddDays(-1), DateTime.UtcNow.AddDays(5),
            20, false, new List<int> { cls.Id }));

        var deleted = await quizService.DeleteQuizAsync(draft.Id, teacher.Id);
        deleted.Should().BeTrue();
        (await quizService.GetQuizByIdAsync(draft.Id, teacher.Id)).Should().BeNull();

        // published quiz cannot be deleted
        var (quizId, _, _) = await TestData.SeedLiveQuizWithTwoQuestionsAsync(db.Context, quizService, teacher.Id, cls.Id, negativeMarking: false);
        await Assert.ThrowsAsync<InvalidOperationException>(() => quizService.DeleteQuizAsync(quizId, teacher.Id));
    }
}
