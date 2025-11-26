using University.App.DTOs;
using University.App.Interfaces;
using University.App.Interfaces.Users;
using University.App.Services.IServices;
using University.Core.Entities;

namespace University.App.Services.Implementations
{
    public class DepartmentService : IDepartmentService
    {
        private readonly IDepartmentRepository _departmentRepo;
        private readonly IInstructorRepository _instructorRepo;

        public DepartmentService(IDepartmentRepository departmentRepo, IInstructorRepository instructorRepo)
        {
            _departmentRepo = departmentRepo;
            _instructorRepo = instructorRepo;
        }

        public async Task<IEnumerable<DepartmentDTO>> GetAllDepartments()
        {
            var departments = await _departmentRepo.GetAllDepartments();
            return departments.Select(d => new DepartmentDTO
            {
                Id = d.DepartmentId,
                Name = d.Name,
                Building = d.Building,
                HeadId = d.HeadId
            });
        }

        public async Task<DepartmentDTO?> GetDepartmentById(int id)
        {
            var department = await _departmentRepo.GetDepartmentById(id);
            if (department == null) return null;

            return new DepartmentDTO
            {
                Id = department.DepartmentId,
                Name = department.Name,
                Building = department.Building,
                HeadId = department.HeadId
            };
        }

        public async Task<DepartmentDTO?> AddDepartment(CreateDepartmentDTO departmentDto)
        {
            // VALIDATION ENHANCED: Null/Whitespace check
            // Ensures both Name and Building contain actual content (not just whitespace)
            // This complements DTO Required attributes for defense-in-depth
            if (string.IsNullOrWhiteSpace(departmentDto.Name) || string.IsNullOrWhiteSpace(departmentDto.Building))
                return null;

            // VALIDATION ENHANCED: Department name uniqueness enforcement
            // Prevents duplicate department names in the system
            // Uses repository-level query for case-insensitive comparison
            var existing = await _departmentRepo.GetDepartmentByName(departmentDto.Name);
            if (existing != null)
                throw new InvalidOperationException("Department name already exists. Please use a unique department name.");

            // VALIDATION ENHANCED: Head instructor existence and uniqueness
            // Validates the HeadId when provided
            if (departmentDto.HeadId.HasValue)
            {
                // First check: Instructor exists in the system
                var instructor = await _instructorRepo.GetInstructorByIdAsync(departmentDto.HeadId.Value);
                if (instructor == null)
                    throw new InvalidOperationException($"Head instructor with ID {departmentDto.HeadId.Value} does not exist");

                // Second check: Ensure instructor is not already head of another department
                // Prevents one instructor being assigned as head to multiple departments
                var existingHead = await _departmentRepo.GetDepartmentByHeadId(departmentDto.HeadId.Value);
                if (existingHead != null)
                    throw new InvalidOperationException($"Instructor with ID {departmentDto.HeadId.Value} is already head of another department. Please choose a different instructor.");
            }

            // Create department entity with validated data from DTO
            var department = new Department
            {
                Name = departmentDto.Name,
                Building = departmentDto.Building,
                HeadId = departmentDto.HeadId
            };

            var addedDepartment = await _departmentRepo.AddDepartment(department);
            if (addedDepartment == null) 
                return null;

            // Return newly created department as DTO
            return new DepartmentDTO
            {
                Id = addedDepartment.DepartmentId,
                Name = addedDepartment.Name,
                Building = addedDepartment.Building,
                HeadId = addedDepartment.HeadId
            };
        }

        public async Task<DepartmentDTO?> UpdateDepartment(int id, UpdateDepartmentDTO departmentDto)
        {
            // VALIDATION ENHANCED: Verify department exists before update
            // Prevents updating non-existent departments
            var existingDepartment = await _departmentRepo.GetDepartmentById(id);
            if (existingDepartment == null)
                return null;

            // VALIDATION ENHANCED: Department name uniqueness check
            // Allows same name for current department but prevents duplicates from other departments
            // Logic: If name exists AND it's a different department ID, throw error
            var duplicate = await _departmentRepo.GetDepartmentByName(departmentDto.Name);
            if (duplicate != null && duplicate.DepartmentId != id)
                throw new InvalidOperationException("Department name already exists. Please use a unique department name.");

            // VALIDATION ENHANCED: Head instructor existence and uniqueness validation
            // Ensures new head assignment is valid before update
            if (departmentDto.HeadId.HasValue)
            {
                // First check: Instructor exists in system
                var instructor = await _instructorRepo.GetInstructorByIdAsync(departmentDto.HeadId.Value);
                if (instructor == null)
                    throw new InvalidOperationException($"Head instructor with ID {departmentDto.HeadId.Value} does not exist");

                // Second check: Prevent instructor from being head of multiple departments
                // Logic: If another department has this head AND it's not current department, throw error
                var anotherDept = await _departmentRepo.GetDepartmentByHeadId(departmentDto.HeadId.Value);
                if (anotherDept != null && anotherDept.DepartmentId != id)
                    throw new InvalidOperationException($"Instructor with ID {departmentDto.HeadId.Value} is already head of another department. Please choose a different instructor.");
            }

            // Update department fields with validated data
            existingDepartment.Name = departmentDto.Name;
            existingDepartment.Building = departmentDto.Building;
            existingDepartment.HeadId = departmentDto.HeadId;

            var updatedDepartment = await _departmentRepo.UpdateDepartment(existingDepartment);
            if (updatedDepartment == null) 
                return null;

            return new DepartmentDTO
            {
                Id = updatedDepartment.DepartmentId,
                Name = updatedDepartment.Name,
                Building = updatedDepartment.Building,
                HeadId = updatedDepartment.HeadId
            };
        }

        public async Task<bool> DeleteDepartment(int id)
        {
            // VALIDATION ENHANCED: Department existence check
            // Verifies department exists before attempting deletion
            // Prevents attempting to delete non-existent departments
            var department = await _departmentRepo.GetDepartmentById(id);
            if (department == null)
                return false;

            // TODO: Consider adding business rule validations:
            // - Check if department has active students enrolled
            // - Check if department has active courses
            // - Check if department has instructors assigned
            // These would prevent deletion of departments with active data

            return await _departmentRepo.DeleteDepartment(id);
        }
    }
}