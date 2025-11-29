using Microsoft.AspNetCore.Identity;
namespace University.Core.Entities
{
    public class AppUser : IdentityUser<int>
    {
        
        public string FirstName {  get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty; // Admin, Student, Instructor

        // Password Management - Force change on first login
        public bool? MustChangePassword { get; set; }

        // Soft Delete
        public bool IsDeleted { get; set; } = false;
        public DateTime? DeletedAt { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // 1 to 1 relations
        public Student? Student { get; set; }
        public Instructor? Instructor { get; set; }
    }
}