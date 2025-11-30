using Microsoft.AspNetCore.Identity;
using University.Core.Entities;
using University.Infra.Data;

public static class DbInitializer
{
    public static async Task SeedAsync(
        UserManager<AppUser> userManager,
        RoleManager<IdentityRole<int>> roleManager,
        UniversityDbContext context)
    {
        // Seed Roles
        var roles = new[] { "Admin", "Instructor", "Student" };
        foreach (var role in roles)
        {
            if (!await roleManager.RoleExistsAsync(role))
                await roleManager.CreateAsync(new IdentityRole<int> { Name = role });
        }

        // Seed Users (1 Admin + 10 Instructors + 10 Students)
        // Only seed if no users exist
        if (context.Users.Any())
        {
            return; // Database already seeded
        }

        var users = new List<AppUser>
            {
                // Admin
                new AppUser { UserName = "Amal", Email = "amal@fci.edu.eg", FirstName="Amal", LastName="Ahmed", Role="Admin", EmailConfirmed=true },
                
                // 10 Instructors
                new AppUser { UserName = "Ahmed", Email = "ahmed.hassan@fci.edu.eg", FirstName="Ahmed", LastName="Hassan", Role="Instructor", EmailConfirmed=true },
                new AppUser { UserName = "Fatima", Email = "fatima.ali@fci.edu.eg", FirstName="Fatima", LastName="Ali", Role="Instructor", EmailConfirmed=true },
                new AppUser { UserName = "Mohamed", Email = "mohamed.khaled@fci.edu.eg", FirstName="Mohamed", LastName="Khaled", Role="Instructor", EmailConfirmed=true },
                new AppUser { UserName = "Sara", Email = "sara.mahmoud@fci.edu.eg", FirstName="Sara", LastName="Mahmoud", Role="Instructor", EmailConfirmed=true },
                new AppUser { UserName = "Youssef", Email = "youssef.ibrahim@fci.edu.eg", FirstName="Youssef", LastName="Ibrahim", Role="Instructor", EmailConfirmed=true },
                new AppUser { UserName = "Nour", Email = "nour.samy@fci.edu.eg", FirstName="Nour", LastName="Samy", Role="Instructor", EmailConfirmed=true },
                new AppUser { UserName = "Omar", Email = "omar.farouk@fci.edu.eg", FirstName="Omar", LastName="Farouk", Role="Instructor", EmailConfirmed=true },
                new AppUser { UserName = "Mona", Email = "mona.salah@fci.edu.eg", FirstName="Mona", LastName="Salah", Role="Instructor", EmailConfirmed=true },
                new AppUser { UserName = "Hassan", Email = "hassan.zaki@fci.edu.eg", FirstName="Hassan", LastName="Zaki", Role="Instructor", EmailConfirmed=true },
                new AppUser { UserName = "Laila", Email = "laila.nabil@fci.edu.eg", FirstName="Laila", LastName="Nabil", Role="Instructor", EmailConfirmed=true },
                
                // 10 Students
                new AppUser { UserName = "Amira", Email = "amira.samir@student.fci.edu.eg", FirstName="Amira", LastName="Samir", Role="Student", EmailConfirmed=true },
                new AppUser { UserName = "Kareem", Email = "kareem.hossam@student.fci.edu.eg", FirstName="Kareem", LastName="Hossam", Role="Student", EmailConfirmed=true },
                new AppUser { UserName = "Hoda", Email = "hoda.mostafa@student.fci.edu.eg", FirstName="Hoda", LastName="Mostafa", Role="Student", EmailConfirmed=true },
                new AppUser { UserName = "Tamer", Email = "tamer.adel@student.fci.edu.eg", FirstName="Tamer", LastName="Adel", Role="Student", EmailConfirmed=true },
                new AppUser { UserName = "Rana", Email = "rana.sherif@student.fci.edu.eg", FirstName="Rana", LastName="Sherif", Role="Student", EmailConfirmed=true },
                new AppUser { UserName = "Karim", Email = "karim.walid@student.fci.edu.eg", FirstName="Karim", LastName="Walid", Role="Student", EmailConfirmed=true },
                new AppUser { UserName = "Dina", Email = "dina.tarek@student.fci.edu.eg", FirstName="Dina", LastName="Tarek", Role="Student", EmailConfirmed=true },
                new AppUser { UserName = "Mazen", Email = "mazen.reda@student.fci.edu.eg", FirstName="Mazen", LastName="Reda", Role="Student", EmailConfirmed=true },
                new AppUser { UserName = "Salma", Email = "salma.fathy@student.fci.edu.eg", FirstName="Salma", LastName="Fathy", Role="Student", EmailConfirmed=true },
                new AppUser { UserName = "Yasser", Email = "yasser.gamal@student.fci.edu.eg", FirstName="Yasser", LastName="Gamal", Role="Student", EmailConfirmed=true }
            };

        foreach (var user in users)
        {
            var result = await userManager.CreateAsync(user, "Password@123");
            if (result.Succeeded)
            {
                await userManager.AddToRoleAsync(user, user.Role);
            }
        }

        // Seed 10 Departments
        var departments = new List<Department>
            {
                new Department { Name = "Computer Science", Building = "Building A", HeadId = null },
                new Department { Name = "Mathematics", Building = "Building B", HeadId = null },
                new Department { Name = "Physics", Building = "Building C", HeadId = null },
                new Department { Name = "Chemistry", Building = "Building D", HeadId = null },
                new Department { Name = "Biology", Building = "Building E", HeadId = null },
                new Department { Name = "Engineering", Building = "Building A", HeadId = null },
                new Department { Name = "Business Administration", Building = "Building B", HeadId = null },
                new Department { Name = "English Literature", Building = "Building C", HeadId = null },
                new Department { Name = "History", Building = "Building D", HeadId = null },
                new Department { Name = "Economics", Building = "Building E", HeadId = null }
            };
        context.Departments.AddRange(departments);
        await context.SaveChangesAsync();

        // Seed 10 Instructors
            var instructors = new List<Instructor>
            {
                new Instructor { FullName = "Ahmed Hassan", UserId = context.Users.First(u => u.UserName=="Ahmed").Id, DepartmentId = context.Departments.First(d => d.Name=="Computer Science").DepartmentId, ContactNumber = "01112345671" },
                new Instructor { FullName = "Fatima Ali", UserId = context.Users.First(u => u.UserName=="Fatima").Id, DepartmentId = context.Departments.First(d => d.Name=="Mathematics").DepartmentId, ContactNumber = "01112345672" },
                new Instructor { FullName = "Mohamed Khaled", UserId = context.Users.First(u => u.UserName=="Mohamed").Id, DepartmentId = context.Departments.First(d => d.Name=="Physics").DepartmentId, ContactNumber = "01112345673" },
                new Instructor { FullName = "Sara Mahmoud", UserId = context.Users.First(u => u.UserName=="Sara").Id, DepartmentId = context.Departments.First(d => d.Name=="Chemistry").DepartmentId, ContactNumber = "01112345674" },
                new Instructor { FullName = "Youssef Ibrahim", UserId = context.Users.First(u => u.UserName=="Youssef").Id, DepartmentId = context.Departments.First(d => d.Name=="Biology").DepartmentId, ContactNumber = "01112345675" },
                new Instructor { FullName = "Nour Samy", UserId = context.Users.First(u => u.UserName=="Nour").Id, DepartmentId = context.Departments.First(d => d.Name=="Engineering").DepartmentId, ContactNumber = "01112345676" },
                new Instructor { FullName = "Omar Farouk", UserId = context.Users.First(u => u.UserName=="Omar").Id, DepartmentId = context.Departments.First(d => d.Name=="Business Administration").DepartmentId, ContactNumber = "01112345677" },
                new Instructor { FullName = "Mona Salah", UserId = context.Users.First(u => u.UserName=="Mona").Id, DepartmentId = context.Departments.First(d => d.Name=="English Literature").DepartmentId, ContactNumber = "01112345678" },
                new Instructor { FullName = "Hassan Zaki", UserId = context.Users.First(u => u.UserName=="Hassan").Id, DepartmentId = context.Departments.First(d => d.Name=="History").DepartmentId, ContactNumber = "01112345679" },
                new Instructor { FullName = "Laila Nabil", UserId = context.Users.First(u => u.UserName=="Laila").Id, DepartmentId = context.Departments.First(d => d.Name=="Economics").DepartmentId, ContactNumber = "01112345680" }
            };
        context.Instructors.AddRange(instructors);
        await context.SaveChangesAsync();

        // Seed 10 Students
            var students = new List<Student>
            {
                new Student { FullName="Amira Samir", UserId = context.Users.First(u => u.UserName=="Amira").Id, DepartmentId = context.Departments.First(d => d.Name=="Computer Science").DepartmentId, Level="1", StudentCode="CS20240001", ContactNumber = "01212345671" },
                new Student { FullName="Kareem Hossam", UserId = context.Users.First(u => u.UserName=="Kareem").Id, DepartmentId = context.Departments.First(d => d.Name=="Mathematics").DepartmentId, Level="2", StudentCode="MATH20240002", ContactNumber = "01212345672" },
                new Student { FullName="Hoda Mostafa", UserId = context.Users.First(u => u.UserName=="Hoda").Id, DepartmentId = context.Departments.First(d => d.Name=="Physics").DepartmentId, Level="3", StudentCode="PHYS20240003", ContactNumber = "01212345673" },
                new Student { FullName="Tamer Adel", UserId = context.Users.First(u => u.UserName=="Tamer").Id, DepartmentId = context.Departments.First(d => d.Name=="Chemistry").DepartmentId, Level="4", StudentCode="CHEM20240004", ContactNumber = "01212345674" },
                new Student { FullName="Rana Sherif", UserId = context.Users.First(u => u.UserName=="Rana").Id, DepartmentId = context.Departments.First(d => d.Name=="Biology").DepartmentId, Level="1", StudentCode="BIO20240005", ContactNumber = "01212345675" },
                new Student { FullName="Karim Walid", UserId = context.Users.First(u => u.UserName=="Karim").Id, DepartmentId = context.Departments.First(d => d.Name=="Engineering").DepartmentId, Level="2", StudentCode="ENG20240006", ContactNumber = "01212345676" },
                new Student { FullName="Dina Tarek", UserId = context.Users.First(u => u.UserName=="Dina").Id, DepartmentId = context.Departments.First(d => d.Name=="Business Administration").DepartmentId, Level="3", StudentCode="BUS20240007", ContactNumber = "01212345677" },
                new Student { FullName="Mazen Reda", UserId = context.Users.First(u => u.UserName=="Mazen").Id, DepartmentId = context.Departments.First(d => d.Name=="English Literature").DepartmentId, Level="4", StudentCode="ENG20240008", ContactNumber = "01212345678" },
                new Student { FullName="Salma Fathy", UserId = context.Users.First(u => u.UserName=="Salma").Id, DepartmentId = context.Departments.First(d => d.Name=="History").DepartmentId, Level="1", StudentCode="HIST20240009", ContactNumber = "01212345679" },
                new Student { FullName="Yasser Gamal", UserId = context.Users.First(u => u.UserName=="Yasser").Id, DepartmentId = context.Departments.First(d => d.Name=="Economics").DepartmentId, Level="2", StudentCode="ECON20240010", ContactNumber = "01212345680" }
            };
        context.Students.AddRange(students);
        await context.SaveChangesAsync();

        // Seed 10 Courses - Get instructor and department IDs from database
        var deptCS = context.Departments.First(d => d.Name=="Computer Science").DepartmentId;
        var deptMath = context.Departments.First(d => d.Name=="Mathematics").DepartmentId;
        var deptPhys = context.Departments.First(d => d.Name=="Physics").DepartmentId;
        var deptChem = context.Departments.First(d => d.Name=="Chemistry").DepartmentId;
        var deptBio = context.Departments.First(d => d.Name=="Biology").DepartmentId;
        var deptEng = context.Departments.First(d => d.Name=="Engineering").DepartmentId;
        var deptBus = context.Departments.First(d => d.Name=="Business Administration").DepartmentId;
        var deptLit = context.Departments.First(d => d.Name=="English Literature").DepartmentId;

        var instAhmed = context.Instructors.First(i => i.FullName=="Ahmed Hassan").InstructorId;
        var instFatima = context.Instructors.First(i => i.FullName=="Fatima Ali").InstructorId;
        var instMohamed = context.Instructors.First(i => i.FullName=="Mohamed Khaled").InstructorId;
        var instSara = context.Instructors.First(i => i.FullName=="Sara Mahmoud").InstructorId;
        var instYoussef = context.Instructors.First(i => i.FullName=="Youssef Ibrahim").InstructorId;
        var instNour = context.Instructors.First(i => i.FullName=="Nour Samy").InstructorId;
        var instOmar = context.Instructors.First(i => i.FullName=="Omar Farouk").InstructorId;
        var instMona = context.Instructors.First(i => i.FullName=="Mona Salah").InstructorId;

        var courses = new List<Course>
            {
                new Course { CourseCode="CS101", Name="Introduction to Programming", Credits=3, DepartmentId = deptCS, InstructorId = instAhmed },
                new Course { CourseCode="CS201", Name="Data Structures and Algorithms", Credits=4, DepartmentId = deptCS, InstructorId = instAhmed },
                new Course { CourseCode="MATH101", Name="Calculus I", Credits=3, DepartmentId = deptMath, InstructorId = instFatima },
                new Course { CourseCode="MATH201", Name="Linear Algebra", Credits=3, DepartmentId = deptMath, InstructorId = instFatima },
                new Course { CourseCode="PHYS101", Name="General Physics", Credits=4, DepartmentId = deptPhys, InstructorId = instMohamed },
                new Course { CourseCode="CHEM201", Name="Organic Chemistry", Credits=4, DepartmentId = deptChem, InstructorId = instSara },
                new Course { CourseCode="BIO301", Name="Molecular Biology", Credits=3, DepartmentId = deptBio, InstructorId = instYoussef },
                new Course { CourseCode="ENG101", Name="Engineering Mechanics", Credits=4, DepartmentId = deptEng, InstructorId = instNour },
                new Course { CourseCode="BUS101", Name="Business Management", Credits=3, DepartmentId = deptBus, InstructorId = instOmar },
                new Course { CourseCode="ENG201", Name="World Literature", Credits=2, DepartmentId = deptLit, InstructorId = instMona }
            };
        context.Courses.AddRange(courses);
        await context.SaveChangesAsync();
    }
}
