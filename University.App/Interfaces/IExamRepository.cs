using University.Core.Entities;
namespace University.App.Interfaces
{
    public interface IExamRepository
    {
        // Exam CRUD
        Task<IEnumerable<Exam>> GetAllExams(bool includeDeleted = false);
        Task<IEnumerable<Exam>> GetAllExamsForCourse(int courseId, bool includeDeleted = false);
        Task<IEnumerable<Exam>> GetAllExamsForInstructor(int instructorId, bool includeDeleted = true);
        Task<Exam?> GetExamById(int id, int courseId);
        Task<Exam?> GetExamByIdWithQuestions(int id, int courseId);
        Task<Exam?> AddExam(Exam exam);
        Task<Exam?> UpdateExam(Exam exam);
        Task<bool> DeleteExam(int id, int courseId);

        // Question CRUD (Simplified - All MCQ now)
        Task<ExamQuestion?> GetQuestionById(int questionId, int examId);
        Task<ExamQuestion?> AddExamQuestion(ExamQuestion question);
        Task<ExamQuestion?> UpdateExamQuestion(ExamQuestion question);
        Task<bool> DeleteExamQuestion(int questionId, int examId);
        Task<IEnumerable<ExamQuestion>> GetQuestionsByExamId(int examId);

        // MCQ Options CRUD (Used for all questions including True/False)
        Task<MCQOption> AddExamMcqOption(MCQOption examOption);
        Task<MCQOption?> UpdateMCQOption(MCQOption option);
        Task<bool> DeleteMCQOption(int optionId);
        Task<IEnumerable<MCQOption>> GetMCQOptionsByQuestionId(int questionId);
    }
}