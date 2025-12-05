using University.App.DTOs;
using University.App.Interfaces;
using University.App.Services.IServices;
using University.App.Validators;
using University.Core.Entities;

namespace University.App.Services.Implementations
{
    public class ExamService : IExamService
    {
        private readonly IExamRepository _examRepository;
        private readonly ISubmissionRepository _submissionRepository;
        private readonly ExamValidator _examValidator;
        private readonly ExamQuestionValidator _questionValidator;

        public ExamService(
            IExamRepository examRepository,
            ISubmissionRepository submissionRepository,
            ExamValidator examValidator,
            ExamQuestionValidator questionValidator)
        {
            _examRepository = examRepository;
            _submissionRepository = submissionRepository;
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
            
            if (dto == null)
                throw new ArgumentNullException(nameof(dto));

            // Validate exam data
            await _examValidator.ValidateCreateExamAsync(dto);

            if (dto.CourseId <= 0)
                throw new ArgumentException("Invalid course ID");

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

            await _examRepository.AddExam(exam);
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
            
            if (dto == null)
                throw new ArgumentNullException(nameof(dto));

            if (dto.ExamId <= 0)
                throw new ArgumentException("Invalid exam ID");

            // Validate question data
            _questionValidator.ValidateCreateOrUpdateQuestion(dto);

            // Check if exam exists
            var exam = await _examRepository.GetExamById(dto.ExamId, dto.CourseId);
            if (exam == null)
                throw new KeyNotFoundException($"Exam with ID {dto.ExamId} not found");

            // Check if exam has submissions
            var hasSubmissions = await _submissionRepository.HasSubmissionsAsync(dto.ExamId);
            if (hasSubmissions)
                throw new InvalidOperationException("Cannot add questions - students have already submitted");

            var question = new ExamQuestion
            {
                QuestionText = dto.QuestionText.Trim(),
                Score = dto.Score,
                OrderNumber = dto.OrderNumber,
                ExamId = dto.ExamId
            };

            var addedQuestion = await _examRepository.AddExamQuestion(question);
            if (addedQuestion == null)
                throw new InvalidOperationException("Failed to add question");

            // Add MCQ Options
            foreach (var optionDto in dto.MCQOptions)
            {
                await _examRepository.AddExamMcqOption(new MCQOption
                {
                    OptionText = optionDto.OptionText.Trim(),
                    OrderNumber = optionDto.OrderNumber,
                    IsCorrect = optionDto.IsCorrect,
                    QuestionId = addedQuestion.QuestionId
                });
            }

            // Retrieve complete question with options
            var completeQuestion = await _examRepository.GetQuestionById(addedQuestion.QuestionId, dto.ExamId);
            return completeQuestion != null ? MapToQuestionDTO(completeQuestion) : null;
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