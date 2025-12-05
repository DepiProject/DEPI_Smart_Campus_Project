namespace University.Core.Entities
{
    public class Instructor
    {
        public int InstructorId { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string? ContactNumber { get; set; }

        // Soft Delete
        public bool IsDeleted { get; set; } = false;
        public DateTime? DeletedAt { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // 1 to 1 relation
        public Department? HeadOfDepartment { get; set; }

        public int UserId { get; set; }
        public AppUser? User { get; set; }

        public int? DepartmentId { get; set; }
        public Department? Department { get; set; }

        // 1 to m relations
        public ICollection<Course> Courses { get; set; } = new List<Course>();
        public ICollection<ExamSubmission> ExamSubmissions { get; set; } = new List<ExamSubmission>();
    }
}