namespace University.Core.Entities
{
    public class ExamSubmission
    {
        public int SubmissionId { get; set; }
        public DateTime StartedAt { get; set; } = DateTime.UtcNow;
        public DateTime? SubmittedAt { get; set; }
        public decimal? Score { get; set; }

        // Soft Delete
        public bool IsDeleted { get; set; } = false;
        public DateTime? DeletedAt { get; set; }

        // 1 to m relation 
        public int? InstructorId { get; set; }
        public Instructor? Instructor { get; set; }

        public int? ExamId { get; set; }
        public Exam? Exam { get; set; }

        public int? StudentId { get; set; }
        public Student? Student { get; set; }

        public ICollection<ExamAnswer> Answers { get; set; } = new List<ExamAnswer>();
        
    }
}
