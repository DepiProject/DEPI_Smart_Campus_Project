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
    }
}
