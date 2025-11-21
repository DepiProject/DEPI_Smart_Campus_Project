using System.ComponentModel.DataAnnotations;

namespace University.App.DTOs
{
    
    public class DepartmentDTO
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Building { get; set; } = string.Empty;
        public int? HeadId { get; set; }
    }

    public class CreateDepartmentDTO
    {
        [Required(ErrorMessage = "Department name is required")]
        [MaxLength(100, ErrorMessage = "Name cannot exceed 100 characters")]
        public string Name { get; set; } = string.Empty;

        [Required(ErrorMessage = "Building is required")]
        [MaxLength(50, ErrorMessage = "Building cannot exceed 50 characters")]
        public string Building { get; set; } = string.Empty;

        [Required(ErrorMessage = "Head instructor is required")]
        public int? HeadId { get; set; }
    }


    public class UpdateDepartmentDTO
    {
        [Required(ErrorMessage = "Department name is required")]
        [MaxLength(100, ErrorMessage = "Name cannot exceed 100 characters")]
        public string Name { get; set; } = string.Empty;

        [Required(ErrorMessage = "Building is required")]
        [MaxLength(50, ErrorMessage = "Building cannot exceed 50 characters")]
        public string Building { get; set; } = string.Empty;

        [Required(ErrorMessage = "Head instructor is required")]
        public int? HeadId { get; set; }
    }
}