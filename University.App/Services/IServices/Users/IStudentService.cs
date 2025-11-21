using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using University.App.DTOs.Users;

namespace University.App.Services.IServices.Users
{
    public interface IStudentService
    {
        // Admin operations
        Task<StudentDTO?> GetByIdAsync(int id);
        Task<IEnumerable<StudentDTO>> GetAllAsync();
        Task<IEnumerable<StudentDTO>> GetByDepartmentAsync(int departmentId);
        Task<StudentDTO> CreateAsync(CreateStudentDto dto);
        Task<StudentDTO> UpdateAsync(int id, UpdateStudentDto dto);
        Task<bool> DeleteAsync(int id);

        // Student self-operations
        Task<StudentDTO?> GetMyProfileAsync(int userId);
        Task<StudentDTO> UpdateMyProfileAsync(int userId, UpdateStudentProfileDto dto);

        // Utility
        Task<StudentDTO?> GetByStudentCodeAsync(string studentCode);

    }
}
