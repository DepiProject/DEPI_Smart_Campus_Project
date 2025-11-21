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

        // Seed Users
        if (!context.Users.Any())
        {
            var users = new List<AppUser>
            {
                new AppUser { UserName = "Amal", Email = "amal@gmail.com", FirstName="Amal", LastName="Ahmed", Role="Admin", EmailConfirmed=true },
                new AppUser { UserName = "Ali", Email = "ali@gmail.com", FirstName="Ali", LastName="Hassan", Role="Instructor", EmailConfirmed=true },
                new AppUser { UserName = "Sara", Email = "sara@gmail.com", FirstName="Sara", LastName="Khaled", Role="Instructor", EmailConfirmed=true },
                new AppUser { UserName = "Mona", Email = "mona@gmail.com", FirstName="Mona", LastName="Saleh", Role="Student", EmailConfirmed=true },
                new AppUser { UserName = "Omar", Email = "omar@gmail.com", FirstName="Omar", LastName="Mahmoud", Role="Student", EmailConfirmed=true }
            };

            foreach (var user in users)
            {
                var result = await userManager.CreateAsync(user, "Password@123");
                if (result.Succeeded)
                {
                    await userManager.AddToRoleAsync(user, user.Role);
                }
            }
        }

        // Seed Departments
        if (!context.Departments.Any())
        {
            var departments = new List<Department>
            {
                new Department { Name = "Computer Science", Building = "A", HeadId = null },
                new Department { Name = "Mathematics", Building = "B", HeadId = null },
                new Department { Name = "Physics", Building = "C", HeadId = null },
                new Department { Name = "Chemistry", Building = "D", HeadId = null },
                new Department { Name = "Biology", Building = "E", HeadId = null }
            };
            context.Departments.AddRange(departments);
            await context.SaveChangesAsync();
        }

        // Seed Instructors
        if (!context.Instructors.Any())
        {
            var instructors = new List<Instructor>
            {
                new Instructor { FullName = "Ali Hassan", UserId = context.Users.First(u => u.UserName=="Ali").Id, DepartmentId = context.Departments.First(d => d.Name=="Computer Science").DepartmentId },
                new Instructor { FullName = "Sara Khaled", UserId = context.Users.First(u => u.UserName=="Sara").Id, DepartmentId = context.Departments.First(d => d.Name=="Mathematics").DepartmentId },
            };
            context.Instructors.AddRange(instructors);
            await context.SaveChangesAsync();
        }

        // Seed Students
        if (!context.Students.Any())
        {
            var students = new List<Student>
            {
                new Student { FullName="Mona Saleh", UserId = context.Users.First(u => u.UserName=="Mona").Id, DepartmentId = context.Departments.First(d => d.Name=="Computer Science").DepartmentId, Level="1", StudentCode="S001" },
                new Student { FullName="Omar Mahmoud", UserId = context.Users.First(u => u.UserName=="Omar").Id, DepartmentId = context.Departments.First(d => d.Name=="Mathematics").DepartmentId, Level="2", StudentCode="S002" }
            };
            context.Students.AddRange(students);
            await context.SaveChangesAsync();
        }

        // Seed Courses
        if (!context.Courses.Any())
        {
            var courses = new List<Course>
            {
                new Course { CourseCode="CS101", Name="Introduction to CS", Credits=3, DepartmentId = context.Departments.First(d => d.Name=="Computer Science").DepartmentId, InstructorId = context.Instructors.First(i => i.FullName=="Ali Hassan").InstructorId },
                new Course { CourseCode="CS102", Name="Data Structures", Credits=4, DepartmentId = context.Departments.First(d => d.Name=="Computer Science").DepartmentId, InstructorId = context.Instructors.First(i => i.FullName=="Ali Hassan").InstructorId },
                new Course { CourseCode="MATH101", Name="Calculus I", Credits=3, DepartmentId = context.Departments.First(d => d.Name=="Mathematics").DepartmentId, InstructorId = context.Instructors.First(i => i.FullName=="Sara Khaled").InstructorId },
                new Course { CourseCode="MATH102", Name="Linear Algebra", Credits=3, DepartmentId = context.Departments.First(d => d.Name=="Mathematics").DepartmentId, InstructorId = context.Instructors.First(i => i.FullName=="Sara Khaled").InstructorId },
                new Course { CourseCode="PHYS101", Name="General Physics", Credits=4, DepartmentId = context.Departments.First(d => d.Name=="Physics").DepartmentId, InstructorId = context.Instructors.First(i => i.FullName=="Sara Khaled").InstructorId }
            };
            context.Courses.AddRange(courses);
            await context.SaveChangesAsync();
        }
    }
}
