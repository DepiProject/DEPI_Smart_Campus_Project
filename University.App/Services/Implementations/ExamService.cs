using University.App.DTOs;
using University.App.Interfaces;
using University.App.Interfaces.Courses;
using University.App.Interfaces.Users;
using University.App.Services.IServices;
using University.App.Validators;
using University.Core.Entities;

namespace University.App.Services.Implementations
{
    public class ExamService : IExamService
    {
        private readonly IExamRepository _examRepository;
        private readonly ISubmissionRepository _submissionRepository;
        private readonly ICourseRepository _courseRepository;
        private readonly IInstructorRepository _instructorRepository;
        private readonly ExamValidator _examValidator;
        private readonly ExamQuestionValidator _questionValidator;

        public ExamService(
            IExamRepository examRepository,
            ISubmissionRepository submissionRepository,
            ICourseRepository courseRepository,
            IInstructorRepository instructorRepository,
            ExamValidator examValidator,
            ExamQuestionValidator questionValidator)
        {
            _examRepository = examRepository;
            _submissionRepository = submissionRepository;
            _courseRepository = courseRepository;
            _instructorRepository = instructorRepository;
            _examValidator = examValidator;
            _questionValidator = questionValidator;
        }

        // ==================== EXAM CRUD ====================

        public async Task<IEnumerable<ExamDTO>> GetAllExams()
        {
            var exams = await _examRepository.GetAllExams();
            return exams.Select(MapToExamDTO);
        }

        public async Task<IEnumerable<ExamDTO>> GetAllExamsForCourse(int courseId)
        {
            if (courseId <= 0)
                throw new ArgumentException("Invalid course ID");

            var exams = await _examRepository.GetAllExamsForCourse(courseId);
            return exams.Select(MapToExamDTO);
        }

        public async Task<ExamDTO?> GetExamById(int id, int courseId)
        {
            ValidateIds(id, courseId);

            var exam = await _examRepository.GetExamById(id, courseId);
            if (exam == null)
                throw new KeyNotFoundException($"Exam with ID {id} not found in course {courseId}");

            return MapToExamDTO(exam);
        }

        public async Task<ExamWithQuestionsDTO?> GetExamWithQuestions(int id, int courseId)
        {
            ValidateIds(id, courseId);

            var exam = await _examRepository.GetExamByIdWithQuestions(id, courseId);
            if (exam == null)
                throw new KeyNotFoundException($"Exam with ID {id} not found in course {courseId}");

            return new ExamWithQuestionsDTO
            {
                ExamId = exam.ExamId,
                CourseName = exam.Course?.Name,
                Title = exam.Title,
                ExamDate = exam.ExamDate,
                Duration = exam.Duration,
                TotalPoints = exam.TotalPoints,
                CourseId = exam.CourseId,
                Questions = exam.ExamQuestions?.Select(MapToQuestionDTO).ToList() ?? new()
            };
        }

        public async Task<CreateExamDto?> AddExam(CreateExamDto dto)
        {
            Console.WriteLine("\n========== EXAM SERVICE: AddExam ==========");
            
            if (dto == null)
            {
                Console.WriteLine("[ERROR] DTO is null");
                throw new ArgumentNullException(nameof(dto));
            }

            Console.WriteLine($"[INFO] DTO Details:");
            Console.WriteLine($"  - Title: '{dto.Title}'");
            Console.WriteLine($"  - CourseId: {dto.CourseId}");
            Console.WriteLine($"  - InstructorId (UserId): {dto.InstructorId}");
            Console.WriteLine($"  - Duration: {dto.Duration}");
            Console.WriteLine($"  - TotalPoints: {dto.TotalPoints}");
            Console.WriteLine($"  - ExamDate: {dto.ExamDate}");

            // Validate exam data
            Console.WriteLine($"[INFO] Validating exam data...");
            await _examValidator.ValidateCreateExamAsync(dto);
            Console.WriteLine($"[SUCCESS] Validation passed");

            if (dto.CourseId <= 0)
            {
                Console.WriteLine($"[ERROR] Invalid course ID: {dto.CourseId}");
                throw new ArgumentException($"Invalid course ID: {dto.CourseId}");
            }

            if (dto.InstructorId <= 0)
            {
                Console.WriteLine($"[ERROR] Invalid user ID: {dto.InstructorId}");
                throw new ArgumentException($"Invalid user ID: {dto.InstructorId}");
            }

            // Convert UserId to InstructorId
            Console.WriteLine($"[INFO] Converting UserId {dto.InstructorId} to InstructorId...");
            var instructor = await _instructorRepository.GetByUserIdAsync(dto.InstructorId);
            
            if (instructor == null)
            {
                Console.WriteLine($"[ERROR] No instructor found for UserId: {dto.InstructorId}");
                throw new InvalidOperationException($"No instructor record found for user ID: {dto.InstructorId}");
            }

            var actualInstructorId = instructor.InstructorId;
            Console.WriteLine($"[INFO] Resolved InstructorId: {actualInstructorId} for UserId: {dto.InstructorId}");

            // Validate that the course belongs to the instructor
            Console.WriteLine($"[INFO] Checking if Course {dto.CourseId} belongs to Instructor {actualInstructorId}...");
            var (courses, _) = await _courseRepository.SearchCoursesAsync(null, null, actualInstructorId, 1, 100);
            
            // DEBUG: Log all courses found for this instructor
            Console.WriteLine($"[INFO] Found {courses.Count()} courses for Instructor {actualInstructorId}:");
            foreach (var c in courses)
            {
                Console.WriteLine($"  - CourseId: {c.CourseId}, Name: '{c.Name}', InstructorId: {c.InstructorId}, IsDeleted: {c.IsDeleted}");
            }
            
            var courseExists = courses.Any(c => c.CourseId == dto.CourseId && !c.IsDeleted);
            
            if (!courseExists)
            {
                Console.WriteLine($"[WARNING] Course {dto.CourseId} NOT found in instructor's courses. Checking if course exists...");
                // Also check if the course exists at all
                var targetCourse = await _courseRepository.GetCourseById(dto.CourseId);
                
                if (targetCourse != null)
                {
                    Console.WriteLine($"[INFO] Target Course Details:");
                    Console.WriteLine($"  - CourseId: {targetCourse.CourseId}");
                    Console.WriteLine($"  - Name: '{targetCourse.Name}'");
                    Console.WriteLine($"  - AssignedInstructorId: {targetCourse.InstructorId}");
                    Console.WriteLine($"  - IsDeleted: {targetCourse.IsDeleted}");
                }
                else
                {
                    Console.WriteLine($"[ERROR] Course {dto.CourseId} does not exist in database!");
                }
                
                var assignedIds = string.Join(", ", courses.Select(c => $"CourseId={c.CourseId}, Name={c.Name}"));
                var courseInfo = targetCourse != null 
                    ? $"Course exists - ID: {targetCourse.CourseId}, Name: {targetCourse.Name}, AssignedInstructorId: {targetCourse.InstructorId}, IsDeleted: {targetCourse.IsDeleted}"
                    : "Course not found in database";
                
                var errorMsg = $"Course {dto.CourseId} is not assigned to Instructor {actualInstructorId}. " +
                    $"Instructor's courses: [{assignedIds}]. " +
                    $"Target course info: {courseInfo}";
                
                Console.WriteLine($"[ERROR] {errorMsg}");
                throw new InvalidOperationException(errorMsg);
            }

            Console.WriteLine($"[SUCCESS] Course {dto.CourseId} is assigned to Instructor {actualInstructorId}");
            Console.WriteLine($"[INFO] Creating exam entity...");
            
            var exam = new Exam
            {
                Title = dto.Title?.Trim() ?? throw new ArgumentException("Title is required"),
                ExamDate = dto.ExamDate,
                Duration = dto.Duration,
                TotalPoints = dto.TotalPoints,
                CourseId = dto.CourseId,
                IsDeleted = false,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            Console.WriteLine($"[INFO] Saving exam to database...");
            var savedExam = await _examRepository.AddExam(exam);
            Console.WriteLine($"[SUCCESS] Exam saved successfully with ID: {savedExam?.ExamId}");
            
            // Return the DTO with the generated ExamId
            if (savedExam != null)
            {
                dto.InstructorId = savedExam.ExamId; // Store ExamId for backwards compatibility
                // Note: This is reusing InstructorId field to pass ExamId back - should be refactored
            }
            
            return dto;
        }

        public async Task<ExamDTO?> UpdateExam(int id, int courseId, UpdateExamDto dto)
        {
            if (dto == null)
                throw new ArgumentNullException(nameof(dto));

            ValidateIds(id, courseId);

            var exam = await _examRepository.GetExamById(id, courseId);
            if (exam == null)
                throw new KeyNotFoundException($"Exam with ID {id} not found");

            // Check if exam has submissions
            var hasSubmissions = await _submissionRepository.HasSubmissionsAsync(id);
            if (hasSubmissions)
                throw new InvalidOperationException("Cannot update exam - students have already submitted");

            // Validate update data
            await _examValidator.ValidateUpdateExamAsync(dto);

            exam.Title = dto.Title?.Trim() ?? exam.Title;
            exam.ExamDate = dto.ExamDate;
            exam.Duration = dto.Duration;
            exam.TotalPoints = dto.TotalPoints;
            exam.UpdatedAt = DateTime.UtcNow;

            await _examRepository.UpdateExam(exam);

            return MapToExamDTO(exam);
        }

        public async Task<bool> DeleteExam(int id, int courseId)
        {
            ValidateIds(id, courseId);

            var exam = await _examRepository.GetExamById(id, courseId);
            if (exam == null)
                throw new KeyNotFoundException($"Exam with ID {id} not found");

            // Check if exam has submissions
            var hasSubmissions = await _submissionRepository.HasSubmissionsAsync(id);
            if (hasSubmissions)
                throw new InvalidOperationException("Cannot delete exam - students have already submitted");

            return await _examRepository.DeleteExam(id, courseId);
        }

        // ==================== QUESTION CRUD ====================

        public async Task<ExamQuestionDTO?> AddExamQuestion(CreateQuestionDto dto)
        {
            Console.WriteLine("\n========== EXAM SERVICE: AddExamQuestion ==========");
            
            if (dto == null)
            {
                Console.WriteLine("[ERROR] DTO is null");
                throw new ArgumentNullException(nameof(dto));
            }

            Console.WriteLine($"[INFO] Question Details:");
            Console.WriteLine($"  - ExamId: {dto.ExamId}");
            Console.WriteLine($"  - CourseId: {dto.CourseId}");
            Console.WriteLine($"  - QuestionText: '{dto.QuestionText}'");
            Console.WriteLine($"  - Score: {dto.Score}");
            Console.WriteLine($"  - OrderNumber: {dto.OrderNumber}");
            Console.WriteLine($"  - MCQOptions count: {dto.MCQOptions?.Count ?? 0}");

            if (dto.ExamId <= 0)
            {
                Console.WriteLine($"[ERROR] Invalid exam ID: {dto.ExamId}");
                throw new ArgumentException("Invalid exam ID");
            }

            Console.WriteLine("[INFO] Validating question data...");
            // Validate question data
            _questionValidator.ValidateCreateOrUpdateQuestion(dto);
            Console.WriteLine("[SUCCESS] Validation passed");

            Console.WriteLine($"[INFO] Checking if exam {dto.ExamId} exists...");
            // Check if exam exists
            var exam = await _examRepository.GetExamById(dto.ExamId, dto.CourseId);
            if (exam == null)
            {
                Console.WriteLine($"[ERROR] Exam {dto.ExamId} not found");
                throw new KeyNotFoundException($"Exam with ID {dto.ExamId} not found");
            }
            Console.WriteLine($"[SUCCESS] Exam found: '{exam.Title}'");

            Console.WriteLine($"[INFO] Checking if exam has submissions...");
            // Check if exam has submissions
            var hasSubmissions = await _submissionRepository.HasSubmissionsAsync(dto.ExamId);
            if (hasSubmissions)
            {
                Console.WriteLine("[ERROR] Exam already has submissions");
                throw new InvalidOperationException("Cannot add questions - students have already submitted");
            }
            Console.WriteLine("[SUCCESS] No submissions found");

            Console.WriteLine("[INFO] Creating question entity...");
            var question = new ExamQuestion
            {
                QuestionText = dto.QuestionText.Trim(),
                Score = dto.Score,
                OrderNumber = dto.OrderNumber,
                ExamId = dto.ExamId
            };

            Console.WriteLine("[INFO] Saving question to database...");
            var addedQuestion = await _examRepository.AddExamQuestion(question);
            if (addedQuestion == null)
            {
                Console.WriteLine("[ERROR] Failed to add question");
                throw new InvalidOperationException("Failed to add question");
            }
            Console.WriteLine($"[SUCCESS] Question saved with ID: {addedQuestion.QuestionId}");

            Console.WriteLine($"[INFO] Adding {dto.MCQOptions.Count} MCQ options...");
            // Add MCQ Options
            foreach (var optionDto in dto.MCQOptions)
            {
                Console.WriteLine($"  - Option: '{optionDto.OptionText}' (IsCorrect: {optionDto.IsCorrect})");
                await _examRepository.AddExamMcqOption(new MCQOption
                {
                    OptionText = optionDto.OptionText.Trim(),
                    OrderNumber = optionDto.OrderNumber,
                    IsCorrect = optionDto.IsCorrect,
                    QuestionId = addedQuestion.QuestionId
                });
            }
            Console.WriteLine("[SUCCESS] All options added");

            Console.WriteLine("[INFO] Retrieving complete question with options...");
            // Retrieve complete question with options
            var completeQuestion = await _examRepository.GetQuestionById(addedQuestion.QuestionId, dto.ExamId);
            var result = completeQuestion != null ? MapToQuestionDTO(completeQuestion) : null;
            
            Console.WriteLine($"[SUCCESS] Question complete with {result?.MCQOptions?.Count ?? 0} options");
            return result;
        }

        public async Task<ExamQuestionDTO?> UpdateExamQuestion(int questionId, int examId, UpdateQuestionDto dto)
        {
            if (dto == null)
                throw new ArgumentNullException(nameof(dto));

            ValidateIds(questionId, examId);

            var question = await _examRepository.GetQuestionById(questionId, examId);
            if (question == null)
                throw new KeyNotFoundException($"Question with ID {questionId} not found");

            // Check if exam has submissions
            var hasSubmissions = await _submissionRepository.HasSubmissionsAsync(examId);
            if (hasSubmissions)
                throw new InvalidOperationException("Cannot update questions - students have already submitted");

            // Validate question data
            _questionValidator.ValidateCreateOrUpdateQuestion(new CreateQuestionDto
            {
                QuestionText = dto.QuestionText,
                Score = dto.Score,
                OrderNumber = dto.OrderNumber,
                ExamId = examId,
                MCQOptions = dto.MCQOptions.Select(o => new CreateMCQOptionDto
                {
                    OptionText = o.OptionText,
                    OrderNumber = o.OrderNumber,
                    IsCorrect = o.IsCorrect
                }).ToList()
            });

            // Update question
            question.QuestionText = dto.QuestionText.Trim();
            question.Score = dto.Score;
            question.OrderNumber = dto.OrderNumber;

            await _examRepository.UpdateExamQuestion(question);

            // Update options
            var existingOptions = await _examRepository.GetMCQOptionsByQuestionId(questionId);
            var optionIdsToKeep = dto.MCQOptions
                .Where(o => o.OptionId.HasValue)
                .Select(o => o.OptionId!.Value)
                .ToHashSet();

            // Delete removed options
            foreach (var existingOption in existingOptions)
            {
                if (!optionIdsToKeep.Contains(existingOption.OptionId))
                    await _examRepository.DeleteMCQOption(existingOption.OptionId);
            }

            // Add/update options
            foreach (var optionDto in dto.MCQOptions)
            {
                if (optionDto.OptionId.HasValue)
                {
                    // Update existing option
                    var existing = existingOptions.FirstOrDefault(o => o.OptionId == optionDto.OptionId);
                    if (existing != null)
                    {
                        existing.OptionText = optionDto.OptionText.Trim();
                        existing.OrderNumber = optionDto.OrderNumber;
                        existing.IsCorrect = optionDto.IsCorrect;
                        await _examRepository.UpdateMCQOption(existing);
                    }
                }
                else
                {
                    // Add new option
                    await _examRepository.AddExamMcqOption(new MCQOption
                    {
                        OptionText = optionDto.OptionText.Trim(),
                        OrderNumber = optionDto.OrderNumber,
                        IsCorrect = optionDto.IsCorrect,
                        QuestionId = questionId
                    });
                }
            }

            var updatedQuestion = await _examRepository.GetQuestionById(questionId, examId);
            return updatedQuestion != null ? MapToQuestionDTO(updatedQuestion) : null;
        }

        public async Task<bool> DeleteExamQuestion(int questionId, int examId)
        {
            ValidateIds(questionId, examId);

            var question = await _examRepository.GetQuestionById(questionId, examId);
            if (question == null)
                throw new KeyNotFoundException($"Question with ID {questionId} not found");

            // Check if exam has submissions
            var hasSubmissions = await _submissionRepository.HasSubmissionsAsync(examId);
            if (hasSubmissions)
                throw new InvalidOperationException("Cannot delete questions - students have already submitted");

            return await _examRepository.DeleteExamQuestion(questionId, examId);
        }

        public async Task<ExamQuestionDTO?> GetQuestionById(int questionId, int examId)
        {
            ValidateIds(questionId, examId);

            var question = await _examRepository.GetQuestionById(questionId, examId);
            if (question == null)
                throw new KeyNotFoundException($"Question with ID {questionId} not found");

            return MapToQuestionDTO(question);
        }

        public async Task<IEnumerable<ExamQuestionDTO>> GetQuestionsByExamId(int examId)
        {
            if (examId <= 0)
                throw new ArgumentException("Invalid exam ID");

            var questions = await _examRepository.GetQuestionsByExamId(examId);
            return questions.Select(MapToQuestionDTO);
        }

        // ==================== HELPER METHODS ====================

        private void ValidateIds(int id, int secondId)
        {
            if (id <= 0)
                throw new ArgumentException("Invalid ID");
            if (secondId < 0)
                throw new ArgumentException("Invalid secondary ID");
        }

        private ExamDTO MapToExamDTO(Exam exam)
        {
            return new ExamDTO
            {
                ExamId = exam.ExamId,
                CourseName = exam.Course?.Name,
                Title = exam.Title,
                ExamDate = exam.ExamDate,
                Duration = exam.Duration,
                TotalPoints = exam.TotalPoints,
                CourseId = exam.CourseId
            };
        }

        private ExamQuestionDTO MapToQuestionDTO(ExamQuestion question)
        {
            return new ExamQuestionDTO
            {
                QuestionId = question.QuestionId,
                QuestionText = question.QuestionText,
                OrderNumber = question.OrderNumber,
                Score = question.Score,
               
                MCQOptions = question.Options?
                    .OrderBy(o => o.OrderNumber)
                    .Select(o => new MCQOptionDTO
                    {
                        OptionId = o.OptionId,
                        OptionText = o.OptionText,
                        OrderNumber = o.OrderNumber,
                        IsCorrect = o.IsCorrect
                    }).ToList() ?? new List<MCQOptionDTO>()
            };
        }
    }
}