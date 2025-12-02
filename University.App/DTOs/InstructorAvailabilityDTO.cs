namespace University.App.DTOs
{
    /// <summary>
    /// DTO for instructor availability when restoring courses
    /// Includes workload information for admin decision-making
    /// </summary>
    public class InstructorAvailabilityDTO
    {
        public int InstructorId { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? DepartmentName { get; set; }
        public string? ContactNumber { get; set; }
        
        /// <summary>
        /// Current number of courses the instructor is teaching
        /// </summary>
        public int CurrentCourseCount { get; set; }
        
        /// <summary>
        /// Maximum allowed courses per instructor (typically 2)
        /// </summary>
        public int MaxCourseCount { get; set; }
        
        /// <summary>
        /// Current total credit hours the instructor is teaching
        /// </summary>
        public int CurrentCreditHours { get; set; }
        
        /// <summary>
        /// Maximum allowed credit hours per instructor (typically 12)
        /// </summary>
        public int MaxCreditHours { get; set; }
        
        /// <summary>
        /// Credit hours of the course being restored
        /// </summary>
        public int CourseCreditHours { get; set; }
        
        /// <summary>
        /// Total credit hours after assigning this course
        /// </summary>
        public int TotalAfterAssignment { get; set; }
        
        /// <summary>
        /// Remaining capacity in credit hours after assignment
        /// </summary>
        public int RemainingCapacity => MaxCreditHours - TotalAfterAssignment;
        
        /// <summary>
        /// Percentage of workload after assignment (0-100)
        /// </summary>
        public double WorkloadPercentage => (TotalAfterAssignment / (double)MaxCreditHours) * 100;
    }
}
