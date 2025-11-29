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

            // 3. Check if user must change password on first login
            if (user.MustChangePassword == true)
            {
                // Return special token indicating password change required
                // Frontend should detect this and redirect to change password page
                throw new InvalidOperationException("PASSWORD_CHANGE_REQUIRED");
            }

            // 4. Generate JWT token
            return await GenerateJwtToken(user);
        }

        public async Task<string?> FirstLoginPasswordChangeAsync(string email, string currentPassword, string newPassword)
        {
            // 1. Find user by email
            var user = await _userManager.FindByEmailAsync(email);
            if (user == null || user.IsDeleted)
                throw new KeyNotFoundException("User not found.");

            // 2. Verify current password
            var passwordCheck = await _signInManager.CheckPasswordSignInAsync(user, currentPassword, lockoutOnFailure: false);
            if (!passwordCheck.Succeeded)
                throw new UnauthorizedAccessException("Current password is incorrect.");

            // 3. Check if user must change password
            if (user.MustChangePassword != true)
                throw new InvalidOperationException("Password change not required.");

            // 4. Change password using Identity
            var removePasswordResult = await _userManager.RemovePasswordAsync(user);
            if (!removePasswordResult.Succeeded)
                throw new InvalidOperationException("Failed to remove old password.");

            var addPasswordResult = await _userManager.AddPasswordAsync(user, newPassword);
            if (!addPasswordResult.Succeeded)
            {
                var errors = string.Join(", ", addPasswordResult.Errors.Select(e => e.Description));
                throw new InvalidOperationException($"Failed to set new password: {errors}");
            }

            // 5. Clear the MustChangePassword flag
            user.MustChangePassword = false;
            user.UpdatedAt = DateTime.UtcNow;
            await _userManager.UpdateAsync(user);

            // 6. Generate and return JWT token
            return await GenerateJwtToken(user);
        }

        public async Task<AdminProfileDTO?> GetAdminProfileAsync(int userId)
        {
            // Get the admin user
            var user = await _userManager.FindByIdAsync(userId.ToString());
            if (user == null || user.IsDeleted)
                return null;

            // Map to AdminProfileDTO
            return new AdminProfileDTO
            {
                Id = user.Id,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Email = user.Email ?? string.Empty,
                ContactNumber = user.PhoneNumber,
                Role = "Admin",
                CreatedDate = user.CreatedAt
            };
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

            // VALIDATION: Update allowed fields (FirstName, LastName, ContactNumber)
            user.FirstName = dto.FirstName.Trim();
            user.LastName = dto.LastName.Trim();
            
            // Update PhoneNumber (ContactNumber) if provided
            if (!string.IsNullOrWhiteSpace(dto.ContactNumber))
            {
                user.PhoneNumber = dto.ContactNumber.Trim();
            }
            else
            {
                user.PhoneNumber = null; // Clear if empty
            }

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