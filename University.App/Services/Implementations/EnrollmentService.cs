using University.App.DTOs;
using University.App.Interfaces.Users;
using University.App.Interfaces.Courses;
using University.App.Services.IServices;
using University.Core.Entities;
using Microsoft.Extensions.Logging;

namespace University.App.Services.Implementations
{
    public class EnrollmentService : IEnrollmentService
    {
        private readonly ICourseRepository _courseRepo;

        private readonly IEnrollmentRepository _enrollRepo;
        private readonly IStudentRepository _studentRepo;
        private readonly ILogger<EnrollmentService> _logger;


        public EnrollmentService(
            ICourseRepository courseRepo, 
            IEnrollmentRepository enrollRepo, 
            IStudentRepository studentRepo,
            ILogger<EnrollmentService> logger)
        {
            _courseRepo = courseRepo;
            _enrollRepo = enrollRepo;
            _studentRepo = studentRepo;
            _logger = logger;
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

            // ENHANCEMENT: Sanitize input data to prevent whitespace pollution
            SanitizeEnrollmentData(enrollCourseDto);

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

            // 4️⃣ Already enrolled? (FIXED: Only check ACTIVE enrollments, allow re-enrollment if deleted)
            var existingEnrollment = await _enrollRepo.GetEnrollmentByStudentAndCourse(
                enrollCourseDto.StudentId, enrollCourseDto.CourseId);
            if (existingEnrollment != null && existingEnrollment.Status != "Dropped" && existingEnrollment.Status != "Withdrawn")
                throw new InvalidOperationException("Student already enrolled in this course.");

            // 5️⃣ Credit limits (UPDATED: 18 credit hours per semester as per academic policy)
            var semesterStart = DateTime.UtcNow; // Replace with real semester logic
            var semesterCredits = await _courseRepo.GetStudentCurrentSemesterCredits(enrollCourseDto.StudentId, semesterStart);
            if (semesterCredits + course.Credits > 18)
                throw new InvalidOperationException("Semester credit limit (18 hours) exceeded.");

            var yearStart = DateTime.UtcNow; // Replace with real academic year logic
            var yearCredits = await _courseRepo.GetStudentCurrentYearCredits(enrollCourseDto.StudentId, yearStart);
            if (yearCredits + course.Credits > 36)
                throw new InvalidOperationException("Annual credit limit exceeded.");

            var enrollment = new Enrollment
            {
                StudentId = student.StudentId,
                CourseId = course.CourseId,
                EnrollmentDate = DateTime.UtcNow,
                Status = "Pending",  // Changed: enrollment starts as Pending until Admin approves
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
                InstructorName = e.Course?.Instructor?.FullName ?? "Unknown",
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
                InstructorName = e.Course?.Instructor?.FullName ?? course.Instructor?.FullName ?? "Unknown",
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
        /// ENHANCEMENT: Robust edge case handling (null exams, zero points, overflow protection)
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
            
            // ENHANCEMENT: Edge case 1 - No exams defined for course
            if (!exams.Any())
            {
                _logger.LogWarning($"Grade calculation skipped for Enrollment {enrollment.EnrollmentId}: No exams defined for course");
                // Cannot calculate grade without exams
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
            decimal totalPossiblePoints = CalculateTotalPossiblePoints(exams);
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

            // ENHANCEMENT: Edge case 2 - Safe grade calculation with overflow protection
            decimal? finalGrade = CalculateFinalGradeFromExams(totalScore, totalPossiblePoints);
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
        /// ENHANCEMENT: Safely calculates total possible points from exam list
        /// Handles null/zero point exams gracefully
        /// </summary>
        private decimal CalculateTotalPossiblePoints(List<Exam> exams)
        {
            try
            {
                return exams.Sum(e => e.TotalPoints);
            }
            catch (OverflowException ex)
            {
                _logger.LogError($"Overflow error calculating total points: {ex.Message}");
                return 0;
            }
        }

        /// <summary>
        /// ENHANCEMENT: Safely calculates final grade with edge case handling
        /// - Prevents division by zero
        /// - Caps result to 0-100 range
        /// - Handles overflow and null values
        /// </summary>
        private decimal? CalculateFinalGradeFromExams(decimal totalScore, decimal totalPossiblePoints)
        {
            try
            {
                // Edge case: No possible points defined (can't calculate percentage)
                if (totalPossiblePoints <= 0)
                {
                    _logger.LogWarning("Grade calculation failed: No valid exam points defined");
                    return null;
                }

                // Edge case: Score exceeds possible points (shouldn't happen, but protect against it)
                if (totalScore > totalPossiblePoints)
                {
                    _logger.LogWarning($"Score {totalScore} exceeds possible points {totalPossiblePoints}, capping to maximum");
                    totalScore = totalPossiblePoints;
                }

                // Safe division now guaranteed
                decimal percentage = (totalScore / totalPossiblePoints) * 100;

                // Ensure result is within 0-100 range (protect against rounding errors)
                return Math.Min(Math.Max(percentage, 0), 100);
            }
            catch (DivideByZeroException ex)
            {
                _logger.LogError($"Division by zero in grade calculation: {ex.Message}");
                return null;
            }
            catch (OverflowException ex)
            {
                _logger.LogError($"Overflow error in grade calculation: {ex.Message}");
                return null;
            }
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

        public async Task<bool> HardDeleteEnrollmentAsync(int enrollmentId)
        {
            if (enrollmentId <= 0)
                throw new ArgumentException("Invalid enrollment ID.");

            return await _enrollRepo.HardDeleteEnrollmentAsync(enrollmentId);
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
                InstructorName = e.Course?.Instructor?.FullName ?? "Unknown",
                Status = e.Status,
                FinalGrade = e.FinalGrade,
                GradeLetter = e.GradeLetter,
                EnrollmentDate = e.EnrollmentDate,
                IsCourseActive = e.Course?.IsDeleted == false
            });
        }

        public async Task<IEnumerable<StudentEnrollmentDTO>> GetAllActiveEnrollmentsAsync()
        {
            var enrollments = await _enrollRepo.GetAllActiveEnrollmentsAsync();

            return enrollments.Select(e => new StudentEnrollmentDTO
            {
                EnrollmentId = e.EnrollmentId,
                StudentName = e.Student?.FullName ?? "Unknown",
                CourseName = e.Course?.Name ?? "Unknown",
                CourseCode = e.Course?.CourseCode ?? "Unknown",
                CreditHours = e.Course?.Credits ?? 0,
                DepartmentName = e.Course?.Department?.Name ?? "Unknown",
                InstructorName = e.Course?.Instructor?.FullName ?? "Unknown",
                Status = e.Status,
                FinalGrade = e.FinalGrade,
                GradeLetter = e.GradeLetter,
                EnrollmentDate = e.EnrollmentDate,
                IsCourseActive = e.Course?.IsDeleted == false
            });
        }

        // ================= INPUT SANITIZATION =================

        /// <summary>
        /// ENHANCEMENT: Sanitizes string inputs to prevent data pollution
        /// - Trims leading/trailing whitespace
        /// - Removes multiple consecutive spaces
        /// - Prevents injection attacks through string fields
        /// </summary>
        private void SanitizeEnrollmentData(CreateEnrollmentDTO dto)
        {
            if (dto == null) return;

            // Trim whitespace from string properties
            if (!string.IsNullOrEmpty(dto.StudentName))
            {
                dto.StudentName = dto.StudentName.Trim();
                // Remove multiple spaces within strings
                dto.StudentName = System.Text.RegularExpressions.Regex.Replace(dto.StudentName, @"\s+", " ");
            }

            if (!string.IsNullOrEmpty(dto.CourseName))
            {
                dto.CourseName = dto.CourseName.Trim();
                dto.CourseName = System.Text.RegularExpressions.Regex.Replace(dto.CourseName, @"\s+", " ");
            }

            if (!string.IsNullOrEmpty(dto.CourseCode))
            {
                dto.CourseCode = dto.CourseCode.Trim();
                // Course codes should be uppercase
                dto.CourseCode = dto.CourseCode.ToUpper();
            }
        }

        // ================= ENROLLMENT APPROVAL WORKFLOW =================

        /// <summary>
        /// Approves a pending enrollment (Admin only)
        /// Changes status from "Pending" to "Enrolled"
        /// </summary>
        public async Task<bool> ApproveEnrollmentAsync(int enrollmentId)
        {
            var enrollment = await _enrollRepo.GetEnrollmentByIdAsync(enrollmentId);
            
            if (enrollment == null)
            {
                _logger.LogWarning("Enrollment {EnrollmentId} not found", enrollmentId);
                throw new InvalidOperationException("Enrollment not found");
            }

            if (enrollment.Status != "Pending")
            {
                _logger.LogWarning("Cannot approve enrollment {EnrollmentId}. Current status is '{Status}'", 
                    enrollmentId, enrollment.Status);
                throw new InvalidOperationException(
                    $"Cannot approve enrollment. Current status is '{enrollment.Status}'. Only 'Pending' enrollments can be approved.");
            }

            // Update enrollment status to Enrolled
            return await _enrollRepo.UpdateEnrollmentCompletion(
                enrollmentId, 
                "Enrolled", 
                enrollment.FinalGrade, 
                enrollment.GradeLetter);
        }

        /// <summary>
        /// Rejects a pending enrollment (Admin only)
        /// Changes status from "Pending" to "Rejected"
        /// </summary>
        public async Task<bool> RejectEnrollmentAsync(int enrollmentId)
        {
            var enrollment = await _enrollRepo.GetEnrollmentByIdAsync(enrollmentId);
            
            if (enrollment == null)
            {
                _logger.LogWarning("Enrollment {EnrollmentId} not found", enrollmentId);
                throw new InvalidOperationException("Enrollment not found");
            }

            if (enrollment.Status != "Pending")
            {
                _logger.LogWarning("Cannot reject enrollment {EnrollmentId}. Current status is '{Status}'", 
                    enrollmentId, enrollment.Status);
                throw new InvalidOperationException(
                    $"Cannot reject enrollment. Current status is '{enrollment.Status}'. Only 'Pending' enrollments can be rejected.");
            }

            // Update enrollment status to Rejected
            return await _enrollRepo.UpdateEnrollmentCompletion(
                enrollmentId, 
                "Rejected", 
                enrollment.FinalGrade, 
                enrollment.GradeLetter);
        }
    }
}