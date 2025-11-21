using University.App.DTOs;
using University.App.Interfaces;
using University.App.Interfaces.Courses;
using University.App.Interfaces.Users;
using University.App.Services.IServices;
using University.Core.Entities;

namespace University.App.Services.Implementations
{
    public class EnrollmentService : IEnrollmentService
    {
        private readonly ICourseRepository _courseRepo;

        private readonly IEnrollmentRepository _enrollRepo;
        private readonly IStudentRepository _studentRepo;
        private readonly ISubmissionRepository _submissionRepo;


        public EnrollmentService(ICourseRepository courseRepo, IEnrollmentRepository enrollRepo, IStudentRepository studentRepo, ISubmissionRepository submissionRepo)
        {
            _courseRepo = courseRepo;

            _enrollRepo = enrollRepo;
            _studentRepo = studentRepo;
            _submissionRepo = submissionRepo;
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

        public async Task<bool> RemoveEnrollCourse(int enrollmentId) => await _enrollRepo.RemoveEnrollment(enrollmentId);

        public async Task<IEnumerable<StudentEnrollmentDTO>> GetEnrollmentsByStudentId(int studentId)
        {
            // Fixed: Use enrollment repository instead of course repository
            var enrollments = await _enrollRepo.GetEnrollmentsByStudentId(studentId);

            return enrollments.Select(e => new StudentEnrollmentDTO
            {

                EnrollmentId = e.EnrollmentId, // ADD THIS
                StudentName = e.Student?.FullName ?? "Unknown",
                CourseName = e.Course?.Name ?? "Unknown (Course Deleted)", // Handle deleted course
                CourseCode = e.Course?.CourseCode ?? "N/A", // Handle deleted course
                CreditHours = e.Course?.Credits ?? 0,
                DepartmentName = e.Course?.Department?.Name ?? "Unknown",
                CourseStatus = e.Course?.IsDeleted == true ? "Deleted" : "Active", // ADD THIS
                EnrollmentStatus = e.Status
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

        // ================= NEW METHOD: CHECK COURSE COMPLETION =================
        public async Task<CourseCompletionStatusDTO> CheckCourseCompletion(int studentId, int courseId)
        {
            if (studentId <= 0)
                throw new ArgumentException("Invalid student ID.");

            if (courseId <= 0)
                throw new ArgumentException("Invalid course ID.");

            // Get enrollment with course details
            var enrollment = await _enrollRepo.GetEnrollmentWithCourseDetails(studentId, courseId);
            if (enrollment == null)
                throw new InvalidOperationException("Enrollment not found.");

            var course = enrollment.Course;
            if (course == null)
                throw new InvalidOperationException("Course not found.");

            // Get all exams for this course
            var courseExams = course.Exams.Where(e => !e.IsDeleted).ToList();

            if (courseExams.Count == 0)
                throw new InvalidOperationException("This course has no exams yet.");

            // Get all submissions for this student in this course
            var submissions = await _submissionRepo.GetStudentSubmissionsAsync(studentId);
            var submittedExamIds = submissions
                .Where(s => s.SubmittedAt.HasValue)
                .Select(s => s.ExamId)
                .ToHashSet();

            // Build exam details list
            var examDetails = new List<ExamCompletionDTO>();
            decimal totalScore = 0;
            decimal totalPossiblePoints = 0;
            int submittedCount = 0;

            foreach (var exam in courseExams)
            {
                var submission = submissions.FirstOrDefault(s => s.ExamId == exam.ExamId);
                bool isSubmitted = submission?.SubmittedAt.HasValue ?? false;

                if (isSubmitted)
                {
                    submittedCount++;
                    decimal score = submission!.Score ?? 0;
                    decimal percentage = exam.TotalPoints > 0
                        ? (score / exam.TotalPoints) * 100
                        : 0;

                    totalScore += score;
                    totalPossiblePoints += exam.TotalPoints;

                    examDetails.Add(new ExamCompletionDTO
                    {
                        ExamId = exam.ExamId,
                        ExamTitle = exam.Title,
                        Score = score,
                        TotalPoints = exam.TotalPoints,
                        Percentage = Math.Round(percentage, 2),
                        IsPassed = percentage >= 60,
                        IsSubmitted = true,
                        SubmittedAt = submission.SubmittedAt
                    });
                }
                else
                {
                    examDetails.Add(new ExamCompletionDTO
                    {
                        ExamId = exam.ExamId,
                        ExamTitle = exam.Title,
                        Score = 0,
                        TotalPoints = exam.TotalPoints,
                        Percentage = 0,
                        IsPassed = false,
                        IsSubmitted = false,
                        SubmittedAt = null
                    });
                }
            }

            // Calculate average score
            decimal? averageScore = totalPossiblePoints > 0
                ? Math.Round((totalScore / totalPossiblePoints) * 100, 2)
                : null;

            // Determine completion status based on average
            bool isCompleted = submittedCount == courseExams.Count && averageScore >= 60;
            string status;
            string? gradeLetter = null;

            if (submittedCount < courseExams.Count)
            {
                status = "In Progress";
            }
            else if (averageScore >= 60)
            {
                status = "Completed";
                gradeLetter = CalculateGradeLetter(averageScore.Value);

                // Update enrollment status in database
                await _enrollRepo.UpdateEnrollmentCompletion(
                    enrollment.EnrollmentId,
                    "Completed",
                    averageScore,
                    gradeLetter);
            }
            else
            {
                status = "Failed";
                gradeLetter = "F";

                // Update enrollment status
                await _enrollRepo.UpdateEnrollmentCompletion(
                    enrollment.EnrollmentId,
                    "Failed",
                    averageScore,
                    gradeLetter);
            }

            return new CourseCompletionStatusDTO
            {
                EnrollmentId = enrollment.EnrollmentId,
                StudentId = studentId,
                StudentName = enrollment.Student?.FullName ?? "Unknown",
                CourseId = courseId,
                CourseName = course.Name,
                CourseCode = course.CourseCode,
                IsCompleted = isCompleted,
                TotalExams = courseExams.Count,
                SubmittedExams = submittedCount,
                AverageScore = averageScore,
                FinalGrade = averageScore,
                GradeLetter = gradeLetter,
                Status = status,
                ExamDetails = examDetails.OrderBy(e => e.ExamId).ToList()
            };
        }

        // Helper method to calculate grade letter
        private string CalculateGradeLetter(decimal percentage)
        {
            if (percentage >= 97) return "A+";
            if (percentage >= 93) return "A";
            if (percentage >= 90) return "A-";
            if (percentage >= 87) return "B+";
            if (percentage >= 83) return "B";
            if (percentage >= 80) return "B-";
            if (percentage >= 77) return "C+";
            if (percentage >= 73) return "C";
            if (percentage >= 70) return "C-";
            if (percentage >= 67) return "D+";
            if (percentage >= 63) return "D";
            if (percentage >= 60) return "D-";
            return "F";
        }
    }

}
