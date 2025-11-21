using University.Core.Entities;

namespace University.App.Interfaces
{
    public interface IAttendanceRepository
    {
        Task<Attendance?> GetAttendanceById(int id);
        Task<IEnumerable<Attendance>> GetAllAttendances();
        Task<IEnumerable<Attendance>> GetAttendancesByStudentId(int studentId);
        Task<IEnumerable<Attendance>> FilterAttendances(int? studentId, int? courseId, DateTime? from, DateTime? to);
        Task<Attendance?> AddAttendance(Attendance attendance);
        Task<Attendance?> UpdateAttendance(Attendance attendance);
        Task<bool> DeleteAttendance(int id);
        Task<bool> AttendanceExists(int studentId, int courseId, DateTime date);
        Task<bool> AttendanceExistsWithStatus(int studentId, int courseId, DateTime date, string status);

        Task<bool> StudentExists(int studentId);
        Task<bool> CourseExists(int courseId);
        Task<bool> IsStudentEnrolledInCourse(int studentId, int courseId);
        Task<int> GetDailyAttendanceCount(int studentId, DateTime date);

    }
}