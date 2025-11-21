using University.App.DTOs;

namespace University.App.Services.IServices
{
    public interface ICourseService
    {
        Task<IEnumerable<CourseDTO>> GetAllCourses();
        Task<CourseDTO?> GetCourseById(int id);
        Task<CreateCourseDTO?> AddCourse(CreateCourseDTO courseDto);
        Task<CourseDTO?> UpdateCourse(int id, UpdateCourseDTO courseDto);
        Task<bool> DeleteCourse(int id);
        Task<bool> RestoreCourse(int id);
        Task<bool> PermanentlyDeleteCourse(int id);
        Task<IEnumerable<CourseDTO>> GetAllCoursesIncludingDeleted();

        Task<IEnumerable<EnrollCourseDTO>> GetAllCoursesByDepartmentID(int departmentId);
        Task<IEnumerable<EnrollCourseDTO>> GetAvailableCoursesForStudent(int studentId);
        Task<IEnumerable<InstructorCoursesDTO>> GetCoursesByInstructorId(int instructorId);

        Task<bool> CanCourseRun(int courseId);
    }
}
