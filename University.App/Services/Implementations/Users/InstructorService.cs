using Microsoft.AspNetCore.Identity;
using University.App.DTOs.Users;
using University.App.Interfaces.Courses;
using University.App.Interfaces.Users;
using University.App.Services.IServices.Users;
using University.Core.Entities;

namespace University.App.Services.Implementations.Users
{
    public class InstructorService: IInstructorService
    {
        private readonly UserManager<AppUser> _userManager;
        private readonly IInstructorRepository _instructorRepository;
        private readonly ICourseRepository _courseRepository;
        
        public InstructorService(
            IInstructorRepository instructorRepository, 
            UserManager<AppUser> userManager,
            ICourseRepository courseRepository)
        {
            _instructorRepository = instructorRepository;
            _userManager = userManager;
            _courseRepository = courseRepository;
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

        public async Task<(IEnumerable<InstructorDTO> instructors, int totalCount)> GetAllWithPaginationAsync(int pageNumber, int pageSize)
        {
            var (instructors, totalCount) = await _instructorRepository.GetInstructorsWithPaginationAsync(pageNumber, pageSize);
            var dtos = new List<InstructorDTO>();

            foreach (var instructor in instructors)
            {
                var isHead = await _instructorRepository.IsHeadOfAnyDepartmentAsync(instructor.InstructorId);
                dtos.Add(MapToDto(instructor, isHead));
            }

            return (dtos, totalCount);
        }

        public async Task<(IEnumerable<InstructorDTO> instructors, int totalCount)> SearchInstructorsAsync(string? searchTerm, int? departmentId, int pageNumber, int pageSize)
        {
            var (instructors, totalCount) = await _instructorRepository.SearchInstructorsAsync(searchTerm, departmentId, pageNumber, pageSize);
            var dtos = new List<InstructorDTO>();

            foreach (var instructor in instructors)
            {
                var isHead = await _instructorRepository.IsHeadOfAnyDepartmentAsync(instructor.InstructorId);
                dtos.Add(MapToDto(instructor, isHead));
            }

            return (dtos, totalCount);
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
                EmailConfirmed = true,
                MustChangePassword = true // Force password change on first login
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
            // ADMIN UPDATE: Only department assignment allowed
            var instructor = await _instructorRepository.GetByIdWithDetailsAsync(id);

            if (instructor == null)
            {
                throw new KeyNotFoundException($"Instructor with ID {id} not found.");
            }

            // Validate department exists
            if (dto.DepartmentId <= 0)
            {
                throw new InvalidOperationException("Invalid Department ID provided");
            }

            // BUSINESS RULE: Cannot change department if instructor is head of current department
            if (instructor.DepartmentId.HasValue && instructor.DepartmentId.Value != dto.DepartmentId)
            {
                var isHead = await _instructorRepository.IsHeadOfAnyDepartmentAsync(id);
                if (isHead)
                {
                    throw new InvalidOperationException("Cannot change department for instructor who is head of their current department. Please reassign department leadership first.");
                }

                // BUSINESS RULE: Cannot change department if instructor has active courses in current department
                var courses = await _courseRepository.GetCoursesByInstructorId(id);
                var activeCourses = courses.Where(c => !c.IsDeleted && c.DepartmentId == instructor.DepartmentId).ToList();
                
                if (activeCourses.Any())
                {
                    var courseNames = string.Join(", ", activeCourses.Select(c => c.Name));
                    throw new InvalidOperationException($"Cannot change department. Instructor has active courses in current department: {courseNames}. Please reassign or remove these courses first.");
                }
            }

            // Admin can only update department assignment
            instructor.DepartmentId = dto.DepartmentId;
            instructor.UpdatedAt = DateTime.UtcNow;

            await _instructorRepository.UpdateInstructor(instructor);

            var updatedInstructor = await _instructorRepository.GetByIdWithDetailsAsync(id);
            var isHeadAfterUpdate = await _instructorRepository.IsHeadOfAnyDepartmentAsync(id);
           
            return MapToDto(updatedInstructor!, isHeadAfterUpdate);
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
            // INSTRUCTOR PROFILE UPDATE: Only contact number allowed
            var instructor = await _instructorRepository.GetByUserIdAsync(userId);
            if (instructor == null)
            {
                throw new KeyNotFoundException("Instructor profile not found for the current user.");
            }

            // Instructors can only update contact number
            // Names are fixed identity information tied to academic records
            instructor.ContactNumber = dto.ContactNumber;
            instructor.UpdatedAt = DateTime.UtcNow;

            // Update the associated user entity with PhoneNumber
            var user = await _userManager.FindByIdAsync(instructor.UserId.ToString());
            if (user != null)
            {
                user.PhoneNumber = dto.ContactNumber;
                await _userManager.UpdateAsync(user);
            }

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
                LastName = instructor.User?.LastName ?? string.Empty,
                IsDeleted = instructor.IsDeleted,
                DeletedAt = instructor.DeletedAt
            };
        }

        // ========== SOFT DELETE OPERATIONS ==========

        public async Task<bool> SoftDeleteAsync(int id)
        {
            // ENHANCED: Check for active courses before soft delete
            var activeCourses = await _courseRepository.GetCoursesByInstructorId(id);
            var activeCount = activeCourses.Count(c => !c.IsDeleted);
            
            if (activeCount > 0)
            {
                throw new InvalidOperationException(
                    $"Cannot archive instructor with {activeCount} active course(s). " +
                    $"Please reassign courses to another instructor first.");
            }

            // Check if instructor is department head
            var isHead = await _instructorRepository.IsHeadOfAnyDepartmentAsync(id);
            if (isHead)
            {
                throw new InvalidOperationException(
                    "Cannot archive instructor who is a department head. " +
                    "Please assign a new department head first.");
            }

            return await _instructorRepository.SoftDeleteInstructor(id);
        }

        public async Task<bool> RestoreAsync(int id)
        {
            return await _instructorRepository.RestoreInstructor(id);
        }

        public async Task<bool> PermanentlyDeleteAsync(int id)
        {
            // ENHANCED: Strict validation for permanent delete
            var (canDelete, reason, count) = await CanPermanentlyDeleteAsync(id);
            
            if (!canDelete)
            {
                throw new InvalidOperationException(reason);
            }

            return await _instructorRepository.PermanentlyDeleteInstructor(id);
        }

        public async Task<(bool CanDelete, string Reason, int RelatedDataCount)> CanPermanentlyDeleteAsync(int id)
        {
            var courseCount = await _instructorRepository.GetInstructorCourseCount(id);
            
            if (courseCount > 0)
            {
                return (false, $"Instructor has {courseCount} course record(s). Cannot permanently delete instructors with course history to preserve academic records.", courseCount);
            }

            // Check if department head
            var isHead = await _instructorRepository.IsHeadOfAnyDepartmentAsync(id);
            if (isHead)
            {
                return (false, "Instructor is a department head. Cannot permanently delete. Please reassign department head first.", 1);
            }

            return (true, "Instructor can be safely deleted - no course records or dependencies found", 0);
        }

        /// <summary>
        /// Reassign all courses from one instructor to another before deletion
        /// </summary>
        public async Task<int> ReassignCoursesToInstructorAsync(int fromInstructorId, int toInstructorId)
        {
            // Validate both instructors exist
            var fromInstructor = await _instructorRepository.GetByIdWithDetailsAsync(fromInstructorId);
            if (fromInstructor == null)
                throw new InvalidOperationException("Source instructor not found.");

            var toInstructor = await _instructorRepository.GetByIdWithDetailsAsync(toInstructorId);
            if (toInstructor == null)
                throw new InvalidOperationException("Target instructor not found.");

            // Get active courses for source instructor
            var courses = await _courseRepository.GetCoursesByInstructorId(fromInstructorId);
            var activeCourses = courses.Where(c => !c.IsDeleted).ToList();

            if (activeCourses.Count == 0)
                return 0;

            // Check target instructor workload limits
            var targetCourses = await _courseRepository.GetCoursesByInstructorId(toInstructorId);
            var targetActiveCount = targetCourses.Count(c => !c.IsDeleted);
            var targetCredits = targetCourses.Where(c => !c.IsDeleted).Sum(c => c.Credits);

            // Validate workload constraints
            if (targetActiveCount + activeCourses.Count > 2)
            {
                throw new InvalidOperationException(
                    $"Target instructor already has {targetActiveCount} course(s). " +
                    $"Cannot exceed 2 courses per instructor.");
            }

            var sourceCredits = activeCourses.Sum(c => c.Credits);
            if (targetCredits + sourceCredits > 12)
            {
                throw new InvalidOperationException(
                    $"Target instructor has {targetCredits} credit hours. " +
                    $"Adding {sourceCredits} more would exceed 12-hour limit.");
            }

            // Reassign courses
            int reassignedCount = 0;
            foreach (var course in activeCourses)
            {
                course.InstructorId = toInstructorId;
                await _courseRepository.UpdateCourse(course);
                reassignedCount++;
            }

            return reassignedCount;
        }

        public async Task<IEnumerable<InstructorDTO>> GetAllIncludingDeletedAsync()
        {
            var instructors = await _instructorRepository.GetAllInstructorsIncludingDeleted();
            var result = new List<InstructorDTO>();
            
            foreach (var instructor in instructors)
            {
                var isHead = await _instructorRepository.IsHeadOfAnyDepartmentAsync(instructor.InstructorId);
                result.Add(MapToDto(instructor, isHead));
            }
            
            return result;
        }

        public async Task<bool> IsPhoneNumberUniqueAsync(string phoneNumber)
        {
            if (string.IsNullOrWhiteSpace(phoneNumber))
                return true;

            var normalizedPhone = phoneNumber.Trim();
            var allInstructors = await _instructorRepository.GetAllInstructorsAsync();
            var exists = allInstructors.Any(i => i.ContactNumber == normalizedPhone && !i.IsDeleted);

            return !exists;
        }

    }
}
