using Microsoft.EntityFrameworkCore;
using University.App.Interfaces;
using University.Core.Entities;
using University.Infra.Data;

namespace University.Infra.Repositories
{
    public class ExamRepository : IExamRepository
    {
        private readonly UniversityDbContext _context;

        public ExamRepository(UniversityDbContext context)
        {
            _context = context;
        }

        // ===== EXAM CRUD =====

        public async Task<IEnumerable<Exam>> GetAllExams()
        {
            return await _context.Exams
                .Include(e => e.Course)
                .Where(e => !e.IsDeleted)
                .ToListAsync();
        }

        public async Task<IEnumerable<Exam>> GetAllExamsForCourse(int courseId)
        {
            return await _context.Exams
                .Include(e => e.Course)
                .Where(e => e.CourseId == courseId && !e.IsDeleted)
                .ToListAsync();
        }

        public async Task<Exam?> GetExamById(int id, int courseId)
        {
            return await _context.Exams
                .Include(e => e.Course)
                .FirstOrDefaultAsync(e => e.ExamId == id
                    && e.CourseId == courseId
                    && !e.IsDeleted);
        }

        public async Task<Exam?> GetExamByIdWithQuestions(int id, int courseId)
        {
            return await _context.Exams
                .Include(e => e.Course)
                .Include(e => e.ExamQuestions.OrderBy(q => q.OrderNumber))
                    .ThenInclude(q => q.Options.OrderBy(o => o.OrderNumber))
                .FirstOrDefaultAsync(e => e.ExamId == id
                    && e.CourseId == courseId
                    && !e.IsDeleted);
        }

        public async Task<Exam?> AddExam(Exam exam)
        {
            exam.IsDeleted = false;
            exam.CreatedAt = DateTime.UtcNow;
            exam.UpdatedAt = DateTime.UtcNow;

            await _context.Exams.AddAsync(exam);
            await _context.SaveChangesAsync();
            return exam;
        }

        public async Task<Exam?> UpdateExam(Exam exam)
        {
            exam.UpdatedAt = DateTime.UtcNow;
            _context.Exams.Update(exam);
            await _context.SaveChangesAsync();
            return exam;
        }

        public async Task<bool> DeleteExam(int id, int courseId)
        {
            var exam = await _context.Exams
                .FirstOrDefaultAsync(e => e.ExamId == id
                    && e.CourseId == courseId
                    && !e.IsDeleted);

            if (exam == null)
                return false;

            // Soft delete
            exam.IsDeleted = true;
            exam.DeletedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return true;
        }

        // ===== QUESTION CRUD (All MCQ now) =====

        public async Task<ExamQuestion?> GetQuestionById(int questionId, int examId)
        {
            return await _context.ExamQuestions
                .Include(q => q.Options.OrderBy(o => o.OrderNumber))
                .FirstOrDefaultAsync(q => q.QuestionId == questionId
                    && q.ExamId == examId);
        }

        public async Task<ExamQuestion?> AddExamQuestion(ExamQuestion question)
        {
           
            await _context.ExamQuestions.AddAsync(question);
            await _context.SaveChangesAsync();
            return question;
        }

        public async Task<ExamQuestion?> UpdateExamQuestion(ExamQuestion question)
        {
            _context.ExamQuestions.Update(question);
            await _context.SaveChangesAsync();
            return question;
        }

        public async Task<bool> DeleteExamQuestion(int questionId, int examId)
        {
            var question = await _context.ExamQuestions
                .FirstOrDefaultAsync(q => q.QuestionId == questionId
                    && q.ExamId == examId);

            if (question == null)
                return false;

            _context.ExamQuestions.Remove(question);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<IEnumerable<ExamQuestion>> GetQuestionsByExamId(int examId)
        {
            return await _context.ExamQuestions
                .Include(q => q.Options.OrderBy(o => o.OrderNumber))
                .Where(q => q.ExamId == examId)
                .OrderBy(q => q.OrderNumber)
                .ToListAsync();
        }

        // ===== MCQ OPTIONS CRUD (Used for ALL questions now) =====

        public async Task<MCQOption> AddExamMcqOption(MCQOption examOption)
        {
            await _context.MCQOptions.AddAsync(examOption);
            await _context.SaveChangesAsync();
            return examOption;
        }

        public async Task<MCQOption?> UpdateMCQOption(MCQOption option)
        {
            _context.MCQOptions.Update(option);
            await _context.SaveChangesAsync();
            return option;
        }

        public async Task<bool> DeleteMCQOption(int optionId)
        {
            var option = await _context.MCQOptions.FindAsync(optionId);
            if (option == null)
                return false;

            _context.MCQOptions.Remove(option);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<IEnumerable<MCQOption>> GetMCQOptionsByQuestionId(int questionId)
        {
            return await _context.MCQOptions
                .Where(o => o.QuestionId == questionId)
                .OrderBy(o => o.OrderNumber)
                .ToListAsync();
        }

    }
}