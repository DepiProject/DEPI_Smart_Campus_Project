using University.Core.Entities;
namespace University.App.Interfaces.Courses
{
    public interface ICourseRepository
    {
        // Basic CRUD
        Task<Course?> GetCourseById(int id);
        Task<IEnumerable<Course>> GetAllCourses();
        Task<(IEnumerable<Course> courses, int totalCount)> GetCoursesWithPaginationAsync(int pageNumber, int pageSize);
        Task<(IEnumerable<Course> courses, int totalCount)> SearchCoursesAsync(string? searchTerm, int? departmentId, int? instructorId, int pageNumber, int pageSize);
        Task<IEnumerable<Course>> GetAllCoursesIncludingDeleted();
        Task<Course?> AddCourse(Course course);
        Task<Course?> UpdateCourse(Course course);
        Task<bool> DeleteCourse(int id);           // Soft delete
        Task<bool> RestoreCourse(int id);
        Task<bool> PermanentlyDeleteCourse(int id);

        // Course validation / info
        Task<int> GetActiveEnrollmentCountByCourseId(int courseId);

        Task<int> GetStudentCurrentSemesterCredits(int studentId, DateTime semesterStartDate);
        Task<int> GetStudentCurrentYearCredits(int studentId, DateTime yearStartDate);
        Task<List<string>> GetStudentCompletedCourseCodes(int studentId);

        Task<IEnumerable<Course>> GetCoursesByInstructorId(int instructorId);
        Task<int> GetInstructorActiveCourseCount(int instructorId);
        Task<int> GetInstructorTotalCreditHours(int instructorId);

        Task<IEnumerable<Course>> GetAllCoursesByDepartmentId(int departmentId);
        Task<IEnumerable<Course>> GetCoursesByDepartmentForStudent(int departmentId);
        Task<bool> IsCourseBelongsToDepartment(int courseId, int departmentId);
    }
}
