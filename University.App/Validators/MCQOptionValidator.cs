using University.Core.Entities;

namespace University.App.Validators
{
    public class MCQOptionValidator
    {
        public void ValidateOptions(List<MCQOption> options)
        {
            if (options.Count < 2)
                throw new Exception("Question must have at least 2 options");

            if (options.Count(o => o.IsCorrect) != 1)
                throw new Exception("Exactly one option must be correct");
        }
    }

}
