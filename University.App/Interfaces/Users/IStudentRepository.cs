using University.Core.Entities;
namespace University.App.Interfaces.Users
{
    public interface IStudentRepository 
    {

        Task<Student?> GetStudentByIdAsync(int id);
        Task<IEnumerable<Student?>> GetAllStudentsAsync();
        Task<(IEnumerable<Student> students, int totalCount)> GetStudentsWithPaginationAsync(int pageNumber, int pageSize);
        Task<(IEnumerable<Student> students, int totalCount)> SearchStudentsAsync(string? searchTerm, int? departmentId, int pageNumber, int pageSize);

        Task<Student?> AddStudentAsync(Student student);
        Task<Student?> UpdateStudent(Student student);
        Task<bool> DeleteStudent(Student student);

        Task<Student?> GetByIdWithDetailsAsync(int id);
        Task<Student?> GetByUserIdAsync(int userId);
        Task<Student?> GetByStudentCodeAsync(string studentCode);
        Task<IEnumerable<Student>> GetByDepartmentAsync(int departmentId);
        Task<bool> IsStudentCodeUniqueAsync(string studentCode, int? excludeStudentId = null);

        // Soft delete operations
        Task<bool> SoftDeleteStudent(int id);
        Task<bool> RestoreStudent(int id);
        Task<bool> PermanentlyDeleteStudent(int id);
        Task<IEnumerable<Student>> GetAllStudentsIncludingDeleted();
        Task<int> GetStudentEnrollmentCount(int studentId);
    }
}
