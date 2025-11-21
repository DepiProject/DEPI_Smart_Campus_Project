using University.Core.Entities;

namespace University.App.Interfaces
{
    public interface ISubmissionRepository
    {
        // Submission CRUD
        Task<ExamSubmission?> GetSubmissionAsync(int examId, int studentId);
        Task<ExamSubmission?> GetSubmissionByIdAsync(int submissionId);
        Task<ExamSubmission?> GetSubmissionWithDetailsAsync(int examId, int studentId);
        Task<IEnumerable<ExamSubmission>> GetStudentSubmissionsAsync(int studentId);
        Task<IEnumerable<ExamSubmission>> GetExamSubmissionsAsync(int examId);
        Task AddSubmissionAsync(ExamSubmission submission);
        Task UpdateSubmissionAsync(ExamSubmission submission);

        // Answer CRUD
        Task AddAnswerAsync(ExamAnswer answer);
        Task UpdateAnswerAsync(ExamAnswer answer);
        Task<ExamAnswer?> GetAnswerAsync(int submissionId, int questionId);

        // Question/Exam retrieval
        Task<ExamQuestion?> GetQuestionByIdAsync(int questionId);
        Task<Exam?> GetExamWithQuestionsAsync(int examId);

        // Save changes
        Task SaveChangesAsync();

        // ADD THIS METHOD - Check if exam has any submissions
        Task<bool> HasSubmissionsAsync(int examId);
    }
}