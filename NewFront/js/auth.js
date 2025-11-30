// =====================================================
// Authentication & Login Handler
// =====================================================

class AuthManager {
    constructor() {
        this.isLoading = false;
        this.initializeEventListeners();
        this.checkExistingToken();
    }

    // Initialize all event listeners
    initializeEventListeners() {
        const loginForm = document.getElementById('loginForm');
        const togglePasswordBtn = document.getElementById('togglePassword');

        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        if (togglePasswordBtn) {
            togglePasswordBtn.addEventListener('click', () => this.togglePasswordVisibility());
        }

        // Real-time validation
        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');

        if (emailInput) {
            emailInput.addEventListener('blur', () => this.validateEmail());
            emailInput.addEventListener('input', () => this.clearEmailError());
        }

        if (passwordInput) {
            passwordInput.addEventListener('blur', () => this.validatePassword());
            passwordInput.addEventListener('input', () => this.clearPasswordError());
        }
    }

    // Check if user already has a valid token
    checkExistingToken() {
        const token = localStorage.getItem('authToken');
        if (token && !API.isTokenExpired()) {
            // User is already logged in, redirect to appropriate dashboard
            this.redirectToDashboard();
        }
    }

    // Handle login form submission
    async handleLogin(e) {
        e.preventDefault();

        // Validate form
        if (!this.validateForm()) {
            return;
        }

        this.isLoading = true;
        this.setButtonLoading(true);

        // Get form data
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;

        console.log('🔐 Login attempt with:', email);

        try {
            // Make API call
            const response = await API.auth.login(email, password);

            console.log('📋 Login response received:', response);
            console.log('✅ response.success:', response.success);

            if (response.success) {
                console.log('✅ SUCCESS! Redirecting to dashboard');
                // Redirect immediately - the redirect itself is the success feedback
                this.redirectToDashboard();
            } else {
                // Handle error
                console.log('❌ FAILURE! response.success is false');
                const errorMessage = this.getErrorMessage(response);
                notifications.error('Login Failed', errorMessage, 7000);
                this.clearForm();
            }
        } catch (error) {
            console.error('❌ Login error:', error);
            notifications.error('Connection Error', 'An unexpected error occurred. Please try again.', 7000);
        } finally {
            this.isLoading = false;
            this.setButtonLoading(false);
        }
    }

    // Validate entire form
    validateForm() {
        const isEmailValid = this.validateEmail();
        const isPasswordValid = this.validatePassword();
        return isEmailValid && isPasswordValid;
    }

    // Validate email
    validateEmail() {
        const emailInput = document.getElementById('email');
        const emailError = document.getElementById('emailError');
        const email = emailInput.value.trim();

        // Check if empty
        if (!email) {
            this.showInputError(emailInput, 'Email is required', emailError);
            return false;
        }

        // Check if valid email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            this.showInputError(emailInput, 'Please enter a valid email address', emailError);
            return false;
        }

        // Clear error
        this.clearInputError(emailInput, emailError);
        return true;
    }

    // Validate password
    validatePassword() {
        const passwordInput = document.getElementById('password');
        const passwordError = document.getElementById('passwordError');
        const password = passwordInput.value;

        if (!password) {
            this.showInputError(passwordInput, 'Password is required', passwordError);
            return false;
        }

        if (password.length < 8) {
            this.showInputError(passwordInput, 'Password must be at least 8 characters', passwordError);
            return false;
        }

        this.clearInputError(passwordInput, passwordError);
        return true;
    }

    // Show input error
    showInputError(input, message, errorElement) {
        input.classList.add('is-invalid');
        input.classList.remove('is-valid');
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.classList.add('show');
        }
    }

    // Clear input error
    clearInputError(input, errorElement) {
        input.classList.remove('is-invalid');
        input.classList.add('is-valid');
        if (errorElement) {
            errorElement.textContent = '';
            errorElement.classList.remove('show');
        }
    }

    // Clear email error on input
    clearEmailError() {
        const emailInput = document.getElementById('email');
        const emailError = document.getElementById('emailError');
        emailInput.classList.remove('is-invalid');
        emailError.classList.remove('show');
    }

    // Clear password error on input
    clearPasswordError() {
        const passwordInput = document.getElementById('password');
        const passwordError = document.getElementById('passwordError');
        passwordInput.classList.remove('is-invalid');
        passwordError.classList.remove('show');
    }

    // Toggle password visibility
    togglePasswordVisibility() {
        const passwordInput = document.getElementById('password');
        const toggleBtn = document.getElementById('togglePassword');
        const icon = toggleBtn.querySelector('i');

        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            icon.classList.remove('bi-eye-fill');
            icon.classList.add('bi-eye-slash-fill');
        } else {
            passwordInput.type = 'password';
            icon.classList.remove('bi-eye-slash-fill');
            icon.classList.add('bi-eye-fill');
        }
    }

    // Clear form
    clearForm() {
        const form = document.getElementById('loginForm');
        if (form) {
            form.reset();
            // Remove validation classes
            form.querySelectorAll('.form-control').forEach(input => {
                input.classList.remove('is-invalid', 'is-valid');
            });
        }
    }

    // Get error message from API response
    getErrorMessage(response) {
        console.log('Getting error message from response:', response);
        
        if (response.data) {
            if (typeof response.data === 'string') {
                return response.data;
            }
            if (response.data.message) {
                return response.data.message;
            }
            if (response.data.errors) {
                const errors = Object.values(response.data.errors).flat();
                return errors[0] || 'Invalid email or password';
            }
        }
        
        // Default error message
        const errorMsg = response.error || 'Login failed. Please try again.';
        console.log('Error message:', errorMsg);
        return errorMsg;
    }

    // Set button loading state
    setButtonLoading(isLoading) {
        const btn = document.querySelector('.btn-gradient');
        const spinner = document.getElementById('btnSpinner');
        const btnText = document.getElementById('btnText');

        if (isLoading) {
            btn.disabled = true;
            btn.classList.add('loading');
            spinner.classList.remove('d-none');
            btnText.textContent = 'Signing In...';
        } else {
            btn.disabled = false;
            btn.classList.remove('loading');
            spinner.classList.add('d-none');
            btnText.textContent = 'Sign In';
        }
    }

    // Redirect to appropriate dashboard based on role
    redirectToDashboard() {
        try {
            const role = API.getUserRole();
            console.log('🎯 User role from token:', role);

            let dashboardUrl = 'pages/student-dashboard.html'; // Default

            if (role) {
                const roleLower = role.toLowerCase().trim();
                console.log('📍 Checking role:', roleLower);
                
                if (roleLower.includes('admin')) {
                    dashboardUrl = 'pages/admin-dashboard.html';
                    console.log('✅ Redirecting to admin dashboard');
                } else if (roleLower.includes('instructor')) {
                    dashboardUrl = 'pages/instructor-dashboard.html';
                    console.log('✅ Redirecting to instructor dashboard');
                } else if (roleLower.includes('student')) {
                    dashboardUrl = 'pages/student-dashboard.html';
                    console.log('✅ Redirecting to student dashboard');
                } else {
                    console.log('⚠️ Unknown role, defaulting to student dashboard');
                }
            } else {
                console.warn('⚠️ No role found, defaulting to student dashboard');
            }

            console.log('🔗 Redirecting to:', dashboardUrl);
            // Redirect to dashboard
            window.location.href = dashboardUrl;
        } catch (error) {
            console.error('❌ Redirect error:', error);
            // Fallback to student dashboard
            window.location.href = 'pages/student-dashboard.html';
        }
    }
}

// Initialize Auth Manager when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new AuthManager();
});
