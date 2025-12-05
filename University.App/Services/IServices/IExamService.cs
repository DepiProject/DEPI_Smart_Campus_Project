using University.App.DTOs;

namespace University.App.Services.IServices
{
    public interface IExamService
    {
        // EXAM CRUD 
        Task<IEnumerable<ExamDTO>> GetAllExams();
        Task<IEnumerable<ExamDTO>> GetAllExamsForCourse(int courseId);
        Task<ExamDTO?> GetExamById(int id, int courseId);
        Task<ExamWithQuestionsDTO?> GetExamWithQuestions(int id, int courseId);
        Task<CreateExamDto?> AddExam(CreateExamDto dto);
        Task<ExamDTO?> UpdateExam(int id, int courseId, UpdateExamDto dto);
        Task<bool> DeleteExam(int id, int courseId);

        // ===== QUESTION CRUD (Simplified - All MCQ) =====
        Task<ExamQuestionDTO?> AddExamQuestion(CreateQuestionDto dto);
        Task<ExamQuestionDTO?> UpdateExamQuestion(int questionId, int examId, UpdateQuestionDto dto);
        Task<bool> DeleteExamQuestion(int questionId, int examId);
        Task<ExamQuestionDTO?> GetQuestionById(int questionId, int examId);
        Task<IEnumerable<ExamQuestionDTO>> GetQuestionsByExamId(int examId);
    }
}