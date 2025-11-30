using System.ComponentModel.DataAnnotations;
using University.App.Validators;

namespace University.App.DTOs
{
    /// <summary>
    /// Admin self-update DTO - Allows admins to update their own profile
    /// Limited to FirstName, LastName, ContactNumber, and password change
    /// </summary>
    public class UpdateAdminProfileDTO
    {
        [Required(ErrorMessage = "First name is required")]
        [ValidName(ErrorMessage = "First name can only contain letters, spaces, hyphens, and apostrophes")]
        [MinLength(2, ErrorMessage = "First name must be at least 2 characters")]
        [MaxLength(50, ErrorMessage = "First name cannot exceed 50 characters")]
        public string FirstName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Last name is required")]
        [ValidName(ErrorMessage = "Last name can only contain letters, spaces, hyphens, and apostrophes")]
        [MinLength(2, ErrorMessage = "Last name must be at least 2 characters")]
        [MaxLength(50, ErrorMessage = "Last name cannot exceed 50 characters")]
        public string LastName { get; set; } = string.Empty;

        [RegularExpression(@"^(010|011|012|015)\d{8}$", ErrorMessage = "Contact number must start with 010, 011, 012, or 015")]
        [ValidEgyptianPhone]
        public string? ContactNumber { get; set; }

        [Required(ErrorMessage = "Current password is required for security verification")]
        [MinLength(6, ErrorMessage = "Password must be at least 6 characters")]
        public string CurrentPassword { get; set; } = string.Empty;

        [MinLength(8, ErrorMessage = "New password must be at least 8 characters")]
        [RegularExpression(@"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$",
            ErrorMessage = "New password must contain uppercase, lowercase, digit, and special character (@$!%*?&)")]
        public string? NewPassword { get; set; }
    }
}
