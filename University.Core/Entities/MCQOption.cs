namespace University.Core.Entities
{
    public class MCQOption
    {
        public int OptionId { get; set; }
        public string OptionText { get; set; } = string.Empty;
        public bool IsCorrect { get; set; } = false;
        public int OrderNumber { get; set; }

        public int QuestionId { get; set; }
        public ExamQuestion? ExamQuestion { get; set; }
    }
}
