using Microsoft.AspNetCore.Identity;
using University.App.DTOs.Users;
using University.App.Interfaces;
using University.App.Interfaces.Users;
using University.App.Services.IServices.Users;
using University.Core.Entities;

namespace University.App.Services.Implementations.Users
{
    public class StudentService : IStudentService
    {
        private readonly UserManager<AppUser> _userManager;
        private readonly IStudentRepository _studentRepository;
        private readonly IDepartmentRepository _departmentRepository;

        public StudentService(IStudentRepository studentRepository, UserManager<AppUser> userManager, IDepartmentRepository departmentRepository)
        {
            _studentRepository = studentRepository;
            _userManager = userManager;
            _departmentRepository = departmentRepository;
        }

        public async Task<StudentDTO> CreateAsync(CreateStudentDto dto)
        {
            // AUTO-GENERATE STUDENT CODE (meaningful format: YYYY-DEPT-XXX)
            string generatedCode = await GenerateStudentCodeAsync(dto.DepartmentId);
            dto.StudentCode = generatedCode; // Override any provided code

            // Validate email uniqueness
            var existingUser = await _userManager.FindByEmailAsync(dto.Email);
            if (existingUser != null)
            {
                throw new InvalidOperationException($"Email '{dto.Email}' is already registered.");
            }

            // Validate level is within acceptable range
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
                EmailConfirmed = true,
                MustChangePassword = true // Force password change on first login
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
                    StudentCode = dto.StudentCode, // Use auto-generated code
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

            // 2. Validate department exists
            if (dto.DepartmentId <= 0)
            {
                throw new InvalidOperationException("Invalid department ID.");
            }

            // 3. Check if student can change departments (business rule)
            if (student.DepartmentId != dto.DepartmentId)
            {
                // Check for active enrollments in current department
                // Student cannot change department if they have any active courses
                var activeEnrollments = student.Enrollments?
                    .Where(e => e.Status != "Rejected" && 
                               e.Status != "Completed" &&
                               e.Course?.DepartmentId == student.DepartmentId)
                    .ToList();

                if (activeEnrollments != null && activeEnrollments.Any())
                {
                    var courseNames = string.Join(", ", activeEnrollments
                        .Select(e => e.Course?.Name ?? "Unknown")
                        .Take(3));
                    
                    throw new InvalidOperationException(
                        $"Cannot change department. Student has {activeEnrollments.Count} active enrollment(s) in current department: {courseNames}");
                }
            }

            // ========== ADMIN UPDATE: Only Level and Department ==========
            // Do NOT update name or contact number
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

        public async Task<(IEnumerable<StudentDTO> students, int totalCount)> GetAllWithPaginationAsync(int pageNumber, int pageSize)
        {
            var (students, totalCount) = await _studentRepository.GetStudentsWithPaginationAsync(pageNumber, pageSize);
            var studentDtos = students.Select(s => MapToDto(s)).ToList();
            return (studentDtos, totalCount);
        }

        public async Task<(IEnumerable<StudentDTO> students, int totalCount)> SearchStudentsAsync(string? searchTerm, int? departmentId, int pageNumber, int pageSize)
        {
            var (students, totalCount) = await _studentRepository.SearchStudentsAsync(searchTerm, departmentId, pageNumber, pageSize);
            var studentDtos = students.Select(s => MapToDto(s)).ToList();
            return (studentDtos, totalCount);
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

            // ========== STUDENT UPDATE: Only Contact Number ==========
            // Do NOT update name, email, code, level, or department
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
                FirstName = student.User?.FirstName ?? string.Empty,
                LastName = student.User?.LastName ?? string.Empty,
                StudentCode = student.StudentCode,
                ContactNumber = student.ContactNumber,
                Level = student.Level,
                DepartmentId = student.DepartmentId,
                DepartmentName = student.Department?.Name,
                CreatedAt = student.CreatedAt,
                UserId = student.UserId,
                Email = student.User?.Email ?? string.Empty,
                IsDeleted = student.IsDeleted,
                DeletedAt = student.DeletedAt
            };
        }

        // ========== VALIDATION OPERATIONS ==========

        // ========== VALIDATION OPERATIONS ==========

        public async Task<bool> IsPhoneNumberUniqueAsync(string phoneNumber)
        {
            if (string.IsNullOrWhiteSpace(phoneNumber))
                return true;

            var normalizedPhone = phoneNumber.Trim();
            var allStudents = await _studentRepository.GetAllStudentsAsync();
            var exists = allStudents.Any(s => s.ContactNumber == normalizedPhone && !s.IsDeleted);

            return !exists;
        }

        // ========== SOFT DELETE OPERATIONS ==========

        public async Task<bool> SoftDeleteAsync(int id)
        {
            // ENHANCED: Check for active enrollments before soft delete
            var enrollmentCount = await _studentRepository.GetStudentEnrollmentCount(id);
            
            if (enrollmentCount > 0)
            {
                throw new InvalidOperationException(
                    $"Cannot archive student with {enrollmentCount} active enrollment(s). " +
                    $"Student must complete, drop, or withdraw from all courses first.");
            }

            return await _studentRepository.SoftDeleteStudent(id);
        }

        public async Task<bool> RestoreAsync(int id)
        {
            return await _studentRepository.RestoreStudent(id);
        }

        public async Task<bool> PermanentlyDeleteAsync(int id)
        {
            // ENHANCED: Strict validation for permanent delete
            var (canDelete, reason, count) = await CanPermanentlyDeleteAsync(id);
            
            if (!canDelete)
            {
                throw new InvalidOperationException(reason);
            }

            return await _studentRepository.PermanentlyDeleteStudent(id);
        }

        public async Task<(bool CanDelete, string Reason, int RelatedDataCount)> CanPermanentlyDeleteAsync(int id)
        {
            var enrollmentCount = await _studentRepository.GetStudentEnrollmentCount(id);
            
            if (enrollmentCount > 0)
            {
                return (false, $"Student has {enrollmentCount} enrollment record(s). Cannot permanently delete students with enrollment history to preserve academic records.", enrollmentCount);
            }

            return (true, "Student can be safely deleted - no enrollment records found", 0);
        }

        public async Task<IEnumerable<StudentDTO>> GetAllIncludingDeletedAsync()
        {
            var students = await _studentRepository.GetAllStudentsIncludingDeleted();
            return students.Select(MapToDto);
        }

        /// <summary>
        /// Generates a meaningful student code format: YYYY-DEPT-XXX
        /// Example: 2024-CS-001, 2024-ENG-042
        /// </summary>
        private async Task<string> GenerateStudentCodeAsync(int? departmentId)
        {
            string year = DateTime.Now.Year.ToString();
            string deptCode = "GEN"; // Default for students without department

            // Get department code from actual department if provided
            if (departmentId.HasValue && departmentId.Value > 0)
            {
                var department = await _departmentRepository.GetDepartmentById(departmentId.Value);
                if (department != null && !string.IsNullOrWhiteSpace(department.Name))
                {
                    // Extract abbreviation from department name
                    // For example: "Computer Science" -> "CS", "Mathematics" -> "MATH"
                    deptCode = GetDepartmentAbbreviation(department.Name);
                }
            }
            
            string codePrefix = $"{year}-{deptCode}-";
            
            // Get all students to find next sequence number
            var allStudents = await _studentRepository.GetAllStudentsAsync();
            int count = allStudents.Count(s => s.StudentCode.StartsWith(codePrefix)) + 1;

            string sequenceNumber = count.ToString("D3"); // Format as 001, 002, etc.
            return $"{year}-{deptCode}-{sequenceNumber}";
        }

        /// <summary>
        /// Generate department abbreviation from department name
        /// </summary>
        private string GetDepartmentAbbreviation(string departmentName)
        {
            if (string.IsNullOrWhiteSpace(departmentName))
                return "GEN";

            // Remove common words and extract key parts
            var words = departmentName.Split(new[] { ' ', '-', '_' }, StringSplitOptions.RemoveEmptyEntries)
                .Where(w => !new[] { "of", "and", "the" }.Contains(w.ToLower()))
                .ToList();

            if (words.Count == 0)
                return "GEN";

            // If single word, take first 3-4 letters
            if (words.Count == 1)
            {
                string word = words[0].ToUpper();
                return word.Length <= 4 ? word : word.Substring(0, 4);
            }

            // If multiple words, take first letter of each word (max 4 letters)
            string abbr = string.Join("", words.Take(4).Select(w => w[0])).ToUpper();
            return abbr;
        }
    }
}