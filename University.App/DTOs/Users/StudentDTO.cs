using System.ComponentModel.DataAnnotations;
namespace University.App.DTOs.Users
{
    public class StudentDTO
    {
        public int StudentId { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string StudentCode { get; set; } = string.Empty;
        public string? ContactNumber { get; set; }
        public string Level { get; set; } = string.Empty;
        public int? DepartmentId { get; set; }
        public string? DepartmentName { get; set; }
        public DateTime CreatedAt { get; set; }

        // User info
        public int UserId { get; set; }
        public string Email { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;

    }
    // Create DTO
    public class CreateStudentDto
    {
        [Required(ErrorMessage = "Email is required")]
        [EmailAddress(ErrorMessage = "Invalid email format")]
        public string Email { get; set; } = string.Empty;

        [Required(ErrorMessage = "Password is required")]
        [MinLength(6, ErrorMessage = "Password must be at least 6 characters")]
        public string Password { get; set; } = string.Empty;

        [Required(ErrorMessage = "First name is required")]
        [MaxLength(50)]
        public string FirstName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Last name is required")]
        [MaxLength(50)]
        public string LastName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Full name is required")]
        [MaxLength(150)]
        public string FullName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Student code is required")]
        [MaxLength(20)]
        public string StudentCode { get; set; } = string.Empty;

        [MaxLength(20)]
        public string? ContactNumber { get; set; }

        [Required(ErrorMessage = "Level is required")]
        [RegularExpression("^[1-4]$", ErrorMessage = "Level must be 1, 2, 3, or 4")]
        public string Level { get; set; } = string.Empty;

        public int? DepartmentId { get; set; }
    }

    // Update DTO (For Admin)
    public class UpdateStudentDto
    {
        [Required(ErrorMessage = "Full name is required")]
        [MaxLength(150)]
        public string FullName { get; set; } = string.Empty;

        [MaxLength(20)]
        public string? ContactNumber { get; set; }

        [Required(ErrorMessage = "Level is required")]
        [RegularExpression("^[1-5]$", ErrorMessage = "Level must be 1, 2, 3, 4 or 5")]
        public string Level { get; set; } = string.Empty;

        public int? DepartmentId { get; set; }
    }

    // Self-Update DTO (For Student - limited fields)
    public class UpdateStudentProfileDto
    {
        [Required(ErrorMessage = "Full name is required")]
        [MaxLength(150)]
        public string FullName { get; set; } = string.Empty;

        [MaxLength(20)]
        public string? ContactNumber { get; set; }
    }
}
