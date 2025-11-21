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
    }
}