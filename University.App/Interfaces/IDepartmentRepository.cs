using University.Core.Entities;
namespace University.App.Interfaces
{
    public interface IDepartmentRepository
    {
        Task<Department?> GetDepartmentById(int id);
        Task<Department?> GetDepartmentByName(string name);
        Task<Department?> GetDepartmentByHeadId(int id);
        Task<IEnumerable<Department>> GetAllDepartments();
        Task<Department?> AddDepartment(Department department);
        Task<Department?> UpdateDepartment(Department department);
        Task<bool> DeleteDepartment(int id);
    }
}
