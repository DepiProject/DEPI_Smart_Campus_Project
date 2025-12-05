using University.Core.Entities;
namespace University.App.Interfaces
{
    public interface IDepartmentRepository
    {
        Task<Department?> GetDepartmentById(int id);
        Task<Department?> GetDepartmentByName(string name);
        Task<Department?> GetDepartmentByHeadId(int id);
        Task<IEnumerable<Department>> GetAllDepartments();
        Task<(IEnumerable<Department> departments, int totalCount)> GetDepartmentsWithPaginationAsync(int pageNumber, int pageSize);
        Task<(IEnumerable<Department> departments, int totalCount)> SearchDepartmentsAsync(string? searchTerm, int pageNumber, int pageSize);
        Task<Department?> AddDepartment(Department department);
        Task<Department?> UpdateDepartment(Department department);
        Task<bool> DeleteDepartment(int id);

        // Soft delete operations
        Task<bool> SoftDeleteDepartment(int id);
        Task<bool> RestoreDepartment(int id);
        Task<bool> PermanentlyDeleteDepartment(int id);
        Task<IEnumerable<Department>> GetAllDepartmentsIncludingDeleted();
        Task<int> GetDepartmentStudentCount(int departmentId);
        Task<int> GetDepartmentInstructorCount(int departmentId);
        Task<int> GetDepartmentCourseCount(int departmentId);
    }
}
