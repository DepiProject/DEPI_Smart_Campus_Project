using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using University.Core.Entities;

namespace University.Infra.Configuration
{
    public class ExamSubmissionConfiguration : IEntityTypeConfiguration<ExamSubmission>
    {
        public void Configure(EntityTypeBuilder<ExamSubmission> builder)
        {
            builder.ToTable("ExamSubmissions");

            builder.HasKey(es => es.SubmissionId);

            builder.Property(es => es.StartedAt)
                .IsRequired();

            builder.Property(es => es.SubmittedAt)
                .IsRequired(false);

            builder.Property(es => es.Score)
                .HasPrecision(5, 2);

            // Indexes
            builder.HasIndex(s => new { s.ExamId, s.StudentId })
                .IsUnique()
                .HasDatabaseName("IX_ExamSubmissions_Exam_Student");

            builder.HasIndex(s => s.StudentId)
                .HasDatabaseName("IX_ExamSubmissions_StudentId");

            // Relationships

            // ExamSubmission → ExamAnswers (1-to-many)
            builder.HasMany(es => es.Answers)
                .WithOne(a => a.Submission)
                .HasForeignKey(a => a.SubmissionId)
                .OnDelete(DeleteBehavior.Cascade);

            // ExamSubmission → Exam (many-to-1) - Restrict
            builder.HasOne(es => es.Exam)
                .WithMany(e => e.ExamSubmissions)
                .HasForeignKey(es => es.ExamId)
                .OnDelete(DeleteBehavior.Restrict);

            // ExamSubmission → Student (many-to-1) - Restrict
            builder.HasOne(es => es.Student)
                .WithMany(s => s.ExamSubmissions)
                .HasForeignKey(es => es.StudentId)
                .OnDelete(DeleteBehavior.Restrict);

            // ExamSubmission → Instructor (many-to-1) - SetNull (optional)
            builder.HasOne(es => es.Instructor)
                .WithMany(i => i.ExamSubmissions)
                .HasForeignKey(es => es.InstructorId)
                .OnDelete(DeleteBehavior.SetNull);
        }
    }
}
