using Microsoft.AspNetCore.Identity;
using University.App.DTOs.Users;
using University.App.Interfaces.Users;
using University.App.Services.IServices.Users;
using University.Core.Entities;

namespace University.App.Services.Implementations.Users
{
    public class InstructorService: IInstructorService
    {
        private readonly UserManager<AppUser> _userManager;
        private readonly IInstructorRepository _instructorRepository;
        public InstructorService(IInstructorRepository instructorRepository, UserManager<AppUser> userManager)
        {
            _instructorRepository = instructorRepository;
            _userManager = userManager;
        }
        public async Task<InstructorDTO?> GetByIdAsync(int id)
        {
            var instructor = await _instructorRepository.GetByIdWithDetailsAsync(id);
            if (instructor == null) return null;

            var isHead = await _instructorRepository.IsHeadOfAnyDepartmentAsync(id);
            return MapToDto(instructor, isHead);
        }

        public async Task<IEnumerable<InstructorDTO>> GetAllAsync()
        {
            var instructors = await _instructorRepository.GetAllInstructorsAsync();
            var dtos = new List<InstructorDTO>();

            foreach (var instructor in instructors)
            {
                var isHead = await _instructorRepository.IsHeadOfAnyDepartmentAsync(instructor.InstructorId);
                dtos.Add(MapToDto(instructor, isHead));
            }

            return dtos;
        }

        public async Task<IEnumerable<InstructorDTO>> GetByDepartmentAsync(int departmentId)
        {
            var instructors = await _instructorRepository.GetByDepartmentAsync(departmentId);
            var dtos = new List<InstructorDTO>();

            foreach (var instructor in instructors)
            {
                var isHead = await _instructorRepository.IsHeadOfAnyDepartmentAsync(instructor.InstructorId);
                dtos.Add(MapToDto(instructor, isHead));
            }

            return dtos;
        }

        public async Task<InstructorDTO> CreateAsync(CreateInstructorDto dto)
        {
            // VALIDATION ENHANCED: Email uniqueness check
            // Prevents duplicate email registrations in the system
            var existingUser = await _userManager.FindByEmailAsync(dto.Email);
            if (existingUser != null)
            {
                throw new InvalidOperationException($"Email '{dto.Email}' is already registered in the system");
            }

            // Create AppUser with validated email and password
            // Password strength validation is enforced at DTO level via RegularExpression attribute
            var user = new AppUser
            {
                UserName = dto.Email,
                Email = dto.Email,
                FirstName = dto.FirstName,
                LastName = dto.LastName,
                Role = "Instructor",
                EmailConfirmed = true
            };

            // Create user with validated password (meets security requirements)
            var result = await _userManager.CreateAsync(user, dto.Password);
            if (!result.Succeeded)
            {
                throw new InvalidOperationException($"Failed to create user: {string.Join(", ", result.Errors.Select(e => e.Description))}");
            }

            // Assign instructor role to newly created user
            await _userManager.AddToRoleAsync(user, "Instructor");

            // VALIDATION ENHANCED: Validate department assignment if provided
            // Ensures DepartmentId is positive and valid before creating instructor record
            if (dto.DepartmentId.HasValue && dto.DepartmentId.Value <= 0)
            {
                throw new InvalidOperationException("Invalid Department ID provided");
            }

            // Create instructor entity with validated data from DTO
            // FullName consistency validated via Validate() method in CreateInstructorDto
            var instructor = new Instructor
            {
                UserId = user.Id,
                FullName = dto.FullName,
                ContactNumber = dto.ContactNumber,
                DepartmentId = dto.DepartmentId
            };

            await _instructorRepository.AddInstructorAsync(instructor);

            var createdInstructor = await _instructorRepository.GetByIdWithDetailsAsync(instructor.InstructorId);
            var isHead = await _instructorRepository.IsHeadOfAnyDepartmentAsync(instructor.InstructorId);
            return MapToDto(createdInstructor!, isHead);
        }

        public async Task<InstructorDTO> UpdateAsync(int id, UpdateInstructorDto dto)
        {
            // VALIDATION ENHANCED: Verify instructor exists before update
            var instructor = await _instructorRepository.GetByIdWithDetailsAsync(id);

            if (instructor == null)
            {
                throw new KeyNotFoundException($"Instructor with ID {id} not found.");
            }

            // VALIDATION ENHANCED: Validate department assignment if changing
            // Ensures DepartmentId is positive if provided
            if (dto.DepartmentId.HasValue && dto.DepartmentId.Value <= 0)
            {
                throw new InvalidOperationException("Invalid Department ID provided");
            }

            // Update validated fields from DTO
            // FullName and ContactNumber have been validated at DTO level
            instructor.FullName = dto.FullName;
            instructor.ContactNumber = dto.ContactNumber;
            instructor.DepartmentId = dto.DepartmentId;
            instructor.UpdatedAt = DateTime.UtcNow;

            await _instructorRepository.UpdateInstructor(instructor);

            var updatedInstructor = await _instructorRepository.GetByIdWithDetailsAsync(id);
            var isHead = await _instructorRepository.IsHeadOfAnyDepartmentAsync(id);
           
            return MapToDto(updatedInstructor!, isHead);
        }

        public async Task<bool> DeleteAsync(int id)
        {
            // VALIDATION ENHANCED: Verify instructor exists before deletion
            var instructor = await _instructorRepository.GetByIdWithDetailsAsync(id);
            if (instructor == null)
            {
                return false;
            }

            // BUSINESS RULE VALIDATION: Cannot delete if head of department
            // Prevents orphaning department leadership structures
            var isHead = await _instructorRepository.IsHeadOfAnyDepartmentAsync(id);
            if (isHead)
            {
                throw new InvalidOperationException("Cannot delete instructor who is head of a department. Please reassign department leadership first.");
            }

            // BUSINESS RULE VALIDATION: Cannot delete if has active courses with enrollments
            // Protects data integrity - prevents deleting instructors with active student enrollments
            var hasActiveCourses = await _instructorRepository.HasActiveCoursesWithEnrollmentsAsync(id);
            if (hasActiveCourses)
            {
                throw new InvalidOperationException("Cannot delete instructor with active courses that have enrollments. Please reassign courses or complete enrollments first.");
            }

            // Soft delete the instructor record (handled by DbContext SaveChanges override)
            _instructorRepository?.DeleteInstructor(instructor);

            // Also soft delete the associated user account for data consistency
            var user = await _userManager.FindByIdAsync(instructor.UserId.ToString());
            if (user != null)
            {
                await _userManager.DeleteAsync(user);
            }

            return true;
        }

        public async Task<InstructorDTO?> GetMyProfileAsync(int userId)
        {
            var instructor = await _instructorRepository.GetByUserIdAsync(userId);
            if (instructor == null) return null;

            var isHead = await _instructorRepository.IsHeadOfAnyDepartmentAsync(instructor.InstructorId);
            return MapToDto(instructor, isHead);
        }

        public async Task<InstructorDTO> UpdateMyProfileAsync(int userId, UpdateInstructorProfileDto dto)
        {
            // VALIDATION ENHANCED: Verify instructor exists before self-update
            var instructor = await _instructorRepository.GetByUserIdAsync(userId);
            if (instructor == null)
            {
                throw new KeyNotFoundException("Instructor profile not found for the current user.");
            }

            // VALIDATION ENHANCED: Restrictive update policy for instructor self-updates
            // Instructors can only update limited fields (FullName and ContactNumber)
            // Department and other assignments remain admin-controlled for data integrity
            instructor.FullName = dto.FullName;
            instructor.ContactNumber = dto.ContactNumber;
            instructor.UpdatedAt = DateTime.UtcNow;

            _instructorRepository.UpdateInstructor(instructor);

            var updatedInstructor = await _instructorRepository.GetByIdWithDetailsAsync(instructor.InstructorId);
            var isHead = await _instructorRepository.IsHeadOfAnyDepartmentAsync(instructor.InstructorId);
            return MapToDto(updatedInstructor!, isHead);
        }
        // Helper method to map entity to DTO
        private InstructorDTO MapToDto(Instructor instructor, bool isHead)
        {
            return new InstructorDTO
            {
                InstructorId = instructor.InstructorId,
                FullName = instructor.FullName,
                ContactNumber = instructor.ContactNumber,
                DepartmentId = instructor.DepartmentId,
                DepartmentName = instructor.Department?.Name,
                IsHeadOfDepartment = isHead,
                CreatedAt = instructor.CreatedAt,
                UserId = instructor.UserId,
                Email = instructor.User?.Email ?? string.Empty,
                FirstName = instructor.User?.FirstName ?? string.Empty,
                LastName = instructor.User?.LastName ?? string.Empty
            };
        }

    }
}
