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
                HeadId = d.HeadId,
                HeadFullName = d.Instructor?.FullName,
                IsDeleted = d.IsDeleted,
                DeletedAt = d.DeletedAt
            });
        }

        public async Task<(IEnumerable<DepartmentDTO> departments, int totalCount)> GetAllDepartmentsWithPaginationAsync(int pageNumber, int pageSize)
        {
            var (departments, totalCount) = await _departmentRepo.GetDepartmentsWithPaginationAsync(pageNumber, pageSize);
            var departmentDtos = departments.Select(d => new DepartmentDTO
            {
                Id = d.DepartmentId,
                Name = d.Name,
                Building = d.Building,
                HeadId = d.HeadId,
                HeadFullName = d.Instructor?.FullName,
                IsDeleted = d.IsDeleted,
                DeletedAt = d.DeletedAt
            }).ToList();

            return (departmentDtos, totalCount);
        }

        public async Task<(IEnumerable<DepartmentDTO> departments, int totalCount)> SearchDepartmentsAsync(string? searchTerm, int pageNumber, int pageSize)
        {
            var (departments, totalCount) = await _departmentRepo.SearchDepartmentsAsync(searchTerm, pageNumber, pageSize);
            var departmentDtos = departments.Select(d => new DepartmentDTO
            {
                Id = d.DepartmentId,
                Name = d.Name,
                Building = d.Building,
                HeadId = d.HeadId,
                HeadFullName = d.Instructor?.FullName,
                IsDeleted = d.IsDeleted,
                DeletedAt = d.DeletedAt
            }).ToList();

            return (departmentDtos, totalCount);
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
                HeadId = department.HeadId,
                HeadFullName = department.Instructor?.FullName,
                IsDeleted = department.IsDeleted,
                DeletedAt = department.DeletedAt
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
            // Validates the HeadId when provided with comprehensive conflict detection
            if (departmentDto.HeadId.HasValue)
            {
                // First check: Instructor exists in the system
                var instructor = await _instructorRepo.GetInstructorByIdAsync(departmentDto.HeadId.Value);
                if (instructor == null)
                    throw new InvalidOperationException($"Head instructor with ID {departmentDto.HeadId.Value} does not exist");

                // Second check: Ensure instructor is not already assigned to a different department
                // Business rule: An instructor cannot be assigned to one department and be head of another
                // This prevents conflicting department assignments
                // Note: For department creation, any existing department assignment is a conflict
                if (instructor.DepartmentId.HasValue)
                {
                    var currentDept = await _departmentRepo.GetDepartmentById(instructor.DepartmentId.Value);
                    throw new InvalidOperationException(
                        $"Instructor '{instructor.FullName}' is already assigned to department '{currentDept?.Name ?? "Unknown"}'. " +
                        $"An instructor cannot be assigned to one department and be head of another. " +
                        $"Please first remove the instructor from their current department.");
                }

                // Third check: Ensure instructor is not already head of another department
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

            // Fetch the added department with instructor details
            var deptWithInstructor = await _departmentRepo.GetDepartmentById(addedDepartment.DepartmentId);

            // Return newly created department as DTO
            return new DepartmentDTO
            {
                Id = deptWithInstructor.DepartmentId,
                Name = deptWithInstructor.Name,
                Building = deptWithInstructor.Building,
                HeadId = deptWithInstructor.HeadId,
                HeadFullName = deptWithInstructor.Instructor?.FullName,
                IsDeleted = deptWithInstructor.IsDeleted,
                DeletedAt = deptWithInstructor.DeletedAt
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
            // Ensures new head assignment is valid before update with comprehensive conflict detection
            if (departmentDto.HeadId.HasValue)
            {
                // First check: Instructor exists in system
                var instructor = await _instructorRepo.GetInstructorByIdAsync(departmentDto.HeadId.Value);
                if (instructor == null)
                    throw new InvalidOperationException($"Head instructor with ID {departmentDto.HeadId.Value} does not exist");

                // Second check: Ensure instructor is not assigned to a different department
                // Business rule: An instructor cannot be assigned to one department and be head of another
                // Exception: If the instructor is already in the SAME department as head, allow (no conflict)
                if (instructor.DepartmentId.HasValue && instructor.DepartmentId.Value != id)
                {
                    var currentDept = await _departmentRepo.GetDepartmentById(instructor.DepartmentId.Value);
                    throw new InvalidOperationException(
                        $"Instructor '{instructor.FullName}' is already assigned to department '{currentDept?.Name ?? "Unknown"}'. " +
                        $"An instructor cannot be assigned to one department and be head of another. " +
                        $"Please first remove the instructor from their current department.");
                }

                // Third check: Prevent instructor from being head of multiple departments
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

            // Fetch the updated department with instructor details
            var deptWithInstructor = await _departmentRepo.GetDepartmentById(updatedDepartment.DepartmentId);

            return new DepartmentDTO
            {
                Id = deptWithInstructor.DepartmentId,
                Name = deptWithInstructor.Name,
                Building = deptWithInstructor.Building,
                HeadId = deptWithInstructor.HeadId,
                HeadFullName = deptWithInstructor.Instructor?.FullName,
                IsDeleted = deptWithInstructor.IsDeleted,
                DeletedAt = deptWithInstructor.DeletedAt
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

        // ========== SOFT DELETE OPERATIONS ==========

        public async Task<bool> SoftDeleteDepartment(int id)
        {
            // ENHANCED: Check for active users and courses before soft delete
            var studentCount = await _departmentRepo.GetDepartmentStudentCount(id);
            var instructorCount = await _departmentRepo.GetDepartmentInstructorCount(id);
            var courseCount = await _departmentRepo.GetDepartmentCourseCount(id);
            
            var issues = new List<string>();
            if (studentCount > 0) issues.Add($"{studentCount} active student(s)");
            if (instructorCount > 0) issues.Add($"{instructorCount} active instructor(s)");
            if (courseCount > 0) issues.Add($"{courseCount} active course(s)");
            
            if (issues.Any())
            {
                throw new InvalidOperationException(
                    $"Cannot archive department with {string.Join(", ", issues)}. " +
                    $"Please reassign all users and courses to another department first.");
            }

            return await _departmentRepo.SoftDeleteDepartment(id);
        }

        public async Task<bool> RestoreDepartment(int id)
        {
            return await _departmentRepo.RestoreDepartment(id);
        }

        public async Task<bool> PermanentlyDeleteDepartment(int id)
        {
            // ENHANCED: Strict validation for permanent delete
            var (canDelete, reason, count) = await CanPermanentlyDeleteDepartment(id);
            
            if (!canDelete)
            {
                throw new InvalidOperationException(reason);
            }

            return await _departmentRepo.PermanentlyDeleteDepartment(id);
        }

        public async Task<(bool CanDelete, string Reason, int RelatedDataCount)> CanPermanentlyDeleteDepartment(int id)
        {
            var studentCount = await _departmentRepo.GetDepartmentStudentCount(id);
            var instructorCount = await _departmentRepo.GetDepartmentInstructorCount(id);
            var courseCount = await _departmentRepo.GetDepartmentCourseCount(id);
            
            var totalRelated = studentCount + instructorCount + courseCount;
            
            if (totalRelated > 0)
            {
                var reasons = new List<string>();
                if (studentCount > 0) reasons.Add($"{studentCount} student(s)");
                if (instructorCount > 0) reasons.Add($"{instructorCount} instructor(s)");
                if (courseCount > 0) reasons.Add($"{courseCount} course(s)");
                
                return (false, $"Department has {string.Join(", ", reasons)}. Cannot permanently delete departments with related data to preserve academic records.", totalRelated);
            }

            return (true, "Department can be safely deleted - no related data found", 0);
        }

        public async Task<IEnumerable<DepartmentDTO>> GetAllDepartmentsIncludingDeleted()
        {
            var departments = await _departmentRepo.GetAllDepartmentsIncludingDeleted();
            return departments.Select(d => new DepartmentDTO
            {
                Id = d.DepartmentId,
                Name = d.Name,
                Building = d.Building,
                HeadId = d.HeadId,
                HeadFullName = d.Instructor?.FullName,
                IsDeleted = d.IsDeleted,
                DeletedAt = d.DeletedAt
            });
        }

        // ========== AUTO-ASSIGN HEAD FUNCTIONALITY ==========

        /// <summary>
        /// Checks if department has exactly 1 instructor and no head assigned yet.
        /// If conditions are met, automatically assigns the first instructor as department head.
        /// This provides a friendly user experience by reducing manual assignment work.
        /// </summary>
        /// <param name="departmentId">The department to check and potentially auto-assign</param>
        /// <returns>Tuple indicating if head was assigned, message, and current instructor count</returns>
        public async Task<(bool HeadAssigned, string Message, int InstructorCount)> CheckAndAutoAssignDepartmentHeadAsync(int departmentId)
        {
            // Get department details
            var department = await _departmentRepo.GetDepartmentById(departmentId);
            if (department == null)
            {
                return (false, "Department not found", 0);
            }

            // Check if department already has a head
            if (department.HeadId.HasValue)
            {
                var instructorCount = await _departmentRepo.GetDepartmentInstructorCount(departmentId);
                return (false, "Department already has a head assigned", instructorCount);
            }

            // Count active instructors in this department
            var activeInstructorCount = await _departmentRepo.GetDepartmentInstructorCount(departmentId);
            
            // Check if we have exactly 1 instructor
            if (activeInstructorCount != 1)
            {
                return (false, $"Department has {activeInstructorCount} instructor(s). Auto-assign happens at 1 instructor.", activeInstructorCount);
            }

            // Get the first instructor in the department to assign as head
            var firstInstructor = await _instructorRepo.GetFirstInstructorByDepartmentAsync(departmentId);
            if (firstInstructor == null)
            {
                return (false, "No instructors found in department", activeInstructorCount);
            }

            // Auto-assign the first instructor as department head
            department.HeadId = firstInstructor.InstructorId;
            await _departmentRepo.UpdateDepartment(department);

            return (true, $"🎉 Auto-assigned {firstInstructor.FullName} as Department Head!", activeInstructorCount);
        }
    }
}