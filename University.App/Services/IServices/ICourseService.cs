using University.App.DTOs;
using University.App.DTOs.Users;

namespace University.App.Services.IServices
{
    public interface ICourseService
    {
        Task<IEnumerable<CourseDTO>> GetAllCourses();
        Task<(IEnumerable<CourseDTO> courses, int totalCount)> GetAllCoursesWithPaginationAsync(int pageNumber, int pageSize);
        Task<(IEnumerable<CourseDTO> courses, int totalCount)> SearchCoursesAsync(string? searchTerm, int? departmentId, int? instructorId, int pageNumber, int pageSize);
        Task<CourseDTO?> GetCourseById(int id);
        Task<CourseDTO?> GetCourseByCode(string courseCode);
        Task<CreateCourseDTO?> AddCourse(CreateCourseDTO courseDto);
        Task<CourseDTO?> UpdateCourse(int id, UpdateCourseDTO courseDto);
        Task<bool> DeleteCourse(int id);
        Task<bool> RestoreCourse(int id);
        Task<bool> RestoreCourseWithInstructorReassignment(int courseId, int? newInstructorId = null);
        Task<IEnumerable<InstructorAvailabilityDTO>> GetAvailableInstructorsForCourseRestore(int courseId);
        Task<object> GetInstructorWorkloadDebugInfo(int courseId);
        Task<bool> PermanentlyDeleteCourse(int id);
        Task<(bool CanDelete, string Reason, int RelatedDataCount)> CanPermanentlyDeleteCourse(int id);
        Task<IEnumerable<CourseDTO>> GetAllCoursesIncludingDeleted();

        Task<IEnumerable<EnrollCourseDTO>> GetAllCoursesByDepartmentID(int departmentId);
        Task<IEnumerable<EnrollCourseDTO>> GetAvailableCoursesForStudent(int studentId);
        Task<IEnumerable<InstructorCoursesDTO>> GetCoursesByInstructorId(int instructorId);

        Task<bool> CanCourseRun(int courseId);
    }
}
