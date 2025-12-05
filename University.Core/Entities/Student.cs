namespace University.Core.Entities
{
    public class Student
    {
        public int StudentId { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string StudentCode { get; set; } = string.Empty;
        public string? ContactNumber { get; set; }
        public string Level { get; set; } = string.Empty;


        // Soft Delete
        public bool IsDeleted { get; set; } = false;
        public DateTime? DeletedAt { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // 1 to 1 relation
        public int UserId { get; set; }
        public AppUser? User { get; set; }

        // 1 to m relation
        public int? DepartmentId { get; set; }
        public Department? Department { get; set; }

        public ICollection<ExamSubmission> ExamSubmissions { get; set; } = new List<ExamSubmission>();
        public ICollection<Enrollment> Enrollments { get; set; } = new List<Enrollment>();
        public ICollection<Attendance> Attendances { get; set; } = new List<Attendance>();
    }
}