using System.ComponentModel.DataAnnotations;

namespace University.App.DTOs
{
    /// <summary>
    /// Basic Course DTO - Used for reading course information in API responses
    /// </summary>
    public class CourseDTO
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public int CreditHours { get; set; }
        public int InstructorId { get; set; }
        public string CourseCode { get; set; } = string.Empty;
        public string DepartmentName { get; set; } = string.Empty;
        public DateTime? DeletedAt { get; set; }
    }

    /// <summary>
    /// Course Update DTO - Enforces validation rules for updating existing courses
    /// </summary>
    public class UpdateCourseDTO
    {
        /// <summary>
        /// VALIDATION ENHANCED: Course name validation for updates
        /// - Required: Course must always have a meaningful name
        /// - StringLength(80): Prevents excessively long course names
        /// - Service-level: Validates new instructor exists (if changed)
        /// - Service-level: Validates instructor workload (if instructor changes)
        /// </summary>
        [Required(ErrorMessage = "Course name is required")]
        [StringLength(80, MinimumLength = 3, ErrorMessage = "Course name must be between 3 and 80 characters")]
        public string CourseName { get; set; } = string.Empty;

        /// <summary>
        /// VALIDATION ENHANCED: Credit hours validation for updates
        /// - Required: Every course must have assigned credit hours
        /// - Range(1, 6): Standard academic credit range (1-6 credits per course)
        /// - Service-level: Validates total instructor credit hours doesn't exceed 12 (if instructor changes)
        /// </summary>
        [Required(ErrorMessage = "Credit hours are required")]
        [Range(1, 6, ErrorMessage = "Credit hours must be between 1 and 6")]
        public int CreditHours { get; set; }

        /// <summary>
        /// VALIDATION ENHANCED: Instructor assignment validation for updates
        /// - Required: Course must have an assigned instructor
        /// - Service-level: Validates instructor exists in system
        /// - Service-level: Validates instructor doesn't exceed max courses (2 courses)
        /// - Service-level: Validates instructor doesn't exceed max credit hours (12 hours)
        /// - Service-level: Allows same instructor (self-assignment)
        /// </summary>
        [Required(ErrorMessage = "Instructor ID is required")]
        [Range(1, int.MaxValue, ErrorMessage = "Instructor ID must be a valid positive number")]
        public int InstructorId { get; set; }
    }

    /// <summary>
    /// Course Creation DTO - Enforces comprehensive validation rules for new course creation
    /// </summary>
    public class CreateCourseDTO
    {
        /// <summary>
        /// VALIDATION ENHANCED: Course code validation
        /// - Required: Every course must have a unique course code
        /// - StringLength(10): Standard course code length constraint
        /// - Service-level: Uniqueness check (no duplicate course codes allowed)
        /// - Service-level: Validates format (typically alphanumeric like "CS101")
        /// </summary>
        [Required(ErrorMessage = "Course code is required")]
        [StringLength(10, MinimumLength = 2, ErrorMessage = "Course code must be between 2 and 10 characters")]
        public string CourseCode { get; set; } = string.Empty;

        /// <summary>
        /// VALIDATION ENHANCED: Course name validation
        /// - Required: Course must have a meaningful name
        /// - StringLength(80): Prevents excessively long course names
        /// - Service-level: Used with course code for comprehensive identification
        /// </summary>
        [Required(ErrorMessage = "Course name is required")]
        [StringLength(80, MinimumLength = 3, ErrorMessage = "Course name must be between 3 and 80 characters")]
        public string Name { get; set; } = string.Empty;

        /// <summary>
        /// VALIDATION ENHANCED: Credit hours validation
        /// - Required: Every course must have assigned credit hours
        /// - Range(1, 6): Standard academic credit range
        /// - Service-level: Validates instructor workload after assignment
        ///   * Max 2 courses per instructor
        ///   * Max 12 total credit hours per instructor
        /// </summary>
        [Required(ErrorMessage = "Credit hours is required")]
        [Range(1, 6, ErrorMessage = "Credit hours must be between 1 and 6")]
        public int CreditHours { get; set; }

        /// <summary>
        /// VALIDATION ENHANCED: Instructor assignment validation
        /// - Required: Every course must have an assigned instructor
        /// - Service-level: Validates instructor exists in system
        /// - Service-level: Validates instructor doesn't exceed:
        ///   * Maximum 2 courses per instructor
        ///   * Maximum 12 credit hours per instructor
        /// - Service-level: Ensures workload rules compliance
        /// </summary>
        [Required(ErrorMessage = "Instructor ID is required")]
        [Range(1, int.MaxValue, ErrorMessage = "Instructor ID must be a valid positive number")]
        public int InstructorId { get; set; }

        /// <summary>
        /// VALIDATION ENHANCED: Department assignment validation
        /// - Required: Every course must belong to a department
        /// - Service-level: Validates department exists in system
        /// - Service-level: Enforces department restriction (ENFORCE_DEPARTMENT_RESTRICTION = true)
        /// - Purpose: Ensures students can only access courses in their department
        /// </summary>
        [Required(ErrorMessage = "Department ID is required")]
        [Range(1, int.MaxValue, ErrorMessage = "Department ID must be a valid positive number")]
        public int DepartmentId { get; set; }
    }

    // DTO for showing course info in enrollment list
    public class EnrollCourseDTO
    {
        public int CourseId { get; set; }
        public string CourseName { get; set; } = string.Empty;
        public string CourseCode { get; set; } = string.Empty;
        [Range(1, 6)]
        public int CreditHours { get; set; }
        public string DepartmentName { get; set; } = string.Empty;
    }

    // Creating Enrollment
    public class CreateEnrollmentDTO
    {
        [Required(ErrorMessage = "Student ID is required")]
        public int StudentId { get; set; }


        [Required(ErrorMessage = "Course ID is required")]
        public int CourseId { get; set; }

        // These fields are populated by the service after enrollment
        public string StudentName { get; set; } = string.Empty;
        public string CourseName { get; set; } = string.Empty;
        public int CreditHours { get; set; }
        public string CourseCode { get; set; } = string.Empty;
    }

    // Student enrollment view DTO
    // UPDATED: Added database fields - Status, FinalGrade, GradeLetter, EnrollmentDate
    public class StudentEnrollmentDTO
    {
        public int EnrollmentId { get; set; }
        public string StudentName { get; set; } = string.Empty;
        public string CourseName { get; set; } = string.Empty;
        public int CreditHours { get; set; }
        public string CourseCode { get; set; } = string.Empty;
        public string DepartmentName { get; set; } = string.Empty;

        // Enrollment status fields (from database)
        public string Status { get; set; } = "Enrolled"; // Enrolled, Dropped, Completed
        public decimal? FinalGrade { get; set; } // 0-100
        public string? GradeLetter { get; set; } // A+, A, B+, etc.
        public DateTime EnrollmentDate { get; set; }

        // Calculated field
        public bool IsCourseActive { get; set; } = true; // Based on Course.IsDeleted
    }
    // Courses taught by Instructor
    public class InstructorCoursesDTO
    {
        public int InstructorID { get; set; }
        public string InstructorName { get; set; } = string.Empty;
        public string CourseName { get; set; } = string.Empty;
        public int CreditHours { get; set; }
        public string CourseCode { get; set; } = string.Empty;
        public string DepartmentName { get; set; } = string.Empty;
    }
    public class CourseCompletionStatusDTO
    {
        public int EnrollmentId { get; set; }
        public int StudentId { get; set; }
        public string StudentName { get; set; } = string.Empty;
        public int CourseId { get; set; }
        public string CourseName { get; set; } = string.Empty;
        public string CourseCode { get; set; } = string.Empty;
        public bool IsCompleted { get; set; }
        public int TotalExams { get; set; }
        public int SubmittedExams { get; set; }
        public decimal? AverageScore { get; set; }
        public decimal? FinalGrade { get; set; }
        public string? GradeLetter { get; set; }
        public string Status { get; set; } = string.Empty; // "Completed", "In Progress", "Failed"
        public List<ExamCompletionDTO> ExamDetails { get; set; } = new();
    }

    public class ExamCompletionDTO
    {
        public int ExamId { get; set; }
        public string ExamTitle { get; set; } = string.Empty;
        public decimal Score { get; set; }
        public decimal TotalPoints { get; set; }
        public decimal Percentage { get; set; }
        public bool IsPassed { get; set; }
        public bool IsSubmitted { get; set; }
        public DateTime? SubmittedAt { get; set; }
    }
}