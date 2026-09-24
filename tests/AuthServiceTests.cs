using Backend.DTOs;
using Backend.Services;
using Backend.Tests.Helpers;
using FluentAssertions;
using Xunit;

namespace Backend.Tests;

public class AuthServiceTests
{
    [Fact]
    public async Task LoginAsync_WithValidCredentials_ReturnsResponseWithTokenAndUser()
    {
        using var db = new TestDb();
        var teacher = await TestData.CreateTeacherAsync(db.Context);

        var auth = new AuthService(db.Context, TestData.Configuration);
        var result = await auth.LoginAsync(new LoginRequest(teacher.Email, TestData.TestPassword));

        result.Should().NotBeNull();
        result.Token.Should().NotBeNullOrEmpty();
        result.User.Email.Should().Be(teacher.Email);
        result.User.Role.Should().Be("Teacher");
        result.User.Id.Should().Be(teacher.Id);
    }

    [Fact]
    public async Task LoginAsync_WithWrongPassword_ReturnsNull()
    {
        using var db = new TestDb();
        var teacher = await TestData.CreateTeacherAsync(db.Context);

        var auth = new AuthService(db.Context, TestData.Configuration);
        var result = await auth.LoginAsync(new LoginRequest(teacher.Email, "wrong-password"));

        result.Should().BeNull();
    }

    [Fact]
    public async Task LoginAsync_WithUnknownEmail_ReturnsNull()
    {
        using var db = new TestDb();
        await TestData.CreateTeacherAsync(db.Context);

        var auth = new AuthService(db.Context, TestData.Configuration);
        var result = await auth.LoginAsync(new LoginRequest("nobody@test.local", TestData.TestPassword));

        result.Should().BeNull();
    }

    [Fact]
    public async Task GetUserByIdAsync_ReturnsUserDtoWithClassName()
    {
        using var db = new TestDb();
        var cls = await TestData.CreateClassAsync(db.Context, "Math-101");
        var student = await TestData.CreateStudentAsync(db.Context, cls.Id);

        var auth = new AuthService(db.Context, TestData.Configuration);
        var result = await auth.GetUserByIdAsync(student.Id);

        result.Should().NotBeNull();
        result.Email.Should().Be(student.Email);
        result.Role.Should().Be("Student");
        result.ClassName.Should().Be("Math-101");
        result.ClassId.Should().Be(cls.Id);
    }

    [Fact]
    public async Task GetUserByIdAsync_WithUnknownId_ReturnsNull()
    {
        using var db = new TestDb();
        var auth = new AuthService(db.Context, TestData.Configuration);

        var result = await auth.GetUserByIdAsync(999);

        result.Should().BeNull();
    }

    [Fact]
    public void VerifyPassword_RoundTripsThroughHash()
    {
        var auth = new AuthService(new TestDb().Context, TestData.Configuration);

        var hash = auth.HashPassword(TestData.TestPassword);
        hash.Should().NotBeNullOrEmpty().And.NotBe(TestData.TestPassword);

        auth.VerifyPassword(TestData.TestPassword, hash).Should().BeTrue();
        auth.VerifyPassword("something-else", hash).Should().BeFalse();
    }
}
