using University.App.DTOs;

namespace University.App.Validators
{
    public class ExamValidator
    {
        public Task ValidateCreateExamAsync(CreateExamDto dto)
        {
            if (dto == null)
                throw new ArgumentNullException(nameof(dto), "Exam data cannot be null");

            if (string.IsNullOrWhiteSpace(dto.Title))
                throw new ArgumentException("Exam title is required");

            if (dto.Title.Length > 200)
                throw new ArgumentException("Exam title cannot exceed 200 characters");

            if (dto.ExamDate < DateTime.UtcNow)
                throw new ArgumentException("Exam date cannot be in the past");

            if (dto.Duration <= 0)
                throw new ArgumentException("Duration must be greater than 0 minutes");

            if (dto.Duration > 480) // 8 hours max
                throw new ArgumentException("Duration cannot exceed 480 minutes (8 hours)");

            if (dto.TotalPoints <= 0)
                throw new ArgumentException("Total points must be greater than 0");

            if (dto.TotalPoints > 1000)
                throw new ArgumentException("Total points cannot exceed 1000");

            return Task.CompletedTask;
        }

        public Task ValidateUpdateExamAsync(UpdateExamDto dto)
        {
            if (dto == null)
                throw new ArgumentNullException(nameof(dto), "Exam data cannot be null");

            if (string.IsNullOrWhiteSpace(dto.Title))
                throw new ArgumentException("Exam title is required");

            if (dto.Title.Length > 200)
                throw new ArgumentException("Exam title cannot exceed 200 characters");

            if (dto.ExamDate < DateTime.UtcNow)
                throw new ArgumentException("Exam date cannot be in the past");

            if (dto.Duration <= 0)
                throw new ArgumentException("Duration must be greater than 0 minutes");

            if (dto.Duration > 480)
                throw new ArgumentException("Duration cannot exceed 480 minutes (8 hours)");

            if (dto.TotalPoints <= 0)
                throw new ArgumentException("Total points must be greater than 0");

            if (dto.TotalPoints > 1000)
                throw new ArgumentException("Total points cannot exceed 1000");

            return Task.CompletedTask;
        }
    }

    public class ExamQuestionValidator
    {
        public void ValidateCreateOrUpdateQuestion(CreateQuestionDto dto)
        {
            if (dto == null)
                throw new ArgumentNullException(nameof(dto), "Question data cannot be null");

            if (string.IsNullOrWhiteSpace(dto.QuestionText))
                throw new ArgumentException("Question text is required");

            if (dto.QuestionText.Length > 1000)
                throw new ArgumentException("Question text cannot exceed 1000 characters");

            if (dto.Score <= 0)
                throw new ArgumentException("Question score must be greater than 0");

            if (dto.Score > 100)
                throw new ArgumentException("Question score cannot exceed 100 points");

            if (dto.OrderNumber <= 0)
                throw new ArgumentException("Question order number must be greater than 0");

            // Validate MCQ Options
            if (dto.MCQOptions == null || dto.MCQOptions.Count < 2)
                throw new ArgumentException("Question must have at least 2 options");

            if (dto.MCQOptions.Count > 10)
                throw new ArgumentException("Question cannot have more than 10 options");

            var correctOptionsCount = dto.MCQOptions.Count(o => o.IsCorrect);
            if (correctOptionsCount != 1)
                throw new ArgumentException("Exactly one option must be marked as correct");

            // Validate each option
            var orderNumbers = new HashSet<int>();
            foreach (var option in dto.MCQOptions)
            {
                if (string.IsNullOrWhiteSpace(option.OptionText))
                    throw new ArgumentException("All option texts are required");

                if (option.OptionText.Length > 500)
                    throw new ArgumentException("Option text cannot exceed 500 characters");

                if (option.OrderNumber <= 0)
                    throw new ArgumentException("Option order number must be greater than 0");

                if (!orderNumbers.Add(option.OrderNumber))
                    throw new ArgumentException($"Duplicate option order number: {option.OrderNumber}");
            }

            // Check for duplicate option texts
            var optionTexts = dto.MCQOptions.Select(o => o.OptionText.Trim().ToLower()).ToList();
            if (optionTexts.Count != optionTexts.Distinct().Count())
                throw new ArgumentException("Option texts must be unique");
        }
    }
}