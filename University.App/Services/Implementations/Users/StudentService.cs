using Microsoft.AspNetCore.Identity;
using University.App.DTOs.Users;
using University.App.Interfaces.Users;
using University.App.Services.IServices.Users;
using University.Core.Entities;

namespace University.App.Services.Implementations.Users
{
    public class StudentService : IStudentService
    {
        private readonly UserManager<AppUser> _userManager;
        private readonly IStudentRepository _studentRepository;

        public StudentService(IStudentRepository studentRepository, UserManager<AppUser> userManager)
        {
            _studentRepository = studentRepository;
            _userManager = userManager;
        }

        public async Task<StudentDTO> CreateAsync(CreateStudentDto dto)
        {
            // 1. Validate student code uniqueness
            if (!await _studentRepository.IsStudentCodeUniqueAsync(dto.StudentCode))
            {
                throw new InvalidOperationException($"Student code '{dto.StudentCode}' already exists.");
            }

            // 2. Validate email uniqueness
            var existingUser = await _userManager.FindByEmailAsync(dto.Email);
            if (existingUser != null)
            {
                throw new InvalidOperationException($"Email '{dto.Email}' is already registered.");
            }

            // 3. Validate student code format (additional server-side check)
            if (!System.Text.RegularExpressions.Regex.IsMatch(dto.StudentCode, @"^[A-Za-z][A-Za-z0-9]*$"))
            {
                throw new InvalidOperationException("Student code must start with a letter and contain only alphanumeric characters.");
            }

            // 4. Validate level is within acceptable range
            if (!new[] { "1", "2", "3", "4" }.Contains(dto.Level))
            {
                throw new InvalidOperationException("Level must be 1, 2, 3, or 4.");
            }

            if (!dto.FullName.Contains(dto.FirstName, StringComparison.OrdinalIgnoreCase) ||
                !dto.FullName.Contains(dto.LastName, StringComparison.OrdinalIgnoreCase))
            {
                throw new InvalidOperationException("Full name must contain both first and last names.");
            }

            // Create AppUser
            var user = new AppUser
            {
                UserName = dto.Email,
                Email = dto.Email,
                FirstName = dto.FirstName.Trim(),
                LastName = dto.LastName.Trim(),
                Role = "Student",
                EmailConfirmed = true
            };

            var result = await _userManager.CreateAsync(user, dto.Password);
            if (!result.Succeeded)
            {
                var errors = string.Join(", ", result.Errors.Select(e => e.Description));
                throw new InvalidOperationException($"Failed to create user: {errors}");
            }

            try
            {
                await _userManager.AddToRoleAsync(user, "Student");

                var student = new Student
                {
                    UserId = user.Id,
                    FullName = dto.FullName.Trim(),
                    StudentCode = dto.StudentCode.ToUpper(), // Standardize to uppercase
                    ContactNumber = dto.ContactNumber?.Trim(),
                    Level = dto.Level,
                    DepartmentId = dto.DepartmentId
                };

                await _studentRepository.AddStudentAsync(student);

                var createdStudent = await _studentRepository.GetByIdWithDetailsAsync(student.StudentId);
                return MapToDto(createdStudent!);
            }
            catch
            {
                // Rollback: Delete user if student creation fails
                await _userManager.DeleteAsync(user);
                throw;
            }
        }

        public async Task<StudentDTO> UpdateAsync(int id, UpdateStudentDto dto)
        {
            var student = await _studentRepository.GetStudentByIdAsync(id);
            if (student == null)
            {
                throw new KeyNotFoundException($"Student with ID {id} not found.");
            }

            // 1. Validate level
            if (!new[] { "1", "2", "3", "4" }.Contains(dto.Level))
            {
                throw new InvalidOperationException("Level must be 1, 2, 3, or 4.");
            }

            // 2. Validate department exists if provided
            if (dto.DepartmentId.HasValue && dto.DepartmentId.Value <= 0)
            {
                throw new InvalidOperationException("Invalid department ID.");
            }

            // 3. Check if student can change departments (business rule)
            if (dto.DepartmentId.HasValue && student.DepartmentId != dto.DepartmentId)
            {
                // Check for active enrollments in current department
                var hasActiveEnrollments = student.Enrollments?.Any(e =>
                    e.Status == "Enrolled" && e.Course?.DepartmentId == student.DepartmentId) ?? false;

                if (hasActiveEnrollments)
                {
                    throw new InvalidOperationException(
                        "Cannot change department while student has active enrollments in current department.");
                }
            }

            student.FullName = dto.FullName.Trim();
            student.ContactNumber = dto.ContactNumber?.Trim();
            student.Level = dto.Level;
            student.DepartmentId = dto.DepartmentId;
            student.UpdatedAt = DateTime.UtcNow;

            await _studentRepository.UpdateStudent(student);

            var updatedStudent = await _studentRepository.GetByIdWithDetailsAsync(id);
            return MapToDto(updatedStudent!);
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var student = await _studentRepository.GetByIdWithDetailsAsync(id);
            if (student == null)
            {
                return false;
            }

            // Business rule: Cannot delete if has active enrollments
            var hasActiveEnrollments = student.Enrollments?.Any(e => e.Status == "Enrolled") ?? false;
            if (hasActiveEnrollments)
            {
                throw new InvalidOperationException(
                    "Cannot delete student with active enrollments. Please drop all active courses first.");
            }

            // Business rule: Cannot delete if has pending exam submissions
            var hasPendingExams = student.ExamSubmissions?.Any(es =>
                es.SubmittedAt == null && !es.IsDeleted) ?? false;
            if (hasPendingExams)
            {
                throw new InvalidOperationException(
                    "Cannot delete student with pending exam submissions.");
            }

            await _studentRepository.DeleteStudent(student);

            var user = await _userManager.FindByIdAsync(student.UserId.ToString());
            if (user != null)
            {
                await _userManager.DeleteAsync(user);
            }

            return true;
        }

        // Implement other interface methods...
        public async Task<StudentDTO?> GetByIdAsync(int id)
        {
            var student = await _studentRepository.GetByIdWithDetailsAsync(id);
            return student == null ? null : MapToDto(student);
        }

        public async Task<IEnumerable<StudentDTO>> GetAllAsync()
        {
            var students = await _studentRepository.GetAllStudentsAsync();
            return students.Select(MapToDto);
        }

        public async Task<IEnumerable<StudentDTO>> GetByDepartmentAsync(int departmentId)
        {
            var students = await _studentRepository.GetByDepartmentAsync(departmentId);
            return students.Select(MapToDto);
        }

        public async Task<StudentDTO?> GetMyProfileAsync(int userId)
        {
            var student = await _studentRepository.GetByUserIdAsync(userId);
            return student == null ? null : MapToDto(student);
        }

        public async Task<StudentDTO> UpdateMyProfileAsync(int userId, UpdateStudentProfileDto dto)
        {
            var student = await _studentRepository.GetByUserIdAsync(userId);
            if (student == null)
            {
                throw new KeyNotFoundException("Student profile not found.");
            }

            student.FullName = dto.FullName.Trim();
            student.ContactNumber = dto.ContactNumber?.Trim();
            student.UpdatedAt = DateTime.UtcNow;

            await _studentRepository.UpdateStudent(student);

            var updatedStudent = await _studentRepository.GetByIdWithDetailsAsync(student.StudentId);
            return MapToDto(updatedStudent!);
        }

        public async Task<StudentDTO?> GetByStudentCodeAsync(string studentCode)
        {
            var student = await _studentRepository.GetByStudentCodeAsync(studentCode);
            return student == null ? null : MapToDto(student);
        }

        private StudentDTO MapToDto(Student student)
        {
            return new StudentDTO
            {
                StudentId = student.StudentId,
                FullName = student.FullName,
                StudentCode = student.StudentCode,
                ContactNumber = student.ContactNumber,
                Level = student.Level,
                DepartmentId = student.DepartmentId,
                DepartmentName = student.Department?.Name,
                CreatedAt = student.CreatedAt,
                UserId = student.UserId,
                Email = student.User?.Email ?? string.Empty,

            };
        }
    }
}