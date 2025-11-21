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

    public class AttendanceDto
    {
        public int AttendanceId { get; set; }
        public int? StudentId { get; set; }
        public string StudentName { get; set; } = string.Empty;
        public int CourseId { get; set; }
        public string CourseName { get; set; } = string.Empty;
        public DateTime Date { get; set; }
        public string Status { get; set; } = string.Empty;
    }

    public class UpdateAttendanceDto
    {
        [Required(ErrorMessage = "Status is required")]
        [RegularExpression("^(Present|Absent|Late|Excused)$",
            ErrorMessage = "Status must be Present, Absent, Late, or Excused")]
        public string Status { get; set; } = string.Empty;
    }

    public class AttendanceSummaryDto
    {
        public int StudentId { get; set; }
        public string StudentName { get; set; } = string.Empty;
        public int? CourseId { get; set; }
        public string? CourseName { get; set; }
        public int TotalClasses { get; set; }
        public int PresentCount { get; set; }
        public int LateCount { get; set; }
        public int AbsentCount { get; set; }
        public int ExcusedCount { get; set; }
        public double AttendancePercentage { get; set; }
    }
}