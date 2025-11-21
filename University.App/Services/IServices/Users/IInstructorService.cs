using University.App.DTOs.Users;

namespace University.App.Services.IServices.Users
{
    public interface IInstructorService
    {
        // Admin operations
        Task<InstructorDTO?> GetByIdAsync(int id);
        Task<IEnumerable<InstructorDTO>> GetAllAsync();
        Task<IEnumerable<InstructorDTO>> GetByDepartmentAsync(int departmentId);
        Task<InstructorDTO> CreateAsync(CreateInstructorDto dto);
        Task<InstructorDTO> UpdateAsync(int id, UpdateInstructorDto dto);
        Task<bool> DeleteAsync(int id);

        // Instructor self-operations
        Task<InstructorDTO?> GetMyProfileAsync(int userId);
        Task<InstructorDTO> UpdateMyProfileAsync(int userId, UpdateInstructorProfileDto dto);

    }
}
