using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using University.Core.Entities;

namespace University.Infra.Configuration
{
    public class ExamQuestionConfiguration : IEntityTypeConfiguration<ExamQuestion>
    {
        public void Configure(EntityTypeBuilder<ExamQuestion> builder)
        {
            builder.ToTable("ExamQuestions");

            builder.HasKey(q => q.QuestionId);

            builder.Property(q => q.QuestionText)
                .IsRequired()
                .HasMaxLength(500);

            builder.Property(q => q.Score)
                .IsRequired()
                .HasColumnType("decimal(5,2)");

            builder.Property(q => q.OrderNumber)
                .IsRequired();

            // ExamQuestion → MCQOptions - Cascade (options belong to question)
            builder.HasMany(eq => eq.Options)
                .WithOne(o => o.ExamQuestion)
                .HasForeignKey(o => o.QuestionId)
                .OnDelete(DeleteBehavior.Cascade);

            // ExamQuestion → ExamAnswers - Restrict (preserve student answers)
            builder.HasMany(eq => eq.Answers)
                .WithOne(a => a.Question)
                .HasForeignKey(a => a.QuestionId)
                .OnDelete(DeleteBehavior.Restrict);

            // ExamQuestion → Exam - Restrict (already configured in ExamConfiguration)
        }
    }
}
