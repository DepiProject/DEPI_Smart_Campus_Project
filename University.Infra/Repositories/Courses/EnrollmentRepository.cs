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
                .Include(e => e.Course)
                    .ThenInclude(c => c.Instructor)
                .Include(e => e.Student)
                    .ThenInclude(s => s.User) // Include User to get email
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

            // Validation - Updated to include Pending and Rejected statuses
            var validStatuses = new[] { "Pending", "Enrolled", "Completed", "Dropped", "Withdrawn", "Rejected" };
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
                    .ThenInclude(s => s.User) // Include User to get email
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
            enrollment.Status = "Pending"; // Reset to Pending for review
            enrollment.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return true;
        }

        // NEW: Hard delete enrollment (permanent removal)
        public async Task<bool> HardDeleteEnrollmentAsync(int enrollmentId)
        {
            // Use explicit transaction to ensure all deletes commit together
            using var transaction = await _context.Database.BeginTransactionAsync();
            
            try
            {
                var enrollment = await _context.Enrollments
                    .IgnoreQueryFilters()
                    .FirstOrDefaultAsync(e => e.EnrollmentId == enrollmentId);

                if (enrollment == null)
                {
                    Console.WriteLine($"❌ Enrollment {enrollmentId} not found");
                    return false;
                }

                Console.WriteLine($"🔍 Found enrollment {enrollmentId}: Student {enrollment.StudentId}, Course {enrollment.CourseId}");

                // 1. Delete attendance records for this student in this course
                var attendanceRecords = await _context.Attendances
                    .IgnoreQueryFilters()
                    .Where(a => a.StudentId == enrollment.StudentId && a.CourseId == enrollment.CourseId)
                    .ToListAsync();
                
                if (attendanceRecords.Any())
                {
                    Console.WriteLine($"📋 Deleting {attendanceRecords.Count} attendance records");
                    _context.Attendances.RemoveRange(attendanceRecords);
                }

                // 2. Delete exam submissions for this student in this course's exams
                var courseExamIds = await _context.Exams
                    .Where(e => e.CourseId == enrollment.CourseId)
                    .Select(e => e.ExamId)
                    .ToListAsync();
                
                if (courseExamIds.Any())
                {
                    var submissions = await _context.ExamSubmissions
                        .IgnoreQueryFilters()
                        .Where(s => s.StudentId == enrollment.StudentId && 
                                   s.ExamId.HasValue && 
                                   courseExamIds.Contains(s.ExamId.Value))
                        .ToListAsync();
                    
                    if (submissions.Any())
                    {
                        Console.WriteLine($"📝 Deleting {submissions.Count} exam submissions");
                        _context.ExamSubmissions.RemoveRange(submissions);
                    }
                }

                // 3. Now delete the enrollment itself
                Console.WriteLine($"🗑️ Deleting enrollment {enrollmentId}");
                _context.Enrollments.Remove(enrollment);
                
                // Save all changes
                var result = await _context.SaveChangesAsync();
                Console.WriteLine($"💾 SaveChanges completed. Rows affected: {result}");
                
                // Commit transaction
                await transaction.CommitAsync();
                Console.WriteLine($"✅ Transaction committed. Enrollment {enrollmentId} permanently deleted");
                
                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Hard delete enrollment {enrollmentId} failed: {ex.Message}");
                Console.WriteLine($"❌ Stack trace: {ex.StackTrace}");
                await transaction.RollbackAsync();
                throw;
            }
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

        // Get all active enrollments (respects IsDeleted filter)
        public async Task<IEnumerable<Enrollment>> GetAllActiveEnrollmentsAsync()
        {
            return await _context.Enrollments
                // Don't use IgnoreQueryFilters - respect the global filter
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
                .IgnoreQueryFilters() // Ignore global query filter to find soft-deleted enrollments
                .Include(e => e.Course)
                .Include(e => e.Student)
                .FirstOrDefaultAsync(e => e.EnrollmentId == enrollmentId);
        }
    }
}