using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using University.Core.Entities;

namespace University.Infra.Configuration
{
    public class ExamConfiguration : IEntityTypeConfiguration<Exam>
    {
        public void Configure(EntityTypeBuilder<Exam> builder)
        {
            builder.ToTable("Exams");

            builder.HasKey(e => e.ExamId);

            builder.Property(e => e.Title)
                .IsRequired()
                .HasMaxLength(100);

            builder.Property(e => e.ExamDate)
                .IsRequired();

            builder.Property(e => e.Duration)
                .IsRequired();

            builder.Property(e => e.TotalPoints)
                .HasColumnType("decimal(5,2)")
                .IsRequired();

            builder.Property(e => e.IsDeleted)
                .HasDefaultValue(false);

            builder.Property(e => e.DeletedAt)
                .IsRequired(false);

            builder.Property(e => e.CreatedAt)
                .HasDefaultValueSql("GETUTCDATE()");

            builder.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("GETUTCDATE()");

            // Indexes
            builder.HasIndex(e => e.CourseId)
                .HasDatabaseName("IX_Exams_CourseId");

            builder.HasIndex(e => e.ExamDate)
                .HasDatabaseName("IX_Exams_ExamDate");

            // Relationships
            // Exam → ExamQuestions - Cascade (questions belong to exam)
            builder.HasMany(e => e.ExamQuestions)
                .WithOne(eq => eq.Exam)
                .HasForeignKey(eq => eq.ExamId)
                .OnDelete(DeleteBehavior.Cascade);

            // Exam → ExamSubmissions - Restrict (preserve submissions)
            builder.HasMany(e => e.ExamSubmissions)
                .WithOne(es => es.Exam)
                .HasForeignKey(es => es.ExamId)
                .OnDelete(DeleteBehavior.Restrict);

            // Exam → Course - Restrict (can't delete course if exams exist)
            builder.HasOne(e => e.Course)
                .WithMany(c => c.Exams)
                .HasForeignKey(e => e.CourseId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}
