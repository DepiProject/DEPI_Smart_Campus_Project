using University.App.DTOs;

namespace University.App.Services.IServices
{
    public interface IAuthService
    {
        Task<string?> LoginAsync(LoginDTO dto);
    }
}
