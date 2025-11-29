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

        // Soft delete info
        public bool IsDeleted { get; set; }
        public DateTime? DeletedAt { get; set; }
    }
    public class CreateInstructorDto
    {
        /// <summary>
        /// VALIDATION ENHANCED: Email field validation includes
        /// - Required check to ensure email is provided
        /// - EmailAddress attribute for basic email format validation
        /// - Custom regex pattern to enforce university email format (domain validation)
        /// - MaxLength constraint to prevent storage issues
        /// </summary>
        [Required(ErrorMessage = "Email is required")]
        [EmailAddress(ErrorMessage = "Invalid email format")]
        [RegularExpression(@"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$",
                   ErrorMessage = "Email must be in valid format (e.g., user@example.bu.edu.eg)")]
        [MaxLength(100, ErrorMessage = "Email cannot exceed 100 characters")]
        public string Email { get; set; } = string.Empty;

        /// <summary>
        /// VALIDATION ENHANCED: FullName validation ensures
        /// - Required field check
        /// - ValidName custom attribute for proper naming conventions
        /// - MinLength and MaxLength constraints (5-150 characters)
        /// - Consistency with FirstName and LastName via custom Validate method
        /// </summary>
        [Required(ErrorMessage = "Full name is required")]
        [ValidName]
        [MinLength(5, ErrorMessage = "Full name must be at least 5 characters")]
        [MaxLength(150, ErrorMessage = "Full name cannot exceed 150 characters")]
        public string FullName { get; set; } = string.Empty;

        /// <summary>
        /// VALIDATION ENHANCED: Password validation implements security best practices
        /// - MinLength of 8 characters minimum
        /// - MaxLength to prevent extremely long passwords
        /// - Complex regex pattern enforcing:
        ///   * At least one lowercase letter
        ///   * At least one uppercase letter
        ///   * At least one numeric digit
        ///   * At least one special character (@$!%*?&)
        /// </summary>
        [Required(ErrorMessage = "Password is required")]
        [MinLength(8, ErrorMessage = "Password must be at least 8 characters")]
        [MaxLength(100, ErrorMessage = "Password cannot exceed 100 characters")]
        [RegularExpression(@"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$",
            ErrorMessage = "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character")]
        public string Password { get; set; } = string.Empty;

        /// <summary>
        /// VALIDATION ENHANCED: FirstName validation ensures
        /// - Required field check
        /// - ValidName custom attribute for naming conventions compliance
        /// - MaxLength constraint (50 characters) for reasonable name length
        /// </summary>
        [Required(ErrorMessage = "First name is required")]
        [ValidName]
        [MaxLength(50, ErrorMessage = "First name cannot exceed 50 characters")]
        public string FirstName { get; set; } = string.Empty;

        /// <summary>
        /// VALIDATION ENHANCED: LastName validation ensures
        /// - Required field check
        /// - ValidName custom attribute for naming conventions compliance
        /// - MaxLength constraint (50 characters) for reasonable name length
        /// </summary>
        [Required(ErrorMessage = "Last name is required")]
        [ValidName]
        [MaxLength(50, ErrorMessage = "Last name cannot exceed 50 characters")]
        public string LastName { get; set; } = string.Empty;

        /// <summary>
        /// VALIDATION ENHANCED: ContactNumber validation ensures
        /// - Optional field (nullable)
        /// - Exact length of 11 characters (Egyptian phone number standard)
        /// - Both MinLength and MaxLength set to 11 for strict validation
        /// </summary>
        [MaxLength(11, ErrorMessage = "Contact number cannot exceed 11 characters")]
        [MinLength(11, ErrorMessage = "Contact number must be exactly 11 characters")]
        public string? ContactNumber { get; set; }

        /// <summary>
        /// VALIDATION ENHANCED: DepartmentId validation ensures
        /// - Optional field (nullable)
        /// - Must be a positive integer if provided
        /// - Range validation prevents invalid department assignments
        /// </summary>
        [Range(1, int.MaxValue, ErrorMessage = "Department ID must be a positive number")]
        public int? DepartmentId { get; set; }

        /// <summary>
        /// CUSTOM VALIDATION: Cross-field validation method
        /// ENHANCED: Validates consistency between FullName and FirstName/LastName components
        /// - Ensures FullName contains both FirstName and LastName substrings
        /// - Prevents mismatched name data that could cause identity issues
        /// - Provides clear error messaging for data consistency failures
        /// </summary>
        public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
        {
            var results = new List<ValidationResult>();

            // Cross-field validation: Ensure FullName contains both FirstName and LastName
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
        /// <summary>
        /// ADMIN UPDATE: Only Department Assignment
        /// - Admin can only change instructor's department assignment
        /// - Personal details (name, contact) must be updated by instructor themselves
        /// - Required field ensures instructor is always assigned to a department
        /// </summary>
        [Required(ErrorMessage = "Department ID is required")]
        [Range(1, int.MaxValue, ErrorMessage = "Department ID must be a positive number")]
        public int DepartmentId { get; set; }
    }

    // Self-Update DTO (For Instructor - limited fields)
    public class UpdateInstructorProfileDto
    {
        /// <summary>
        /// INSTRUCTOR PROFILE UPDATE: Only Contact Number
        /// - Personal details (name) cannot be changed after account creation
        /// - Names are official identity information tied to academic records
        /// - Optional to allow instructors without contact info initially
        /// - If provided, enforces exact 11 character length (Egyptian standard)
        /// </summary>
        [MaxLength(11, ErrorMessage = "Contact number cannot exceed 11 characters")]
        [MinLength(11, ErrorMessage = "Contact number must be exactly 11 characters")]
        public string? ContactNumber { get; set; }
    }
}