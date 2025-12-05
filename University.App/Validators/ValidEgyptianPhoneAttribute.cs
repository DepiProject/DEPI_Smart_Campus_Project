using System.ComponentModel.DataAnnotations;

namespace University.App.Validators
{
    /// <summary>
    /// Custom validation attribute for Egyptian phone numbers
    /// Ensures:
    /// 1. Phone number starts with 010, 011, 012, or 015
    /// 2. Last 8 digits are not all the same number
    /// </summary>
    public class ValidEgyptianPhoneAttribute : ValidationAttribute
    {
        protected override ValidationResult? IsValid(object? value, ValidationContext validationContext)
        {
            // If null or empty, let [Required] handle it
            if (value == null || string.IsNullOrWhiteSpace(value.ToString()))
                return ValidationResult.Success;

            string phoneNumber = value.ToString()!.Trim();

            // Check if exactly 11 digits
            if (phoneNumber.Length != 11 || !phoneNumber.All(char.IsDigit))
            {
                return new ValidationResult("Contact number must be exactly 11 digits");
            }

            // Check if starts with valid Egyptian prefixes
            string prefix = phoneNumber.Substring(0, 3);
            if (prefix != "010" && prefix != "011" && prefix != "012" && prefix != "015")
            {
                return new ValidationResult("Contact number must start with 010, 011, 012, or 015");
            }

            // Check if last 8 digits are all the same
            string last8Digits = phoneNumber.Substring(3);
            if (last8Digits.Distinct().Count() == 1)
            {
                return new ValidationResult($"Contact number is invalid - last 8 digits cannot be all the same (e.g., {prefix}00000000)");
            }
            return ValidationResult.Success;
        }
    }
}
