using Microsoft.EntityFrameworkCore;
using University.App.Interfaces;
using University.Core.Entities;
using University.Infra.Data;

namespace University.Infra.Repositories
{
    public class AttendanceRepository : IAttendanceRepository
    {
        private readonly UniversityDbContext _context;

        public AttendanceRepository(UniversityDbContext context)
        {
            _context = context;
        }

        public async Task<Attendance?> GetAttendanceById(int id)
        {
            return await _context.Attendances
                .Include(a => a.Student)
                .Include(a => a.Course)
                .FirstOrDefaultAsync(a => a.AttendanceId == id);
        }

        public async Task<IEnumerable<Attendance>> GetAllAttendances()
        {
            return await _context.Attendances
                .Where(a => !a.IsDeleted)  // ENHANCEMENT: Filter soft-deleted
                .Include(a => a.Student)
                .Include(a => a.Course)
                .OrderByDescending(a => a.Date)
                .ToListAsync();
        }

        public async Task<IEnumerable<Attendance>> GetAttendancesByStudentId(int studentId)
        {
            return await _context.Attendances
                .Where(a => a.StudentId == studentId && !a.IsDeleted)  // ENHANCEMENT: Filter soft-deleted
                .Include(a => a.Student)
                .Include(a => a.Course)
                .OrderByDescending(a => a.Date)
                .ToListAsync();
        }

        public async Task<IEnumerable<Attendance>> FilterAttendances(
            int? studentId,
            int? courseId,
            DateTime? from,
            DateTime? to)
        {
            var query = _context.Attendances
                .Where(a => !a.IsDeleted)  // ENHANCEMENT: Filter soft-deleted
                .Include(a => a.Student)
                .Include(a => a.Course)
                .AsQueryable();

            if (studentId.HasValue)
                query = query.Where(a => a.StudentId == studentId.Value);

            if (courseId.HasValue)
                query = query.Where(a => a.CourseId == courseId.Value);

            if (from.HasValue)
                query = query.Where(a => a.Date.Date >= from.Value.Date);

            if (to.HasValue)
                query = query.Where(a => a.Date.Date <= to.Value.Date);

            return await query
                .OrderByDescending(a => a.Date)
                .ToListAsync();
        }

        public async Task<Attendance?> AddAttendance(Attendance attendance)
        {
            _context.Attendances.Add(attendance);
            await _context.SaveChangesAsync();
            return attendance;
        }

        public async Task<Attendance?> UpdateAttendance(Attendance attendance)
        {
            var existingAttendance = await _context.Attendances.FindAsync(attendance.AttendanceId);
            if (existingAttendance == null)
                return null;

            _context.Attendances.Update(attendance);
            await _context.SaveChangesAsync();
            return attendance;
        }

        public async Task<bool> DeleteAttendance(int id)
        {
            var attendance = await _context.Attendances
                .FirstOrDefaultAsync(a => a.AttendanceId == id && !a.IsDeleted);
            
            if (attendance == null)
                throw new InvalidOperationException("Attendance record not found or already deleted");

            // Cannot delete records older than 7 days
            if (attendance.Date.Date < DateTime.Today.AddDays(-7))
                throw new InvalidOperationException("You cannot delete attendance older than 7 days");

            // Cannot delete attendance from the future
            if (attendance.Date.Date > DateTime.Today)
                throw new InvalidOperationException("You cannot delete attendance for a future date");

            // ENHANCEMENT: Use soft delete instead of hard delete
            attendance.IsDeleted = true;
            attendance.DeletedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> AttendanceExists(int studentId, int courseId, DateTime date)
        {
            var dateOnly = date.Date;
            return await _context.Attendances.AnyAsync(a =>
                a.StudentId == studentId &&
                a.CourseId == courseId &&
                a.Date.Date == dateOnly);
        }

        public async Task<bool> StudentExists(int studentId) => await _context.Students.AnyAsync(s => s.StudentId == studentId);
        public async Task<bool> CourseExists(int courseId) => await _context.Courses.AnyAsync(c => c.CourseId == courseId);
        public async Task<bool> AttendanceExistsWithStatus(int studentId, int courseId, DateTime date, string status)
        {
            return await _context.Attendances.AnyAsync(a =>
              a.StudentId == studentId &&
              a.CourseId == courseId &&
              a.Date.Date == date.Date &&
              a.Status == status);
        }
        public async Task<bool> IsStudentEnrolledInCourse(int studentId, int courseId) => await _context.Enrollments.AnyAsync(e => e.StudentId == studentId && e.CourseId == courseId);
        public async Task<int> GetDailyAttendanceCount(int studentId, DateTime date) => await _context.Attendances.CountAsync(a => a.StudentId == studentId && a.Date.Date == date.Date);

    }
}