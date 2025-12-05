namespace University.Core.Entities
{
    public class Attendance
    {
        public int AttendanceId { get; set; }
        public DateTime Date { get; set; }
        public string Status { get; set; } = string.Empty; // Present, Absent

        // Soft Delete
        public bool IsDeleted { get; set; } = false;
        public DateTime? DeletedAt { get; set; }

        public int CourseId { get; set; }
        public Course? Course { get; set; }

        public int? StudentId { get; set; }
        public Student? Student { get; set; }
    }
}
