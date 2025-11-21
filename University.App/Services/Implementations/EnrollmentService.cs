using University.App.DTOs;
using University.App.Interfaces.Users;
using University.App.Interfaces.Courses;
using University.App.Services.IServices;
using University.Core.Entities;

namespace University.App.Services.Implementations
{
    public class EnrollmentService : IEnrollmentService
    {
        private readonly ICourseRepository _courseRepo;
      
        private readonly IEnrollmentRepository _enrollRepo;
        private readonly IStudentRepository _studentRepo;


        public EnrollmentService(ICourseRepository courseRepo,  IEnrollmentRepository enrollRepo, IStudentRepository studentRepo)
        {
            _courseRepo = courseRepo;
           
            _enrollRepo = enrollRepo;
            _studentRepo = studentRepo;
        }

        public async Task<CreateEnrollmentDTO?> AddEnrollCourse(CreateEnrollmentDTO enrollCourseDto)
        {
            //if (enrollCourseDto.StudentId == 0 || enrollCourseDto.CourseId == 0)
            //    throw new ArgumentException("StudentId and CourseId are required.");

            //var course = await _courseRepo.GetCourseById(enrollCourseDto.CourseId)
            //    ?? throw new InvalidOperationException("Course not found.");

            //// Get student info
            //var student = await _studentRepo.GetStudentByIdAsync(enrollCourseDto.StudentId)
            //    ?? throw new InvalidOperationException("Student not found.");

            //// Department restriction
            //await ValidateDepartmentRestriction(enrollCourseDto.StudentId, enrollCourseDto.CourseId);

            //// Already enrolled?
            //var existing = await _enrollRepo.GetEnrollmentByStudentAndCourse(
            //    enrollCourseDto.StudentId, enrollCourseDto.CourseId);
            //if (existing != null) throw new InvalidOperationException("Student already enrolled.");

            //await ValidateStudentCreditLimits(enrollCourseDto.StudentId, course.Credits);

            if (enrollCourseDto.StudentId == 0 || enrollCourseDto.CourseId == 0)
                throw new ArgumentException("StudentId and CourseId are required.");

            // 1️⃣ Check if course exists
            var course = await _courseRepo.GetCourseById(enrollCourseDto.CourseId);
            if (course == null)
                throw new InvalidOperationException("Course not found.");

            // 2️⃣ Check if student exists
            var student = await _studentRepo.GetStudentByIdAsync(enrollCourseDto.StudentId);
            if (student == null)
                throw new InvalidOperationException("Student not found.");

            // 3️⃣ Department restriction
            if (student.DepartmentId.HasValue)
            {
                var belongs = await _courseRepo.IsCourseBelongsToDepartment(enrollCourseDto.CourseId, student.DepartmentId.Value);
                if (!belongs)
                    throw new InvalidOperationException("Course not available for student's department.");
            }

            // 4️⃣ Already enrolled?
            var existingEnrollment = await _enrollRepo.GetEnrollmentByStudentAndCourse(
                enrollCourseDto.StudentId, enrollCourseDto.CourseId);
            if (existingEnrollment != null)
                throw new InvalidOperationException("Student already enrolled.");

            // 5️⃣ Credit limits
            var semesterStart = DateTime.UtcNow; // Replace with real semester logic
            var semesterCredits = await _courseRepo.GetStudentCurrentSemesterCredits(enrollCourseDto.StudentId, semesterStart);
            if (semesterCredits + course.Credits > 21)
                throw new InvalidOperationException("Semester credit limit exceeded.");

            var yearStart = DateTime.UtcNow; // Replace with real academic year logic
            var yearCredits = await _courseRepo.GetStudentCurrentYearCredits(enrollCourseDto.StudentId, yearStart);
            if (yearCredits + course.Credits > 36)
                throw new InvalidOperationException("Annual credit limit exceeded.");

            var enrollment = new Enrollment
            {
                StudentId = student.StudentId,
                CourseId = course.CourseId,
                EnrollmentDate = DateTime.UtcNow,
                Status = "Enrolled",
                FinalGrade = 0
            };

            await _enrollRepo.AddEnrollment(enrollment);

            return new CreateEnrollmentDTO
            {
                StudentId = student.StudentId,
                CourseId = course.CourseId,
                StudentName = student.FullName,
                CourseName = course.Name,
                CourseCode = course.CourseCode,
                CreditHours = course.Credits
            };
        }

        public async Task<bool> RemoveEnrollCourse(int enrollmentId) =>
            await _enrollRepo.RemoveEnrollment(enrollmentId);

        public async Task<IEnumerable<StudentEnrollmentDTO>> GetEnrollmentsByStudentId(int studentId)
        {
            // Fixed: Use enrollment repository instead of course repository
            var enrollments = await _enrollRepo.GetEnrollmentsByStudentId(studentId);

            return enrollments.Select(e => new StudentEnrollmentDTO
            {
                StudentName = e.Student?.FullName ?? "Unknown",
                CourseName = e.Course?.Name ?? "Unknown",
                CourseCode = e.Course?.CourseCode ?? "Unknown",
                CreditHours = e.Course?.Credits ?? 0,
                DepartmentName = e.Course?.Department?.Name ?? "Unknown"
            });
        }

        public async Task<IEnumerable<StudentEnrollmentDTO>> GetEnrollmentStudentsByCourseID(int courseId)
        {
            var course = await _courseRepo.GetCourseById(courseId);
            if (course == null || course.Enrollments == null)
                return new List<StudentEnrollmentDTO>();

            return course.Enrollments.Select(e => new StudentEnrollmentDTO
            {
                StudentName = e.Student?.FullName ?? "Unknown",
                CourseName = e.Course?.Name ?? course.Name,
                CourseCode = e.Course?.CourseCode ?? course.CourseCode,
                CreditHours = e.Course?.Credits ?? course.Credits,
                DepartmentName = e.Course?.Department?.Name ?? course.Department?.Name ?? "Unknown"
            });
        }

        // ================= BUSINESS RULES VALIDATION =================
        private async Task ValidateDepartmentRestriction(int studentId, int courseId)
        {
            var student = await _studentRepo.GetStudentByIdAsync(studentId)
                ?? throw new InvalidOperationException("Student not found.");
            if (!student.DepartmentId.HasValue)
                throw new InvalidOperationException("Student has no department.");

            var belongs = await _courseRepo.IsCourseBelongsToDepartment(courseId, student.DepartmentId.Value);
            if (!belongs)
                throw new InvalidOperationException("Course not available for student's department.");
        }

        private async Task ValidateStudentCreditLimits(int studentId, int newCourseCredits)
        {
            var semesterStart = DateTime.UtcNow; // placeholder: use real semester logic
            var semesterCredits = await _courseRepo.GetStudentCurrentSemesterCredits(studentId, semesterStart);
            if (semesterCredits + newCourseCredits > 21)
                throw new InvalidOperationException("Semester credit limit exceeded.");

            var yearStart = DateTime.UtcNow; // placeholder: use real academic year logic
            var yearCredits = await _courseRepo.GetStudentCurrentYearCredits(studentId, yearStart);
            if (yearCredits + newCourseCredits > 36)
                throw new InvalidOperationException("Annual credit limit exceeded.");
        }
    }
}