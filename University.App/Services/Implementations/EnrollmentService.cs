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


        public EnrollmentService(ICourseRepository courseRepo, IEnrollmentRepository enrollRepo, IStudentRepository studentRepo)
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

            // BUSINESS LOGIC: Prevent enrolling in deleted courses
            if (course.IsDeleted)
                throw new InvalidOperationException("Cannot enroll in a deleted or inactive course.");

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
            // FIXED: Use enrollment repository and map to updated DTO with all database fields
            var enrollments = await _enrollRepo.GetEnrollmentsByStudentId(studentId);

            return enrollments.Select(e => new StudentEnrollmentDTO
            {
                EnrollmentId = e.EnrollmentId,
                StudentName = e.Student?.FullName ?? "Unknown",
                CourseName = e.Course?.Name ?? "Unknown",
                CourseCode = e.Course?.CourseCode ?? "Unknown",
                CreditHours = e.Course?.Credits ?? 0,
                DepartmentName = e.Course?.Department?.Name ?? "Unknown",
                Status = e.Status,
                FinalGrade = e.FinalGrade,
                GradeLetter = e.GradeLetter,
                EnrollmentDate = e.EnrollmentDate,
                IsCourseActive = e.Course?.IsDeleted == false
            });
        }

        public async Task<IEnumerable<StudentEnrollmentDTO>> GetEnrollmentStudentsByCourseID(int courseId)
        {
            var course = await _courseRepo.GetCourseById(courseId);
            if (course == null || course.Enrollments == null)
                return new List<StudentEnrollmentDTO>();

            return course.Enrollments.Select(e => new StudentEnrollmentDTO
            {
                EnrollmentId = e.EnrollmentId,
                StudentName = e.Student?.FullName ?? "Unknown",
                CourseName = e.Course?.Name ?? course.Name,
                CourseCode = e.Course?.CourseCode ?? course.CourseCode,
                CreditHours = e.Course?.Credits ?? course.Credits,
                DepartmentName = e.Course?.Department?.Name ?? course.Department?.Name ?? "Unknown",
                Status = e.Status,
                FinalGrade = e.FinalGrade,
                GradeLetter = e.GradeLetter,
                EnrollmentDate = e.EnrollmentDate,
                IsCourseActive = e.Course?.IsDeleted == false
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

        // ================= GRADE CALCULATION =================

        /// <summary>
        /// Calculate student's final grade for a course based on all exam scores
        /// NEW: Calculates grade, determines letter grade, and updates enrollment
        /// </summary>
        public async Task<StudentEnrollmentDTO?> CalculateAndUpdateStudentCourseGradeAsync(int studentId, int courseId)
        {
            if (studentId <= 0 || courseId <= 0)
                throw new ArgumentException("Invalid student ID or course ID.");

            var enrollment = await _enrollRepo.GetEnrollmentWithCourseDetails(studentId, courseId);
            if (enrollment == null)
                throw new InvalidOperationException("Enrollment not found.");

            var course = enrollment.Course;
            if (course == null)
                throw new InvalidOperationException("Course not found.");

            // Get all exams for the course
            var exams = course.Exams?.Where(e => !e.IsDeleted).ToList() ?? new List<Exam>();
            if (!exams.Any())
            {
                // No exams - cannot calculate grade
                return new StudentEnrollmentDTO
                {
                    EnrollmentId = enrollment.EnrollmentId,
                    StudentName = enrollment.Student?.FullName ?? "",
                    CourseName = course.Name,
                    CourseCode = course.CourseCode,
                    CreditHours = course.Credits,
                    DepartmentName = course.Department?.Name ?? "",
                    Status = enrollment.Status,
                    FinalGrade = null,
                    GradeLetter = null,
                    EnrollmentDate = enrollment.EnrollmentDate,
                    IsCourseActive = !course.IsDeleted
                };
            }

            // Calculate total score from all exam submissions
            decimal totalScore = 0;
            decimal totalPossiblePoints = exams.Sum(e => e.TotalPoints);
            int completedExams = 0;

            foreach (var exam in exams)
            {
                var submission = exam.ExamSubmissions?
                    .FirstOrDefault(s => s.StudentId == studentId && s.SubmittedAt.HasValue && !s.IsDeleted);

                if (submission != null)
                {
                    totalScore += submission.Score ?? 0;
                    completedExams++;
                }
            }

            // Check if all exams are completed
            bool allExamsCompleted = completedExams == exams.Count && exams.Count > 0;

            // Calculate final grade as percentage
            decimal? finalGrade = totalPossiblePoints > 0 ? (totalScore / totalPossiblePoints) * 100 : null;
            string? gradeLetter = finalGrade.HasValue ? CalculateGradeLetter(finalGrade.Value) : null;

            // Update enrollment status
            string status = allExamsCompleted ? "Completed" : "Enrolled";

            await _enrollRepo.UpdateEnrollmentCompletion(
                enrollment.EnrollmentId,
                status,
                finalGrade,
                gradeLetter
            );

            return new StudentEnrollmentDTO
            {
                EnrollmentId = enrollment.EnrollmentId,
                StudentName = enrollment.Student?.FullName ?? "",
                CourseName = course.Name,
                CourseCode = course.CourseCode,
                CreditHours = course.Credits,
                DepartmentName = course.Department?.Name ?? "",
                Status = status,
                FinalGrade = finalGrade,
                GradeLetter = gradeLetter,
                EnrollmentDate = enrollment.EnrollmentDate,
                IsCourseActive = !course.IsDeleted
            };
        }

        /// <summary>
        /// Calculate letter grade based on percentage
        /// Standard grading scale: A+ (97-100), A (93-96), A- (90-92), etc.
        /// </summary>
        private string CalculateGradeLetter(decimal percentage)
        {
            return percentage switch
            {
                >= 97 => "A+",
                >= 93 => "A",
                >= 90 => "A-",
                >= 87 => "B+",
                >= 83 => "B",
                >= 80 => "B-",
                >= 77 => "C+",
                >= 73 => "C",
                >= 70 => "C-",
                >= 67 => "D+",
                >= 63 => "D",
                >= 60 => "D-",
                _ => "F"
            };
        }

        // ================= SOFT DELETE & RESTORE =================

        public async Task<bool> DeleteEnrollmentAsync(int enrollmentId)
        {
            if (enrollmentId <= 0)
                throw new ArgumentException("Invalid enrollment ID.");

            return await _enrollRepo.DeleteEnrollmentAsync(enrollmentId);
        }

        public async Task<bool> RestoreEnrollmentAsync(int enrollmentId)
        {
            if (enrollmentId <= 0)
                throw new ArgumentException("Invalid enrollment ID.");

            return await _enrollRepo.RestoreEnrollmentAsync(enrollmentId);
        }

        public async Task<IEnumerable<StudentEnrollmentDTO>> GetAllEnrollmentsIncludingDeletedAsync()
        {
            var enrollments = await _enrollRepo.GetAllEnrollmentsIncludingDeletedAsync();

            return enrollments.Select(e => new StudentEnrollmentDTO
            {
                EnrollmentId = e.EnrollmentId,
                StudentName = e.Student?.FullName ?? "Unknown",
                CourseName = e.Course?.Name ?? "Unknown",
                CourseCode = e.Course?.CourseCode ?? "Unknown",
                CreditHours = e.Course?.Credits ?? 0,
                DepartmentName = e.Course?.Department?.Name ?? "Unknown",
                Status = e.Status,
                FinalGrade = e.FinalGrade,
                GradeLetter = e.GradeLetter,
                EnrollmentDate = e.EnrollmentDate,
                IsCourseActive = e.Course?.IsDeleted == false
            });
        }
    }
}