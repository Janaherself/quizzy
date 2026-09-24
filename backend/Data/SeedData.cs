using Backend.Data;
using Backend.Models;
using BCrypt.Net;
using Microsoft.EntityFrameworkCore;

namespace Backend.Data;

public static class SeedData
{
    public static async Task InitializeAsync(AppDbContext context)
    {
        if (await context.Users.AnyAsync())
            return;

        var passwordHash = BCrypt.Net.BCrypt.HashPassword("pa$$1234", workFactor: 12);

        var class10A = new Class { Name = "10A" };
        var class10B = new Class { Name = "10B" };
        var class11A = new Class { Name = "11A" };

        context.Classes.AddRange(class10A, class10B, class11A);
        await context.SaveChangesAsync();

        var teacher1 = new User
        {
            Name = "أحمد المعلم",
            Email = "teacher1@quizzy.local",
            PasswordHash = passwordHash,
            Role = UserRole.Teacher,
            CreatedAt = DateTime.UtcNow
        };

        var teacher2 = new User
        {
            Name = "فاطمة المعلمة",
            Email = "teacher2@quizzy.local",
            PasswordHash = passwordHash,
            Role = UserRole.Teacher,
            CreatedAt = DateTime.UtcNow
        };

        context.Users.AddRange(teacher1, teacher2);
        await context.SaveChangesAsync();

        var students10A = new[]
        {
            new User { Name = "محمد أحمد", Email = "student1@quizzy.local", PasswordHash = passwordHash, Role = UserRole.Student, ClassId = class10A.Id },
            new User { Name = "علي حسن", Email = "student2@quizzy.local", PasswordHash = passwordHash, Role = UserRole.Student, ClassId = class10A.Id },
            new User { Name = "عمر خالد", Email = "student3@quizzy.local", PasswordHash = passwordHash, Role = UserRole.Student, ClassId = class10A.Id },
            new User { Name = "حسن محمود", Email = "student4@quizzy.local", PasswordHash = passwordHash, Role = UserRole.Student, ClassId = class10A.Id },
            new User { Name = "يوسف إبراهيم", Email = "student5@quizzy.local", PasswordHash = passwordHash, Role = UserRole.Student, ClassId = class10A.Id }
        };

        var students10B = new[]
        {
            new User { Name = "سارة علي", Email = "student6@quizzy.local", PasswordHash = passwordHash, Role = UserRole.Student, ClassId = class10B.Id },
            new User { Name = "ليلى محمد", Email = "student7@quizzy.local", PasswordHash = passwordHash, Role = UserRole.Student, ClassId = class10B.Id },
            new User { Name = "نور أحمد", Email = "student8@quizzy.local", PasswordHash = passwordHash, Role = UserRole.Student, ClassId = class10B.Id },
            new User { Name = "مريم خالد", Email = "student9@quizzy.local", PasswordHash = passwordHash, Role = UserRole.Student, ClassId = class10B.Id },
            new User { Name = "هدى حسن", Email = "student10@quizzy.local", PasswordHash = passwordHash, Role = UserRole.Student, ClassId = class10B.Id }
        };

        var students11A = new[]
        {
            new User { Name = "أحمد عبدالله", Email = "student11@quizzy.local", PasswordHash = passwordHash, Role = UserRole.Student, ClassId = class11A.Id },
            new User { Name = "محمد سالم", Email = "student12@quizzy.local", PasswordHash = passwordHash, Role = UserRole.Student, ClassId = class11A.Id },
            new User { Name = "خالد عمر", Email = "student13@quizzy.local", PasswordHash = passwordHash, Role = UserRole.Student, ClassId = class11A.Id },
            new User { Name = "عبدالله يوسف", Email = "student14@quizzy.local", PasswordHash = passwordHash, Role = UserRole.Student, ClassId = class11A.Id },
            new User { Name = "فارس محمود", Email = "student15@quizzy.local", PasswordHash = passwordHash, Role = UserRole.Student, ClassId = class11A.Id }
        };

        context.Users.AddRange(students10A);
        context.Users.AddRange(students10B);
        context.Users.AddRange(students11A);
        await context.SaveChangesAsync();

        var now = DateTime.UtcNow;

        var quiz1 = new Quiz
        {
            Title = "أساسيات الجبر",
            Description = "اختبار في أساسيات الجبر للصف العاشر",
            StartAt = now.AddDays(-2),
            EndAt = now.AddDays(5),
            DurationMinutes = 20,
            NegativeMarkingEnabled = false,
            IsPublished = true,
            CreatedByTeacherId = teacher1.Id,
            CreatedAt = now.AddDays(-10),
            QuizClasses = new List<QuizClass>
            {
                new QuizClass { ClassId = class10A.Id },
                new QuizClass { ClassId = class10B.Id }
            }
        };

        var quiz2 = new Quiz
        {
            Title = "هندسة المثلثات",
            Description = "اختبار في خصائص المثلثات ونظرياتها",
            StartAt = now.AddDays(1),
            EndAt = now.AddDays(8),
            DurationMinutes = 25,
            NegativeMarkingEnabled = true,
            IsPublished = true,
            CreatedByTeacherId = teacher1.Id,
            CreatedAt = now.AddDays(-5),
            QuizClasses = new List<QuizClass>
            {
                new QuizClass { ClassId = class10A.Id }
            }
        };

        var quiz3 = new Quiz
        {
            Title = "التفاضل والتكامل - مقدمة",
            Description = "اختبار تمهيدي في التفاضل والتكامل للصف الحادي عشر",
            StartAt = now.AddDays(-5),
            EndAt = now.AddDays(-1),
            DurationMinutes = 30,
            NegativeMarkingEnabled = true,
            IsPublished = true,
            CreatedByTeacherId = teacher2.Id,
            CreatedAt = now.AddDays(-15),
            QuizClasses = new List<QuizClass>
            {
                new QuizClass { ClassId = class11A.Id }
            }
        };

        var quiz4 = new Quiz
        {
            Title = "الإحصاء والاحتمالات",
            Description = "اختبار في أساسيات الإحصاء والاحتمالات",
            StartAt = now.AddDays(10),
            EndAt = now.AddDays(20),
            DurationMinutes = 20,
            NegativeMarkingEnabled = false,
            IsPublished = false,
            CreatedByTeacherId = teacher2.Id,
            CreatedAt = now.AddDays(-2),
            QuizClasses = new List<QuizClass>
            {
                new QuizClass { ClassId = class11A.Id }
            }
        };

        context.Quizzes.AddRange(quiz1, quiz2, quiz3, quiz4);
        await context.SaveChangesAsync();

        await AddQuestionsForQuiz1Async(context, quiz1);
        await AddQuestionsForQuiz2Async(context, quiz2);
        await AddQuestionsForQuiz3Async(context, quiz3);
        await AddQuestionsForQuiz4Async(context, quiz4);

        await context.SaveChangesAsync();

        var student1 = await context.Users.FirstAsync(u => u.Email == "student1@quizzy.local");
        var submission1 = new Submission
        {
            QuizId = quiz1.Id,
            StudentId = student1.Id,
            StartedAt = now.AddDays(-1),
            SubmittedAt = now.AddDays(-1).AddMinutes(15),
            Status = SubmissionStatus.Completed,
            Score = 85
        };
        context.Submissions.Add(submission1);

        var student6 = await context.Users.FirstAsync(u => u.Email == "student6@quizzy.local");
        var submission2 = new Submission
        {
            QuizId = quiz1.Id,
            StudentId = student6.Id,
            StartedAt = now.AddHours(-2),
            Status = SubmissionStatus.InProgress,
            Score = 0
        };
        context.Submissions.Add(submission2);

        await context.SaveChangesAsync();
    }

    private static async Task AddQuestionsForQuiz1Async(AppDbContext context, Quiz quiz)
    {
        var q1 = new Question { QuizId = quiz.Id, Text = "ما هو حل المعادلة 2x + 5 = 15؟", Points = 5, Order = 1 };
        var q2 = new Question { QuizId = quiz.Id, Text = "إذا كانت f(x) = 3x + 2، فما قيمة f(4)؟", Points = 5, Order = 2 };
        var q3 = new Question { QuizId = quiz.Id, Text = "أي من العبارات التالية تصف الدالة الخطية؟", Points = 10, Order = 3 };
        var q4 = new Question { QuizId = quiz.Id, Text = "حل المتباينة: 3x - 7 > 8", Points = 5, Order = 4 };
        var q5 = new Question { QuizId = quiz.Id, Text = "إذا كان ميل الخط المستقيم يساوي 2 ويمر بالنقطة (1, 3)، ما معادلته؟", Points = 10, Order = 5 };

        context.Questions.AddRange(q1, q2, q3, q4, q5);
        await context.SaveChangesAsync();

        var choices = new List<Choice>
        {
            new Choice { QuestionId = q1.Id, Text = "x = 5", IsCorrect = true, Order = 1 },
            new Choice { QuestionId = q1.Id, Text = "x = 10", IsCorrect = false, Order = 2 },
            new Choice { QuestionId = q1.Id, Text = "x = 3", IsCorrect = false, Order = 3 },
            new Choice { QuestionId = q1.Id, Text = "x = 7", IsCorrect = false, Order = 4 },

            new Choice { QuestionId = q2.Id, Text = "14", IsCorrect = true, Order = 1 },
            new Choice { QuestionId = q2.Id, Text = "12", IsCorrect = false, Order = 2 },
            new Choice { QuestionId = q2.Id, Text = "10", IsCorrect = false, Order = 3 },
            new Choice { QuestionId = q2.Id, Text = "16", IsCorrect = false, Order = 4 },

            new Choice { QuestionId = q3.Id, Text = "دالة على شكل f(x) = ax + b حيث a و b ثابتين", IsCorrect = true, Order = 1 },
            new Choice { QuestionId = q3.Id, Text = "دالة على شكل f(x) = ax² + bx + c", IsCorrect = false, Order = 2 },
            new Choice { QuestionId = q3.Id, Text = "دالة على شكل f(x) = a/x", IsCorrect = false, Order = 3 },
            new Choice { QuestionId = q3.Id, Text = "دالة على شكل f(x) = √x", IsCorrect = false, Order = 4 },

            new Choice { QuestionId = q4.Id, Text = "x > 5", IsCorrect = true, Order = 1 },
            new Choice { QuestionId = q4.Id, Text = "x > 3", IsCorrect = false, Order = 2 },
            new Choice { QuestionId = q4.Id, Text = "x < 5", IsCorrect = false, Order = 3 },
            new Choice { QuestionId = q4.Id, Text = "x < 3", IsCorrect = false, Order = 4 },

            new Choice { QuestionId = q5.Id, Text = "y = 2x + 1", IsCorrect = true, Order = 1 },
            new Choice { QuestionId = q5.Id, Text = "y = 2x + 3", IsCorrect = false, Order = 2 },
            new Choice { QuestionId = q5.Id, Text = "y = 2x - 1", IsCorrect = false, Order = 3 },
            new Choice { QuestionId = q5.Id, Text = "y = x + 2", IsCorrect = false, Order = 4 }
        };

        context.Choices.AddRange(choices);
    }

    private static async Task AddQuestionsForQuiz2Async(AppDbContext context, Quiz quiz)
    {
        var q1 = new Question { QuizId = quiz.Id, Text = "مجموع زوايا المثلث يساوي:", Points = 5, Order = 1 };
        var q2 = new Question { QuizId = quiz.Id, Text = "في المثلث القائم الزاوية، إذا كان الوتر 10 وأحد الضلعين 6، فما طول الضلع الآخر؟", Points = 10, Order = 2 };
        var q3 = new Question { QuizId = quiz.Id, Text = "أي من النظريات التالية ينص على أن مربع الوتر يساوي مجموع مربعي الضلعين الآخرين؟", Points = 10, Order = 3 };

        context.Questions.AddRange(q1, q2, q3);
        await context.SaveChangesAsync();

        var choices = new List<Choice>
        {
            new Choice { QuestionId = q1.Id, Text = "180 درجة", IsCorrect = true, Order = 1 },
            new Choice { QuestionId = q1.Id, Text = "360 درجة", IsCorrect = false, Order = 2 },
            new Choice { QuestionId = q1.Id, Text = "90 درجة", IsCorrect = false, Order = 3 },
            new Choice { QuestionId = q1.Id, Text = "270 درجة", IsCorrect = false, Order = 4 },

            new Choice { QuestionId = q2.Id, Text = "8", IsCorrect = true, Order = 1 },
            new Choice { QuestionId = q2.Id, Text = "4", IsCorrect = false, Order = 2 },
            new Choice { QuestionId = q2.Id, Text = "12", IsCorrect = false, Order = 3 },
            new Choice { QuestionId = q2.Id, Text = "16", IsCorrect = false, Order = 4 },

            new Choice { QuestionId = q3.Id, Text = "نظرية فيثاغورس", IsCorrect = true, Order = 1 },
            new Choice { QuestionId = q3.Id, Text = "نظرية تاليس", IsCorrect = false, Order = 2 },
            new Choice { QuestionId = q3.Id, Text = "نظرية الجيب", IsCorrect = false, Order = 3 },
            new Choice { QuestionId = q3.Id, Text = "نظرية جيب التمام", IsCorrect = false, Order = 4 }
        };

        context.Choices.AddRange(choices);
    }

    private static async Task AddQuestionsForQuiz3Async(AppDbContext context, Quiz quiz)
    {
        var q1 = new Question { QuizId = quiz.Id, Text = "مشتقة الدالة f(x) = x² تساوي:", Points = 5, Order = 1 };
        var q2 = new Question { QuizId = quiz.Id, Text = "تكامل الدالة f(x) = 2x من 0 إلى 3 يساوي:", Points = 10, Order = 2 };

        context.Questions.AddRange(q1, q2);
        await context.SaveChangesAsync();

        var choices = new List<Choice>
        {
            new Choice { QuestionId = q1.Id, Text = "2x", IsCorrect = true, Order = 1 },
            new Choice { QuestionId = q1.Id, Text = "x", IsCorrect = false, Order = 2 },
            new Choice { QuestionId = q1.Id, Text = "x²", IsCorrect = false, Order = 3 },
            new Choice { QuestionId = q1.Id, Text = "2", IsCorrect = false, Order = 4 },

            new Choice { QuestionId = q2.Id, Text = "9", IsCorrect = true, Order = 1 },
            new Choice { QuestionId = q2.Id, Text = "6", IsCorrect = false, Order = 2 },
            new Choice { QuestionId = q2.Id, Text = "12", IsCorrect = false, Order = 3 },
            new Choice { QuestionId = q2.Id, Text = "3", IsCorrect = false, Order = 4 }
        };

        context.Choices.AddRange(choices);
    }

    private static async Task AddQuestionsForQuiz4Async(AppDbContext context, Quiz quiz)
    {
        var q1 = new Question { QuizId = quiz.Id, Text = "ما هو المدى (Range) لمجموعة البيانات: 2, 5, 8, 12, 15؟", Points = 5, Order = 1 };
        var q2 = new Question { QuizId = quiz.Id, Text = "إذا كان احتمال وقوع حدث A يساوي 0.3، فاحتمال عدم وقوعه يساوي:", Points = 5, Order = 2 };

        context.Questions.AddRange(q1, q2);
        await context.SaveChangesAsync();

        var choices = new List<Choice>
        {
            new Choice { QuestionId = q1.Id, Text = "13", IsCorrect = true, Order = 1 },
            new Choice { QuestionId = q1.Id, Text = "15", IsCorrect = false, Order = 2 },
            new Choice { QuestionId = q1.Id, Text = "2", IsCorrect = false, Order = 3 },
            new Choice { QuestionId = q1.Id, Text = "8", IsCorrect = false, Order = 4 },

            new Choice { QuestionId = q2.Id, Text = "0.7", IsCorrect = true, Order = 1 },
            new Choice { QuestionId = q2.Id, Text = "0.3", IsCorrect = false, Order = 2 },
            new Choice { QuestionId = q2.Id, Text = "1.3", IsCorrect = false, Order = 3 },
            new Choice { QuestionId = q2.Id, Text = "0", IsCorrect = false, Order = 4 }
        };

        context.Choices.AddRange(choices);
    }
}