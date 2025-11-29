using University.App.DTOs;

namespace University.App.Services.IServices
{
    public interface IEnrollmentService
    {
        Task<CreateEnrollmentDTO?> AddEnrollCourse(CreateEnrollmentDTO enrollCourseDto);
        Task<bool> RemoveEnrollCourse(int enrollmentId);
        Task<IEnumerable<StudentEnrollmentDTO>> GetEnrollmentsByStudentId(int studentId);
        Task<IEnumerable<StudentEnrollmentDTO>> GetEnrollmentStudentsByCourseID(int courseId);

        // Grade calculation and course completion
        Task<StudentEnrollmentDTO?> CalculateAndUpdateStudentCourseGradeAsync(int studentId, int courseId);

        // Soft delete and restore
        Task<bool> DeleteEnrollmentAsync(int enrollmentId);
        Task<bool> RestoreEnrollmentAsync(int enrollmentId);
        Task<bool> HardDeleteEnrollmentAsync(int enrollmentId);
        Task<IEnumerable<StudentEnrollmentDTO>> GetAllEnrollmentsIncludingDeletedAsync();
        Task<IEnumerable<StudentEnrollmentDTO>> GetAllActiveEnrollmentsAsync();

        // Approval workflow
        Task<bool> ApproveEnrollmentAsync(int enrollmentId);
        Task<bool> RejectEnrollmentAsync(int enrollmentId);
    }
}