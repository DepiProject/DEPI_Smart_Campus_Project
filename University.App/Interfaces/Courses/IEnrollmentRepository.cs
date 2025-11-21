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
        Task<IEnumerable<Enrollment>> GetEnrollmentsWithCoursesByStudentId(int studentId); // ← ADD THIS
    }
}