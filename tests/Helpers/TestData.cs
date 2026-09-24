using Backend.Data;
using Backend.DTOs;
using Backend.Models;
using Backend.Services;
using Microsoft.Extensions.Configuration;

namespace Backend.Tests.Helpers;

public static class TestData
{
    public const string TestPassword = "Test@12345";

    public static IConfiguration Configuration { get; } = new ConfigurationBuilder()
        .AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["JwtSettings:SecretKey"] = "quizzy-super-secret-key-for-development-only-change-in-production",
            ["JwtSettings:Issuer"] = "quizzy",
            ["JwtSettings:Audience"] = "quizzy-users"
        })
        .Build();

    public static async Task<User> CreateTeacherAsync(AppDbContext ctx, string email = "teacher@test.local", string name = "Test Teacher")
    {
        var teacher = new User
        {
            Name = name,
            Email = email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(TestPassword, workFactor: 12),
            Role = UserRole.Teacher,
            CreatedAt = DateTime.UtcNow
        };
        ctx.Users.Add(teacher);
        await ctx.SaveChangesAsync();
        return teacher;
    }

    public static async Task<User> CreateTeacherAsync(AppDbContext ctx, int id, string email, string name)
    {
        var teacher = new User
        {
            Id = id,
            Name = name,
            Email = email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(TestPassword, workFactor: 12),
            Role = UserRole.Teacher,
            CreatedAt = DateTime.UtcNow
        };
        ctx.Users.Add(teacher);
        await ctx.SaveChangesAsync();
        return teacher;
    }

    public static async Task<Class> CreateClassAsync(AppDbContext ctx, string name = "Class-A")
    {
        var cls = new Class { Name = name };
        ctx.Classes.Add(cls);
        await ctx.SaveChangesAsync();
        return cls;
    }

    public static async Task<User> CreateStudentAsync(AppDbContext ctx, int classId, string email = "student@test.local", string name = "Test Student")
    {
        var student = new User
        {
            Name = name,
            Email = email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(TestPassword, workFactor: 12),
            Role = UserRole.Student,
            ClassId = classId,
            CreatedAt = DateTime.UtcNow
        };
        ctx.Users.Add(student);
        await ctx.SaveChangesAsync();
        return student;
    }

    public static async Task<Question> AddQuestionAsync(AppDbContext ctx, int quizId, int points, int order, string correctText = "Correct", string wrongText = "Wrong")
    {
        var question = new Question
        {
            QuizId = quizId,
            Points = points,
            Order = order,
            Text = $"Question {order}"
        };
        ctx.Questions.Add(question);
        await ctx.SaveChangesAsync();

        var correct = new Choice { QuestionId = question.Id, Text = correctText, IsCorrect = true, Order = 1 };
        var wrong = new Choice { QuestionId = question.Id, Text = wrongText, IsCorrect = false, Order = 2 };
        ctx.Choices.AddRange(correct, wrong);
        await ctx.SaveChangesAsync();

        return question;
    }

    public static async Task<(int quizId, Question q1, Question q2)> SeedLiveQuizWithTwoQuestionsAsync(
        AppDbContext ctx,
        IQuizService quizService,
        int teacherId,
        int classId,
        bool negativeMarking = false)
    {
        var quizDto = await quizService.CreateQuizAsync(teacherId, new CreateQuizRequest(
            "Live Quiz",
            "A live quiz for testing",
            DateTime.UtcNow.AddDays(-1),
            DateTime.UtcNow.AddDays(5),
            20,
            negativeMarking,
            new List<int> { classId }));

        var q1 = await AddQuestionAsync(ctx, quizDto.Id, 5, 1);
        var q2 = await AddQuestionAsync(ctx, quizDto.Id, 5, 2);

        await quizService.PublishQuizAsync(quizDto.Id, teacherId);

        return (quizDto.Id, q1, q2);
    }
}
