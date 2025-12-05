namespace University.App.DTOs
{
    /// <summary>
    /// Admin profile data transfer object - Read-only profile information for admins
    /// </summary>
    public class AdminProfileDTO
    {
        public int Id { get; set; }
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? ContactNumber { get; set; }
        public string Role { get; set; } = "Admin";
        public DateTime CreatedDate { get; set; }
    }
}
