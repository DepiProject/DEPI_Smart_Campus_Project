using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Microsoft.EntityFrameworkCore;
using University.Core.Entities;

namespace University.Infra.Configuration
{
    public class DepartmentConfiguration : IEntityTypeConfiguration<Department>
    {
        public void Configure(EntityTypeBuilder<Department> builder)
        {
            builder.ToTable("Departments");
            builder.HasKey(d => d.DepartmentId);

            builder.Property(d => d.Name)
                .IsRequired()
                .HasMaxLength(100);

            builder.Property(d => d.Building)
                .IsRequired()
                .HasMaxLength(50);

            // Soft Delete
            builder.Property(d => d.IsDeleted)
                .HasDefaultValue(false);

            builder.Property(d => d.DeletedAt)
                .IsRequired(false);

            // Timestamp Defaults
            builder.Property(d => d.CreatedAt)
                .HasDefaultValueSql("GETUTCDATE()");

            builder.Property(d => d.UpdatedAt)
                .HasDefaultValueSql("GETUTCDATE()");

            // Indexes
            builder.HasIndex(d => d.Name)
                .IsUnique()
                .HasDatabaseName("IX_Departments_Name");

            // Department Head (1:1)
            builder.HasOne(d => d.Instructor)
                .WithOne(i => i.HeadOfDepartment)
                .HasForeignKey<Department>(d => d.HeadId)
                .OnDelete(DeleteBehavior.SetNull);

            // Department -> Instructors (1:M)
            builder.HasMany(d => d.Instructors)
                .WithOne(i => i.Department)
                .HasForeignKey(i => i.DepartmentId)
                .OnDelete(DeleteBehavior.SetNull);

            // Department -> Students (1:M)
            builder.HasMany(d => d.Students)
                .WithOne(s => s.Department)
                .HasForeignKey(s => s.DepartmentId)
                .OnDelete(DeleteBehavior.SetNull);

            // Department -> Courses (1:M)
            builder.HasMany(d => d.Courses)
                .WithOne(c => c.Department)
                .HasForeignKey(c => c.DepartmentId)
                .OnDelete(DeleteBehavior.SetNull);
        }
    }
}
