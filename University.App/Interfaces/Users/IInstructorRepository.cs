using University.Core.Entities;


namespace University.App.Interfaces.Users
{
    public interface IInstructorRepository 
    {
        Task<Instructor?> GetInstructorByIdAsync(int id);
        Task<IEnumerable<Instructor?>> GetAllInstructorsAsync();
        Task<(IEnumerable<Instructor> instructors, int totalCount)> GetInstructorsWithPaginationAsync(int pageNumber, int pageSize);
        Task<(IEnumerable<Instructor> instructors, int totalCount)> SearchInstructorsAsync(string? searchTerm, int? departmentId, int pageNumber, int pageSize);

        Task<Instructor?> AddInstructorAsync(Instructor instructor);
        Task<Instructor?> UpdateInstructor(Instructor instructor);
        Task<bool> DeleteInstructor(Instructor instructor);

        Task<Instructor?> GetByIdWithDetailsAsync(int id);
        Task<Instructor?> GetByUserIdAsync(int userId);
        Task<IEnumerable<Instructor>> GetByDepartmentAsync(int departmentId);
        Task<Instructor?> GetFirstInstructorByDepartmentAsync(int departmentId);
        Task<bool> IsHeadOfAnyDepartmentAsync(int instructorId);
        Task<bool> HasActiveCoursesWithEnrollmentsAsync(int instructorId);

        // Soft delete operations
        Task<bool> SoftDeleteInstructor(int id);
        Task<bool> RestoreInstructor(int id);
        Task<bool> PermanentlyDeleteInstructor(int id);
        Task<IEnumerable<Instructor>> GetAllInstructorsIncludingDeleted();
        Task<int> GetInstructorCourseCount(int instructorId);
    }
}
