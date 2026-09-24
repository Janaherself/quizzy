using Backend.DTOs;
using Backend.Services;
using Backend.Tests.Helpers;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using System.Text;
using System.Text.Json;
using Xunit;

namespace Backend.Tests;

public class SecurityTests
{
    [Fact]
    public void GenerateJwtToken_ContainsCorrectRoleAndUserClaims()
    {
        using var db = new TestDb();
        var teacher = TestData.CreateTeacherAsync(db.Context).Result;
        var auth = new AuthService(db.Context, TestData.Configuration);

        var token = auth.GenerateJwtToken(teacher);

        var claims = DecodeJwtPayload(token);
        claims["role"].GetString().Should().Be("Teacher");
        claims["email"].GetString().Should().Be(teacher.Email);
        claims["sub"].GetString().Should().Be(teacher.Id.ToString());
    }

    [Fact]
    public async Task TeacherCannotAccessAnotherTeachersQuiz()
    {
        using var db = new TestDb();
        var teacher1 = await TestData.CreateTeacherAsync(db.Context, "t1@test.local", "Teacher One");
        var teacher2 = await TestData.CreateTeacherAsync(db.Context, "t2@test.local", "Teacher Two");
        var cls = await TestData.CreateClassAsync(db.Context, "ClassA");
        var quizService = new QuizService(db.Context);

        var quiz = await quizService.CreateQuizAsync(teacher1.Id, new CreateQuizRequest(
            "T1 Quiz", null, DateTime.UtcNow.AddDays(-1), DateTime.UtcNow.AddDays(5),
            20, false, new List<int> { cls.Id }));

        // teacher2 has no quiz with this id -> ownership isolation
        var other = await quizService.GetQuizByIdAsync(quiz.Id, teacher2.Id);
        other.Should().BeNull();

        // teacher1 can see their own
        var own = await quizService.GetQuizByIdAsync(quiz.Id, teacher1.Id);
        own.Should().NotBeNull();
        own.CreatedByTeacherId.Should().Be(teacher1.Id);
    }

    [Fact]
    public async Task StudentCannotCreateQuizAsTeacher()
    {
        using var db = new TestDb();
        var cls = await TestData.CreateClassAsync(db.Context, "ClassA");
        var student = await TestData.CreateStudentAsync(db.Context, cls.Id, "student@test.local", "A Student");
        var quizService = new QuizService(db.Context);

        var result = await quizService.CreateQuizAsync(student.Id, new CreateQuizRequest(
            "By Student", null, DateTime.UtcNow.AddDays(-1), DateTime.UtcNow.AddDays(5),
            20, false, new List<int> { cls.Id }));

        result.Should().BeNull();
    }

    [Fact]
    public async Task SubmitterIsolation_OnlyOwnerSeesTheirQuizResult()
    {
        using var db = new TestDb();
        var teacher = await TestData.CreateTeacherAsync(db.Context);
        var cls = await TestData.CreateClassAsync(db.Context, "ClassA");
        var student1 = await TestData.CreateStudentAsync(db.Context, cls.Id, "s1@test.local", "Student One");
        var student2 = await TestData.CreateStudentAsync(db.Context, cls.Id, "s2@test.local", "Student Two");
        var quizService = new QuizService(db.Context);
        var (quizId, q1, q2) = await TestData.SeedLiveQuizWithTwoQuestionsAsync(db.Context, quizService, teacher.Id, cls.Id);
        var submissionService = new SubmissionService(db.Context, quizService);

        var start = await submissionService.StartQuizAsync(quizId, student1.Id);
        var correct1 = await db.Context.Choices.FirstAsync(c => c.QuestionId == q1.Id && c.IsCorrect);
        var correct2 = await db.Context.Choices.FirstAsync(c => c.QuestionId == q2.Id && c.IsCorrect);
        await submissionService.SubmitQuizAsync(start.SubmissionId, student1.Id, new SubmitQuizRequest(
            new List<SubmitAnswerRequest> { new(q1.Id, correct1.Id), new(q2.Id, correct2.Id) }));

        // student2 has no submission -> gets null
        var otherResult = await submissionService.GetQuizResultAsync(quizId, student2.Id);
        otherResult.Should().BeNull();

        // student1 owns the submission -> gets a result
        var ownResult = await submissionService.GetQuizResultAsync(quizId, student1.Id);
        ownResult.Should().NotBeNull();
        ownResult.Score.Should().Be(10);
    }

    private static Dictionary<string, JsonElement> DecodeJwtPayload(string token)
    {
        var payload = token.Split('.')[1];
        var b64 = payload.Replace('-', '+').Replace('_', '/');
        switch (b64.Length % 4)
        {
            case 2: b64 += "=="; break;
            case 3: b64 += "="; break;
        }
        var json = Encoding.UTF8.GetString(Convert.FromBase64String(b64));
        return JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(json)!;
    }
}
