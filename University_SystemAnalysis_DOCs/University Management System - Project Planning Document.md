## 1. Project Overview

### 1.1 Project Name

Smart Campus Management System

### 1.2 Project Purpose

A comprehensive Full Stack system designed to manage university operations including student enrollment, course management, attendance tracking, examination system, and automated grading. This project serves as a practical implementation of skills acquired during the DEPI training program.

### 1.3 Project Duration

Development Phase: Completed Current Phase: Documentation and Deployment

### 1.4 Technology Stack

- **Backend Framework**: ASP.NET Core 8.0
- **Authentication**: JWT Bearer Tokens
- **ORM**: Entity Framework Core
- **Database**: SQL Server
- **Architecture**: Clean Architecture (Core, Application, Infrastructure, API)
- **Identity Management**: ASP.NET Core Identity
- **Backend Hosting**: [MonsterASP.NET](https://smartcampus-university.runasp.net/swagger/index.html)
- **Frontend Hosting**:Netlify
---

## 2. Project Scope

### 2.1 In-Scope Features

#### 2.1.1 User Management & Authentication

- **JWT-based Authentication**: Secure login system with token generation
- **Role-Based Access Control (RBAC)**: Three user roles (Admin, Instructor, Student)
- **User Profile Management**: Each role can view and update their own profile
- **Soft Delete**: Preserve user data integrity with reversible deletion
#### 2.1.2 Academic Management (Admin Functions)

**Student Management**

- Create, Read, Update, Delete (CRUD) operations for students
- Assign students to departments
- Track student codes, levels, and contact information
- View students by department

**Instructor Management**

- CRUD operations for instructors
- Assign instructors to departments
- Manage instructor contact information
- View instructors by department

**Department Management**

- CRUD operations for departments
- Assign department heads (instructors)
- Manage building information
- Track department hierarchy

**Course Management**

- CRUD operations for courses
- Assign courses to instructors (max 2 courses, 12 credit hours per instructor)
- Assign courses to departments
- Define course codes, names, and credit hours
- Soft delete with restore functionality
- Check course viability (minimum 5 students required)

#### 2.1.3 Enrollment System (Student Functions)

- Students enroll in courses within their department
- Maximum credit hour limits:
    - 21 credit hours per semester
    - 36 credit hours per year
- Prevent duplicate enrollments
- Cannot enroll in deleted/inactive courses
- View enrollment history
- Drop courses (remove enrollment)

#### 2.1.4 Attendance System (Instructor Functions)

- Mark student attendance with statuses:
    - Present
    - Absent
    - Late
    - Excused
- Business rules enforcement:
    - Cannot mark duplicate attendance for same student/course/date
    - Cannot mark attendance older than 7 days
    - Cannot mark future attendance
    - Student cannot attend more than 5 classes per day
    - Cannot update attendance after 48 hours
    - Cannot delete attendance older than 7 days
- Filter attendance by student, course, or date range
- Generate attendance summaries
- View student attendance history

#### 2.1.5 Examination System

**Exam Creation (Admin & Instructor)**

- Create exams with:
    - Title
    - Date and time
    - Duration (in minutes)
    - Total points
    - Course association
- Update and delete exams
- View exams by course

**Question Management (Admin & Instructor)**

- Add questions to exams:
    - Multiple Choice Questions (MCQ)
    - True/False questions (implemented as MCQ with 2 options)
- Define question text, score, and order
- Add multiple options per question
- Mark correct answers
- Update and delete questions

**Exam Submission (Student)**

- Start exam (creates submission record with timestamp)
- Submit answers for all questions
- System validates submission within time limit
- Cannot submit exam twice
- Cannot submit after time expires

**Automated Grading (System)**

- Automatic scoring of MCQ and True/False questions
- Calculate total score
- Generate final grade percentage
- Assign letter grades:
    - A+ (90-100), A (85-96)
    - B+ (80-84), B (75-79)
    - C+ (70-74), C (65-69)
    - D+ (60-64), D (50-59)
    - F (<50)
- Update enrollment status to "Completed" when all exams finished

**Results Viewing**

- Students view their exam results
- Instructors view all student submissions
- View submission status and detailed answers

#### 2.1.6 Grade Management

- Automatic grade calculation based on exam scores
- Final grade stored in Enrollment table
- Letter grade assignment
- Grade viewing for students and instructors

### 2.2 Out-of-Scope Features

- Course scheduling/timetable management
- Financial management (tuition, payments)
- Library management
- Hostel/accommodation management
- Parent/guardian portal
- Mobile application
- Real-time notifications
- Email integration
- Document management system
- Academic calendar planning
- Scholarship management
- Alumni management

---

## 3. System Architecture

### 3.1 Architecture Pattern

**Clean Architecture** with three main layers:

1. **Core Layer** (University.Core)
    
	- Domain entities
2. **Application Layer** (University.Application)
    
    - Business logic implementation
    - Service interfaces
    - DTOs (Data Transfer Objects)
    - Validators
3. **Infrastructure Layer** (University.Infra)
    
    - Data access implementation
    - Entity Framework configurations
    - Repository implementations

### 3.2 Database Design

- **SQL Server** relational database
- Entity Framework Core for ORM
- Database-first approach with code-first migrations
- Comprehensive relationship mapping
- Soft delete implementation across all entities

---

## 4. Key Business Rules & Constraints

### 4.1 Course Management Rules

1. Instructor cannot teach more than 2 courses
2. Instructor cannot teach more than 12 credit hours total
3. Course code must be unique across the system
4. Course requires minimum 5 enrolled students to run

### 4.2 Enrollment Rules

1. Student can only enroll in courses from their own department
2. Maximum 21 credit hours per semester
3. Maximum 36 credit hours per academic year
4. Cannot enroll in deleted or inactive courses
5. Cannot enroll in the same course twice

### 4.3 Attendance Rules

1. Cannot mark duplicate attendance for same student/course/date
2. Cannot mark attendance older than 7 days from current date
3. Cannot mark attendance for future dates
4. Student cannot attend more than 5 classes per day
5. Cannot mark as "Late" before session time
6. Cannot mark as "Absent" if already marked "Excused"
7. Cannot update attendance after 48 hours
8. Cannot delete attendance older than 7 days
9. Student must be enrolled in the course to mark attendance

### 4.4 Exam & Submission Rules

1. Cannot submit exam after time limit expires
2. Must start exam before submitting answers
3. Cannot submit the same exam twice
4. Exam date must be in the future when creating
5. Cannot modify exam questions after students have submitted
6. All questions must have at least one correct answer

---

## 5. Security Features

### 5.1 Authentication

- JWT token-based authentication
- Token expiration (configurable, default 24 hours)
- Secure password hashing using ASP.NET Core Identity

### 5.2 Authorization

- Role-based access control (RBAC)
- Three distinct roles: Admin, Instructor, Student
- Endpoint-level authorization attributes
- Resource-level authorization (users can only access their own data)

### 5.3 Data Protection

- Soft delete for data preservation
- SQL injection protection via Entity Framework
- Input validation using Data Annotations
- Business rule validation at service layer

---

## 6. API Design

### 6.1 RESTful Principles

- Standard HTTPs methods (GET, POST, PUT, DELETE)
- Resource-based URLs
- Consistent response formats
- Proper HTTPs status codes

### 6.2 Response Format

```json
{
  "success": true/false,
  "message": "Operation description",
  "data": { /* response data */ },
  "error": "Error details (if applicable)"
}
```

### 6.3 Error Handling

- 200: Success
- 201: Created
- 400: Bad Request (validation error)
- 401: Unauthorized (missing/invalid token)
- 403: Forbidden (insufficient permissions)
- 404: Not Found
- 409: Conflict (business rule violation)
- 500: Internal Server Error

---

## 7. Deployment Strategy

### 7.1 Backend Deployment

- **Platform**: MonsterASP.NET
- **Environment**: Production
- **Database**: SQL Server (cloud-hosted)

### 7.2 Frontend Deployment

- **Platform**: Netlify
- **Integration**: API calls to MonsterASP.NET backend
- **Authentication**: JWT token storage and management

### 7.3 Configuration Management

- Connection strings in appsettings.json
- JWT settings configuration
- Environment-specific settings

---

## 8. Testing Strategy

### 8.1 Manual Testing

- Endpoint testing using Swagger
- Business rule validation
- Authorization testing
- Error handling validation

### 8.2 Integration Testing

- Database operations
- Authentication flow
- End-to-end workflows

---

## 9. Project Milestones

### Phase 1: Core Setup 

- Project structure setup
- Database design and implementation
- Entity Framework configuration
- Identity and authentication setup

### Phase 2: User Management 

- User registration and login
- Role-based authorization
- Profile management
- Soft delete implementation

### Phase 3: Academic Management 

- Department CRUD operations
- Instructor CRUD operations
- Student CRUD operations
- Course CRUD operations
- Enrollment system

### Phase 4: Attendance System 

- Attendance marking
- Attendance filtering
- Business rules implementation
- Attendance summaries

### Phase 5: Examination System 

- Exam creation and management
- Question management (MCQ/True-False)
- Exam submission system
- Automated grading

### Phase 6: Testing & Deployment 

- API testing
- Business rule validation
- Documentation
- Deployment to Monctar.asp and Netlify

---

## 10. Success Criteria

### 10.1 Functional Success

- All CRUD operations working correctly
- Authentication and authorization functioning properly
- Business rules enforced consistently
- Automated grading calculating correctly
- Soft delete preserving data integrity

### 10.2 Technical Success

- Clean architecture implementation
- Secure JWT authentication
- Proper relationship mapping in database
- Comprehensive error handling
- API documentation completeness

### 10.3 Learning Objectives (DEPI)

- Practical application of ASP.NET Core
- Implementation of Clean Architecture
- Database design and EF Core usage
- RESTful API design principles
- Security best practices (JWT, RBAC)
- Business logic implementation

---

## 11. Future Enhancements (Out of Current Scope)

### 11.1 Potential Features

- Real-time notifications system
- Email integration for announcements
- Course scheduling and timetable
- Discussion forums
- Assignment submission system
- Gradebook analytics and reports
- Parent/guardian access portal
- Mobile application

### 11.2 Technical Improvements

- Automated unit testing
- Continuous Integration/Continuous Deployment (CI/CD)
- Caching implementation (Redis)
- API versioning
- Rate limiting
- Advanced logging and monitoring
- Performance optimization

---

## 12. Risk Management

### 12.1 Identified Risks

1. **Data Loss**: Mitigated by soft delete implementation
2. **Unauthorized Access**: Mitigated by JWT and RBAC
3. **Business Rule Violations**: Mitigated by comprehensive validation
4. **Performance Issues**: Mitigated by proper indexing and query optimization

### 12.2 Mitigation Strategies

- Regular database backups
- Comprehensive input validation
- Soft delete for data preservation
- Proper error handling and logging

---

## 13. Project Constraints

### 13.1 Technical Constraints

- .NET 8.0+ framework requirement
- SQL Server database dependency
- No mobile application in current scope

### 13.2 Resource Constraints

- Development team: 5 members
- Timeline: DEPI program duration
- No dedicated QA team

### 13.3 Scope Constraints

- Focus on core academic management only
- No financial management features
- No advanced scheduling features
- No third-party integrations
