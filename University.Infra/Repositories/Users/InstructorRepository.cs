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
                .Where(i => i.DepartmentId == departmentId)
                .ToListAsync();
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
            return await _context.Instructors.ToListAsync();
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
    }
}
