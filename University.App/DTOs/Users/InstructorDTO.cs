using System.ComponentModel.DataAnnotations;
using University.App.Validators;
namespace University.App.DTOs.Users
{
    public class InstructorDTO
    {
        public int InstructorId { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string? ContactNumber { get; set; }
        public int? DepartmentId { get; set; }
        public string? DepartmentName { get; set; }
        public bool IsHeadOfDepartment { get; set; }
        public DateTime CreatedAt { get; set; }

        // User info
        public int UserId { get; set; }
        public string Email { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;

    }
    public class CreateInstructorDto
    {
        [Required(ErrorMessage = "Email is required")]
        [EmailAddress(ErrorMessage = "Invalid email format")]
        [RegularExpression(@"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$",
                   ErrorMessage = "Email must be in valid format (e.g., user@example.bu.edu.eg)")]
        [MaxLength(100, ErrorMessage = "Email cannot exceed 100 characters")]
        public string Email { get; set; } = string.Empty;

        [Required(ErrorMessage = "Full name is required")]
        [ValidName]
        [MinLength(5, ErrorMessage = "Full name must be at least 5 characters")]
        [MaxLength(150, ErrorMessage = "Full name cannot exceed 150 characters")]
        public string FullName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Password is required")]
        [MinLength(8, ErrorMessage = "Password must be at least 8 characters")]
        [MaxLength(100, ErrorMessage = "Password cannot exceed 100 characters")]
        [RegularExpression(@"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$",
            ErrorMessage = "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character")]
        public string Password { get; set; } = string.Empty;

        [Required(ErrorMessage = "First name is required")]
        [ValidName]
        [MaxLength(50, ErrorMessage = "First name cannot exceed 50 characters")]
        public string FirstName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Last name is required")]
        [ValidName]
        [MaxLength(50, ErrorMessage = "Last name cannot exceed 50 characters")]
        public string LastName { get; set; } = string.Empty;

        [MaxLength(11, ErrorMessage = "Contact number cannot exceed 11 characters")]
        [MinLength(11, ErrorMessage = "Contact number cannot Less than 11 characters")]
        public string? ContactNumber { get; set; }

        [Range(1, int.MaxValue, ErrorMessage = "Department ID must be a positive number")]
        public int? DepartmentId { get; set; }

        public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
        {
            var results = new List<ValidationResult>();

            // Ensure FullName contains both FirstName and LastName
            if (!string.IsNullOrEmpty(FirstName) && !string.IsNullOrEmpty(LastName) && !string.IsNullOrEmpty(FullName))
            {
                if (!FullName.Contains(FirstName) || !FullName.Contains(LastName))
                {
                    results.Add(new ValidationResult(
                        "Full name should contain both first name and last name",
                        new[] { nameof(FullName) }));
                }
            }

            return results;
        }
    }

    // Update DTO (For Admin)
    public class UpdateInstructorDto
    {
        [Required(ErrorMessage = "Full name is required")]
        [ValidName]
        [MinLength(5, ErrorMessage = "Full name must be at least 5 characters")]
        [MaxLength(150, ErrorMessage = "Full name cannot exceed 150 characters")]
        public string FullName { get; set; } = string.Empty;

        [MaxLength(11, ErrorMessage = "Contact number cannot exceed 11 characters")]
        [MinLength(11, ErrorMessage = "Contact number cannot Less than 11 characters")]
        public string? ContactNumber { get; set; }

        [Range(1, int.MaxValue, ErrorMessage = "Department ID must be a positive number")]
        public int? DepartmentId { get; set; }
    }

    // Self-Update DTO (For Instructor - limited fields)
    public class UpdateInstructorProfileDto
    {
        [Required(ErrorMessage = "Full name is required")]
        [ValidName]
        [MinLength(5, ErrorMessage = "Full name must be at least 5 characters")]
        [MaxLength(150, ErrorMessage = "Full name cannot exceed 150 characters")]
        public string FullName { get; set; } = string.Empty;


        [MaxLength(11, ErrorMessage = "Contact number cannot exceed 11 characters")]
        [MinLength(11, ErrorMessage = "Contact number cannot Less than 11 characters")]
        public string? ContactNumber { get; set; }
    }
}
