using Microsoft.EntityFrameworkCore;
using University.App.Interfaces.Users;
using University.Core.Entities;
using University.Infra.Data;

namespace University.Infra.Repositories.Users
{
    public class InstructorRepository : IInstructorRepository
    {
        private readonly UniversityDbContext _context;

        public InstructorRepository(UniversityDbContext context)
        {
            _context = context;
        }
        public async Task<Instructor?> GetByIdWithDetailsAsync(int id)
        {
            return await _context.Instructors
                .Include(i => i.User)
                .Include(i => i.Department)
                .ThenInclude(i => i.Courses)
                .FirstOrDefaultAsync(i => i.InstructorId == id);
        }

        public async Task<Instructor?> GetByUserIdAsync(int userId)
        {
            return await _context.Instructors
                .Include(i => i.User)
                .Include(i => i.Department)
                .FirstOrDefaultAsync(i => i.UserId == userId);
        }

        public async Task<IEnumerable<Instructor>> GetByDepartmentAsync(int departmentId)
        {
            return await _context.Instructors
                .Include(i => i.User)
                .Include(i => i.Department)
                .Where(i => i.DepartmentId == departmentId)
                .ToListAsync();
        }

        public async Task<Instructor?> GetFirstInstructorByDepartmentAsync(int departmentId)
        {
            return await _context.Instructors
                .Include(i => i.User)
                .Include(i => i.Department)
                .Where(i => i.DepartmentId == departmentId && !i.IsDeleted)
                .OrderBy(i => i.InstructorId)
                .FirstOrDefaultAsync();
        }

        public async Task<bool> IsHeadOfAnyDepartmentAsync(int instructorId)
        {
            return await _context.Departments
                .AnyAsync(d => d.HeadId == instructorId);
        }

        public async Task<bool> HasActiveCoursesWithEnrollmentsAsync(int instructorId)
        {
            return await _context.Courses
                .Where(c => c.InstructorId == instructorId)
                .AnyAsync(c => c.Enrollments.Any(e => e.Status == "Enrolled"));
        }

        public async Task<Instructor?> GetInstructorByIdAsync(int id)
        {
            return await _context.Instructors
                    .Include(i => i.User)
                    .FirstOrDefaultAsync(i =>i.InstructorId  == id);
        }

        public async Task<IEnumerable<Instructor?>> GetAllInstructorsAsync()
        {
            return await _context.Instructors
                .Include(i => i.User)
                .Include(i => i.Department)
                .ToListAsync();
        }

        public async Task<(IEnumerable<Instructor> instructors, int totalCount)> GetInstructorsWithPaginationAsync(int pageNumber, int pageSize)
        {
            var query = _context.Instructors
                .Include(i => i.User)
                .Include(i => i.Department)
                .AsQueryable();

            var totalCount = await query.CountAsync();
            var instructors = await query
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return (instructors, totalCount);
        }

        public async Task<(IEnumerable<Instructor> instructors, int totalCount)> SearchInstructorsAsync(string? searchTerm, int? departmentId, int pageNumber, int pageSize)
        {
            var query = _context.Instructors
                .Include(i => i.User)
                .Include(i => i.Department)
                .AsQueryable();

            // Apply search filter
            if (!string.IsNullOrWhiteSpace(searchTerm))
            {
                searchTerm = searchTerm.ToLower();
                query = query.Where(i => 
                    (i.User.FirstName + " " + i.User.LastName).ToLower().Contains(searchTerm) ||
                    i.User.Email.ToLower().Contains(searchTerm) ||
                    (i.Department != null && i.Department.Name.ToLower().Contains(searchTerm))
                );
            }

            // Apply department filter
            if (departmentId.HasValue)
            {
                query = query.Where(i => i.DepartmentId == departmentId.Value);
            }

            var totalCount = await query.CountAsync();
            var instructors = await query
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return (instructors, totalCount);
        }

        public async Task<Instructor?> AddInstructorAsync(Instructor instructor)
        {
            _context.Instructors.Add(instructor);
            await _context.SaveChangesAsync();
            return instructor;
        }

        public async Task<Instructor?> UpdateInstructor(Instructor instructor)
        {
            var instructorExist = await _context.Instructors.FindAsync(instructor.InstructorId);
            if (instructorExist != null)
            {
                _context.Instructors.Update(instructor);
                await _context.SaveChangesAsync();
                return instructor;
            }
            return null;
        }

        public async Task<bool> DeleteInstructor(Instructor instructor)
        {
            var instructorExist = await _context.Instructors
                .Include(i => i.User)
                .FirstOrDefaultAsync(i => i.InstructorId == instructor.InstructorId);

            if (instructorExist == null)
                return false;

            // Check if instructor is a department head
            var isHead = await _context.Departments
                .AnyAsync(d => d.HeadId == instructor.InstructorId && !d.IsDeleted);

            if (isHead)
                throw new InvalidOperationException("Cannot delete instructor who is a department head");

            // Check for active courses with enrollments
            var hasActiveCourses = await _context.Courses
                .Where(c => c.InstructorId == instructor.InstructorId && !c.IsDeleted)
                .AnyAsync(c => c.Enrollments.Any(e => e.Status == "Enrolled"));

            if (hasActiveCourses)
                throw new InvalidOperationException("Cannot delete instructor with active courses");

            // Delete instructor and user
            _context.Instructors.Remove(instructorExist);
            if (instructorExist.User != null)
            {
                _context.Users.Remove(instructorExist.User);
            }

            await _context.SaveChangesAsync();
            return true;
        }

        // ========== SOFT DELETE OPERATIONS ==========

        public async Task<bool> SoftDeleteInstructor(int id)
        {
            var instructor = await _context.Instructors
                .Include(i => i.User)
                .FirstOrDefaultAsync(i => i.InstructorId == id);
                
            if (instructor == null || instructor.IsDeleted)
                return false;

            // Mark both Instructor and User as deleted
            instructor.IsDeleted = true;
            instructor.DeletedAt = DateTime.UtcNow;
            
            if (instructor.User != null)
            {
                instructor.User.IsDeleted = true;
                instructor.User.DeletedAt = DateTime.UtcNow;
            }
            
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> RestoreInstructor(int id)
        {
            var instructor = await _context.Instructors
                .IgnoreQueryFilters()
                .Include(i => i.User)
                .FirstOrDefaultAsync(i => i.InstructorId == id);

            if (instructor == null || !instructor.IsDeleted)
                return false;

            // Restore both Instructor and User
            instructor.IsDeleted = false;
            instructor.DeletedAt = null;
            
            if (instructor.User != null)
            {
                instructor.User.IsDeleted = false;
                instructor.User.DeletedAt = null;
            }
            
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> PermanentlyDeleteInstructor(int id)
        {
            var instructor = await _context.Instructors
                .IgnoreQueryFilters()
                .Include(i => i.User)
                .FirstOrDefaultAsync(i => i.InstructorId == id);

            if (instructor == null)
                return false;

            // Cascade delete related data
            // 1. Delete exam submissions graded by this instructor
            var submissions = await _context.ExamSubmissions
                .IgnoreQueryFilters()
                .Where(es => es.InstructorId == id)
                .ToListAsync();
            _context.ExamSubmissions.RemoveRange(submissions);

            // 2. Set courses to null instructor (or delete if preferred)
            var courses = await _context.Courses
                .IgnoreQueryFilters()
                .Where(c => c.InstructorId == id)
                .ToListAsync();
            foreach (var course in courses)
            {
                course.InstructorId = null;
            }

            // 3. Remove as department head
            var departments = await _context.Departments
                .IgnoreQueryFilters()
                .Where(d => d.HeadId == id)
                .ToListAsync();
            foreach (var dept in departments)
            {
                dept.HeadId = null;
            }

            // 4. Delete instructor
            _context.Instructors.Remove(instructor);

            // 5. Delete associated user
            if (instructor.User != null)
            {
                _context.Users.Remove(instructor.User);
            }

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<IEnumerable<Instructor>> GetAllInstructorsIncludingDeleted()
        {
            return await _context.Instructors
                .IgnoreQueryFilters()
                .Include(i => i.User)
                .Include(i => i.Department)
                .ToListAsync();
        }

        public async Task<int> GetInstructorCourseCount(int instructorId)
        {
            return await _context.Courses
                .IgnoreQueryFilters()
                .CountAsync(c => c.InstructorId == instructorId);
        }
    }
}
