using Microsoft.AspNetCore.Identity;
using System;
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

        public async Task<StudentDTO> CreateAsync(CreateStudentDto dto)
        {
            // Validate student code uniqueness
            if (!await _studentRepository.IsStudentCodeUniqueAsync(dto.StudentCode))
            {
                throw new InvalidOperationException($"Student code '{dto.StudentCode}' already exists.");
            }

            // Create AppUser
            var user = new AppUser
            {
                UserName = dto.Email,
                Email = dto.Email,
                FirstName = dto.FirstName,
                LastName = dto.LastName,
                Role = "Student",
                EmailConfirmed = true
            };

            var result = await _userManager.CreateAsync(user, dto.Password);
            if (!result.Succeeded)
            {
                throw new InvalidOperationException($"Failed to create user: {string.Join(", ", result.Errors.Select(e => e.Description))}");
            }

            //Add to Student role
            await _userManager.AddToRoleAsync(user, "Student");

            //Create Student entity
            var student = new Student
            {
                UserId = user.Id,
                FullName = dto.FullName,
                StudentCode = dto.StudentCode,
                ContactNumber = dto.ContactNumber,
                Level = dto.Level,
                DepartmentId = dto.DepartmentId
            };

            await _studentRepository.AddStudentAsync(student);

            // Reload with details
            var createdStudent = await _studentRepository.GetByIdWithDetailsAsync(student.StudentId);
            return MapToDto(createdStudent!);
        }

        public async Task<StudentDTO> UpdateAsync(int id, UpdateStudentDto dto)
        {
            var student = await _studentRepository.GetStudentByIdAsync(id);
            if (student == null)
            {
                throw new KeyNotFoundException($"Student with ID {id} not found.");
            }

            // Update fields
            student.FullName = dto.FullName;
            student.ContactNumber = dto.ContactNumber;
            student.Level = dto.Level;
            student.DepartmentId = dto.DepartmentId;
            student.UpdatedAt = DateTime.UtcNow;

            _studentRepository?.UpdateStudent(student);
            

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

            // Check for active enrollments
            var hasActiveEnrollments = student.Enrollments?.Any(e => e.Status == "Enrolled") ?? false;
            if (hasActiveEnrollments)
            {
                throw new InvalidOperationException("Cannot delete student with active enrollments.");
            }
            _studentRepository?.DeleteStudent(student);
            var user = await _userManager.FindByIdAsync(student.UserId.ToString());
            if (user != null)
            {
                await _userManager.DeleteAsync(user);
            }

            return true;
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

            // Students can only update limited fields
            student.FullName = dto.FullName;
            student.ContactNumber = dto.ContactNumber;
            student.UpdatedAt = DateTime.UtcNow;

            _studentRepository?.UpdateStudent(student);


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
                FirstName = student.User?.FirstName ?? string.Empty,
                LastName = student.User?.LastName ?? string.Empty
            };
        }
    }
}
