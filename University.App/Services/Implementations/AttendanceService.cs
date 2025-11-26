using University.App.DTOs;
using University.App.Interfaces;
using University.App.Services.IServices;
using University.Core.Entities;
using Microsoft.Extensions.Logging;

namespace University.App.Services.Implementations
{
    public class AttendanceService : IAttendanceService
    {
        private readonly IAttendanceRepository _attendanceRepo;
        private readonly ILogger<AttendanceService> _logger;
        private readonly List<string> _validStatuses = new() { "Present", "Absent", "Late", "Excused" };

        public AttendanceService(
            IAttendanceRepository attendanceRepo,
            ILogger<AttendanceService> logger)
        {
            _attendanceRepo = attendanceRepo;
            _logger = logger;
        }

        public async Task MarkAttendanceAsync(MarkAttendanceDto dto)
        {
            // ENHANCEMENT: Sanitize input data
            SanitizeMarkAttendanceDto(dto);

            if (!_validStatuses.Contains(dto.Status)) throw new ArgumentException($"Invalid status. Must be one of: {string.Join(", ", _validStatuses)}");
            if (!await _attendanceRepo.StudentExists(dto.StudentId)) throw new InvalidOperationException($"Student with ID {dto.StudentId} not found.");

            if (!await _attendanceRepo.CourseExists(dto.CourseId)) throw new InvalidOperationException($"Course with ID {dto.CourseId} not found.");

            // بتأكد انى الطالب مسجل اصلا  في الكورس
            if (!await _attendanceRepo.IsStudentEnrolledInCourse(dto.StudentId, dto.CourseId))
                throw new InvalidOperationException("Student is not enrolled in this course.");
            // منع  تكرر لتسجيل الحضور لو الطالب ناصح يعنى
            if (await _attendanceRepo.AttendanceExists(dto.StudentId, dto.CourseId, dto.Date))
            {
                throw new InvalidOperationException(
                    $"Attendance already marked for student {dto.StudentId} in course {dto.CourseId} on {dto.Date.Date:yyyy-MM-dd}");
            }
            // Rule Prevent marking Absent if student is Excused on this date
            if (dto.Status == "Absent")
            {
                bool excused = await _attendanceRepo.AttendanceExistsWithStatus(dto.StudentId, dto.CourseId, dto.Date, "Excused");
                if (excused)
                {
                    throw new InvalidOperationException("Student is already excused on this date. Cannot mark as Absent.");
                }
            }

            //  منع تسجيل حضور اكتر من 5 محاضرات في اليوم 
            var dailyCount = await _attendanceRepo.GetDailyAttendanceCount(dto.StudentId, dto.Date);
            if (dailyCount >= 5)
            {
                throw new InvalidOperationException("A student cannot attend more than 6 classes per day.");
            }

            // منع تسجيل الحضور بعد ما بيعدى  7 أيام 
            if (dto.Date.Date < DateTime.Today.AddDays(-7))
            {
                throw new InvalidOperationException("You cannot mark attendance older than 7 days.");

            }
            // منع تسجيل الحضور لتاريخ لسه مجااااش
            if (dto.Date.Date > DateTime.UtcNow.Date)
            {
                throw new InvalidOperationException("Attendance cannot be marked for a future date.");
            }

            // منع اسجله متأخر ولسه السيشن مبدأتش اصلا منطقى يعنى 
            // FIXED: Changed DateTime.Now to DateTime.UtcNow for consistency
            if (dto.Status == "Late" && dto.Date > DateTime.UtcNow)
            {
                throw new InvalidOperationException("Cannot mark a student as Late before the session time.");
            }

            var attendance = new Attendance
            {
                StudentId = dto.StudentId,
                CourseId = dto.CourseId,
                Date = dto.Date,
                Status = dto.Status
            };
            await _attendanceRepo.AddAttendance(attendance);
            
            // ENHANCEMENT: Log successful attendance marking
            _logger.LogInformation($"Attendance marked: StudentId={dto.StudentId}, CourseId={dto.CourseId}, Date={dto.Date:yyyy-MM-dd}, Status={dto.Status}");
        }

        public async Task<List<AttendanceDto>> GetStudentHistoryAsync(int studentId)
        {
            if (!await _attendanceRepo.StudentExists(studentId)) throw new InvalidOperationException($"Student with ID {studentId} not found.");
            var attendances = await _attendanceRepo.GetAttendancesByStudentId(studentId);
            return attendances.Select(a => new AttendanceDto
            {
                AttendanceId = a.AttendanceId,
                StudentId = a.StudentId,
                StudentName = a.Student?.FullName ?? string.Empty,
                CourseId = a.CourseId,
                CourseName = a.Course?.Name ?? string.Empty,
                Date = a.Date,
                Status = a.Status
            }).ToList();
        }
        public async Task<List<AttendanceDto>> FilterAsync(
            int? studentId,
            int? courseId,
            DateTime? from,
            DateTime? to)
        {

            // from > to   ممنوع تكون 
            if (from.HasValue && to.HasValue && from > to)
                throw new ArgumentException("From date cannot be greater than To date");

            // التاكد انى فعلا الطالب ده موجود
            if (studentId.HasValue && !await _attendanceRepo.StudentExists(studentId.Value))
                throw new InvalidOperationException($"Student with ID {studentId.Value} not found");

            // لازم اتأكد انى الكورس ده موجود
            if (courseId.HasValue && !await _attendanceRepo.CourseExists(courseId.Value))
                throw new InvalidOperationException($"Course with ID {courseId.Value} not found");

            // مش هعمل فلتر لفتره اكبر من 6 شهور
            // FIXED: Changed DateTime.Now to DateTime.UtcNow
            if (from.HasValue && (DateTime.UtcNow - from.Value).TotalDays > 180)
                throw new InvalidOperationException("Cannot filter data older than 6 monthes");

            //  السطر ده هو اللى هيعمل الفلتر فعلا هو اللى بعمل الكويرى فى  الدتا بيز 
            var attendances = await _attendanceRepo.FilterAttendances(studentId, courseId, from, to);


            return attendances.Select(a => new AttendanceDto
            {
                AttendanceId = a.AttendanceId,
                StudentId = a.StudentId,
                StudentName = a.Student?.FullName ?? string.Empty,
                CourseId = a.CourseId,
                CourseName = a.Course?.Name ?? string.Empty,
                Date = a.Date,
                Status = a.Status
            }).ToList();
        }

        public async Task<object> GetAttendanceSummaryAsync(int studentId, int? courseId = null)
        {
            // التاكد من انى الطالب موجود
            if (!await _attendanceRepo.StudentExists(studentId))
            {
                throw new InvalidOperationException($"Student with ID {studentId} not found.");
            }

            // التاكد انى الكورس موجود
            if (courseId.HasValue && !await _attendanceRepo.CourseExists(courseId.Value))
            {
                throw new InvalidOperationException($"Course with ID {courseId.Value} not found.");
            }

            // لازم الطالب يكون مسجل فى الكورس
            if (courseId.HasValue)
            {
                if (!await _attendanceRepo.IsStudentEnrolledInCourse(studentId, courseId.Value))
                    throw new InvalidOperationException("Student is not enrolled in this course.");
            }


            var attendances = await _attendanceRepo.FilterAttendances(studentId, courseId, null, null);
            var attendanceList = attendances.ToList();

            //لو مفيش حضور اصلا
            if (!attendanceList.Any())
            {
                return new
                {
                    StudentId = studentId,
                    CourseId = courseId,
                    TotalClasses = 0,
                    PresentCount = 0,
                    LateCount = 0,
                    AbsentCount = 0,
                    ExcusedCount = 0,
                    AttendancePercentage = 0
                };
            }


            var total = attendanceList.Count;
            var present = attendanceList.Count(a => a.Status == "Present");
            var late = attendanceList.Count(a => a.Status == "Late");
            var absent = attendanceList.Count(a => a.Status == "Absent");
            var excused = attendanceList.Count(a => a.Status == "Excused");

            double percentage = total == 0 ? 0 : (present * 100.0 / total);

            return new
            {
                StudentId = studentId,
                CourseId = courseId,
                TotalClasses = total,
                PresentCount = present,
                LateCount = late,
                AbsentCount = absent,
                ExcusedCount = excused,
                AttendancePercentage = Math.Round(percentage, 2)
            };
        }


        public async Task UpdateAttendanceAsync(int id, string status)
        {
            // Validate status
            if (!_validStatuses.Contains(status))
            {
                throw new ArgumentException($"Invalid status. Must be one of: {string.Join(", ", _validStatuses)}");
            }

            var existingAttendance = await _attendanceRepo.GetAttendanceById(id);
            if (existingAttendance == null)
            {
                throw new InvalidOperationException($"Attendance record with ID {id} not found");
            }
            //  No update after 48 hours
            if ((DateTime.UtcNow - existingAttendance.Date).TotalHours > 48)
            {
                throw new InvalidOperationException("Cannot update attendance after 48 hours");
            }

            // Prevent updating with same status
            if (existingAttendance.Status == status)
            {
                throw new InvalidOperationException("Status is already the same");
            }

            existingAttendance.Status = status;
            await _attendanceRepo.UpdateAttendance(existingAttendance);
        }

        public async Task DeleteAttendanceAsync(int id)
        {
            // Check attendance exists
            var attendance = await _attendanceRepo.GetAttendanceById(id);


            if (attendance == null)
            {
                throw new InvalidOperationException($"Attendance with ID {id} not found");
            }

            //Cannot delete records older than 7 days
            if (attendance.Date.Date < DateTime.Today.AddDays(-7))
            {
                throw new InvalidOperationException("You cannot delete attendance older than 7 days");
            }

            //Cannot delete attendance from the future
            if (attendance.Date.Date > DateTime.Today)
            {
                throw new InvalidOperationException("You cannot delete attendance for a future date");
            }


            var deleted = await _attendanceRepo.DeleteAttendance(id);
            if (!deleted)
            {
                throw new InvalidOperationException("Delete failed");
            }
        }

        // ================= INPUT SANITIZATION =================

        /// <summary>
        /// ENHANCEMENT: Sanitizes string inputs to prevent data pollution
        /// </summary>
        private void SanitizeMarkAttendanceDto(MarkAttendanceDto dto)
        {
            if (dto == null) return;

            // Trim whitespace from status
            if (!string.IsNullOrEmpty(dto.Status))
            {
                dto.Status = dto.Status.Trim();
            }
        }

        // ================= HELPER METHODS =================

        /// <summary>
        /// ENHANCEMENT: Safely calculates attendance percentage with bounds protection
        /// </summary>
        private double SafeCalculatePercentage(int count, int total)
        {
            // Protection against data corruption
            if (total <= 0) return 0;

            // Prevent count from exceeding total
            if (count > total)
            {
                _logger.LogWarning($"Count {count} exceeds total {total}, capping to total");
                count = total;
            }

            double percentage = (count * 100.0 / total);

            // Ensure result is within 0-100 range
            return Math.Min(Math.Max(percentage, 0), 100);
        }
    }
}