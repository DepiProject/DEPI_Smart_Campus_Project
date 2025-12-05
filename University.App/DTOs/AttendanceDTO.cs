using System.ComponentModel.DataAnnotations;

namespace University.App.DTOs
{
    public class MarkAttendanceDto
    {
        [Required(ErrorMessage = "Student ID is required")]
        [Range(1, int.MaxValue, ErrorMessage = "StudentId must be a valid positive number")]
        public int StudentId { get; set; }

        [Required(ErrorMessage = "Course ID is required")]
        [Range(1, int.MaxValue, ErrorMessage = "CourseId must be a valid positive number")]
        public int CourseId { get; set; }

        [Required(ErrorMessage = "Date is required")]
        public DateTime Date { get; set; }

        [Required(ErrorMessage = "Status is required")]
        [RegularExpression("^(Present|Absent|Late|Excused)$",
            ErrorMessage = "Status must be Present, Absent, Late, or Excused")]
        public string Status { get; set; } = "Present";
    }

    /// <summary>
    /// DTO for displaying attendance records
    /// VALIDATION ENHANCED: Comprehensive output validation
    /// </summary>
    public class AttendanceDto
    {
        /// <summary>Attendance identifier</summary>
        [Range(1, int.MaxValue)]
        public int AttendanceId { get; set; }

        /// <summary>Student identifier (required)</summary>
        [Range(1, int.MaxValue, ErrorMessage = "Student ID must be a valid positive number")]
        public int? StudentId { get; set; }

        /// <summary>Student name validation (required, max 150 chars)</summary>
        [Required(ErrorMessage = "Student name is required")]
        [StringLength(150, ErrorMessage = "Student name cannot exceed 150 characters")]
        public string StudentName { get; set; } = string.Empty;

        /// <summary>Course identifier (required)</summary>
        [Required(ErrorMessage = "Course ID is required")]
        [Range(1, int.MaxValue, ErrorMessage = "Course ID must be a valid positive number")]
        public int CourseId { get; set; }

        /// <summary>Course name validation (required, max 80 chars)</summary>
        [Required(ErrorMessage = "Course name is required")]
        [StringLength(80, ErrorMessage = "Course name cannot exceed 80 characters")]
        public string CourseName { get; set; } = string.Empty;

        /// <summary>Attendance date (required)</summary>
        [Required(ErrorMessage = "Attendance date is required")]
        public DateTime Date { get; set; }

        /// <summary>Status validation (Present, Absent, Late, Excused)</summary>
        [Required(ErrorMessage = "Attendance status is required")]
        [StringLength(20, ErrorMessage = "Status cannot exceed 20 characters")]
        [RegularExpression("^(Present|Absent|Late|Excused)$", ErrorMessage = "Status must be Present, Absent, Late, or Excused")]
        public string Status { get; set; } = string.Empty;
    }

    public class UpdateAttendanceDto
    {
        [Required(ErrorMessage = "Status is required")]
        [RegularExpression("^(Present|Absent|Late|Excused)$",
            ErrorMessage = "Status must be Present, Absent, Late, or Excused")]
        public string Status { get; set; } = string.Empty;
    }

    /// <summary>
    /// DTO for displaying attendance summary statistics
    /// VALIDATION ENHANCED: Ensures summary data is valid
    /// </summary>
    public class AttendanceSummaryDto
    {
        /// <summary>Student identifier (required)</summary>
        [Required(ErrorMessage = "Student ID is required")]
        [Range(1, int.MaxValue, ErrorMessage = "Student ID must be a valid positive number")]
        public int StudentId { get; set; }

        /// <summary>Student name (required, max 150 chars)</summary>
        [Required(ErrorMessage = "Student name is required")]
        [StringLength(150, ErrorMessage = "Student name cannot exceed 150 characters")]
        public string StudentName { get; set; } = string.Empty;

        /// <summary>Course identifier (optional, valid positive number)</summary>
        [Range(1, int.MaxValue, ErrorMessage = "Course ID must be a valid positive number")]
        public int? CourseId { get; set; }

        /// <summary>Course name (optional, max 80 chars)</summary>
        [StringLength(80, ErrorMessage = "Course name cannot exceed 80 characters")]
        public string? CourseName { get; set; }

        /// <summary>Total classes (non-negative)</summary>
        [Range(0, int.MaxValue, ErrorMessage = "Total classes cannot be negative")]
        public int TotalClasses { get; set; }

        /// <summary>Present count (non-negative)</summary>
        [Range(0, int.MaxValue, ErrorMessage = "Present count cannot be negative")]
        public int PresentCount { get; set; }

        /// <summary>Late count (non-negative)</summary>
        [Range(0, int.MaxValue, ErrorMessage = "Late count cannot be negative")]
        public int LateCount { get; set; }

        /// <summary>Absent count (non-negative)</summary>
        [Range(0, int.MaxValue, ErrorMessage = "Absent count cannot be negative")]
        public int AbsentCount { get; set; }

        /// <summary>Excused count (non-negative)</summary>
        [Range(0, int.MaxValue, ErrorMessage = "Excused count cannot be negative")]
        public int ExcusedCount { get; set; }

        /// <summary>Attendance percentage (0-100 range)</summary>
        [Range(0, 100, ErrorMessage = "Attendance percentage must be between 0 and 100")]
        public double AttendancePercentage { get; set; }
    }
}