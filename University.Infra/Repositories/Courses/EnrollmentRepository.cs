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
        .FirstOrDefaultAsync(e => e.EnrollmentId == enrollmentId && !e.IsDeleted);

            if (enrollment == null)
                throw new InvalidOperationException("Enrollment not found or already deleted");

            // ENHANCEMENT: Prevent deletion of completed enrollments (preserve academic records)
            if (enrollment.Status == "Completed")
                throw new InvalidOperationException("Cannot delete completed enrollment. Completed enrollments are permanent academic records.");

            // Check for related data (soft delete checks)
            var hasActiveAttendance = await _context.Attendances
                .AnyAsync(a => a.StudentId == enrollment.StudentId && a.CourseId == enrollment.CourseId && !a.IsDeleted);

            if (hasActiveAttendance)
                throw new InvalidOperationException("Cannot delete enrollment with active attendance records. Remove attendance first.");

            // ENHANCEMENT: Use soft delete instead of hard delete (preserves data for audit/compliance)
            enrollment.IsDeleted = true;
            enrollment.DeletedAt = DateTime.UtcNow;
            enrollment.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<IEnumerable<Enrollment>> GetEnrollmentsByStudentId(int studentId)
        {
            // FIXED: Added IsDeleted filter to exclude soft-deleted enrollments by default
            return await _context.Enrollments
                .Include(e => e.Course)
                    .ThenInclude(c => c.Department)
                .Include(e => e.Student)
                .Where(e => e.StudentId == studentId && !e.IsDeleted)
                .IgnoreQueryFilters() // includes soft-deleted courses
                .AsNoTracking()
                .ToListAsync();
        }

        public async Task<Enrollment?> GetEnrollmentByStudentAndCourse(int studentId, int courseId)
        {
            // FIXED: Added IsDeleted filter
            return await _context.Enrollments
                .Include(e => e.Course)
                .Include(e => e.Student)
                .Where(e => !e.IsDeleted)
                .IgnoreQueryFilters() // includes soft-deleted courses
                .AsNoTracking()
                .FirstOrDefaultAsync(e => e.StudentId == studentId && e.CourseId == courseId);
        }

        public async Task<bool> IsStudentEnrolled(int studentId, int courseId)
        {
            // FIXED: Added IsDeleted filter
            return await _context.Enrollments
                .IgnoreQueryFilters()
                .AnyAsync(e => e.StudentId == studentId && e.CourseId == courseId && e.Status == "Enrolled" && !e.IsDeleted);
        }
        // Get enrollment with course details
        public async Task<Enrollment?> GetEnrollmentWithCourseDetails(int studentId, int courseId)
        {
            // FIXED: Added IsDeleted filter
            return await _context.Enrollments
                .Include(e => e.Course)
                    .ThenInclude(c => c.Exams)
                .Include(e => e.Student)
                .Where(e => !e.IsDeleted)
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(e => e.StudentId == studentId && e.CourseId == courseId);
        }

        // Update enrollment completion status
        // FIXED: Uses DateTime.UtcNow
        public async Task<bool> UpdateEnrollmentCompletion(int enrollmentId, string status, decimal? finalGrade, string? gradeLetter)
        {
            var enrollment = await _context.Enrollments.FindAsync(enrollmentId);
            if (enrollment == null)
                return false;

            // Validation
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
        // Get enrollments with course details (including deleted courses)
        // FIXED: Added IsDeleted filter for enrollments
        public async Task<IEnumerable<Enrollment>> GetEnrollmentsWithCoursesByStudentId(int studentId)
        {
            return await _context.Enrollments
                .Include(e => e.Course)
                    .ThenInclude(c => c.Department)
                .Include(e => e.Student)
                .Where(e => e.StudentId == studentId && !e.IsDeleted)
                .IgnoreQueryFilters() // This ensures soft-deleted courses are included
                .AsNoTracking()
                .ToListAsync();
        }

        // NEW: Soft delete enrollment
        public async Task<bool> DeleteEnrollmentAsync(int enrollmentId)
        {
            var enrollment = await _context.Enrollments
                .FirstOrDefaultAsync(e => e.EnrollmentId == enrollmentId && !e.IsDeleted);

            if (enrollment == null)
                return false;

            enrollment.IsDeleted = true;
            enrollment.DeletedAt = DateTime.UtcNow;
            enrollment.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return true;
        }

        // NEW: Restore soft-deleted enrollment
        public async Task<bool> RestoreEnrollmentAsync(int enrollmentId)
        {
            var enrollment = await _context.Enrollments
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(e => e.EnrollmentId == enrollmentId);

            if (enrollment == null)
                return false;

            if (!enrollment.IsDeleted)
                throw new InvalidOperationException("Enrollment is not deleted.");

            enrollment.IsDeleted = false;
            enrollment.DeletedAt = null;
            enrollment.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return true;
        }

        // NEW: Get all enrollments including deleted
        public async Task<IEnumerable<Enrollment>> GetAllEnrollmentsIncludingDeletedAsync()
        {
            return await _context.Enrollments
                .IgnoreQueryFilters()
                .Include(e => e.Course)
                    .ThenInclude(c => c.Department)
                .Include(e => e.Student)
                .AsNoTracking()
                .ToListAsync();
        }

        // NEW: Get enrollment by ID (without IsDeleted filter)
        public async Task<Enrollment?> GetEnrollmentByIdAsync(int enrollmentId)
        {
            return await _context.Enrollments
                .Include(e => e.Course)
                .Include(e => e.Student)
                .Where(e => !e.IsDeleted)
                .FirstOrDefaultAsync(e => e.EnrollmentId == enrollmentId);
        }
    }
}