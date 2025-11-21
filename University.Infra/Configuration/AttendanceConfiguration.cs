using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using University.Core.Entities;

namespace University.Infra.Configuration
{
    public class AttendanceConfiguration : IEntityTypeConfiguration<Attendance>
    {
        public void Configure(EntityTypeBuilder<Attendance> builder)
        {
            builder.ToTable("Attendances");

            builder.HasKey(a => a.AttendanceId);

            builder.Property(a => a.Date)
                .IsRequired();

            builder.Property(a => a.Status)
                .IsRequired()
                .HasMaxLength(20);

            // Prevent duplicate attendance in same course & date
            builder.HasIndex(a => new { a.StudentId, a.CourseId, a.Date })
                 .IsUnique()
                 .HasDatabaseName("IX_Attendances_UniqueRecord");

            

            // Attendance → Course  (many-to-one)
            builder.HasOne(a => a.Course)
                .WithMany(c => c.Attendances)
                .HasForeignKey(a => a.CourseId)
                .OnDelete(DeleteBehavior.Restrict); // consistent with Course config

            // Attendance → Student (many-to-one)
            builder.HasOne(a => a.Student)
                .WithMany(s => s.Attendances)
                .HasForeignKey(a => a.StudentId)
                .OnDelete(DeleteBehavior.Restrict); // consistent with Student config
        }
    }
}
