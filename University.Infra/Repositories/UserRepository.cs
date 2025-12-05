using Microsoft.EntityFrameworkCore;
using University.App.Interfaces;
using University.Core.Entities;
using University.Infra.Data;


namespace University.Infra.Repositories
{
    public class UserRepository : IUserRepository
    {
        private readonly UniversityDbContext _context;

        public UserRepository(UniversityDbContext context)
        {
            _context = context;
        }

        public async Task<AppUser?> GetUserByEmail(string email)
        {
            return await _context.Users.FirstOrDefaultAsync(s => s.Email == email);
        }
        public async Task<Student?> GetStudentByEmail(string email)
        {
            return await _context.Students.FirstOrDefaultAsync(s => s.User.Email == email);
        }
        public async Task<Instructor?> GetInstructorByEmail(string email)
        {
            return await _context.Instructors.FirstOrDefaultAsync(s => s.User.Email == email);
        }
        // Get Student and Instructor by id
        public async Task<Student?> GetStudentById(int id)
        {
            return await _context.Students
                    .Include(s => s.User)
                    .FirstOrDefaultAsync(s => s.StudentId == id);

        }
        public async Task<Instructor?> GetInstructorById(int id)
        {
            return await _context.Instructors
                                .Include(i => i.User)
                                .FirstOrDefaultAsync(i => i.InstructorId == id);
        }

        // Create Student and Instructor
        public async Task<AppUser?> CreateUser(AppUser user)
        {
            _context.Users.Add(user);
            await _context.SaveChangesAsync();
            return user;
        }
        public async Task<Student?> CreateStudent(Student student)
        {
            _context.Students.Add(student);
            await _context.SaveChangesAsync();
            return student;
        }
        public async Task<Instructor?> CreateInstructor(Instructor instructor)
        {
            _context.Instructors.Add(instructor);
            await _context.SaveChangesAsync();
            return instructor;
        }

        // retrive Student and Instructor
        public async Task<IEnumerable<Student>> GetAllStudents()
        {
            return await _context.Students.ToListAsync();


        }
        public async Task<IEnumerable<Instructor>> GetAllInstructors()
        {
            return await _context.Instructors.ToListAsync();
        }

        // update Student and Instructor
        public async Task<AppUser?> UpdateUser(AppUser user)
        {
            var userExist = await _context.Users.FindAsync(user.Id);
            if (userExist != null)
            {
                _context.Users.Update(user);
                await _context.SaveChangesAsync();
                return user;
            }
            return null;
        }

        public async Task<Student?> UpdateStudent(Student student)
        {
            var studentExist = await _context.Students.FindAsync(student.StudentId);
            if (studentExist != null)
            {
                _context.Students.Update(student);
                await _context.SaveChangesAsync();
                return student;
            }
            return null;
        }

        public async Task<Student?> UpdateSudentContactNumber(int id, string phoneNumber)
        {
            var student = await _context.Students
                .Include(s => s.User)
                .Include(s => s.Department)
                .FirstOrDefaultAsync(s => s.StudentId == id);

            if (student == null) return null;
            // Update contact number
            student.ContactNumber = phoneNumber;
            student.UpdatedAt = DateTime.UtcNow;
            var user = await _context.Users.FindAsync(student.UserId);
            if (user != null)
            {
                user.PhoneNumber=phoneNumber;
                user.UpdatedAt = DateTime.UtcNow;
            }
            await _context.SaveChangesAsync();
            return student;
        }

        public async Task<Instructor?> UpdateInstructor(Instructor instructor)
        {
            var instructorExist = await _context.Instructors.FindAsync(instructor.InstructorId);
            if (instructorExist != null)
            {
                _context.Instructors.Update(instructor);
                await _context.SaveChangesAsync();
                return instructor;
            }
            return null;
        }


        // delete Student and Instructor
        public async Task<bool> DeleteStudent(int id)
        {
            var studentExist = await _context.Students.FindAsync(id);
            if (studentExist != null)
            {
                // for deleting enrollments
                var enrollments = await _context.Enrollments
                    .Where(e => e.StudentId == id)
                    .ToListAsync();
                _context.Enrollments.RemoveRange(enrollments);

                // for deleting attendances
                var attendances = await _context.Attendances
                    .Where(a => a.StudentId == id)
                    .ToListAsync();
                _context.Attendances.RemoveRange(attendances);

                //for deleting submissions
                var submissions = await _context.ExamSubmissions
                    .Where(es => es.StudentId == id)
                    .ToListAsync();
                _context.ExamSubmissions.RemoveRange(submissions);
                
                _context.Students.Remove(studentExist);
                var user = await _context.Users.FindAsync(studentExist.UserId);
                if (user != null)
                {
                    _context.Users.Remove(user);
                }
                await _context.SaveChangesAsync();
                return true;
            }
            return false;
        }

        //public async Task<bool> DeleteInstructor(int id,int replaceId)
        //{
        //    var instructorExist = await _context.Instructors.FindAsync(id);
        //    if (instructorExist != null)
        //    {
        //        // if we need replace anything
        //        var coursesCount = await _context.Courses.CountAsync(c => c.InstructorId == id);
        //        var gradesCount = await _context.Grades.CountAsync(g => g.EnteredBy == id);

        //        if (replaceId > 0)
        //        {
        //            var replaceExist = await _context.Instructors.FindAsync(replaceId);

        //            int reassignedCourses = 0;
        //            int reassignedGrades = 0;

        //            //Reassign courses to replacement instructor
        //            if (replaceExist != null && coursesCount > 0)
        //            {
        //                var courses = await _context.Courses
        //                    .Where(c => c.InstructorId == id)
        //                    .ToListAsync();

        //                foreach (var course in courses)
        //                {
        //                    course.InstructorId = replaceExist.InstructorId;
        //                    reassignedCourses++;
        //                }
        //            }

        //            //Reassign grades to replacement instructor
        //            if (replaceExist != null && gradesCount > 0)
        //            {
        //                var grades = await _context.Grades
        //                    .Where(g => g.EnteredBy == id)
        //                    .ToListAsync();

        //                foreach (var grade in grades)
        //                {
        //                    grade.EnteredBy = replaceExist.InstructorId;
        //                    reassignedGrades++;
        //                }
        //            }
        //        }
        //        else
        //        {
        //            return false;
        //        }
        //        var user = await _context.Users.FindAsync(instructorExist.UserId);
        //        _context.Instructors.Remove(instructorExist);
        //        if (user != null)
        //        {
        //            _context.Users.Remove(user);
        //        }
        //        await _context.SaveChangesAsync();
        //        return true;

        //    }
        //    return false;
        //}

    }
}
