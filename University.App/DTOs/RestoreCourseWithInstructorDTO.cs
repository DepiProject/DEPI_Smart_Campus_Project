using System.ComponentModel.DataAnnotations;

namespace University.App.DTOs
{
    public class RestoreCourseWithInstructorDTO
    {
        [Range(1, int.MaxValue, ErrorMessage = "Instructor ID must be a positive integer")]
        public int? InstructorId { get; set; }
    }
}