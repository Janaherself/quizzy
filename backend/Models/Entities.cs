namespace Backend.Models;

public enum UserRole
{
    Student = 0,
    Teacher = 1
}

public enum SubmissionStatus
{
    InProgress = 0,
    Completed = 1
}

public class User
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public UserRole Role { get; set; }
    public int? ClassId { get; set; }
    public Class? Class { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public ICollection<Quiz> CreatedQuizzes { get; set; } = new List<Quiz>();
    public ICollection<Submission> Submissions { get; set; } = new List<Submission>();
}

public class Class
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    
    public ICollection<User> Students { get; set; } = new List<User>();
    public ICollection<QuizClass> QuizClasses { get; set; } = new List<QuizClass>();
}

public class Quiz
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime StartAt { get; set; }
    public DateTime EndAt { get; set; }
    public int DurationMinutes { get; set; } = 20;
    public bool NegativeMarkingEnabled { get; set; }
    public bool IsPublished { get; set; }
    public int CreatedByTeacherId { get; set; }
    public User CreatedByTeacher { get; set; } = null!;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public ICollection<Question> Questions { get; set; } = new List<Question>();
    public ICollection<QuizClass> QuizClasses { get; set; } = new List<QuizClass>();
    public ICollection<Submission> Submissions { get; set; } = new List<Submission>();
}

public class QuizClass
{
    public int QuizId { get; set; }
    public Quiz Quiz { get; set; } = null!;
    public int ClassId { get; set; }
    public Class Class { get; set; } = null!;
}

public class Question
{
    public int Id { get; set; }
    public int QuizId { get; set; }
    public Quiz Quiz { get; set; } = null!;
    public string Text { get; set; } = string.Empty;
    public int Points { get; set; }
    public int Order { get; set; }
    
    public ICollection<Choice> Choices { get; set; } = new List<Choice>();
}

public class Choice
{
    public int Id { get; set; }
    public int QuestionId { get; set; }
    public Question Question { get; set; } = null!;
    public string Text { get; set; } = string.Empty;
    public bool IsCorrect { get; set; }
    public int Order { get; set; }
}

public class Submission
{
    public int Id { get; set; }
    public int QuizId { get; set; }
    public Quiz Quiz { get; set; } = null!;
    public int StudentId { get; set; }
    public User Student { get; set; } = null!;
    public DateTime StartedAt { get; set; }
    public DateTime? SubmittedAt { get; set; }
    public SubmissionStatus Status { get; set; } = SubmissionStatus.InProgress;
    public int Score { get; set; }
    
    public ICollection<Answer> Answers { get; set; } = new List<Answer>();
}

public class Answer
{
    public int Id { get; set; }
    public int SubmissionId { get; set; }
    public Submission Submission { get; set; } = null!;
    public int QuestionId { get; set; }
    public Question Question { get; set; } = null!;
    public int? SelectedChoiceId { get; set; }
    public Choice? SelectedChoice { get; set; }
    public int AwardedPoints { get; set; }
}