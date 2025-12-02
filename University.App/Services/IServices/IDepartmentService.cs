using University.App.DTOs;

namespace University.App.Services.IServices
{
    public interface IDepartmentService
    {
        Task<DepartmentDTO?> GetDepartmentById(int id);
        Task<IEnumerable<DepartmentDTO>> GetAllDepartments();
        Task<(IEnumerable<DepartmentDTO> departments, int totalCount)> GetAllDepartmentsWithPaginationAsync(int pageNumber, int pageSize);
        Task<(IEnumerable<DepartmentDTO> departments, int totalCount)> SearchDepartmentsAsync(string? searchTerm, int pageNumber, int pageSize);
        Task<DepartmentDTO?> AddDepartment(CreateDepartmentDTO departmentDto);
        Task<DepartmentDTO?> UpdateDepartment(int id, UpdateDepartmentDTO departmentDto);
        Task<bool> DeleteDepartment(int id);

        // Soft delete operations
        Task<bool> SoftDeleteDepartment(int id);
        Task<bool> RestoreDepartment(int id);
        Task<bool> PermanentlyDeleteDepartment(int id);
        Task<(bool CanDelete, string Reason, int RelatedDataCount)> CanPermanentlyDeleteDepartment(int id);
        Task<IEnumerable<DepartmentDTO>> GetAllDepartmentsIncludingDeleted();

        // Auto-assign head functionality
        Task<(bool HeadAssigned, string Message, int InstructorCount)> CheckAndAutoAssignDepartmentHeadAsync(int departmentId);
    }
}