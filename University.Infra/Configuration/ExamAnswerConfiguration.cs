using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using University.Core.Entities;

namespace University.Infra.Configuration
{
    public class ExamAnswerConfiguration : IEntityTypeConfiguration<ExamAnswer>
    {
        public void Configure(EntityTypeBuilder<ExamAnswer> builder)
        {
            builder.ToTable("ExamAnswers");

            builder.HasKey(ea => ea.AnswerId);

            builder.Property(ea => ea.IsCorrect)
                .HasDefaultValue(false);

            builder.Property(ea => ea.PointsAwarded)
                .HasPrecision(4, 2)
                .IsRequired(false);

            // Indexes
            builder.HasIndex(a => new { a.SubmissionId, a.QuestionId })
                .IsUnique()
                .HasDatabaseName("IX_ExamAnswers_Submission_Question");

            // Relationships

            // ExamAnswer → ExamSubmission (many-to-1)
            builder.HasOne(ea => ea.Submission)
                .WithMany(es => es.Answers)
                .HasForeignKey(ea => ea.SubmissionId)
                .OnDelete(DeleteBehavior.Cascade);

            // ExamAnswer → ExamQuestion (many-to-1)
            builder.HasOne(ea => ea.Question)
                .WithMany(q => q.Answers)
                .HasForeignKey(ea => ea.QuestionId)
                .OnDelete(DeleteBehavior.Restrict);

            // ExamAnswer → MCQOption (SelectedOption) - optional
            builder.HasOne<MCQOption>()
                .WithMany()
                .HasForeignKey(ea => ea.SelectedOptionId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}
