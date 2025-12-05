using Microsoft.EntityFrameworkCore;
using University.App.Interfaces;
using University.Core.Entities;
using University.Infra.Data;

namespace University.Infra.Repositories
{
    public class SubmissionRepository : ISubmissionRepository
    {
        private readonly UniversityDbContext _context;

        public SubmissionRepository(UniversityDbContext context)
        {
            _context = context;
        }

        // ========== SUBMISSION CRUD ==========

        public async Task<ExamSubmission?> GetSubmissionAsync(int examId, int studentId)
        {
            return await _context.ExamSubmissions
                .Include(s => s.Answers)
                .Where(s => !s.IsDeleted)
                .FirstOrDefaultAsync(s => s.ExamId == examId && s.StudentId == studentId);
        }

        public async Task<ExamSubmission?> GetSubmissionByIdAsync(int submissionId)
        {
            return await _context.ExamSubmissions
                .Include(s => s.Answers)
                .Include(s => s.Exam)
                .Include(s => s.Student)
                .Include(s => s.Instructor)
                .Where(s => !s.IsDeleted)
                .FirstOrDefaultAsync(s => s.SubmissionId == submissionId);
        }

        public async Task<ExamSubmission?> GetSubmissionWithDetailsAsync(int examId, int studentId)
        {
            return await _context.ExamSubmissions
                .Include(s => s.Answers)
                    .ThenInclude(a => a.Question)
                        .ThenInclude(q => q.Options)
                .Include(s => s.Exam)
                    .ThenInclude(e => e.Course)
                .Include(s => s.Exam)
                    .ThenInclude(e => e.ExamQuestions)
                .Include(s => s.Student)
                .Include(s => s.Instructor)
                .Where(s => !s.IsDeleted)
                .FirstOrDefaultAsync(s => s.ExamId == examId && s.StudentId == studentId);
        }

        public async Task<IEnumerable<ExamSubmission>> GetStudentSubmissionsAsync(int studentId)
        {
            return await _context.ExamSubmissions
                .Include(s => s.Exam)
                    .ThenInclude(e => e.Course)
                .Include(s => s.Instructor)
                .Where(s => s.StudentId == studentId && !s.IsDeleted)
                .OrderByDescending(s => s.StartedAt)
                .ToListAsync();
        }

        public async Task<IEnumerable<ExamSubmission>> GetExamSubmissionsAsync(int examId)
        {
            return await _context.ExamSubmissions
                .Include(s => s.Student)
                .Include(s => s.Instructor)
                .Include(s => s.Answers)
                .Where(s => s.ExamId == examId && !s.IsDeleted)
                .OrderByDescending(s => s.StartedAt)
                .ToListAsync();
        }

        public async Task AddSubmissionAsync(ExamSubmission submission)
        {
            await _context.ExamSubmissions.AddAsync(submission);
        }

        public async Task UpdateSubmissionAsync(ExamSubmission submission)
        {
            _context.ExamSubmissions.Update(submission);
        }

        // ========== ANSWER CRUD ==========

        public async Task AddAnswerAsync(ExamAnswer answer)
        {
            await _context.ExamAnswers.AddAsync(answer);
        }

        public async Task UpdateAnswerAsync(ExamAnswer answer)
        {
            _context.ExamAnswers.Update(answer);
        }

        public async Task<ExamAnswer?> GetAnswerAsync(int submissionId, int questionId)
        {
            return await _context.ExamAnswers
                .FirstOrDefaultAsync(a => a.SubmissionId == submissionId && a.QuestionId == questionId);
        }

        // ========== QUESTION/EXAM RETRIEVAL ==========

        public async Task<ExamQuestion?> GetQuestionByIdAsync(int questionId)
        {
            return await _context.ExamQuestions
                .Include(q => q.Options)
                .FirstOrDefaultAsync(q => q.QuestionId == questionId);
        }

        public async Task<Exam?> GetExamWithQuestionsAsync(int examId)
        {
            return await _context.Exams
                .Include(e => e.Course)
                .Include(e => e.ExamQuestions.OrderBy(q => q.OrderNumber))
                    .ThenInclude(q => q.Options.OrderBy(o => o.OrderNumber))
                .Where(e => !e.IsDeleted)
                .FirstOrDefaultAsync(e => e.ExamId == examId);
        }

        // ========== VALIDATION HELPER ==========

        /// <summary>
        /// Check if an exam has any submissions (started or submitted)
        /// </summary>
        public async Task<bool> HasSubmissionsAsync(int examId)
        {
            return await _context.ExamSubmissions
                .AnyAsync(s => s.ExamId == examId && !s.IsDeleted);
        }

        // ========== SOFT DELETE & RESTORE ==========

        public async Task<bool> DeleteSubmissionAsync(int submissionId)
        {
            var submission = await _context.ExamSubmissions
                .FirstOrDefaultAsync(s => s.SubmissionId == submissionId && !s.IsDeleted);

            if (submission == null)
                return false;

            submission.IsDeleted = true;
            submission.DeletedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> RestoreSubmissionAsync(int submissionId)
        {
            var submission = await _context.ExamSubmissions
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(s => s.SubmissionId == submissionId);

            if (submission == null)
                return false;

            if (!submission.IsDeleted)
                throw new InvalidOperationException("Submission is not deleted.");

            submission.IsDeleted = false;
            submission.DeletedAt = null;

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<IEnumerable<ExamSubmission>> GetAllSubmissionsIncludingDeletedAsync()
        {
            return await _context.ExamSubmissions
                .IgnoreQueryFilters()
                .Include(s => s.Exam)
                    .ThenInclude(e => e.Course)
                .Include(s => s.Student)
                .Include(s => s.Instructor)
                .OrderByDescending(s => s.StartedAt)
                .ToListAsync();
        }

        // ========== SAVE CHANGES ==========

        public async Task SaveChangesAsync()
        {
            await _context.SaveChangesAsync();
        }
    }
}