using Microsoft.EntityFrameworkCore;
using Backend.Models;

namespace Backend.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Class> Classes => Set<Class>();
    public DbSet<Quiz> Quizzes => Set<Quiz>();
    public DbSet<QuizClass> QuizClasses => Set<QuizClass>();
    public DbSet<Question> Questions => Set<Question>();
    public DbSet<Choice> Choices => Set<Choice>();
    public DbSet<Submission> Submissions => Set<Submission>();
    public DbSet<Answer> Answers => Set<Answer>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasIndex(u => u.Email).IsUnique();
            entity.Property(u => u.Role).HasConversion<int>();
            entity.HasOne(u => u.Class)
                  .WithMany(c => c.Students)
                  .HasForeignKey(u => u.ClassId)
                  .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<Class>(entity =>
        {
            entity.HasIndex(c => c.Name).IsUnique();
        });

        modelBuilder.Entity<Quiz>(entity =>
        {
            entity.HasOne(q => q.CreatedByTeacher)
                  .WithMany(u => u.CreatedQuizzes)
                  .HasForeignKey(q => q.CreatedByTeacherId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<QuizClass>(entity =>
        {
            entity.HasKey(qc => new { qc.QuizId, qc.ClassId });
            entity.HasOne(qc => qc.Quiz)
                  .WithMany(q => q.QuizClasses)
                  .HasForeignKey(qc => qc.QuizId)
                  .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(qc => qc.Class)
                  .WithMany(c => c.QuizClasses)
                  .HasForeignKey(qc => qc.ClassId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Question>(entity =>
        {
            entity.HasOne(q => q.Quiz)
                  .WithMany(qz => qz.Questions)
                  .HasForeignKey(q => q.QuizId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Choice>(entity =>
        {
            entity.HasOne(c => c.Question)
                  .WithMany(q => q.Choices)
                  .HasForeignKey(c => c.QuestionId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Submission>(entity =>
        {
            entity.HasIndex(s => new { s.StudentId, s.QuizId }).IsUnique();
            entity.Property(s => s.Status).HasConversion<int>();
            entity.HasOne(s => s.Quiz)
                  .WithMany(q => q.Submissions)
                  .HasForeignKey(s => s.QuizId)
                  .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(s => s.Student)
                  .WithMany(u => u.Submissions)
                  .HasForeignKey(s => s.StudentId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Answer>(entity =>
        {
            entity.HasOne(a => a.Submission)
                  .WithMany(s => s.Answers)
                  .HasForeignKey(a => a.SubmissionId)
                  .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(a => a.Question)
                  .WithMany()
                  .HasForeignKey(a => a.QuestionId)
                  .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(a => a.SelectedChoice)
                  .WithMany()
                  .HasForeignKey(a => a.SelectedChoiceId)
                  .OnDelete(DeleteBehavior.SetNull);
        });
    }
}