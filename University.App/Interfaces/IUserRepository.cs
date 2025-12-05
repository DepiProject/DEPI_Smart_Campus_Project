using University.Core.Entities;

namespace University.App.Interfaces
{
    public interface IUserRepository
    {
        Task<AppUser?> CreateUser(AppUser user);
        Task<Student?> CreateStudent(Student student);
        Task<Instructor?> CreateInstructor(Instructor instructor);

        Task<AppUser?> GetUserByEmail(string email);
        Task<Student?> GetStudentByEmail(string email);
        Task<Instructor?> GetInstructorByEmail(string email);

        Task<IEnumerable<Student>> GetAllStudents();
        Task<IEnumerable<Instructor>> GetAllInstructors();

        Task<Student?> GetStudentById(int id);
        Task<Instructor?> GetInstructorById(int id);

        Task<AppUser?> UpdateUser(AppUser user);
        Task<Student?> UpdateStudent(Student student);
        Task<Instructor?> UpdateInstructor(Instructor instructor);
        Task<Student?> UpdateSudentContactNumber(int id,string PhoneNumber);



        ////Task<bool> DeleteUser(int id);
        //Task<bool> DeleteStudent(int id);
        //Task<bool> DeleteInstructor(int id, int replaceId);



    }
}
