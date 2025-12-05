## 1. Stakeholder Overview

This document identifies and analyzes all stakeholders involved in the University Management System project, their roles, responsibilities, and interests in the project's success.

---

## 2. Primary Stakeholders

### 2.1 Project Supervisor/Advisor

**Name**: Eng. Karim Essam

**Role**: Technical Supervisor

**Responsibilities**:

- Provide technical guidance and mentorship
- Review project progress and deliverables
- Ensure alignment with DEPI program objectives
- Approve major technical decisions
- Validate implementation approaches
- Guide architectural decisions

**Interest in Project**:

- Successful completion of DEPI program requirements
- Quality of technical implementation
- Student learning outcomes
- Project demonstrates best practices

**Influence Level**: High

---

## 3. Development Team (Internal Stakeholders)

### 3.1 Team Member: Alyaa Gamal Ahmed

**Role**: Developer - Authentication & Core Management

**Responsibilities**:

- Authentication system implementation (JWT)
- User management (Admin, Instructor, Student)
- Department management (CRUD operations)
- Frontend and backend validation for assigned modules
- Integration with ASP.NET Core Identity

**Modules Owned**:

- Authentication (Login, Token Management)
- Users Management (CRUD, Soft Delete)
- Department (CRUD, Validation)

**Technical Focus**:

- JWT token generation and validation
- Role-based authorization
- User profile management
- Department-Instructor relationships

---

### 3.2 Team Member: Youssef Mohamed

**Role**: Developer - Exam Submission System

**Responsibilities**:

- Exam submission workflow implementation
- Answer recording and validation
- Automated grading system
- Frontend and backend validation for submissions
- Integration with exam and student modules

**Modules Owned**:

- Exam Submission (Start, Submit)
- Exam Answers (Recording, Validation)
- Automated Grading (Score Calculation)
- Results Display

**Technical Focus**:

- Submission time validation
- Score calculation algorithms
- Answer correctness verification

---

### 3.3 Team Member: Menna Mahmoud

**Role**: Developer - Course & Enrollment Management

**Responsibilities**:

- Course management system (CRUD)
- Enrollment system implementation
- Credit hour validation
- Frontend and backend validation for courses and enrollments
- Business rule enforcement for enrollments

**Modules Owned**:

- Course (CRUD, Soft Delete, Restore)
- Enrollment (Enroll, Drop, View)
- Grade Calculation Integration

**Technical Focus**:

- Course-Instructor relationships
- Enrollment constraints (credit hours, department restrictions)
- Soft delete implementation for courses

---

### 3.4 Team Member: Mahmoud Alaa

**Role**: Developer - Attendance Management

**Responsibilities**:

- Attendance tracking system
- Attendance status management
- Business rule implementation for attendance
- Frontend and backend validation for attendance
- Attendance reporting and summaries

**Modules Owned**:

- Attendance (Mark, Update, Delete)
- Attendance Filtering
- Attendance Summaries

**Technical Focus**:

- Date validation rules
- Status management (Present, Absent, Late, Excused)
- Duplicate prevention

---

### 3.5 Team Member: Sara Reda

**Role**: Developer - Exam Management

**Responsibilities**:

- Exam creation and management (CRUD)
- Question management system
- MCQ and True/False question types
- Frontend and backend validation for exams
- Integration with course and submission modules

**Modules Owned**:

- Exam (CRUD, Soft Delete)
- Exam Questions (CRUD)
- MCQ Options Management

**Technical Focus**:

- Exam-Course relationships
- Option management

---

## 4. End Users (Direct Users)

### 4.1 System Administrator

**Role**: Admin User

**System Access**: Full administrative access

**Key Functions**:

- Manage all users (Students, Instructors)
- Manage departments
- Manage courses
- Oversee enrollments
- View all system data
- Perform soft delete and restore operations

**Goals**:

- Efficient user management
- Maintain system data integrity
- Monitor system usage
- Ensure proper department and course setup

**Pain Points Addressed**:

- Centralized user management
- Easy course and department administration
- Data preservation through soft delete

---

### 4.2 Instructors

**Role**: Instructor User

**System Access**: Limited to teaching-related functions

**Key Functions**:

- View and update own profile
- View assigned courses
- Mark student attendance
- Create and manage exams for their courses
- Add questions to exams
- View student submissions
- View course enrollments

**Goals**:

- Efficiently manage course attendance
- Create comprehensive exams
- Track student performance
- Quick access to course information

**Pain Points Addressed**:

- Streamlined attendance marking
- Easy exam creation
- Automated grading reduces workload
- Clear view of student submissions

**Constraints**:

- Cannot teach more than 2 courses
- Cannot exceed 12 credit hours

---

### 4.3 Students

**Role**: Student User

**System Access**: Limited to student-related functions

**Key Functions**:

- View and update own profile
- Enroll in courses within their department
- Drop courses
- View enrolled courses
- Take exams
- View exam results
- View attendance records
- View grades

**Goals**:

- Easy course enrollment
- Clear view of academic progress
- Access to exam schedules and results
- Track attendance

**Pain Points Addressed**:

- Self-service enrollment
- Immediate grade feedback
- Attendance tracking
- Clear credit hour limits

**Constraints**:

- Maximum 21 credit hours per semester
- Maximum 36 credit hours per year
- Can only enroll in department courses

---

## 5. Stakeholder Interests Matrix

|Stakeholder|Primary Interest|Secondary Interest|Influence|Impact|
|---|---|---|---|---|
|Eng. Karim Essam|Project Quality|Student Learning|High|High|
|Alyaa Gamal|Authentication & User Mgmt|Overall System Integration|Medium|High|
|Youssef Mohamed|Submission System|Grading Accuracy|Medium|High|
|Menna Mahmoud|Course & Enrollment|Business Rules|Medium|High|
|Mahmoud Alaa|Attendance System|Data Accuracy|Medium|Medium|
|Sara Reda|Exam Management|Question Quality|Medium|High|
|Admin Users|System Control|Data Integrity|Medium|High|
|Instructors|Teaching Efficiency|Student Tracking|Medium|Medium|
|Students|Course Access|Grade Transparency|Low|High|

---


## 6. Stakeholder Requirements Summary

### 6.1 Technical Requirements (Development Team)

**From All Developers**:

- Clean, maintainable code
- Comprehensive validation (frontend & backend)
- Proper error handling
- Consistent API design
- Clear documentation

**Specific to Modules**:

- **Authentication (Alyaa)**: Secure JWT implementation, role management
- **Submissions (Youssef)**: Accurate grading, time validation
- **Courses (Menna)**: Business rule enforcement, soft delete
- **Attendance (Mahmoud)**: Date validation, status management
- **Exams (Sara)**: Question management, option handling

---

### 6.2 Functional Requirements (End Users)

**Admin Requirements**:

- Complete CRUD operations for all entities
- Soft delete with restore capability
- Comprehensive system oversight
- Data integrity maintenance

**Instructor Requirements**:

- Easy attendance marking
- Simple exam creation
- Automated grading
- Student performance visibility

**Student Requirements**:

- Self-service enrollment
- Clear course information
- Immediate grade access
- Attendance visibility

---

## 7. Stakeholder Dependencies

### 7.1 Development Dependencies

```
Alyaa (Authentication) → All Modules (Authorization needed)
Sara (Exams) → Youssef (Submissions) → Menna (Grade in Enrollment)
Menna (Courses) → Mahmoud (Attendance)
Alyaa (Departments) → Menna (Courses) → Students
```

### 7.2 User Dependencies

```
Admin → Creates/Manages → Instructors, Students, Departments, Courses
Instructors → Create → Exams → Students Take
Instructors → Mark → Attendance → Students View
Students → Enroll → Courses → Take Exams → Receive Grades
```

