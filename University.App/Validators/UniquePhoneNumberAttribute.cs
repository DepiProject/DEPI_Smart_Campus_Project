using System.ComponentModel.DataAnnotations;

namespace University.App.Validators
{
    /// <summary>
    /// Marker attribute for unique phone number validation
    /// Actual validation is performed in the service layer to avoid circular dependencies
    /// </summary>
    public class UniquePhoneNumberAttribute : ValidationAttribute
    {
        public UniquePhoneNumberAttribute()
        {
            ErrorMessage = "This phone number is already registered by another user";
        }

        protected override ValidationResult? IsValid(object? value, ValidationContext validationContext)
        {
            // This is just a marker attribute
            // Actual validation is done in the service layer
            return ValidationResult.Success;
        }
    }
}
