# University Management System API Documentation

A comprehensive REST API for managing university operations including students, instructors, courses, enrollments, exams, attendance, and more.

## 📋 Table of Contents

- [Features](#features)
- [Technology Stack](#technology-stack)
- [Getting Started](#getting-started)
- [Authentication](#authentication)
- [API Endpoints](#api-endpoints)
- [Database Schema](#database-schema)
- [Business Rules](#business-rules)
- [Error Handling](#error-handling)

## ✨ Features

- **User Management**: Admin, Instructor, and Student roles with JWT authentication
- **Academic Management**: Departments, Courses, and Enrollments
- **Examination System**: Create exams, manage questions (MCQ/True-False), handle submissions
- **Attendance Tracking**: Mark and monitor student attendance
- **Grade Calculation**: Automatic grade calculation based on exam scores
- **Soft Delete**: Preserve data integrity with soft delete functionality
- **Authorization**: Role-based access control (RBAC)

## 🛠️ Technology Stack

- **Framework**: ASP.NET Core 6.0+
- **Authentication**: JWT Bearer Tokens
- **ORM**: Entity Framework Core
- **Database**: SQL Server
- **Architecture**: Clean Architecture (Core, Application, Infrastructure)
- **Identity**: ASP.NET Core Identity

## 🚀 Getting Started

### Prerequisites

- .NET 6.0 SDK or later
- SQL Server 2019 or later
- Visual Studio 2022 or VS Code

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/university-api.git
cd university-api
```

2. Update connection string in `appsettings.json`
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=.;Database=UniversityDB;Trusted_Connection=True;"
  }
}
```

3. Update JWT settings in `appsettings.json`
```json
{
  "Jwt": {
    "Key": "YourSecretKeyHere_MustBe32CharactersOrMore",
    "Issuer": "UniversityAPI",
    "Audience": "UniversityClients",
    "ExpiresInHours": "24"
  }
}
```

4. Run migrations
```bash
dotnet ef database update
```

5. Run the application
```bash
dotnet run
```

The API will be available at `https://localhost:5001` (or the port specified in launchSettings.json)

### Default Seed Data

The system seeds with default users:

| Role | Email | Password | Name |
|------|-------|----------|------|
| Admin | amal@gmail.com | Password@123 | Amal Ahmed |
| Instructor | ali@gmail.com | Password@123 | Ali Hassan |
| Instructor | sara@gmail.com | Password@123 | Sara Khaled |
| Student | mona@gmail.com | Password@123 | Mona Saleh |
| Student | omar@gmail.com | Password@123 | Omar Mahmoud |

## 🔐 Authentication

### Login

**POST** `/api/Auth/login`

**Request Body:**
```json
{
  "email": "amal@gmail.com",
  "password": "Password@123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "message": "Login successful"
}
```

### Using the Token

Include the JWT token in the Authorization header for all protected endpoints:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 📚 API Endpoints

### 🔑 Authentication

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/Auth/login` | User login | No |

---

### 👤 Students

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | `/api/Student` | Get all students | Admin |
| GET | `/api/Student/{id}` | Get student by ID | Admin |
| GET | `/api/Student/department/{departmentId}` | Get students by department | Admin |
| GET | `/api/Student/code/{studentCode}` | Get student by code | Admin |
| POST | `/api/Student` | Create new student | Admin |
| PUT | `/api/Student/{id}` | Update student | Admin |
| DELETE | `/api/Student/{id}` | Delete student | Admin |
| GET | `/api/Student/me` | Get current student profile | Student |
| PUT | `/api/Student/me` | Update current student profile | Student |

**Create Student Request:**
```json
{
  "email": "john@example.com",
  "password": "Password@123",
  "firstName": "John",
  "lastName": "Doe",
  "fullName": "John Doe",
  "studentCode": "S001",
  "contactNumber": "1234567890",
  "level": "1",
  "departmentId": 1
}
```

---

### 👨‍🏫 Instructors

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | `/api/Instructor` | Get all instructors | Admin |
| GET | `/api/Instructor/{id}` | Get instructor by ID | Admin |
| GET | `/api/Instructor/department/{departmentId}` | Get instructors by department | Admin |
| POST | `/api/Instructor` | Create new instructor | Admin |
| PUT | `/api/Instructor/{id}` | Update instructor | Admin |
| DELETE | `/api/Instructor/{id}` | Delete instructor | Admin |
| GET | `/api/Instructor/me` | Get current instructor profile | Instructor |
| PUT | `/api/Instructor/me` | Update current instructor profile | Instructor |

**Create Instructor Request:**
```json
{
  "email": "jane@example.com",
  "password": "Password@123",
  "firstName": "Jane",
  "lastName": "Smith",
  "fullName": "Dr. Jane Smith",
  "contactNumber": "0987654321",
  "departmentId": 1
}
```

---

### 🏢 Departments

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | `/api/Department` | Get all departments | All authenticated |
| GET | `/api/Department/{id}` | Get department by ID | All authenticated |
| POST | `/api/Department` | Create department | Admin |
| PUT | `/api/Department/{id}` | Update department | Admin |
| DELETE | `/api/Department/{id}` | Delete department | Admin |

**Create Department Request:**
```json
{
  "name": "Computer Science",
  "building": "Building A",
  "headId": 1
}
```

---

### 📖 Courses

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | `/api/Course` | Get all active courses | All authenticated |
| GET | `/api/Course/all-including-deleted` | Get all courses (including deleted) | Admin |
| GET | `/api/Course/{id}` | Get course by ID | All authenticated |
| POST | `/api/Course` | Create new course | Admin |
| PUT | `/api/Course/{id}` | Update course | Admin |
| DELETE | `/api/Course/{id}` | Soft delete course | Admin |
| POST | `/api/Course/{id}/restore` | Restore deleted course | Admin |
| GET | `/api/Course/instructor/{instructorId}` | Get courses by instructor | All authenticated |
| GET | `/api/Course/department/{departmentId}` | Get courses by department | All authenticated |
| GET | `/api/Course/student/{studentId}/available` | Get available courses for student | All authenticated |
| GET | `/api/Course/{courseId}/can-run` | Check if course can run (min 5 students) | All authenticated |

**Create Course Request:**
```json
{
  "courseCode": "CS101",
  "name": "Introduction to Programming",
  "creditHours": 3,
  "instructorId": 1,
  "departmentId": 1
}
```

**Business Rules:**
- Instructor cannot teach more than 2 courses
- Instructor cannot teach more than 12 credit hours
- Course requires minimum 5 students to run

---

### 📝 Enrollments

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| POST | `/api/Enrollment` | Enroll student in course | Student |
| DELETE | `/api/Enrollment/{enrollmentId}` | Remove enrollment | Student |
| GET | `/api/Enrollment/student/{studentId}` | Get student enrollments | All authenticated |
| GET | `/api/Enrollment/course/{courseId}` | Get course enrollments | Admin, Instructor |
| GET | `/api/Enrollment/student/{studentId}/course/{courseId}/grade` | Get/calculate student grade | All authenticated |
| GET | `/api/Enrollment/all-including-deleted` | Get all enrollments (including deleted) | Admin |
| DELETE | `/api/Enrollment/soft-delete/{enrollmentId}` | Soft delete enrollment | Admin |
| POST | `/api/Enrollment/{enrollmentId}/restore` | Restore enrollment | Admin |

**Enroll Student Request:**
```json
{
  "studentId": 1,
  "courseId": 1
}
```

**Business Rules:**
- Student cannot enroll in course outside their department
- Maximum 21 credit hours per semester
- Maximum 36 credit hours per year
- Cannot enroll in deleted/inactive courses

---

### 📋 Exams

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | `/api/Exam` | Get all exams | All authenticated |
| GET | `/api/Exam/course/{courseId}` | Get exams for course | All authenticated |
| GET | `/api/Exam/{id}/course/{courseId}` | Get exam by ID | All authenticated |
| GET | `/api/Exam/{id}/course/{courseId}/with-questions` | Get exam with questions | All authenticated |
| POST | `/api/Exam` | Create exam | Admin, Instructor |
| PUT | `/api/Exam/{id}/course/{courseId}` | Update exam | Admin, Instructor |
| DELETE | `/api/Exam/{id}/course/{courseId}` | Delete exam | Admin, Instructor |

**Create Exam Request:**
```json
{
  "title": "Midterm Exam",
  "examDate": "2025-03-15T10:00:00Z",
  "duration": 120,
  "totalPoints": 100,
  "courseId": 1
}
```

---

### ❓ Exam Questions

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | `/api/Exam/{examId}/questions` | Get all questions for exam | Admin, Instructor |
| GET | `/api/Exam/{examId}/questions/{questionId}` | Get question by ID | Admin, Instructor |
| POST | `/api/Exam/questions` | Add question to exam | Admin, Instructor |
| PUT | `/api/Exam/{examId}/questions/{questionId}` | Update question | Admin, Instructor |
| DELETE | `/api/Exam/{examId}/questions/{questionId}` | Delete question | Admin, Instructor |

**Create MCQ Question Request:**
```json
{
  "questionText": "What is 2+2?",
  "orderNumber": 1,
  "score": 10,
  "examId": 1,
  "mcqOptions": [
    {
      "optionText": "3",
      "orderNumber": 1,
      "isCorrect": false
    },
    {
      "optionText": "4",
      "orderNumber": 2,
      "isCorrect": true
    },
    {
      "optionText": "5",
      "orderNumber": 3,
      "isCorrect": false
    }
  ]
}
```

**Create True/False Question (using helper):**
```json
{
  "questionText": "The Earth is flat",
  "orderNumber": 2,
  "score": 5,
  "examId": 1,
  "mcqOptions": [
    {
      "optionText": "True",
      "orderNumber": 1,
      "isCorrect": false
    },
    {
      "optionText": "False",
      "orderNumber": 2,
      "isCorrect": true
    }
  ]
}
```

---

### 📤 Exam Submissions

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| POST | `/api/Submission/start` | Start exam | Student |
| POST | `/api/Submission/submit` | Submit exam answers | Student |
| GET | `/api/Submission/result/{examId}/{studentId}` | Get exam result | Student, Instructor |
| GET | `/api/Submission/status/{examId}/{studentId}` | Get submission status | Instructor |
| GET | `/api/Submission/student/{studentId}` | Get student submissions | Student, Instructor |
| GET | `/api/Submission/exam/{examId}` | Get exam submissions | Instructor |
| GET | `/api/Submission/all-including-deleted` | Get all submissions (including deleted) | Admin, Instructor |
| DELETE | `/api/Submission/{submissionId}` | Soft delete submission | Admin, Instructor |
| POST | `/api/Submission/{submissionId}/restore` | Restore submission | Admin, Instructor |

**Start Exam Request:**
```json
{
  "examId": 1,
  "studentId": 1
}
```

**Submit Exam Request:**
```json
{
  "examId": 1,
  "studentId": 1,
  "answers": [
    {
      "questionId": 1,
      "selectedOptionId": 2
    },
    {
      "questionId": 2,
      "selectedOptionId": 4
    }
  ]
}
```

---

### 📅 Attendance

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| POST | `/api/Attendance/mark` | Mark attendance | Instructor |
| GET | `/api/Attendance/student/{studentId}` | Get student attendance history | Admin, Instructor |
| GET | `/api/Attendance/filter` | Filter attendance records | Instructor, Admin |
| GET | `/api/Attendance/summary/{studentId}` | Get attendance summary | Admin, Student, Instructor |
| PUT | `/api/Attendance/{id}` | Update attendance | Instructor |
| DELETE | `/api/Attendance/{id}` | Delete attendance | Instructor |

**Mark Attendance Request:**
```json
{
  "studentId": 1,
  "courseId": 1,
  "date": "2025-01-15T10:00:00Z",
  "status": "Present"
}
```

**Status Options:** Present, Absent, Late, Excused

**Filter Attendance Query Parameters:**
```
GET /api/Attendance/filter?studentId=1&courseId=1&from=2025-01-01&to=2025-01-31
```

**Business Rules:**
- Cannot mark attendance for same student/course/date twice
- Cannot mark attendance older than 7 days
- Cannot mark attendance for future dates
- Student cannot attend more than 5 classes per day
- Cannot mark as Late before session time
- Cannot mark as Absent if already marked Excused
- Cannot update attendance after 48 hours
- Student must be enrolled in course

---

## 🗄️ Database Schema

### Core Tables

**Users (AspNetUsers)**
- Id (PK)
- FirstName
- LastName
- Email
- Role (Admin/Instructor/Student)
- IsDeleted (Soft Delete)
- DeletedAt
- CreatedAt
- UpdatedAt

**Students**
- StudentId (PK)
- UserId (FK)
- FullName
- StudentCode (Unique)
- ContactNumber
- Level
- DepartmentId (FK)
- IsDeleted
- DeletedAt

**Instructors**
- InstructorId (PK)
- UserId (FK)
- FullName
- ContactNumber
- DepartmentId (FK)
- IsDeleted
- DeletedAt

**Departments**
- DepartmentId (PK)
- Name (Unique)
- Building
- HeadId (FK to Instructor)
- IsDeleted
- DeletedAt

**Courses**
- CourseId (PK)
- CourseCode (Unique)
- Name
- Credits
- InstructorId (FK)
- DepartmentId (FK)
- IsDeleted
- DeletedAt

**Enrollments**
- EnrollmentId (PK)
- StudentId (FK)
- CourseId (FK)
- EnrollmentDate
- Status (Enrolled/Dropped/Completed)
- FinalGrade (0-100)
- GradeLetter (A+, A, B+, etc.)
- IsDeleted
- DeletedAt

**Exams**
- ExamId (PK)
- Title
- ExamDate
- Duration (minutes)
- TotalPoints
- CourseId (FK)
- IsDeleted
- DeletedAt

**ExamQuestions**
- QuestionId (PK)
- QuestionText
- Score
- OrderNumber
- ExamId (FK)

**MCQOptions**
- OptionId (PK)
- OptionText
- IsCorrect
- OrderNumber
- QuestionId (FK)

**ExamSubmissions**
- SubmissionId (PK)
- ExamId (FK)
- StudentId (FK)
- InstructorId (FK, nullable)
- StartedAt
- SubmittedAt
- Score
- IsDeleted
- DeletedAt

**ExamAnswers**
- AnswerId (PK)
- SubmissionId (FK)
- QuestionId (FK)
- SelectedOptionId (FK)
- IsCorrect
- PointsAwarded

**Attendances**
- AttendanceId (PK)
- StudentId (FK)
- CourseId (FK)
- Date
- Status (Present/Absent/Late/Excused)
- IsDeleted
- DeletedAt

---

## 📋 Business Rules

### Course Management
- ✅ Instructor cannot teach more than 2 courses
- ✅ Instructor cannot teach more than 12 credit hours
- ✅ Course code must be unique
- ✅ Course requires minimum 5 students to run

### Enrollment
- ✅ Student can only enroll in courses from their department
- ✅ Maximum 21 credit hours per semester
- ✅ Maximum 36 credit hours per year
- ✅ Cannot enroll in deleted/inactive courses
- ✅ Cannot enroll in same course twice

### Attendance
- ✅ Cannot mark duplicate attendance for same student/course/date
- ✅ Cannot mark attendance older than 7 days
- ✅ Cannot mark attendance for future dates
- ✅ Student cannot attend more than 5 classes per day
- ✅ Cannot update attendance after 48 hours
- ✅ Cannot delete attendance older than 7 days

### Exam Submission
- ✅ Cannot submit exam after time limit expires
- ✅ Must start exam before submitting
- ✅ Cannot submit exam twice
- ✅ Exam date must be in future when creating
- ✅ Cannot modify exam questions after students have submitted

### Grade Calculation
- ✅ Final grade calculated as percentage (0-100)
- ✅ Letter grades: A+ (97-100), A (93-96), A- (90-92), B+ (87-89), B (83-86), B- (80-82), C+ (77-79), C (73-76), C- (70-72), D+ (67-69), D (63-66), D- (60-62), F (<60)
- ✅ Enrollment status changes to "Completed" when all exams finished

### Soft Delete
- ✅ Users, Students, Instructors, Departments, Courses, Exams, Enrollments, Attendance, and Submissions support soft delete
- ✅ Soft-deleted records preserved in database with IsDeleted flag
- ✅ Can be restored by Admin
- ✅ Global query filters exclude soft-deleted records by default

---

## ⚠️ Error Handling

The API returns standard HTTP status codes:

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (missing/invalid token) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not Found |
| 409 | Conflict (business rule violation) |
| 500 | Internal Server Error |

**Error Response Format:**
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message"
}
```

**Success Response Format:**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { /* response data */ }
}
```

---

## 🔒 Security Features

- ✅ JWT token-based authentication
- ✅ Role-based authorization (RBAC)
- ✅ Password hashing with ASP.NET Core Identity
- ✅ Token expiration
- ✅ Soft delete for data preservation
- ✅ Input validation using Data Annotations
- ✅ Business rule validation
- ✅ SQL injection protection via Entity Framework

---

## 📝 License

This project is licensed under the MIT License.

---

## 👥 Contributors

- Your Name - Initial work

---

## 📧 Support

For support, email support@university.com or create an issue in the repository.
