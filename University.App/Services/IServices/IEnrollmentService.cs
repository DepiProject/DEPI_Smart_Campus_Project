using University.App.DTOs;

namespace University.App.Services.IServices
{
    public interface IEnrollmentService
    {
        Task<CreateEnrollmentDTO?> AddEnrollCourse(CreateEnrollmentDTO enrollCourseDto);
        Task<bool> RemoveEnrollCourse(int enrollmentId);
        Task<IEnumerable<StudentEnrollmentDTO>> GetEnrollmentsByStudentId(int studentId);
        Task<IEnumerable<StudentEnrollmentDTO>> GetEnrollmentStudentsByCourseID(int courseId);
    }
}
