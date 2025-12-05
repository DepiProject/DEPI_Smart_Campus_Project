using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using University.Core.Entities;

namespace University.Infra.Configuration
{
    public class StudentConfiguration : IEntityTypeConfiguration<Student>
    {
        public void Configure(EntityTypeBuilder<Student> builder)
        {
            builder.ToTable("Students");
            builder.HasKey(s => s.StudentId);

            // -------- Basic Fields --------
            builder.Property(s => s.FullName)
                .IsRequired()
                .HasMaxLength(150);

            builder.Property(s => s.StudentCode)
                .IsRequired()
                .HasMaxLength(20);

            builder.HasIndex(s => s.StudentCode).IsUnique();


            builder.Property(s => s.ContactNumber)
                .HasMaxLength(20);

            builder.Property(s => s.Level)
                .IsRequired()
                .HasMaxLength(20);

            // -------- Soft Delete --------
            builder.Property(s => s.IsDeleted)
                .HasDefaultValue(false);

            builder.Property(s => s.DeletedAt)
                .IsRequired(false);

            // -------- Timestamps --------
            builder.Property(s => s.CreatedAt)
                .HasDefaultValueSql("GETUTCDATE()");

            builder.Property(s => s.UpdatedAt)
                .HasDefaultValueSql("GETUTCDATE()");

            // -------- Indexes --------
            builder.HasIndex(s => s.UserId)
                .IsUnique()
                .HasDatabaseName("IX_Students_UserId");

            // -------- Relationships --------

            // Student → Department (Many-to-One)
            builder.HasOne(s => s.Department)
                .WithMany(d => d.Students)
                .HasForeignKey(s => s.DepartmentId)
                .OnDelete(DeleteBehavior.SetNull);
            // student remains even if department deleted

            // Student → User handled in UserConfiguration:
            // builder.HasOne(s => s.User).WithOne(u => u.Student)...

            // Student → Enrollments
            builder.HasMany(s => s.Enrollments)
                .WithOne(e => e.Student)
                .HasForeignKey(e => e.StudentId)
                .OnDelete(DeleteBehavior.Restrict);

            // Student → Attendances
            builder.HasMany(s => s.Attendances)
                .WithOne(a => a.Student)
                .HasForeignKey(a => a.StudentId)
                .OnDelete(DeleteBehavior.Restrict);

            // Student → ExamSubmissions
            builder.HasMany(s => s.ExamSubmissions)
                .WithOne(es => es.Student)
                .HasForeignKey(es => es.StudentId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}
