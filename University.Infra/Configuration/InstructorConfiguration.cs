using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using University.Core.Entities;

namespace University.Infra.Configuration
{
    public class InstructorConfiguration : IEntityTypeConfiguration<Instructor>
    {
        public void Configure(EntityTypeBuilder<Instructor> builder)
        {
            builder.ToTable("Instructors");
            builder.HasKey(i => i.InstructorId);

            // -------- Basic Fields --------
            builder.Property(i => i.FullName)
                .IsRequired()
                .HasMaxLength(150);

            builder.Property(i => i.ContactNumber)
                .HasMaxLength(20);

            // -------- Soft Delete --------
            builder.Property(i => i.IsDeleted)
                .HasDefaultValue(false);

            builder.Property(i => i.DeletedAt)
                .IsRequired(false);

            // -------- Timestamp Defaults --------
            builder.Property(i => i.CreatedAt)
                .HasDefaultValueSql("GETUTCDATE()");

            builder.Property(i => i.UpdatedAt)
                .HasDefaultValueSql("GETUTCDATE()");

            // -------- Indexes --------
            builder.HasIndex(i => i.UserId)
                .IsUnique()
                .HasDatabaseName("IX_Instructors_UserId");

            // -------- Relationships --------

            // Instructor → User (1:1)
            // Actual FK is configured in UserConfiguration:
            // builder.HasOne(i => i.User).WithOne(u => u.Instructor)...

            // Instructor → Department (Many instructors → 1 department)
            builder.HasOne(i => i.Department)
                .WithMany(d => d.Instructors)
                .HasForeignKey(i => i.DepartmentId)
                .OnDelete(DeleteBehavior.SetNull);

            // Instructor → HeadOfDepartment (1:1)
            // Department has HeadId FK, so we configure from Department side in DeptConfig


            // Instructor → Courses (1:M)
            builder.HasMany(i => i.Courses)
                .WithOne(c => c.Instructor)
                .HasForeignKey(c => c.InstructorId)
                .OnDelete(DeleteBehavior.SetNull);

            // Instructor → ExamSubmissions (1:M)
            builder.HasMany(i => i.ExamSubmissions)
                .WithOne(es => es.Instructor)
                .HasForeignKey(es => es.InstructorId)
                .OnDelete(DeleteBehavior.SetNull);
        }
    }
}
