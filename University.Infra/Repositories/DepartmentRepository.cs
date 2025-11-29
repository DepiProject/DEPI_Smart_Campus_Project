using Microsoft.EntityFrameworkCore;
using University.App.Interfaces;
using University.Core.Entities;
using University.Infra.Data;

namespace University.Infra.Repositories
{
    public class DepartmentRepository : IDepartmentRepository
    {
        private readonly UniversityDbContext _context;

        public DepartmentRepository(UniversityDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Department>> GetAllDepartments()
        {
            return await _context.Departments
                .Where(d => !d.IsDeleted)
                .Include(d => d.Instructor)
                .ToListAsync();
        }

        public async Task<(IEnumerable<Department> departments, int totalCount)> GetDepartmentsWithPaginationAsync(int pageNumber, int pageSize)
        {
            var query = _context.Departments
                .Where(d => !d.IsDeleted)
                .Include(d => d.Instructor)
                .AsQueryable();

            var totalCount = await query.CountAsync();
            var departments = await query
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return (departments, totalCount);
        }

        public async Task<(IEnumerable<Department> departments, int totalCount)> SearchDepartmentsAsync(string? searchTerm, int pageNumber, int pageSize)
        {
            var query = _context.Departments
                .Where(d => !d.IsDeleted)
                .Include(d => d.Instructor)
                .AsQueryable();

            // Apply search filter
            if (!string.IsNullOrWhiteSpace(searchTerm))
            {
                searchTerm = searchTerm.ToLower();
                query = query.Where(d => 
                    d.Name.ToLower().Contains(searchTerm) ||
                    (d.Building != null && d.Building.ToLower().Contains(searchTerm)) ||
                    (d.Instructor != null && d.Instructor.FullName.ToLower().Contains(searchTerm))
                );
            }

            var totalCount = await query.CountAsync();
            var departments = await query
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return (departments, totalCount);
        }

        public async Task<Department?> GetDepartmentById(int id)
        {
            return await _context.Departments
                .Include(d => d.Instructor)
                .FirstOrDefaultAsync(d => d.DepartmentId == id && !d.IsDeleted);
        }

        public async Task<Department?> GetDepartmentByHeadId(int headId)
        {
            return await _context.Departments
                .FirstOrDefaultAsync(d => d.HeadId == headId && !d.IsDeleted);
        }

        public async Task<Department?> GetDepartmentByName(string name)
        {
            return await _context.Departments
                .FirstOrDefaultAsync(d => d.Name == name && !d.IsDeleted);
        }

        public async Task<Department?> AddDepartment(Department department)
        {
            _context.Departments.Add(department);
            await _context.SaveChangesAsync();
            return department;
        }

        public async Task<Department?> UpdateDepartment(Department department)
        {
            var deptExist = await _context.Departments
                .FirstOrDefaultAsync(d => d.DepartmentId == department.DepartmentId && !d.IsDeleted);

            if (deptExist == null)
                return null;

            _context.Entry(deptExist).CurrentValues.SetValues(department);
            await _context.SaveChangesAsync();
            return deptExist;
        }

        public async Task<bool> DeleteDepartment(int id)
        {
            var department = await _context.Departments
       .FirstOrDefaultAsync(d => d.DepartmentId == id && !d.IsDeleted);

            if (department == null) return false;

            // Only manually clear HeadId (to avoid circular reference issues)
            department.HeadId = null;

            // If Department has soft delete in UpdateSoftDeleteStatuses:
            _context.Departments.Remove(department);
            await _context.SaveChangesAsync();
            return true;
        }

        // ========== SOFT DELETE OPERATIONS ==========

        public async Task<bool> SoftDeleteDepartment(int id)
        {
            var department = await _context.Departments.FindAsync(id);
            if (department == null || department.IsDeleted)
                return false;

            department.IsDeleted = true;
            department.DeletedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> RestoreDepartment(int id)
        {
            var department = await _context.Departments
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(d => d.DepartmentId == id);

            if (department == null || !department.IsDeleted)
                return false;

            department.IsDeleted = false;
            department.DeletedAt = null;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> PermanentlyDeleteDepartment(int id)
        {
            var department = await _context.Departments
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(d => d.DepartmentId == id);

            if (department == null)
                return false;

            // Cascade delete: Update related entities to remove department reference
            // 1. Set students' department to null
            var students = await _context.Students
                .IgnoreQueryFilters()
                .Where(s => s.DepartmentId == id)
                .ToListAsync();
            foreach (var student in students)
            {
                student.DepartmentId = null;
            }

            // 2. Set instructors' department to null
            var instructors = await _context.Instructors
                .IgnoreQueryFilters()
                .Where(i => i.DepartmentId == id)
                .ToListAsync();
            foreach (var instructor in instructors)
            {
                instructor.DepartmentId = null;
            }

            // 3. Set courses' department to null
            var courses = await _context.Courses
                .IgnoreQueryFilters()
                .Where(c => c.DepartmentId == id)
                .ToListAsync();
            foreach (var course in courses)
            {
                course.DepartmentId = null;
            }

            // 4. Delete department
            _context.Departments.Remove(department);

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<IEnumerable<Department>> GetAllDepartmentsIncludingDeleted()
        {
            return await _context.Departments
                .IgnoreQueryFilters()
                .Include(d => d.Instructor)
                .ToListAsync();
        }

        public async Task<int> GetDepartmentStudentCount(int departmentId)
        {
            return await _context.Students
                .IgnoreQueryFilters()
                .CountAsync(s => s.DepartmentId == departmentId);
        }

        public async Task<int> GetDepartmentInstructorCount(int departmentId)
        {
            return await _context.Instructors
                .IgnoreQueryFilters()
                .CountAsync(i => i.DepartmentId == departmentId);
        }

        public async Task<int> GetDepartmentCourseCount(int departmentId)
        {
            return await _context.Courses
                .IgnoreQueryFilters()
                .CountAsync(c => c.DepartmentId == departmentId);
        }
    }
}