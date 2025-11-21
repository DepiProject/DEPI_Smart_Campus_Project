//using University.App.DTOs;
//using University.App.Interfaces;
//using University.App.Interfaces.Courses;
//using University.App.Interfaces.Users;
//using University.App.Services.IServices;
//using University.Core.Entities;

//namespace University.App.Services.Implementations
//{
//    public class CourseService : ICourseService 
//    {
//        private readonly ICourseRepository _courseRepo;

//        private readonly IInstructorRepository _instructorRepo;
//        private readonly IStudentRepository _studentRepo;

//        // BUSINESS RULES CONSTANTS
//        private const int MAX_COURSE_CAPACITY = 50;
//        private const int MIN_STUDENTS_TO_RUN_COURSE = 5;
//        private const int MAX_COURSES_PER_INSTRUCTOR = 2;
//        private const int MAX_CREDIT_HOURS_PER_INSTRUCTOR = 12;
//        private const bool ENFORCE_DEPARTMENT_RESTRICTION = true;

//        public CourseService(ICourseRepository courseRepo, IStudentRepository studentRepo, IInstructorRepository instructorRepo)
//        {
//            _courseRepo = courseRepo;
//            _studentRepo = studentRepo;
//            _instructorRepo = instructorRepo;
//        }

//        // ================= COURSE MANAGEMENT =================

//        public async Task<IEnumerable<CourseDTO>> GetAllCourses()
//        {
//            var courses = await _courseRepo.GetAllCourses();
//            return courses.Select(c => new CourseDTO
//            {
//                Id = c.CourseId,
//                Name = c.Name,
//                CreditHours = c.Credits,
//                InstructorId = c.InstructorId ?? 0
//            });
//        }

//        public async Task<CourseDTO?> GetCourseById(int id)
//        {
//            var course = await _courseRepo.GetCourseById(id);
//            if (course == null) return null;

//            return new CourseDTO
//            {
//                Id=course.CourseId,
//                Name = course.Name,
//                CreditHours = course.Credits,
//                InstructorId = course.InstructorId ?? 0
//            };
//        }

//        public async Task<CreateCourseDTO?> AddCourse(CreateCourseDTO courseDto)
//        {
//            var instructor = await _instructorRepo.GetInstructorByIdAsync(courseDto.InstructorId)
//                ?? throw new InvalidOperationException($"Instructor {courseDto.InstructorId} not found.");

//            await ValidateInstructorTeachingLoad(courseDto.InstructorId, courseDto.CreditHours);

//            if ((await _courseRepo.GetAllCourses()).Any(c => c.CourseCode == courseDto.CourseCode))
//                throw new InvalidOperationException($"Course code '{courseDto.CourseCode}' already exists.");

//            var course = new Course
//            {
//                CourseCode = courseDto.CourseCode,
//                Name = courseDto.Name,
//                Credits = courseDto.CreditHours,
//                InstructorId = courseDto.InstructorId,
//                DepartmentId = courseDto.DepartmentId,
//                IsDeleted = false
//            };

//            await _courseRepo.AddCourse(course);
//            return courseDto;
//        }

//        public async Task<CourseDTO?> UpdateCourse(int id, CourseDTO courseDto)
//        {
//            var courseExist = await _courseRepo.GetCourseById(id);
//            if (courseExist == null) return null;

//            var instructor = await _instructorRepo.GetInstructorByIdAsync(courseDto.InstructorId)
//                ?? throw new InvalidOperationException($"Instructor {courseDto.InstructorId} not found.");

//            if (courseExist.InstructorId != courseDto.InstructorId)
//                await ValidateInstructorTeachingLoad(courseDto.InstructorId, courseDto.CreditHours, id);

//            courseExist.Name = courseDto.Name;
//            courseExist.Credits = courseDto.CreditHours;
//            courseExist.InstructorId = courseDto.InstructorId;

//            var updatedCourse = await _courseRepo.UpdateCourse(courseExist);
//            if (updatedCourse == null) return null;

//            return new CourseDTO
//            {
//                Name = updatedCourse.Name,
//                CreditHours = updatedCourse.Credits,
//                InstructorId = updatedCourse.InstructorId ?? 0
//            };
//        }

//        public async Task<bool> DeleteCourse(int id) => await _courseRepo.DeleteCourse(id);
//        public async Task<bool> RestoreCourse(int id) => await _courseRepo.RestoreCourse(id);
//        public async Task<bool> PermanentlyDeleteCourse(int id) => await _courseRepo.PermanentlyDeleteCourse(id);

//        public async Task<IEnumerable<CourseDTO>> GetAllCoursesIncludingDeleted()
//        {
//            var courses = await _courseRepo.GetAllCoursesIncludingDeleted();
//            return courses.Select(c => new CourseDTO
//            {
//                Id=c.CourseId,
//                Name = c.Name,
//                CreditHours = c.Credits,
//                InstructorId = c.InstructorId ?? 0
//            });
//        }

//        public async Task<IEnumerable<EnrollCourseDTO>> GetAllCoursesByDepartmentID(int departmentId)
//        {
//            var courses = await _courseRepo.GetAllCoursesByDepartmentId(departmentId);
//            return courses.Select(c => new EnrollCourseDTO
//            {
//                id=c.CourseId,
//                CourseName = c.Name,
//                CreditHours = c.Credits,
//                CourseCode = c.CourseCode,
//                DepartmentName = c.Department?.Name ?? "Unknown"
//            });
//        }

//        public async Task<IEnumerable<EnrollCourseDTO>> GetAvailableCoursesForStudent(int studentId)
//        {
//            var student = await _studentRepo.GetStudentByIdAsync(studentId)
//                ?? throw new InvalidOperationException("Student not found.");
//            if (!student.DepartmentId.HasValue)
//                throw new InvalidOperationException("Student has no department.");

//            var courses = await _courseRepo.GetCoursesByDepartmentForStudent(student.DepartmentId.Value);

//            return courses.Select(c => new EnrollCourseDTO
//            {
//                id=c.CourseId,
//                CourseName = c.Name,
//                CreditHours = c.Credits,
//                CourseCode = c.CourseCode,
//                DepartmentName = c.Department?.Name ?? "Unknown"
//            });
//        }

//        public async Task<IEnumerable<InstructorCoursesDTO>> GetCoursesByInstructorId(int instructorId)
//        {
//            var courses = await _courseRepo.GetCoursesByInstructorId(instructorId);
//            return courses.Select(c => new InstructorCoursesDTO
//            {

//                CourseName = c.Name,
//                CourseCode = c.CourseCode,
//                DepartmentName = c.Department?.Name ?? "Unknown",
//                CreditHours = c.Credits,
//                InstructorName = c.Instructor?.FullName ?? "Unknown"
//            });
//        }

//        public async Task<bool> CanCourseRun(int courseId)
//        {
//            var enrolledCount = await _courseRepo.GetActiveEnrollmentCountByCourseId(courseId);
//            return enrolledCount >= MIN_STUDENTS_TO_RUN_COURSE;
//        }

//        // ================= BUSINESS RULES VALIDATION =================
//        private async Task ValidateInstructorTeachingLoad(int instructorId, int newCourseCredits, int? excludeCourseId = null)
//        {
//            var courseCount = await _courseRepo.GetInstructorActiveCourseCount(instructorId);
//            if (excludeCourseId.HasValue)
//            {
//                var currentCourse = await _courseRepo.GetCourseById(excludeCourseId.Value);
//                if (currentCourse?.InstructorId == instructorId) courseCount--;
//            }
//            if (courseCount >= MAX_COURSES_PER_INSTRUCTOR)
//                throw new InvalidOperationException($"Instructor teaching max courses ({MAX_COURSES_PER_INSTRUCTOR}).");

//            var totalHours = await _courseRepo.GetInstructorTotalCreditHours(instructorId);
//            if (excludeCourseId.HasValue)
//            {
//                var currentCourse = await _courseRepo.GetCourseById(excludeCourseId.Value);
//                if (currentCourse?.InstructorId == instructorId) totalHours -= currentCourse.Credits;
//            }
//            if (totalHours + newCourseCredits > MAX_CREDIT_HOURS_PER_INSTRUCTOR)
//                throw new InvalidOperationException("Instructor exceeds max teaching hours.");
//        }
//    }
//}
using University.App.DTOs;
using University.App.Interfaces;
using University.App.Interfaces.Courses;
using University.App.Interfaces.Users;
using University.App.Services.IServices;
using University.Core.Entities;

namespace University.App.Services.Implementations
{
    public class CourseService : ICourseService
    {
        private readonly ICourseRepository _courseRepo;

        private readonly IInstructorRepository _instructorRepo;
        private readonly IStudentRepository _studentRepo;

        // BUSINESS RULES CONSTANTS
        private const int MAX_COURSE_CAPACITY = 50;
        private const int MIN_STUDENTS_TO_RUN_COURSE = 5;
        private const int MAX_COURSES_PER_INSTRUCTOR = 2;
        private const int MAX_CREDIT_HOURS_PER_INSTRUCTOR = 12;
        private const bool ENFORCE_DEPARTMENT_RESTRICTION = true;

        public CourseService(ICourseRepository courseRepo, IStudentRepository studentRepo, IInstructorRepository instructorRepo)
        {
            _courseRepo = courseRepo;
            _studentRepo = studentRepo;
            _instructorRepo = instructorRepo;
        }

        // ================= COURSE MANAGEMENT =================

        public async Task<IEnumerable<CourseDTO>> GetAllCourses()
        {
            var courses = await _courseRepo.GetAllCourses();
            return courses.Select(c => new CourseDTO
            {
                Id = c.CourseId,
                Name = c.Name,
                CreditHours = c.Credits,
                InstructorId = c.InstructorId ?? 0
            });
        }

        public async Task<CourseDTO?> GetCourseById(int id)
        {
            var course = await _courseRepo.GetCourseById(id);
            if (course == null) return null;

            return new CourseDTO
            {
                Id = course.CourseId,
                CourseCode = course.CourseCode,
                Name = course.Name,
                CreditHours = course.Credits,
                InstructorId = course.InstructorId ?? 0,
                DepartmentName = course.Department?.Name ?? "Unknown"
            };
        }

        public async Task<CreateCourseDTO?> AddCourse(CreateCourseDTO courseDto)
        {
            var instructor = await _instructorRepo.GetInstructorByIdAsync(courseDto.InstructorId)
                ?? throw new InvalidOperationException($"Instructor {courseDto.InstructorId} not found.");

            await ValidateInstructorTeachingLoad(courseDto.InstructorId, courseDto.CreditHours);

            if ((await _courseRepo.GetAllCourses()).Any(c => c.CourseCode == courseDto.CourseCode))
                throw new InvalidOperationException($"Course code '{courseDto.CourseCode}' already exists.");

            var course = new Course
            {
                CourseCode = courseDto.CourseCode,
                Name = courseDto.Name,
                Credits = courseDto.CreditHours,
                InstructorId = courseDto.InstructorId,
                DepartmentId = courseDto.DepartmentId,
                IsDeleted = false
            };

            await _courseRepo.AddCourse(course);
            return courseDto;
        }

        public async Task<CourseDTO?> UpdateCourse(int id, UpdateCourseDTO courseDto)
        {
            var courseExist = await _courseRepo.GetCourseById(id);
            if (courseExist == null) return null;

            var instructor = await _instructorRepo.GetInstructorByIdAsync(courseDto.InstructorId)
                ?? throw new InvalidOperationException($"Instructor {courseDto.InstructorId} not found.");

            if (courseExist.InstructorId != courseDto.InstructorId)
                await ValidateInstructorTeachingLoad(courseDto.InstructorId, courseDto.CreditHours, id);

            courseExist.Name = courseDto.CourseName;
            courseExist.Credits = courseDto.CreditHours;
            courseExist.InstructorId = courseDto.InstructorId;

            var updatedCourse = await _courseRepo.UpdateCourse(courseExist);
            if (updatedCourse == null) return null;

            return new CourseDTO
            {
                Name = updatedCourse.Name,
                CreditHours = updatedCourse.Credits,
                InstructorId = updatedCourse.InstructorId ?? 0
            };
        }

        public async Task<bool> DeleteCourse(int id) => await _courseRepo.DeleteCourse(id);
        public async Task<bool> RestoreCourse(int id) => await _courseRepo.RestoreCourse(id);
        public async Task<bool> PermanentlyDeleteCourse(int id) => await _courseRepo.PermanentlyDeleteCourse(id);

        public async Task<IEnumerable<CourseDTO>> GetAllCoursesIncludingDeleted()
        {
            var courses = await _courseRepo.GetAllCoursesIncludingDeleted();
            return courses.Select(c => new CourseDTO
            {
                Id = c.CourseId,
                Name = c.Name,
                CreditHours = c.Credits,
                InstructorId = c.InstructorId ?? 0,
                CourseCode = c.CourseCode
            });
        }

        public async Task<IEnumerable<EnrollCourseDTO>> GetAllCoursesByDepartmentID(int departmentId)
        {
            var courses = await _courseRepo.GetAllCoursesByDepartmentId(departmentId);
            return courses.Select(c => new EnrollCourseDTO
            {
                CourseId = c.CourseId,
                CourseName = c.Name,
                CreditHours = c.Credits,
                CourseCode = c.CourseCode,
                DepartmentName = c.Department?.Name ?? "Unknown"
            });
        }

        public async Task<IEnumerable<EnrollCourseDTO>> GetAvailableCoursesForStudent(int studentId)
        {
            var student = await _studentRepo.GetStudentByIdAsync(studentId)
                ?? throw new InvalidOperationException("Student not found.");
            if (!student.DepartmentId.HasValue)
                throw new InvalidOperationException("Student has no department.");

            var courses = await _courseRepo.GetCoursesByDepartmentForStudent(student.DepartmentId.Value);

            return courses.Select(c => new EnrollCourseDTO
            {
                CourseId = c.CourseId,
                CourseName = c.Name,
                CreditHours = c.Credits,
                CourseCode = c.CourseCode,
                DepartmentName = c.Department?.Name ?? "Unknown"
            });
        }

        public async Task<IEnumerable<InstructorCoursesDTO>> GetCoursesByInstructorId(int instructorId)
        {
            var courses = await _courseRepo.GetCoursesByInstructorId(instructorId);
            return courses.Select(c => new InstructorCoursesDTO
            {
                InstructorID = c.InstructorId ?? 0,
                InstructorName = c.Instructor?.FullName ?? "Unknown",
                CourseName = c.Name,
                CourseCode = c.CourseCode,
                DepartmentName = c.Department?.Name ?? "Unknown",
                CreditHours = c.Credits,
            });
        }

        public async Task<bool> CanCourseRun(int courseId)
        {
            var enrolledCount = await _courseRepo.GetActiveEnrollmentCountByCourseId(courseId);
            return enrolledCount >= MIN_STUDENTS_TO_RUN_COURSE;
        }

        // ================= BUSINESS RULES VALIDATION =================
        private async Task ValidateInstructorTeachingLoad(int instructorId, int newCourseCredits, int? excludeCourseId = null)
        {
            var courseCount = await _courseRepo.GetInstructorActiveCourseCount(instructorId);
            if (excludeCourseId.HasValue)
            {
                var currentCourse = await _courseRepo.GetCourseById(excludeCourseId.Value);
                if (currentCourse?.InstructorId == instructorId) courseCount--;
            }
            if (courseCount >= MAX_COURSES_PER_INSTRUCTOR)
                throw new InvalidOperationException($"Instructor teaching max courses ({MAX_COURSES_PER_INSTRUCTOR}).");

            var totalHours = await _courseRepo.GetInstructorTotalCreditHours(instructorId);
            if (excludeCourseId.HasValue)
            {
                var currentCourse = await _courseRepo.GetCourseById(excludeCourseId.Value);
                if (currentCourse?.InstructorId == instructorId) totalHours -= currentCourse.Credits;
            }
            if (totalHours + newCourseCredits > MAX_CREDIT_HOURS_PER_INSTRUCTOR)
                throw new InvalidOperationException("Instructor exceeds max teaching hours.");
        }
    }
}
