using Microsoft.EntityFrameworkCore;
using University.App.Interfaces.Users;
using University.Core.Entities;
using University.Infra.Data;

namespace University.Infra.Repositories.Users
{
    public class StudentRepository : IStudentRepository
    {
        private readonly UniversityDbContext _context;

        public StudentRepository(UniversityDbContext context)
        {
            _context = context;
        }
 
        public async Task<Student?> GetByIdWithDetailsAsync(int id)
        {
            return await _context.Students
                .Include(s => s.User)
                .Include(s => s.Department)
                .Include(s => s.Enrollments)
                    .ThenInclude(e => e.Course)
                .FirstOrDefaultAsync(s => s.StudentId == id);
        }

        public async Task<Student?> GetByUserIdAsync(int userId)
        {
            return await _context.Students
                .Include(s => s.User)
                .Include(s => s.Department)
                .FirstOrDefaultAsync(s => s.UserId == userId);
        }
        public async Task<Student?> GetByStudentCodeAsync(string studentCode)
        {
            return await _context.Students
                .Include(s => s.User)
                .FirstOrDefaultAsync(s => s.StudentCode == studentCode);
        }

        public async Task<IEnumerable<Student>> GetByDepartmentAsync(int departmentId)
        {
            return await _context.Students
                .Include(s => s.User)
                .Where(s => s.DepartmentId == departmentId)
                .ToListAsync();
        }

        public async Task<Student?> GetStudentByIdAsync(int id)
        {
            return await _context.Students
                    .Include(s => s.User)
                    .FirstOrDefaultAsync(s => s.StudentId == id);
        }

        public async Task<IEnumerable<Student?>> GetAllStudentsAsync()
        {
            return await _context.Students
                .Include(s => s.User)
                .Include(s => s.Department)
                .ToListAsync();
        }

        public async Task<(IEnumerable<Student> students, int totalCount)> GetStudentsWithPaginationAsync(int pageNumber, int pageSize)
        {
            var query = _context.Students
                .Include(s => s.User)
                .Include(s => s.Department)
                .AsQueryable();

            var totalCount = await query.CountAsync();
            var students = await query
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return (students, totalCount);
        }

        public async Task<(IEnumerable<Student> students, int totalCount)> SearchStudentsAsync(string? searchTerm, int? departmentId, int pageNumber, int pageSize)
        {
            var query = _context.Students
                .Include(s => s.User)
                .Include(s => s.Department)
                .AsQueryable();

            // Apply search filter
            if (!string.IsNullOrWhiteSpace(searchTerm))
            {
                searchTerm = searchTerm.ToLower();
                query = query.Where(s => 
                    (s.User.FirstName + " " + s.User.LastName).ToLower().Contains(searchTerm) ||
                    s.User.Email.ToLower().Contains(searchTerm) ||
                    s.StudentCode.ToLower().Contains(searchTerm) ||
                    (s.Department != null && s.Department.Name.ToLower().Contains(searchTerm))
                );
            }

            // Apply department filter
            if (departmentId.HasValue)
            {
                query = query.Where(s => s.DepartmentId == departmentId.Value);
            }

            var totalCount = await query.CountAsync();
            var students = await query
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return (students, totalCount);
        }

        public async Task<Student?> AddStudentAsync(Student student)
        {
            _context.Students.Add(student);
            await _context.SaveChangesAsync();
            return student;
        }

        public async Task<Student?> UpdateStudent(Student student)
        {
            var studentExist = await _context.Students.FindAsync(student.StudentId);
            if (studentExist != null)
            {
                _context.Students.Update(student);
                await _context.SaveChangesAsync();
                return student;
            }
            return null;
        }

        public async Task<bool> DeleteStudent(Student student)
        {
            var studentExist = await _context.Students
                .Include(s => s.User)
                .FirstOrDefaultAsync(s => s.StudentId == student.StudentId);

            if (studentExist == null)
                return false;

            // Check for critical data that should prevent deletion
            var hasExamSubmissions = await _context.ExamSubmissions
                .AnyAsync(es => es.StudentId == student.StudentId);

            if (hasExamSubmissions)
                throw new InvalidOperationException("Cannot delete student with exam submissions");

            // Check for enrollments
            var hasActiveEnrollments = await _context.Enrollments
                .AnyAsync(e => e.StudentId == student.StudentId && e.Status == "Enrolled");

            if (hasActiveEnrollments)
                throw new InvalidOperationException("Cannot delete student with active enrollments");

            // Delete student and user
            _context.Students.Remove(studentExist);
            if (studentExist.User != null)
            {
                _context.Users.Remove(studentExist.User);
            }

            await _context.SaveChangesAsync();
            return true;
        }
        public async Task<bool> IsStudentCodeUniqueAsync(string studentCode, int? excludeStudentId = null)
        {
            var query = _context.Students.Where(s => s.StudentCode == studentCode);

            if (excludeStudentId.HasValue)
            {
                query = query.Where(s => s.StudentId != excludeStudentId.Value);
            }

            return !await query.AnyAsync();
        }

        // ========== SOFT DELETE OPERATIONS ==========

        public async Task<bool> SoftDeleteStudent(int id)
        {
            var student = await _context.Students
                .Include(s => s.User)
                .FirstOrDefaultAsync(s => s.StudentId == id);
                
            if (student == null || student.IsDeleted)
                return false;

            // Mark both Student and User as deleted
            student.IsDeleted = true;
            student.DeletedAt = DateTime.UtcNow;
            
            if (student.User != null)
            {
                student.User.IsDeleted = true;
                student.User.DeletedAt = DateTime.UtcNow;
            }
            
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> RestoreStudent(int id)
        {
            var student = await _context.Students
                .IgnoreQueryFilters()
                .Include(s => s.User)
                .FirstOrDefaultAsync(s => s.StudentId == id);

            if (student == null || !student.IsDeleted)
                return false;

            // Restore both Student and User
            student.IsDeleted = false;
            student.DeletedAt = null;
            
            if (student.User != null)
            {
                student.User.IsDeleted = false;
                student.User.DeletedAt = null;
            }
            
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> PermanentlyDeleteStudent(int id)
        {
            var student = await _context.Students
                .IgnoreQueryFilters()
                .Include(s => s.User)
                .FirstOrDefaultAsync(s => s.StudentId == id);

            if (student == null)
                return false;

            // Cascade delete related data
            // 1. Delete attendance records
            var attendances = await _context.Attendances
                .IgnoreQueryFilters()
                .Where(a => a.StudentId == id)
                .ToListAsync();
            _context.Attendances.RemoveRange(attendances);

            // 2. Delete exam submissions
            var submissions = await _context.ExamSubmissions
                .IgnoreQueryFilters()
                .Where(es => es.StudentId == id)
                .ToListAsync();
            _context.ExamSubmissions.RemoveRange(submissions);

            // 3. Delete enrollments
            var enrollments = await _context.Enrollments
                .IgnoreQueryFilters()
                .Where(e => e.StudentId == id)
                .ToListAsync();
            _context.Enrollments.RemoveRange(enrollments);

            // 4. Delete student
            _context.Students.Remove(student);

            // 5. Delete associated user
            if (student.User != null)
            {
                _context.Users.Remove(student.User);
            }

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<IEnumerable<Student>> GetAllStudentsIncludingDeleted()
        {
            return await _context.Students
                .IgnoreQueryFilters()
                .Include(s => s.User)
                .Include(s => s.Department)
                .ToListAsync();
        }

        public async Task<int> GetStudentEnrollmentCount(int studentId)
        {
            return await _context.Enrollments
                .IgnoreQueryFilters()
                .CountAsync(e => e.StudentId == studentId);
        }
    }
}
