using System.ComponentModel.DataAnnotations;

namespace University.App.DTOs
{
    // Basic Course DTO
    public class CourseDTO
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public int CreditHours { get; set; }
        public int InstructorId { get; set; }
        public string CourseCode { get; set; } = string.Empty;
        public string DepartmentName { get; set; } = string.Empty;
    }

    public class UpdateCourseDTO
    {
        [Required(ErrorMessage = "Course name is required")]
        [StringLength(80, ErrorMessage = "Course name cannot exceed 80 characters")]
        public string CourseName { get; set; } = string.Empty;
        [Required(ErrorMessage = "Credit hours are required")]
        [Range(1, 6, ErrorMessage = "Credit hours must be between 1 and 6")]
        public int CreditHours { get; set; }
        [Required(ErrorMessage = "Instructor ID is required")]
        public int InstructorId { get; set; }

    }
    // Create Course DTO
    public class CreateCourseDTO
    {
        [Required(ErrorMessage = "Course code is required")]
        [StringLength(10, ErrorMessage = "Course code cannot exceed 10 characters")]
        public string CourseCode { get; set; } = string.Empty;

        [Required(ErrorMessage = "Course name is required")]
        [StringLength(80, ErrorMessage = "Course name cannot exceed 80 characters")]
        public string Name { get; set; } = string.Empty;

        [Required(ErrorMessage = "Credit hours is required")]
        [Range(1, 6, ErrorMessage = "Credit hours must be between 1 and 6")]
        public int CreditHours { get; set; }

        [Required(ErrorMessage = "Instructor ID is required")]
        public int InstructorId { get; set; }

        [Required(ErrorMessage = "Department ID is required")]
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
    public class StudentEnrollmentDTO
    {
        public string StudentName { get; set; } = string.Empty;
        public string CourseName { get; set; } = string.Empty;
        public int CreditHours { get; set; }
        public string CourseCode { get; set; } = string.Empty;
        public string DepartmentName { get; set; } = string.Empty;
        public string EnrollmentStatus { get; set; } = "Enrolled";
        public String CourseStatus { get; set; } = "Active";
        public int EnrollmentId { get; set; }
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