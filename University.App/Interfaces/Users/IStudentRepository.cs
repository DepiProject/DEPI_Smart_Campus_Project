using System.Linq.Expressions;
using University.Core.Entities;


namespace University.App.Interfaces.Users
{
    public interface IStudentRepository 
    {

        Task<Student?> GetStudentByIdAsync(int id);
        Task<IEnumerable<Student?>> GetAllStudentsAsync();

        Task<Student?> AddStudentAsync(Student student);
        Task<Student?> UpdateStudent(Student student);
        Task<bool> DeleteStudent(Student student);

        Task<Student?> GetByIdWithDetailsAsync(int id);
        Task<Student?> GetByUserIdAsync(int userId);
        Task<Student?> GetByStudentCodeAsync(string studentCode);
        Task<IEnumerable<Student>> GetByDepartmentAsync(int departmentId);
        Task<bool> IsStudentCodeUniqueAsync(string studentCode, int? excludeStudentId = null);

    }
}
