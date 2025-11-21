using Microsoft.EntityFrameworkCore;
using University.App.Interfaces.Courses;
using University.Core.Entities;
using University.Infra.Data;

namespace University.Infra.Repositories.Courses
{
    public class EnrollmentRepository : IEnrollmentRepository
    {
        private readonly UniversityDbContext _context;

        public EnrollmentRepository(UniversityDbContext context)
        {
            _context = context;
        }

        public async Task<Enrollment?> AddEnrollment(Enrollment enrollment)
        {
            _context.Enrollments.Add(enrollment);
            await _context.SaveChangesAsync();
            return enrollment;
        }

        public async Task<bool> RemoveEnrollment(int enrollmentId)
        {
            var enrollment = await _context.Enrollments
        .Include(e => e.Course)
        .FirstOrDefaultAsync(e => e.EnrollmentId == enrollmentId);

            if (enrollment == null) return false;

            // Prevent deletion if course is completed
            if (enrollment.Status == "Completed")
                throw new InvalidOperationException("Cannot delete completed enrollment");

            // Check for related data
            var hasAttendance = await _context.Attendances
                .AnyAsync(a => a.StudentId == enrollment.StudentId && a.CourseId == enrollment.CourseId);

            if (hasAttendance)
                throw new InvalidOperationException("Cannot delete enrollment with attendance records");

            _context.Enrollments.Remove(enrollment);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<IEnumerable<Enrollment>> GetEnrollmentsByStudentId(int studentId)
        {
            return await _context.Enrollments
                .Include(e => e.Course)
                    .ThenInclude(c => c.Department)
                .Include(e => e.Student)
                .Where(e => e.StudentId == studentId)
                 .IgnoreQueryFilters() // ADD THIS LINE - includes soft-deleted courses
                .AsNoTracking()
                .ToListAsync();
        }

        public async Task<Enrollment?> GetEnrollmentByStudentAndCourse(int studentId, int courseId)
        {
            return await _context.Enrollments
                .Include(e => e.Course)
                .Include(e => e.Student)
                .IgnoreQueryFilters() // ADD THIS LINE - includes soft-deleted courses
                .AsNoTracking()
                .FirstOrDefaultAsync(e => e.StudentId == studentId && e.CourseId == courseId);
        }

        public async Task<bool> IsStudentEnrolled(int studentId, int courseId)
        {
            return await _context.Enrollments
             .IgnoreQueryFilters()
             .AnyAsync(e => e.StudentId == studentId && e.CourseId == courseId && e.Status == "Enrolled");
        }
        // NEW METHOD: Get enrollment with course details
        public async Task<Enrollment?> GetEnrollmentWithCourseDetails(int studentId, int courseId)
        {
            return await _context.Enrollments
                .Include(e => e.Course)
                    .ThenInclude(c => c.Exams)
                .Include(e => e.Student)
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(e => e.StudentId == studentId && e.CourseId == courseId);
        }

        // NEW METHOD: Update enrollment completion status
        public async Task<bool> UpdateEnrollmentCompletion( int enrollmentId,string status,decimal? finalGrade,string? gradeLetter)
        {
            var enrollment = await _context.Enrollments.FindAsync(enrollmentId);
            if (enrollment == null)
                return false;

            // Validation (can be moved to service layer)
            var validStatuses = new[] { "Enrolled", "Completed", "Dropped", "Withdrawn" };
            if (!validStatuses.Contains(status))
                throw new ArgumentException($"Invalid status: {status}");

            if (finalGrade.HasValue && (finalGrade < 0 || finalGrade > 100))
                throw new ArgumentException("Final grade must be between 0 and 100");

            enrollment.Status = status;
            enrollment.FinalGrade = finalGrade;
            enrollment.GradeLetter = gradeLetter;
            enrollment.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return true;
        }
        // ADDITIONAL METHOD: Get enrollments with course details (including deleted)
        public async Task<IEnumerable<Enrollment>> GetEnrollmentsWithCoursesByStudentId(int studentId)
        {
            return await _context.Enrollments
                .Include(e => e.Course)
                    .ThenInclude(c => c.Department)
                .Include(e => e.Student)
                .Where(e => e.StudentId == studentId)
                .IgnoreQueryFilters() // This ensures soft-deleted courses are included
                .AsNoTracking()
                .ToListAsync();
        }
    }
}
