using System.ComponentModel.DataAnnotations;
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

        [MaxLength(20)]
        public string? ContactNumber { get; set; }

        public int? DepartmentId { get; set; }
    }

    // Update DTO (For Admin)
    public class UpdateInstructorDto
    {
        [Required(ErrorMessage = "Full name is required")]
        [MaxLength(150)]
        public string FullName { get; set; } = string.Empty;

        [MaxLength(20)]
        public string? ContactNumber { get; set; }

        public int? DepartmentId { get; set; }
    }

    // Self-Update DTO (For Instructor - limited fields)
    public class UpdateInstructorProfileDto
    {
        [Required(ErrorMessage = "Full name is required")]
        [MaxLength(150)]
        public string FullName { get; set; } = string.Empty;

        [MaxLength(20)]
        public string? ContactNumber { get; set; }
    }
}
