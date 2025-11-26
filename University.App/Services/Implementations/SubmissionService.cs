using University.App.DTOs;
using University.App.Interfaces;
using University.App.Services.IServices;
using University.Core.Entities;

namespace SmartCampus.App.Services.Implementations
{
    public class SubmissionService : ISubmissionService
    {
        private readonly ISubmissionRepository _submissionRepository;

        public SubmissionService(ISubmissionRepository submissionRepository)
        {
            _submissionRepository = submissionRepository;
        }

        // Start exam 
        public async Task<ExamSubmissionDto> StartExamAsync(int examId, int studentId)
        {
            if (examId <= 0)
                throw new ArgumentException("Invalid exam id.");

            if (studentId <= 0)
                throw new ArgumentException("Invalid student id.");

            var existingSubmission = await _submissionRepository.GetSubmissionAsync(examId, studentId);
            if (existingSubmission != null)
                throw new InvalidOperationException("You have already started this exam.");

            var exam = await _submissionRepository.GetExamWithQuestionsAsync(examId);
            if (exam == null)
                throw new InvalidOperationException("Exam not found.");

            // Check if exam is available
            if (exam.ExamDate > DateTime.UtcNow)
                throw new InvalidOperationException("This exam is not available yet.");

            // Check exam has questions
            if (exam.ExamQuestions == null || exam.ExamQuestions.Count == 0)
                throw new InvalidOperationException("This exam has no questions.");

            var submission = new ExamSubmission
            {
                ExamId = examId,
                StudentId = studentId,
                StartedAt = DateTime.UtcNow,
                SubmittedAt = null,
                Score = null,
                Instructor = null
            };

            await _submissionRepository.AddSubmissionAsync(submission);
            await _submissionRepository.SaveChangesAsync();

            return new ExamSubmissionDto
            {
                SubmissionId = submission.SubmissionId,
                ExamId = submission.ExamId ?? 0,
                ExamTitle = exam.Title,
                StudentId = submission.StudentId ?? 0,
                StartedAt = submission.StartedAt,
                SubmittedAt = submission.SubmittedAt,
                IsSubmitted = false,
                IsGraded = false
            };
        }

        //Submit exam  
        public async Task<ExamResultDto> SubmitExamAsync(SubmitExamDto dto)
        {
            if (dto == null)
                throw new ArgumentNullException(nameof(dto), "Invalid submit request.");

            if (dto.ExamId <= 0 || dto.StudentId <= 0)
                throw new ArgumentException("Invalid exam or student id.");

            // validate submission exists
            var submission = await _submissionRepository.GetSubmissionAsync(dto.ExamId, dto.StudentId);
            if (submission == null)
                throw new InvalidOperationException("Exam not started, start the exam first.");

            if (submission.SubmittedAt.HasValue)
                throw new InvalidOperationException("Exam already submitted.");

            var exam = await _submissionRepository.GetExamWithQuestionsAsync(dto.ExamId);
            if (exam == null)
                throw new InvalidOperationException("Exam not found.");





            // check time
            var examEndTime = submission.StartedAt.AddMinutes(exam.Duration);
            if (DateTime.UtcNow > examEndTime)
                throw new InvalidOperationException("Time is over. You cannot submit this exam.");

            
            // grade answers
            decimal totalScore = 0;
            int correctAnswers = 0;
            var questionResults = new List<QuestionResultDto>();

            // HashSet to track answered question IDs
            var answeredQuestions = new HashSet<int>();

            foreach (var answerDto in dto.Answers)
            {
                if (answerDto.QuestionId <= 0)
                    continue;

                // check for duplicate answers
                if (!answeredQuestions.Add(answerDto.QuestionId))
                    throw new InvalidOperationException($"Duplicate answer detected for QuestionId {answerDto.QuestionId}.");

                var question = await _submissionRepository.GetQuestionByIdAsync(answerDto.QuestionId);
                if (question == null || question.ExamId != dto.ExamId)
                    continue;

                bool isCorrect = false;
                decimal pointsAwarded = 0;

                var selectedOption = question.Options
                    .FirstOrDefault(o => o.OptionId == answerDto.SelectedOptionId);

                var correctOption = question.Options.FirstOrDefault(o => o.IsCorrect);

                if (selectedOption != null && selectedOption.IsCorrect)
                {
                    isCorrect = true;
                    pointsAwarded = question.Score;
                    correctAnswers++;
                }

                questionResults.Add(new QuestionResultDto
                {
                    QuestionId = question.QuestionId,
                    QuestionText = question.QuestionText,
                    MaxScore = question.Score,
                    PointsAwarded = pointsAwarded,
                    IsCorrect = isCorrect,
                    StudentSelectedOptionId = answerDto.SelectedOptionId,
                    StudentSelectedOptionText = selectedOption?.OptionText,
                    CorrectOptionId = correctOption?.OptionId,
                    CorrectOptionText = correctOption?.OptionText
                });

                var examAnswer = new ExamAnswer
                {
                    SubmissionId = submission.SubmissionId,
                    QuestionId = question.QuestionId,
                    SelectedOptionId = answerDto.SelectedOptionId,
                    IsCorrect = isCorrect,
                    PointsAwarded = pointsAwarded
                };

                await _submissionRepository.AddAnswerAsync(examAnswer);

                totalScore += pointsAwarded;
            }


            // update submission
            submission.SubmittedAt = DateTime.UtcNow;
            submission.Score = totalScore;
            await _submissionRepository.UpdateSubmissionAsync(submission);
            await _submissionRepository.SaveChangesAsync();

            // calc percentage
            decimal percentage = exam.TotalPoints > 0
                ? (totalScore / exam.TotalPoints) * 100
                : 0;

            return new ExamResultDto
            {
                SubmissionId = submission.SubmissionId,
                ExamId = exam.ExamId,
                ExamTitle = exam.Title,
                StudentId = submission.StudentId ?? 0,
                Score = totalScore,
                TotalPoints = exam.TotalPoints,
                Percentage = Math.Round(percentage, 2),
                CorrectAnswers = correctAnswers,
                TotalQuestions = exam.ExamQuestions.Count,
                IsSubmitted = true,
                IsGraded = submission.InstructorId.HasValue,
                StartedAt = submission.StartedAt,
                SubmittedAt = submission.SubmittedAt,
                QuestionResults = questionResults
            };
        }

        // Get result 
        public async Task<ExamResultDto?> GetExamResultAsync(int examId, int studentId)
        {
            if (examId <= 0 || studentId <= 0)
                throw new ArgumentException("Invalid request.");

            var submission = await _submissionRepository.GetSubmissionWithDetailsAsync(examId, studentId);
            if (submission == null || !submission.SubmittedAt.HasValue)
                return null;

            var questionResults = new List<QuestionResultDto>();

            foreach (var answer in submission.Answers)
            {
                var question = answer.Question;
                if (question == null) continue;

                var q = new QuestionResultDto
                {
                    QuestionId = question.QuestionId,
                    QuestionText = question.QuestionText,
                    MaxScore = question.Score,
                    PointsAwarded = answer.PointsAwarded ?? 0,
                    IsCorrect = answer.IsCorrect ?? false
                };

                q.StudentSelectedOptionId = answer.SelectedOptionId;
                var selectedOption = question.Options.FirstOrDefault(o => o.OptionId == answer.SelectedOptionId);
                q.StudentSelectedOptionText = selectedOption?.OptionText;

                var correctOption = question.Options.FirstOrDefault(o => o.IsCorrect);
                q.CorrectOptionId = correctOption?.OptionId;
                q.CorrectOptionText = correctOption?.OptionText;

                questionResults.Add(q);
            }

            decimal percentage = submission.Exam.TotalPoints > 0
                ? ((submission.Score ?? 0) / submission.Exam.TotalPoints) * 100
                : 0;

            return new ExamResultDto
            {
                SubmissionId = submission.SubmissionId,
                ExamId = submission.ExamId ?? 0,
                ExamTitle = submission.Exam?.Title ?? "",
                StudentId = submission.StudentId ?? 0,
                StudentName = submission.Student?.FullName ?? "",
                Score = submission.Score ?? 0,
                TotalPoints = submission.Exam?.TotalPoints ?? 0,
                Percentage = Math.Round(percentage, 2),
                CorrectAnswers = submission.Answers.Count(a => a.IsCorrect == true),
                TotalQuestions = submission.Exam?.ExamQuestions.Count ?? 0,
                IsSubmitted = submission.SubmittedAt.HasValue,
                IsGraded = submission.InstructorId.HasValue,
                StartedAt = submission.StartedAt,
                SubmittedAt = submission.SubmittedAt,
                GradedBy = submission.InstructorId,
                GradedByName = submission.Instructor?.FullName,
                QuestionResults = questionResults
            };
        }

        // Submission status 
        public async Task<ExamSubmissionDto?> GetSubmissionStatusAsync(int examId, int studentId)
        {
            if (examId <= 0 || studentId <= 0)
                throw new ArgumentException("Invalid request.");

            var submission = await _submissionRepository.GetSubmissionWithDetailsAsync(examId, studentId);
            if (submission == null)
                return null;

            return new ExamSubmissionDto
            {
                SubmissionId = submission.SubmissionId,
                ExamId = submission.ExamId ?? 0,
                ExamTitle = submission.Exam?.Title ?? "",
                StudentId = submission.StudentId ?? 0,
                StudentName = submission.Student?.FullName ?? "",
                StartedAt = submission.StartedAt,
                SubmittedAt = submission.SubmittedAt,
                Score = submission.Score,
                IsSubmitted = submission.SubmittedAt.HasValue,
                IsGraded = submission.InstructorId.HasValue,
                GradedBy = submission.InstructorId
            };
        }

        // Get all submissions for student 
        public async Task<IEnumerable<ExamSubmissionDto>> GetStudentSubmissionsAsync(int studentId)
        {
            if (studentId <= 0)
                throw new ArgumentException("Invalid student id.");

            var submissions = await _submissionRepository.GetStudentSubmissionsAsync(studentId);

            return submissions.Select(s => new ExamSubmissionDto
            {
                SubmissionId = s.SubmissionId,
                ExamId = s.ExamId ?? 0,
                ExamTitle = s.Exam?.Title ?? "",
                StudentId = s.StudentId ?? 0,
                StartedAt = s.StartedAt,
                SubmittedAt = s.SubmittedAt,
                Score = s.Score,
                IsSubmitted = s.SubmittedAt.HasValue,
                IsGraded = s.InstructorId.HasValue,
                GradedBy = s.InstructorId
            });
        }

        //Get all submissioms for exam 
        public async Task<IEnumerable<ExamResultDto>> GetExamSubmissionsAsync(int examId)
        {
            if (examId <= 0)
                throw new ArgumentException("Invalid exam id.");

            var submissions = await _submissionRepository.GetExamSubmissionsAsync(examId);
            var exam = await _submissionRepository.GetExamWithQuestionsAsync(examId);

            return submissions
                .Where(s => s.SubmittedAt.HasValue)
                .Select(s =>
                {
                    decimal percentage = exam?.TotalPoints > 0
                        ? ((s.Score ?? 0) / exam.TotalPoints) * 100
                        : 0;

                    return new ExamResultDto
                    {
                        SubmissionId = s.SubmissionId,
                        ExamId = s.ExamId ?? 0,
                        ExamTitle = s.Exam?.Title ?? "",
                        StudentId = s.StudentId ?? 0,
                        StudentName = s.Student?.FullName ?? "",
                        Score = s.Score ?? 0,
                        TotalPoints = exam?.TotalPoints ?? 0,
                        Percentage = Math.Round(percentage, 2),
                        CorrectAnswers = s.Answers?.Count(a => a.IsCorrect == true) ?? 0,
                        TotalQuestions = exam?.ExamQuestions.Count ?? 0,
                        IsSubmitted = s.SubmittedAt.HasValue,
                        IsGraded = s.InstructorId.HasValue,
                        StartedAt = s.StartedAt,
                        SubmittedAt = s.SubmittedAt,
                        GradedBy = s.InstructorId,
                        GradedByName = s.Instructor?.FullName
                    };
                });
        }

        // Soft delete submission
        public async Task<bool> DeleteSubmissionAsync(int submissionId)
        {
            if (submissionId <= 0)
                throw new ArgumentException("Invalid submission ID.");

            return await _submissionRepository.DeleteSubmissionAsync(submissionId);
        }

        // Restore submission
        public async Task<bool> RestoreSubmissionAsync(int submissionId)
        {
            if (submissionId <= 0)
                throw new ArgumentException("Invalid submission ID.");

            return await _submissionRepository.RestoreSubmissionAsync(submissionId);
        }

        // Get all submissions including deleted
        public async Task<IEnumerable<ExamSubmissionDto>> GetAllSubmissionsIncludingDeletedAsync()
        {
            var submissions = await _submissionRepository.GetAllSubmissionsIncludingDeletedAsync();

            return submissions.Select(s => new ExamSubmissionDto
            {
                SubmissionId = s.SubmissionId,
                ExamId = s.ExamId ?? 0,
                ExamTitle = s.Exam?.Title ?? "",
                StudentId = s.StudentId ?? 0,
                StudentName = s.Student?.FullName ?? "",
                StartedAt = s.StartedAt,
                SubmittedAt = s.SubmittedAt,
                Score = s.Score,
                IsSubmitted = s.SubmittedAt.HasValue,
                IsGraded = s.InstructorId.HasValue,
                GradedBy = s.InstructorId
            });
        }
    }
}