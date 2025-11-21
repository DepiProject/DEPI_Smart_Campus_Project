using University.App.DTOs;

namespace University.App.Services.IServices
{
    public interface IEnrollmentService
    {
        Task<CreateEnrollmentDTO?> AddEnrollCourse(CreateEnrollmentDTO enrollCourseDto);
        Task<bool> RemoveEnrollCourse(int enrollmentId);
        Task<IEnumerable<StudentEnrollmentDTO>> GetEnrollmentsByStudentId(int studentId);
        Task<IEnumerable<StudentEnrollmentDTO>> GetEnrollmentStudentsByCourseID(int courseId);

        // NEW: Grade calculation and course completion
        Task<StudentEnrollmentDTO?> CalculateAndUpdateStudentCourseGradeAsync(int studentId, int courseId);

        // NEW: Soft delete and restore
        Task<bool> DeleteEnrollmentAsync(int enrollmentId);
        Task<bool> RestoreEnrollmentAsync(int enrollmentId);
        Task<IEnumerable<StudentEnrollmentDTO>> GetAllEnrollmentsIncludingDeletedAsync();
    }
}
