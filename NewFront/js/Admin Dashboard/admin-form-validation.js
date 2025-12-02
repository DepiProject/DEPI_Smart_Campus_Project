/**
 * Advanced Real-time Form Validation for Admin Dashboard
 * Provides immediate feedback as users type/interact with forms
 */

// Validation Rules and Patterns
const ValidationRules = {
    // Name validation (letters, spaces, hyphens, apostrophes only)
    name: {
        pattern: /^[a-zA-Z\s'-]{2,50}$/,
        message: "Letters only, 2-50 characters"
    },
    
    // Email validation - MUST be university email (.edu, .ac, etc)
    email: {
        pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.(edu|ac)\.[a-zA-Z]{2,}$/,
        message: "Must be university email (.edu or .ac domain)"
    },
    
    // Egyptian phone number validation
    phone: {
        pattern: /^(010|011|012|015)\d{8}$/,
        message: "Must start with 010, 011, 012, or 015"
    },
    
    // Password validation (strong password)
    password: {
        pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
        message: "8+ chars with uppercase, lowercase, number & special char"
    },
    
    // Course name validation (must contain at least one letter)
    courseName: {
        pattern: /^(?=.*[a-zA-Z]).{3,80}$/,
        message: "3-80 characters, must contain at least one letter"
    },
    
    // Department name validation
    departmentName: {
        pattern: /^[a-zA-Z\s&-]{3,100}$/,
        message: "3-100 characters, letters and spaces only"
    }
};

// Validation Class
class FormValidator {
    constructor() {
        this.initializeValidation();
    }

    initializeValidation() {
        // Initialize validation for all forms when DOM is ready
        document.addEventListener('DOMContentLoaded', () => {
            this.setupInstructorValidation();
            this.setupStudentValidation();
            this.setupDepartmentValidation();
            this.setupCourseValidation();
        });
    }

    // Real-time validation helper
    addRealTimeValidation(fieldId, validationFn) {
        const field = document.getElementById(fieldId);
        if (!field) return;

        // Flag to track if user has interacted with field
        let userHasInteracted = false;

        // Add input event with debounce for better UX
        field.addEventListener('input', () => {
            userHasInteracted = true;
            
            // Clear previous validation timeout
            clearTimeout(field.validationTimeout);
            
            // Clear validation state immediately when user starts typing
            this.clearValidation(field);
            
            // Set timeout for validation after user stops typing
            field.validationTimeout = setTimeout(() => {
                validationFn(field);
            }, 300); // 300ms delay
        });

        // Add blur and change events for immediate validation (only after user interaction)
        ['blur', 'change'].forEach(event => {
            field.addEventListener(event, () => {
                if (userHasInteracted || field.value.trim() !== '') {
                    clearTimeout(field.validationTimeout);
                    validationFn(field);
                }
            });
        });

        // Reset interaction flag when form is reset
        field.addEventListener('reset', () => {
            userHasInteracted = false;
        });
    }

    // Show validation error
    showError(field, message) {
        field.classList.remove('is-valid');
        field.classList.add('is-invalid');
        
        const errorElement = document.getElementById(field.id + 'Error');
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        }
        
        // Add shake animation
        field.style.animation = 'invalidShake 0.6s ease-in-out';
        setTimeout(() => {
            field.style.animation = '';
        }, 600);
    }

    // Show validation success
    showSuccess(field) {
        field.classList.remove('is-invalid');
        field.classList.add('is-valid');
        
        // Clear error message
        const errorElement = document.getElementById(field.id + 'Error');
        if (errorElement) {
            errorElement.textContent = '';
            errorElement.style.display = 'none';
        }
        
        // Add pulse animation
        field.style.animation = 'validPulse 0.6s ease-in-out';
        setTimeout(() => {
            field.style.animation = '';
        }, 600);
    }

    // Clear validation state
    clearValidation(field) {
        field.classList.remove('is-invalid', 'is-valid');
        
        // Clear error message
        const errorElement = document.getElementById(field.id + 'Error');
        if (errorElement) {
            errorElement.textContent = '';
            errorElement.style.display = 'none';
        }
        
        // Reset field styling
        field.style.borderColor = '';
        field.style.animation = '';
    }

    // Generic field validation with enhanced messages
    validateField(field, rules, customMessage = null) {
        const value = field.value.trim();
        
        if (field.hasAttribute('required') && !value) {
            const fieldLabel = field.previousElementSibling?.textContent.replace('*', '').trim() || 'This field';
            this.showError(field, `${fieldLabel} is required`);
            return false;
        }

        if (value && rules.pattern && !rules.pattern.test(value)) {
            this.showError(field, customMessage || rules.message);
            return false;
        }

        if (value || field.hasAttribute('required')) {
            this.showSuccess(field);
        } else {
            this.clearValidation(field);
        }
        
        return true;
    }

    // Password strength indicator
    updatePasswordStrength(passwordField, strengthContainer, strengthText) {
        const password = passwordField.value;
        let strength = 0;
        let strengthLabel = 'Very Weak';
        let strengthColor = 'danger';

        if (password.length >= 8) strength++;
        if (/[a-z]/.test(password)) strength++;
        if (/[A-Z]/.test(password)) strength++;
        if (/\d/.test(password)) strength++;
        if (/[@$!%*?&]/.test(password)) strength++;

        const strengthPercentage = (strength / 5) * 100;

        switch (strength) {
            case 0:
            case 1:
                strengthLabel = 'Very Weak';
                strengthColor = 'danger';
                break;
            case 2:
                strengthLabel = 'Weak';
                strengthColor = 'warning';
                break;
            case 3:
                strengthLabel = 'Fair';
                strengthColor = 'info';
                break;
            case 4:
                strengthLabel = 'Good';
                strengthColor = 'primary';
                break;
            case 5:
                strengthLabel = 'Strong';
                strengthColor = 'success';
                break;
        }

        const progressBar = strengthContainer.querySelector('.progress-bar');
        if (progressBar) {
            progressBar.style.width = `${strengthPercentage}%`;
            progressBar.className = `progress-bar bg-${strengthColor}`;
        }

        if (strengthText) {
            strengthText.textContent = strengthLabel;
            strengthText.className = `text-${strengthColor}`;
        }
    }

    // Phone number validation with format helper
    validatePhone(field) {
        const value = field.value.replace(/\D/g, ''); // Remove non-digits
        
        if (!value) {
            if (field.hasAttribute('required')) {
                this.showError(field, 'Phone number is required');
                return false;
            } else {
                this.clearValidation(field);
                return true;
            }
        }

        // Auto-format as user types
        if (value.length <= 11) {
            field.value = value;
        }

        if (value.length === 11 && ValidationRules.phone.pattern.test(value)) {
            // Check for invalid patterns (all same digits in last 8)
            const lastEight = value.slice(3);
            const allSame = lastEight.split('').every(digit => digit === lastEight[0]);
            
            if (allSame) {
                this.showError(field, 'Last 8 digits cannot be all the same');
                return false;
            }
            
            this.showSuccess(field);
            return true;
        } else if (value.length === 11) {
            this.showError(field, ValidationRules.phone.message);
            return false;
        } else if (value.length > 0) {
            this.showError(field, `Enter ${11 - value.length} more digits`);
            return false;
        }
        
        return true;
    }

    // INSTRUCTOR FORM VALIDATION
    setupInstructorValidation() {
        // First Name validation
        this.addRealTimeValidation('instructorFirstName', (field) => {
            this.validateField(field, ValidationRules.name);
        });

        // Last Name validation
        this.addRealTimeValidation('instructorLastName', (field) => {
            this.validateField(field, ValidationRules.name);
        });

        // Email validation
        this.addRealTimeValidation('instructorEmail', (field) => {
            this.validateField(field, ValidationRules.email);
        });

        // Department validation
        this.addRealTimeValidation('instructorDepartment', (field) => {
            // Only validate if field has value or user has explicitly interacted
            if (field.value) {
                this.showSuccess(field);
                return true;
            } else if (field.classList.contains('user-touched')) {
                this.showError(field, 'Please select a department');
                return false;
            }
            return true;
        });

        // Phone validation
        this.addRealTimeValidation('instructorPhone', (field) => {
            this.validatePhone(field);
        });

        // Password validation with strength indicator
        this.addRealTimeValidation('instructorPassword', (field) => {
            const isValid = this.validateField(field, ValidationRules.password);
            
            // Update password strength indicator
            const strengthContainer = document.getElementById('instructorPasswordStrength');
            const strengthText = document.getElementById('strengthText');
            if (strengthContainer) {
                this.updatePasswordStrength(field, strengthContainer, strengthText);
            }
            
            return isValid;
        });
    }

    // STUDENT FORM VALIDATION
    setupStudentValidation() {
        // First Name validation
        this.addRealTimeValidation('studentFirstName', (field) => {
            this.validateField(field, ValidationRules.name);
        });

        // Last Name validation
        this.addRealTimeValidation('studentLastName', (field) => {
            this.validateField(field, ValidationRules.name);
        });

        // Email validation
        this.addRealTimeValidation('studentEmail', (field) => {
            this.validateField(field, ValidationRules.email);
        });

        // Department validation
        this.addRealTimeValidation('studentDepartment', (field) => {
            if (field.value) {
                this.showSuccess(field);
                return true;
            } else if (field.classList.contains('user-touched')) {
                this.showError(field, 'Please select a department');
                return false;
            }
            return true;
        });

        // Level validation
        this.addRealTimeValidation('studentLevel', (field) => {
            if (field.value) {
                this.showSuccess(field);
                return true;
            } else if (field.classList.contains('user-touched')) {
                this.showError(field, 'Please select a level');
                return false;
            }
            return true;
        });

        // Phone validation
        this.addRealTimeValidation('studentPhone', (field) => {
            this.validatePhone(field);
        });

        // Password validation with strength indicator
        this.addRealTimeValidation('studentPassword', (field) => {
            const isValid = this.validateField(field, ValidationRules.password);
            
            // Update password strength indicator
            const strengthContainer = document.getElementById('studentPasswordStrength');
            const strengthText = document.getElementById('studentStrengthText');
            if (strengthContainer) {
                this.updatePasswordStrength(field, strengthContainer, strengthText);
            }
            
            return isValid;
        });
    }

    // DEPARTMENT FORM VALIDATION
    setupDepartmentValidation() {
        // Department Name validation
        this.addRealTimeValidation('departmentName', (field) => {
            this.validateField(field, ValidationRules.departmentName);
        });

        // Building validation
        this.addRealTimeValidation('departmentBuilding', (field) => {
            if (field.value) {
                this.showSuccess(field);
                return true;
            } else if (field.classList.contains('user-touched')) {
                this.showError(field, 'Please select a building');
                return false;
            }
            return true;
        });

        // Department Head validation (optional)
        this.addRealTimeValidation('departmentHead', (field) => {
            // This is optional, so just show success if selected
            if (field.value) {
                this.showSuccess(field);
            } else {
                this.clearValidation(field);
            }
            return true;
        });
    }

    // COURSE FORM VALIDATION
    setupCourseValidation() {
        // Course Name validation
        this.addRealTimeValidation('courseName', (field) => {
            this.validateField(field, ValidationRules.courseName);
        });

        // Credit Hours validation
        this.addRealTimeValidation('courseCredits', (field) => {
            const value = parseInt(field.value);
            
            if (!field.value) {
                this.showError(field, 'Credit hours is required');
                return false;
            }
            
            if (value < 1 || value > 6) {
                this.showError(field, 'Credit hours must be between 1 and 6');
                return false;
            }
            
            this.showSuccess(field);
            return true;
        });

        // Department validation
        this.addRealTimeValidation('courseDepartment', (field) => {
            if (field.value) {
                this.showSuccess(field);
                
                // Clear instructor selection when department changes
                const instructorField = document.getElementById('courseInstructor');
                if (instructorField) {
                    instructorField.innerHTML = '<option value="">Loading instructors...</option>';
                    this.clearValidation(instructorField);
                }
                
                return true;
            } else if (field.classList.contains('user-touched')) {
                this.showError(field, 'Please select a department');
                return false;
            }
            return true;
        });

        // Instructor validation
        this.addRealTimeValidation('courseInstructor', (field) => {
            if (field.value) {
                this.showSuccess(field);
                return true;
            } else if (field.classList.contains('user-touched')) {
                this.showError(field, 'Please select an instructor');
                return false;
            }
            return true;
        });
    }

    // Form submission validation
    validateForm(formId) {
        const form = document.getElementById(formId);
        if (!form) return false;

        let isValid = true;
        const requiredFields = form.querySelectorAll('[required]');
        
        requiredFields.forEach(field => {
            if (!this.validateFieldByType(field)) {
                isValid = false;
            }
        });

        return isValid;
    }

    // Validate field based on its type and ID
    validateFieldByType(field) {
        const fieldId = field.id;
        
        // Name fields
        if (fieldId.includes('FirstName') || fieldId.includes('LastName')) {
            return this.validateField(field, ValidationRules.name);
        }
        
        // Email fields
        if (fieldId.includes('Email')) {
            return this.validateField(field, ValidationRules.email);
        }
        
        // Phone fields
        if (fieldId.includes('Phone')) {
            return this.validatePhone(field);
        }
        
        // Password fields
        if (fieldId.includes('Password')) {
            return this.validateField(field, ValidationRules.password);
        }
        
        // Course name
        if (fieldId === 'courseName') {
            return this.validateField(field, ValidationRules.courseName);
        }
        
        // Department name
        if (fieldId === 'departmentName') {
            return this.validateField(field, ValidationRules.departmentName);
        }
        
        // Select fields
        if (field.tagName === 'SELECT') {
            if (!field.value) {
                this.showError(field, 'Please select an option');
                return false;
            }
            this.showSuccess(field);
            return true;
        }
        
        // Number fields
        if (field.type === 'number') {
            const min = parseInt(field.getAttribute('min'));
            const max = parseInt(field.getAttribute('max'));
            const value = parseInt(field.value);
            
            if (isNaN(value) || value < min || value > max) {
                this.showError(field, `Please enter a number between ${min} and ${max}`);
                return false;
            }
            this.showSuccess(field);
            return true;
        }
        
        // Default validation for required fields
        if (!field.value.trim()) {
            this.showError(field, 'This field is required');
            return false;
        }
        
        this.showSuccess(field);
        return true;
    }

    // Clear all validation states in a form
    clearFormValidation(formId) {
        const form = document.getElementById(formId);
        if (!form) return;
        
        const fields = form.querySelectorAll('.form-control, .form-select');
        fields.forEach(field => {
            this.clearValidation(field);
        });
    }

    // Show form-level success message
    showFormSuccess(message) {
        // You can implement this based on your notification system
        console.log('Form Success:', message);
    }

    // Show form-level error message
    showFormError(message) {
        // You can implement this based on your notification system
        console.error('Form Error:', message);
    }

    // FORM VALIDATION METHODS FOR SAVE FUNCTIONS
    validateInstructorForm() {
        const fields = ['instructorFirstName', 'instructorLastName', 'instructorEmail', 'instructorPhone', 'instructorDepartment'];
        
        // Add password validation only if it's visible (create mode)
        const passwordField = document.getElementById('instructorPassword');
        if (passwordField && passwordField.offsetParent !== null) {
            fields.push('instructorPassword');
        }
        
        let isValid = true;
        
        fields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                let fieldValid = false;
                
                switch(fieldId) {
                    case 'instructorFirstName':
                    case 'instructorLastName':
                        fieldValid = this.validateField(field, ValidationRules.name);
                        break;
                    case 'instructorEmail':
                        fieldValid = this.validateField(field, ValidationRules.email);
                        break;
                    case 'instructorPhone':
                        fieldValid = this.validatePhone(field);
                        break;
                    case 'instructorPassword':
                        fieldValid = this.validateField(field, ValidationRules.password);
                        break;
                    case 'instructorDepartment':
                        if (!field.value) {
                            this.showError(field, 'Please select a department');
                            fieldValid = false;
                        } else {
                            this.showSuccess(field);
                            fieldValid = true;
                        }
                        break;
                }
                
                if (!fieldValid) {
                    isValid = false;
                }
            }
        });
        
        return isValid;
    }

    validateStudentForm() {
        const fields = ['studentFirstName', 'studentLastName', 'studentEmail', 'studentPhone', 'studentLevel', 'studentDepartment'];
        
        // Add password validation only if it's visible (create mode)
        const passwordField = document.getElementById('studentPassword');
        if (passwordField && passwordField.offsetParent !== null) {
            fields.push('studentPassword');
        }
        
        let isValid = true;
        
        fields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                let fieldValid = false;
                
                switch(fieldId) {
                    case 'studentFirstName':
                    case 'studentLastName':
                        fieldValid = this.validateField(field, ValidationRules.name);
                        break;
                    case 'studentEmail':
                        fieldValid = this.validateField(field, ValidationRules.email);
                        break;
                    case 'studentPhone':
                        fieldValid = this.validatePhone(field);
                        break;
                    case 'studentPassword':
                        fieldValid = this.validateField(field, ValidationRules.password);
                        break;
                    case 'studentLevel':
                    case 'studentDepartment':
                        if (!field.value) {
                            this.showError(field, `Please select a ${fieldId.replace('student', '').toLowerCase()}`);
                            fieldValid = false;
                        } else {
                            this.showSuccess(field);
                            fieldValid = true;
                        }
                        break;
                }
                
                if (!fieldValid) {
                    isValid = false;
                }
            }
        });
        
        return isValid;
    }

    validateDepartmentForm() {
        const fields = ['departmentName', 'departmentDescription', 'departmentBuilding'];
        let isValid = true;
        
        fields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                let fieldValid = false;
                
                switch(fieldId) {
                    case 'departmentName':
                        fieldValid = this.validateField(field, ValidationRules.departmentName);
                        break;
                    case 'departmentDescription':
                        if (!field.value.trim()) {
                            this.showError(field, 'Please enter a department description');
                            fieldValid = false;
                        } else {
                            this.showSuccess(field);
                            fieldValid = true;
                        }
                        break;
                    case 'departmentBuilding':
                        if (!field.value.trim()) {
                            this.showError(field, 'Please enter a building name');
                            fieldValid = false;
                        } else {
                            this.showSuccess(field);
                            fieldValid = true;
                        }
                        break;
                }
                
                if (!fieldValid) {
                    isValid = false;
                }
            }
        });
        
        return isValid;
    }

    validateCourseForm() {
        const fields = ['courseName', 'courseCredits', 'courseDepartment', 'courseInstructor'];
        let isValid = true;
        
        fields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                let fieldValid = false;
                
                switch(fieldId) {
                    case 'courseName':
                        fieldValid = this.validateField(field, ValidationRules.courseName);
                        break;
                    case 'courseCredits':
                        const creditHours = parseInt(field.value);
                        if (isNaN(creditHours) || creditHours < 1 || creditHours > 6) {
                            this.showError(field, 'Credit hours must be between 1 and 6');
                            fieldValid = false;
                        } else {
                            this.showSuccess(field);
                            fieldValid = true;
                        }
                        break;
                    case 'courseDepartment':
                        if (!field.value) {
                            this.showError(field, 'Please select a department');
                            fieldValid = false;
                        } else {
                            this.showSuccess(field);
                            fieldValid = true;
                        }
                        break;
                    case 'courseInstructor':
                        if (!field.value) {
                            this.showError(field, 'Please select an instructor');
                            fieldValid = false;
                        } else {
                            this.showSuccess(field);
                            fieldValid = true;
                        }
                        break;
                }
                
                if (!fieldValid) {
                    isValid = false;
                }
            }
        });
        
        return isValid;
    }
}

// Initialize form validation when script loads
const formValidator = new FormValidator();

// Export for use in other scripts
window.FormValidator = FormValidator;
window.formValidator = formValidator;
window.adminFormValidator = formValidator; // Additional alias for admin dashboard