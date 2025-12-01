using University.App.DTOs.Users;

namespace University.App.Services.IServices.Users
{
    public interface IInstructorService
    {
        // Admin operations
        Task<InstructorDTO?> GetByIdAsync(int id);
        Task<IEnumerable<InstructorDTO>> GetAllAsync();
        Task<(IEnumerable<InstructorDTO> instructors, int totalCount)> GetAllWithPaginationAsync(int pageNumber, int pageSize);
        Task<(IEnumerable<InstructorDTO> instructors, int totalCount)> SearchInstructorsAsync(string? searchTerm, int? departmentId, int pageNumber, int pageSize);
        Task<IEnumerable<InstructorDTO>> GetByDepartmentAsync(int departmentId);
        Task<InstructorDTO> CreateAsync(CreateInstructorDto dto);
        Task<InstructorDTO> UpdateAsync(int id, UpdateInstructorDto dto);
        Task<bool> DeleteAsync(int id);

        // Instructor self-operations
        Task<InstructorDTO?> GetMyProfileAsync(int userId);
        Task<InstructorDTO> UpdateMyProfileAsync(int userId, UpdateInstructorProfileDto dto);

        // Soft delete operations
        Task<bool> SoftDeleteAsync(int id);
        Task<bool> RestoreAsync(int id);
        Task<bool> PermanentlyDeleteAsync(int id);
        Task<(bool CanDelete, string Reason, int RelatedDataCount)> CanPermanentlyDeleteAsync(int id);
        Task<IEnumerable<InstructorDTO>> GetAllIncludingDeletedAsync();
        
        // Reassignment operations
        Task<int> ReassignCoursesToInstructorAsync(int fromInstructorId, int toInstructorId);
        
        // Validation operations
        Task<bool> IsPhoneNumberUniqueAsync(string phoneNumber);
        Task<int> GetInstructorCourseCountAsync(int instructorId);
        Task<bool> IsHeadOfDepartmentAsync(int instructorId);
        
        // Granular reassignment operations
        Task<int> ReassignCoursesOnlyAsync(int fromInstructorId, int toInstructorId);
        Task<bool> TransferDepartmentHeadRoleAsync(int fromInstructorId, int toInstructorId);
    }
}
