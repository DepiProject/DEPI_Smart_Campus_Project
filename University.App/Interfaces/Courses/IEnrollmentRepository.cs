using University.Core.Entities;

namespace University.App.Interfaces.Courses
{
    public interface IEnrollmentRepository
    {
        Task<Enrollment?> AddEnrollment(Enrollment enrollment);
        Task<bool> RemoveEnrollment(int enrollmentId);

        Task<IEnumerable<Enrollment>> GetEnrollmentsByStudentId(int studentId);
        Task<Enrollment?> GetEnrollmentByStudentAndCourse(int studentId, int courseId);
        Task<bool> IsStudentEnrolled(int studentId, int courseId);

        // NEW METHODS
        Task<Enrollment?> GetEnrollmentWithCourseDetails(int studentId, int courseId);
        Task<bool> UpdateEnrollmentCompletion(int enrollmentId, string status, decimal? finalGrade, string? gradeLetter);
        Task<IEnumerable<Enrollment>> GetEnrollmentsWithCoursesByStudentId(int studentId);

        // Soft delete and restore
        Task<bool> DeleteEnrollmentAsync(int enrollmentId);
        Task<bool> RestoreEnrollmentAsync(int enrollmentId);
        Task<bool> HardDeleteEnrollmentAsync(int enrollmentId);
        Task<IEnumerable<Enrollment>> GetAllEnrollmentsIncludingDeletedAsync();
        Task<IEnumerable<Enrollment>> GetAllActiveEnrollmentsAsync();
        Task<Enrollment?> GetEnrollmentByIdAsync(int enrollmentId);
    }
}