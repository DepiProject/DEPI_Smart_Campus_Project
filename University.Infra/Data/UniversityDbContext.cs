using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using University.Core.Entities;

namespace University.Infra.Data
{
    public class UniversityDbContext : IdentityDbContext<AppUser, IdentityRole<int>, int>
    {
        public UniversityDbContext(DbContextOptions<UniversityDbContext> options)
           : base(options)
        {
        }

        // DbSets - Identity & Academic
        public DbSet<Department> Departments { get; set; }
        public DbSet<Student> Students { get; set; }
        public DbSet<Instructor> Instructors { get; set; }
        public DbSet<Course> Courses { get; set; }

        // DbSets - Enrollment (Grade now part of Enrollment)
        public DbSet<Enrollment> Enrollments { get; set; }

        // DbSets - Exams (Simplified - No QuestionType, No TrueFalse)
        public DbSet<Exam> Exams { get; set; }
        public DbSet<ExamQuestion> ExamQuestions { get; set; }
        public DbSet<MCQOption> MCQOptions { get; set; }
        public DbSet<ExamSubmission> ExamSubmissions { get; set; }
        public DbSet<ExamAnswer> ExamAnswers { get; set; }

        // DbSets - Tracking
        public DbSet<Attendance> Attendances { get; set; }

        // Removed: Grades, Notifications, QuestionTypes, TrueFalseQuestions

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            builder.ApplyConfigurationsFromAssembly(typeof(UniversityDbContext).Assembly);

            // Global query filter for soft delete
            builder.Entity<AppUser>().HasQueryFilter(u => !u.IsDeleted);
            builder.Entity<Student>().HasQueryFilter(s => !s.IsDeleted);
            builder.Entity<Instructor>().HasQueryFilter(i => !i.IsDeleted);
            builder.Entity<Course>().HasQueryFilter(c => !c.IsDeleted);
            builder.Entity<Exam>().HasQueryFilter(e => !e.IsDeleted);
            builder.Entity<Department>().HasQueryFilter(d => !d.IsDeleted);
            builder.Entity<Enrollment>().HasQueryFilter(en => !en.IsDeleted);
            builder.Entity<Attendance>().HasQueryFilter(a => !a.IsDeleted);
            builder.Entity<ExamSubmission>().HasQueryFilter(es => !es.IsDeleted);
        }

        // Override SaveChanges for soft delete
        public override int SaveChanges()
        {
            UpdateSoftDeleteStatuses();
            return base.SaveChanges();
        }

        public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        {
            UpdateSoftDeleteStatuses();
            return base.SaveChangesAsync(cancellationToken);
        }

        private void UpdateSoftDeleteStatuses()
        {
            foreach (var entry in ChangeTracker.Entries())
            {
                // Update timestamps for modified entities
                if (entry.State == EntityState.Modified)
                {
                    if (entry.Entity.GetType().GetProperty("UpdatedAt") != null)
                    {
                        entry.Property("UpdatedAt").CurrentValue = DateTime.UtcNow;
                    }
                }
                if (entry.State == EntityState.Deleted)
                {
                    // Check if entity is already soft-deleted (IsDeleted = true)
                    // If yes, allow permanent deletion (hard delete)
                    var isDeletedProperty = entry.Entity.GetType().GetProperty("IsDeleted");
                    bool isAlreadySoftDeleted = false;
                    
                    if (isDeletedProperty != null)
                    {
                        var value = isDeletedProperty.GetValue(entry.Entity);
                        isAlreadySoftDeleted = value is bool b && b;
                    }

                    // If already soft-deleted, allow hard delete (don't intercept)
                    if (isAlreadySoftDeleted)
                    {
                        continue; // Skip interception - let it be permanently deleted
                    }

                    // Otherwise, convert to soft delete
                    if (entry.Entity is AppUser user)
                    {
                        entry.State = EntityState.Modified;
                        user.IsDeleted = true;
                        user.DeletedAt = DateTime.UtcNow;
                    }
                    else if (entry.Entity is Student student)
                    {
                        entry.State = EntityState.Modified;
                        student.IsDeleted = true;
                        student.DeletedAt = DateTime.UtcNow;
                    }
                    else if (entry.Entity is Instructor instructor)
                    {
                        entry.State = EntityState.Modified;
                        instructor.IsDeleted = true;
                        instructor.DeletedAt = DateTime.UtcNow;
                    }
                    else if (entry.Entity is Course course)
                    {
                        entry.State = EntityState.Modified;
                        course.IsDeleted = true;
                        course.DeletedAt = DateTime.UtcNow;
                    }
                    else if (entry.Entity is Exam exam)
                    {
                        entry.State = EntityState.Modified;
                        exam.IsDeleted = true;
                        exam.DeletedAt = DateTime.UtcNow;
                    }
                    else if (entry.Entity is Department department)
                    {
                        entry.State = EntityState.Modified;
                        department.IsDeleted = true;
                        department.DeletedAt = DateTime.UtcNow;
                    }
                    else if (entry.Entity is Enrollment enrollment)
                    {
                        entry.State = EntityState.Modified;
                        enrollment.IsDeleted = true;
                        enrollment.DeletedAt = DateTime.UtcNow;
                    }
                    else if (entry.Entity is Attendance attendance)
                    {
                        entry.State = EntityState.Modified;
                        attendance.IsDeleted = true;
                        attendance.DeletedAt = DateTime.UtcNow;
                    }
                    else if (entry.Entity is ExamSubmission examSubmission)
                    {
                        entry.State = EntityState.Modified;
                        examSubmission.IsDeleted = true;
                        examSubmission.DeletedAt = DateTime.UtcNow;
                    }
                }
            }
        }
    }
}