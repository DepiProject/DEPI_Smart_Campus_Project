using University.Core.Entities;


namespace University.App.Interfaces.Users
{
    public interface IInstructorRepository 
    {
        Task<Instructor?> GetInstructorByIdAsync(int id);
        Task<IEnumerable<Instructor?>> GetAllInstructorsAsync();

        Task<Instructor?> AddInstructorAsync(Instructor instructor);
        Task<Instructor?> UpdateInstructor(Instructor instructor);
        Task<bool> DeleteInstructor(Instructor instructor);

        Task<Instructor?> GetByIdWithDetailsAsync(int id);
        Task<Instructor?> GetByUserIdAsync(int userId);
        Task<IEnumerable<Instructor>> GetByDepartmentAsync(int departmentId);
        Task<bool> IsHeadOfAnyDepartmentAsync(int instructorId);
        Task<bool> HasActiveCoursesWithEnrollmentsAsync(int instructorId);
    }
}
