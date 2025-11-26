using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using University.App.DTOs;
using University.App.Services.IServices;
using University.Core.Entities;

namespace University.App.Services.Implementations
{
    public class AuthService : IAuthService
    {
        private readonly UserManager<AppUser> _userManager;
        private readonly IConfiguration _config;
        private readonly SignInManager<AppUser> _signInManager;

        public AuthService(
            UserManager<AppUser> userManager,
            SignInManager<AppUser> signInManager,
            IConfiguration config)
        {
            _userManager = userManager;
            _signInManager = signInManager;
            _config = config;
        }

        public async Task<string?> LoginAsync(LoginDTO dto)
        {
            // 1. Find user by email
            var user = await _userManager.FindByEmailAsync(dto.Email);
            if (user == null || user.IsDeleted)
                return null;

            // 2. Check password
            var result = await _signInManager.CheckPasswordSignInAsync(user, dto.Password, lockoutOnFailure: false);
            if (!result.Succeeded)
                return null;

            // 3. Generate JWT token
            return await GenerateJwtToken(user);
        }

        public async Task<string?> UpdateAdminProfileAsync(int userId, UpdateAdminProfileDTO dto)
        {
            // VALIDATION: Get the admin user
            var user = await _userManager.FindByIdAsync(userId.ToString());
            if (user == null || user.IsDeleted)
                throw new KeyNotFoundException("Admin user not found.");

            // VALIDATION: Verify current password for security
            var passwordCheck = await _signInManager.CheckPasswordSignInAsync(user, dto.CurrentPassword, lockoutOnFailure: false);
            if (!passwordCheck.Succeeded)
                throw new UnauthorizedAccessException("Current password is incorrect.");

            // VALIDATION: Update allowed fields (FirstName, LastName)
            user.FirstName = dto.FirstName.Trim();
            user.LastName = dto.LastName.Trim();

            // VALIDATION: If new password provided, update it
            if (!string.IsNullOrWhiteSpace(dto.NewPassword))
            {
                var removePasswordResult = await _userManager.RemovePasswordAsync(user);
                if (!removePasswordResult.Succeeded)
                    throw new InvalidOperationException("Failed to remove old password.");

                var addPasswordResult = await _userManager.AddPasswordAsync(user, dto.NewPassword);
                if (!addPasswordResult.Succeeded)
                    throw new InvalidOperationException("Failed to set new password.");
            }

            // Update timestamp
            user.UpdatedAt = DateTime.UtcNow;

            // Save changes
            var updateResult = await _userManager.UpdateAsync(user);
            if (!updateResult.Succeeded)
                throw new InvalidOperationException("Failed to update admin profile.");

            // Generate and return new JWT token with updated claims
            return await GenerateJwtToken(user);
        }

        private async Task<string> GenerateJwtToken(AppUser user)
        {
            // Get user roles
            var roles = await _userManager.GetRolesAsync(user);

            // Create claims
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Email, user.Email!),
                new Claim(ClaimTypes.Name, $"{user.FirstName} {user.LastName}"),
                new Claim("FirstName", user.FirstName),
                new Claim("LastName", user.LastName),
                new Claim("Role", user.Role) // Custom role from AppUser
            };

            // Add Identity roles as claims
            foreach (var role in roles)
            {
                claims.Add(new Claim(ClaimTypes.Role, role));
            }

            // Get JWT settings from appsettings.json
            var jwtSettings = _config.GetSection("Jwt");
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings["Key"]!));
            var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            // Create token
            var token = new JwtSecurityToken(
                issuer: jwtSettings["Issuer"],
                audience: jwtSettings["Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddHours(double.Parse(jwtSettings["ExpiresInHours"]!)),
                signingCredentials: credentials
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}