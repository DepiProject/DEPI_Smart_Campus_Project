using Microsoft.EntityFrameworkCore;
using University.App.Interfaces.Courses;
using University.Core.Entities;
using University.Infra.Data;

namespace University.Infra.Repositories.Courses
{
    public class CourseRepository : ICourseRepository
    {
        private readonly UniversityDbContext _context;

        public CourseRepository(UniversityDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Course>> GetAllCourses()
        {
            return await _context.Courses
                .Include(c => c.Instructor)
                .Include(c => c.Department)
                .Where(c => !c.IsDeleted) // Filter out soft-deleted courses
                .AsNoTracking()
                .ToListAsync();
        }

        public async Task<Course?> GetCourseById(int id)
        {
            return await _context.Courses
                .Include(c => c.Instructor)
                .Include(c => c.Department)
                .Include(c => c.Enrollments) // Include enrollments for GetEnrollmentStudentsByCourseID
                    .ThenInclude(e => e.Student)
                .Where(c => !c.IsDeleted) // Filter out soft-deleted courses
                .AsNoTracking()
                .FirstOrDefaultAsync(c => c.CourseId == id);
        }

        public async Task<IEnumerable<Course>> GetAllCoursesIncludingDeleted()
        {
            return await _context.Courses
                .IgnoreQueryFilters()
                .Include(c => c.Instructor)
                .Include(c => c.Department)
                .AsNoTracking()
                .ToListAsync();
        }

        public async Task<Course?> AddCourse(Course course)
        {
            course.IsDeleted = false;
            course.DeletedAt = null;
            course.CreatedAt = DateTime.UtcNow;
            course.UpdatedAt = DateTime.UtcNow;

            _context.Courses.Add(course);
            await _context.SaveChangesAsync();

            return course;
        }

        public async Task<Course?> UpdateCourse(Course course)
        {
            var existing = await _context.Courses
                .FirstOrDefaultAsync(c => c.CourseId == course.CourseId && !c.IsDeleted);

            if (existing == null)
                return null;

            // Preserve certain fields
            course.IsDeleted = existing.IsDeleted;
            course.DeletedAt = existing.DeletedAt;
            course.CreatedAt = existing.CreatedAt;
            course.UpdatedAt = DateTime.UtcNow;

            _context.Entry(existing).CurrentValues.SetValues(course);
            await _context.SaveChangesAsync();

            return existing;
        }

        public async Task<bool> DeleteCourse(int id)
        {
            var course = await _context.Courses
                .FirstOrDefaultAsync(c => c.CourseId == id && !c.IsDeleted);

            if (course == null)
                return false;

            course.IsDeleted = true;
            course.DeletedAt = DateTime.UtcNow;
            course.InstructorId = null; // Unassign instructor

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> RestoreCourse(int id)
        {
            var course = await _context.Courses
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(c => c.CourseId == id);

            if (course == null)
                return false;

            if (!course.IsDeleted)
                throw new InvalidOperationException("Course is not deleted.");

            course.IsDeleted = false;
            course.DeletedAt = null;
            course.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> PermanentlyDeleteCourse(int id)
        {
            var course = await _context.Courses
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(c => c.CourseId == id);

            if (course == null)
                return false;

            bool hasExams = await _context.Exams
                .IgnoreQueryFilters()
                .AnyAsync(e => e.CourseId == id);

            if (hasExams)
                throw new InvalidOperationException("Cannot permanently delete course with existing exams.");

            bool hasEnrollments = await _context.Enrollments
                .IgnoreQueryFilters()
                .AnyAsync(e => e.CourseId == id);

            if (hasEnrollments)
                throw new InvalidOperationException("Cannot permanently delete course with existing enrollments.");

            bool hasAttendance = await _context.Attendances
                .IgnoreQueryFilters()
                .AnyAsync(a => a.CourseId == id);

            if (hasAttendance)
                throw new InvalidOperationException("Cannot permanently delete course with existing attendance records.");

            _context.Courses.Remove(course);
            await _context.SaveChangesAsync();

            return true;
        }

        public async Task<int> GetActiveEnrollmentCountByCourseId(int courseId)
        {
            return await _context.Enrollments
                .CountAsync(e => e.CourseId == courseId && e.Status == "Enrolled");
        }

        public async Task<IEnumerable<Course>> GetCoursesByInstructorId(int instructorId)
        {
            return await _context.Courses
                .Include(c => c.Department)
                .Include(c => c.Instructor)
                .Where(c => c.InstructorId == instructorId && !c.IsDeleted)
                .AsNoTracking()
                .ToListAsync();
        }

        public async Task<int> GetInstructorActiveCourseCount(int instructorId)
        {
            return await _context.Courses
                .Where(c => c.InstructorId == instructorId && !c.IsDeleted)
                .CountAsync();
        }

        public async Task<int> GetInstructorTotalCreditHours(int instructorId)
        {
            return await _context.Courses
                .Where(c => c.InstructorId == instructorId && !c.IsDeleted)
                .SumAsync(c => (int?)c.Credits) ?? 0;
        }

        public async Task<int> GetStudentCurrentSemesterCredits(int studentId, DateTime semesterStartDate)
        {
            return await _context.Enrollments
                .Where(e => e.StudentId == studentId
                            && e.Status == "Enrolled"
                            && e.EnrollmentDate >= semesterStartDate)
                .SumAsync(e => (int?)e.Course.Credits) ?? 0;
        }

        public async Task<int> GetStudentCurrentYearCredits(int studentId, DateTime yearStartDate)
        {
            return await _context.Enrollments
                .Where(e => e.StudentId == studentId
                            && e.Status == "Enrolled"
                            && e.EnrollmentDate >= yearStartDate)
                .SumAsync(e => (int?)e.Course.Credits) ?? 0;
        }

        public async Task<List<string>> GetStudentCompletedCourseCodes(int studentId)
        {
            return await _context.Enrollments
                .Where(e => e.StudentId == studentId && e.Status == "Completed")
                .Select(e => e.Course.CourseCode)
                .Distinct()
                .ToListAsync();
        }

        public async Task<IEnumerable<Course>> GetAllCoursesByDepartmentId(int departmentId)
        {
            return await _context.Courses
                .Include(c => c.Instructor)
                .Include(c => c.Department)
                .Where(c => c.DepartmentId == departmentId && !c.IsDeleted)
                .AsNoTracking()
                .ToListAsync();
        }

        public async Task<IEnumerable<Course>> GetCoursesByDepartmentForStudent(int departmentId)
        {
            return await GetAllCoursesByDepartmentId(departmentId);
        }

        public async Task<bool> IsCourseBelongsToDepartment(int courseId, int departmentId)
        {
            return await _context.Courses
                .AnyAsync(c => c.CourseId == courseId && c.DepartmentId == departmentId && !c.IsDeleted);
        }
    }
}