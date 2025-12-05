using University.App.DTOs;

namespace University.App.Services.IServices
{
    public interface IAuthService
    {
        Task<string?> LoginAsync(LoginDTO dto);
        Task<string?> FirstLoginPasswordChangeAsync(string email, string currentPassword, string newPassword);
        Task<AdminProfileDTO?> GetAdminProfileAsync(int userId);
        Task<string?> UpdateAdminProfileAsync(int userId, UpdateAdminProfileDTO dto);
    }
}
