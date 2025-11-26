using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using University.App.DTOs;
using University.App.Services.IServices;

namespace University.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;

        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDTO dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var token = await _authService.LoginAsync(dto);

            if (token == null)
                return Unauthorized(new { message = "Invalid email or password" });

            return Ok(new
            {
                token = token,
                message = "Login successful"
            });
        }

        [HttpPut("update-profile")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateAdminProfileDTO dto)
        {
            // VALIDATION: Check ModelState validity
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                // VALIDATION: Get current user ID from JWT token
                var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (!int.TryParse(userIdClaim, out int userId))
                    return Unauthorized(new { message = "Invalid token" });

                // Call service to update profile and get new token
                var newToken = await _authService.UpdateAdminProfileAsync(userId, dto);

                if (newToken == null)
                    return BadRequest(new { message = "Failed to update profile" });

                return Ok(new
                {
                    token = newToken,
                    message = "Profile updated successfully"
                });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while updating profile", error = ex.Message });
            }
        }
    }
}
