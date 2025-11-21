using University.App.DTOs;
using University.App.Interfaces;
using University.App.Interfaces.Users;
using University.App.Services.IServices;
using University.Core.Entities;

namespace University.App.Services.Implementations
{
    public class DepartmentService : IDepartmentService
    {
        private readonly IDepartmentRepository _departmentRepo;
        private readonly IInstructorRepository _instructorRepo;

        public DepartmentService(IDepartmentRepository departmentRepo, IInstructorRepository instructorRepo)
        {
            _departmentRepo = departmentRepo;
            _instructorRepo = instructorRepo;
        }

        public async Task<IEnumerable<DepartmentDTO>> GetAllDepartments()
        {
            var departments = await _departmentRepo.GetAllDepartments();
            return departments.Select(d => new DepartmentDTO
            {
                Id = d.DepartmentId,
                Name = d.Name,
                Building = d.Building,
                HeadId = d.HeadId
            });
        }

        public async Task<DepartmentDTO?> GetDepartmentById(int id)
        {
            var department = await _departmentRepo.GetDepartmentById(id);
            if (department == null) return null;

            return new DepartmentDTO
            {
                Id = department.DepartmentId,
                Name = department.Name,
                Building = department.Building,
                HeadId = department.HeadId
            };
        }

        public async Task<DepartmentDTO?> AddDepartment(CreateDepartmentDTO departmentDto)
        {
            if (string.IsNullOrWhiteSpace(departmentDto.Name) || string.IsNullOrWhiteSpace(departmentDto.Building))
                return null;

            // name duplication 
            var existing = await _departmentRepo.GetDepartmentByName(departmentDto.Name);
            if (existing != null)
                throw new Exception("Department name already exists");

            // head id must be unique
            if (departmentDto.HeadId != null)
            {
                var instructor = await _instructorRepo.GetInstructorByIdAsync(departmentDto.HeadId.Value);
                if (instructor == null)
                    throw new Exception("Head instructor does not exist");

                // to make sure the head asign not head in onther dept
                var existingHead = await _departmentRepo.GetDepartmentByHeadId(departmentDto.HeadId.Value);
                if (existingHead != null)
                    throw new Exception("This instructor is already head of another department");
            }

            var department = new Department
            {
                Name = departmentDto.Name,
                Building = departmentDto.Building,
                HeadId = departmentDto.HeadId
            };

            var addedDepartment = await _departmentRepo.AddDepartment(department);
            if (addedDepartment == null) return null;

            return new DepartmentDTO
            {
                Id = addedDepartment.DepartmentId,
                Name = addedDepartment.Name,
                Building = addedDepartment.Building,
                HeadId = addedDepartment.HeadId
            };
        }

        public async Task<DepartmentDTO?> UpdateDepartment(int id, UpdateDepartmentDTO departmentDto)
        {
            var existingDepartment = await _departmentRepo.GetDepartmentById(id);
            if (existingDepartment == null)
                return null;

            //  duplicate name
            var duplicate = await _departmentRepo.GetDepartmentByName(departmentDto.Name);
            if (duplicate != null && duplicate.DepartmentId != id)
                throw new Exception("Department name already exists");

            // unique HeadId 
            if (departmentDto.HeadId != null)
            {
                var instructor = await _instructorRepo.GetInstructorByIdAsync(departmentDto.HeadId.Value);
                if (instructor == null)
                    throw new Exception("Head instructor does not exist");

                
                var anotherDept = await _departmentRepo.GetDepartmentByHeadId(departmentDto.HeadId.Value);
                if (anotherDept != null && anotherDept.DepartmentId != id)
                    throw new Exception("This instructor is already head of another department");
            }

            existingDepartment.Name = departmentDto.Name;
            existingDepartment.Building = departmentDto.Building;
            existingDepartment.HeadId = departmentDto.HeadId;

            var updatedDepartment = await _departmentRepo.UpdateDepartment(existingDepartment);
            if (updatedDepartment == null) return null;

            return new DepartmentDTO
            {
                Id = updatedDepartment.DepartmentId,
                Name = updatedDepartment.Name,
                Building = updatedDepartment.Building,
                HeadId = updatedDepartment.HeadId
            };
        }

        public async Task<bool> DeleteDepartment(int id)
        {
            var department = await _departmentRepo.GetDepartmentById(id);
            if (department == null)
                return false;

            return await _departmentRepo.DeleteDepartment(id);
        }
    }
}