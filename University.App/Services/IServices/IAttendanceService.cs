using University.App.DTOs;

namespace University.App.Services.IServices
{
    public interface IAttendanceService
    {
        Task MarkAttendanceAsync(MarkAttendanceDto dto);
        Task<List<AttendanceDto>> GetStudentHistoryAsync(int studentId);
        Task<List<AttendanceDto>> FilterAsync(int? studentId, int? courseId, DateTime? from, DateTime? to);
        Task<object> GetAttendanceSummaryAsync(int studentId, int? courseId = null);
        Task UpdateAttendanceAsync(int id, string status);
        Task DeleteAttendanceAsync(int id);
    }
}