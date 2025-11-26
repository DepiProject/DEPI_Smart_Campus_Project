using System.ComponentModel.DataAnnotations;

namespace University.App.DTOs
{
    /// <summary>
    /// Data Transfer Object for Department entity - Read operations
    /// Used for returning department information in API responses
    /// </summary>
    public class DepartmentDTO
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Building { get; set; } = string.Empty;
        public int? HeadId { get; set; }
        public string? HeadFullName { get; set; }
    }

    /// <summary>
    /// Department Creation DTO - Enforces validation rules for new department creation
    /// </summary>
    public class CreateDepartmentDTO
    {
        /// <summary>
        /// VALIDATION ENHANCED: Department Name validation
        /// - Required: Department must have a name
        /// - MaxLength(100): Prevents excessively long names
        /// - Service-level validation: Uniqueness check (no duplicate department names)
        /// - Service-level validation: Case-insensitive name comparison
        /// </summary>
        [Required(ErrorMessage = "Department name is required")]
        [MaxLength(100, ErrorMessage = "Name cannot exceed 100 characters")]
        [MinLength(3, ErrorMessage = "Department name must be at least 3 characters")]
        public string Name { get; set; } = string.Empty;

        /// <summary>
        /// VALIDATION ENHANCED: Building/Location validation
        /// - Required: Physical location must be specified
        /// - MaxLength(1): Limited to single letter (A-E) for building designation
        /// - MinLength(1): Allows single letter building codes
        /// - Purpose: Identifies the physical location of the department (Buildings A, B, C, D, E)
        /// </summary>
        [Required(ErrorMessage = "Building is required")]
        [MaxLength(1, ErrorMessage = "Building must be a single letter (A-E)")]
        [MinLength(1, ErrorMessage = "Building is required")]
        public string Building { get; set; } = string.Empty;

        /// <summary>
        /// VALIDATION ENHANCED: Head Instructor assignment validation
        /// - Required: Every department must have a head instructor
        /// - Service-level validation: Instructor must exist in system
        /// - Service-level validation: Instructor cannot be head of multiple departments
        /// - Service-level validation: Ensures unique department head assignment
        /// </summary>
        [Required(ErrorMessage = "Head instructor is required")]
        [Range(1, int.MaxValue, ErrorMessage = "Head instructor ID must be a valid positive number")]
        public int? HeadId { get; set; }
    }

    /// <summary>
    /// Department Update DTO - Enforces validation rules for department modifications
    /// </summary>
    public class UpdateDepartmentDTO
    {
        /// <summary>
        /// VALIDATION ENHANCED: Department Name validation for updates
        /// - Required: Maintains requirement for valid department name
        /// - MaxLength(100): Consistent with creation DTO
        /// - MinLength(3): Ensures meaningful names
        /// - Service-level validation: Duplicate name check (excluding current department)
        /// </summary>
        [Required(ErrorMessage = "Department name is required")]
        [MaxLength(100, ErrorMessage = "Name cannot exceed 100 characters")]
        [MinLength(3, ErrorMessage = "Department name must be at least 3 characters")]
        public string Name { get; set; } = string.Empty;

        /// <summary>
        /// VALIDATION ENHANCED: Building/Location validation for updates
        /// - Required: Physical location must always be specified
        /// - MaxLength(1): Limited to single letter (A-E) for building designation
        /// - MinLength(1): Allows single letter building codes
        /// </summary>
        [Required(ErrorMessage = "Building is required")]
        [MaxLength(1, ErrorMessage = "Building must be a single letter (A-E)")]
        [MinLength(1, ErrorMessage = "Building is required")]
        public string Building { get; set; } = string.Empty;

        /// <summary>
        /// VALIDATION ENHANCED: Head Instructor re-assignment validation
        /// - Required: Department must always have a head
        /// - Service-level validation: New head must exist as an instructor
        /// - Service-level validation: Prevents assigning instructor as head of multiple departments
        /// - Service-level validation: Allows keeping same head (self-assignment)
        /// </summary>
        [Required(ErrorMessage = "Head instructor is required")]
        [Range(1, int.MaxValue, ErrorMessage = "Head instructor ID must be a valid positive number")]
        public int? HeadId { get; set; }
    }
}