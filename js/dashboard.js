// =====================================================
// Dashboard Handler - Enhanced with Notification System
// =====================================================

class DashboardManager {
    constructor() {
        this.currentUser = null;
        this.initializeEventListeners();
        this.loadUserInfo();
        this.setupNavigation();
        this.initAnimations();
    }

    // Initialize event listeners
    initializeEventListeners() {
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.logout();
            });
        }

        // Navigation section switching with smooth transitions
        document.querySelectorAll('[data-section]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.getAttribute('data-section');
                this.switchSection(section);
                
                // Update URL hash without scrolling
                history.pushState(null, null, `#${section}`);
            });
        });

        // Handle browser back/forward buttons
        window.addEventListener('popstate', () => {
            const hash = window.location.hash.slice(1) || 'dashboard';
            this.switchSection(hash);
        });
    }

    // Initialize animations on page load
    initAnimations() {
        // Add staggered fade-in animation to cards
        const cards = document.querySelectorAll('.hover-card');
        cards.forEach((card, index) => {
            setTimeout(() => {
                card.style.opacity = '0';
                card.style.transform = 'translateY(20px)';
                card.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
                
                setTimeout(() => {
                    card.style.opacity = '1';
                    card.style.transform = 'translateY(0)';
                }, 50);
            }, index * 100);
        });

        // Animate counters
        this.animateCounters();
    }

    // Animate number counters
    animateCounters() {
        const counters = document.querySelectorAll('.counter');
        
        const observerOptions = {
            threshold: 0.5
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const counter = entry.target;
                    const target = parseInt(counter.textContent) || 0;
                    
                    if (target > 0 && !counter.classList.contains('counted')) {
                        this.countUp(counter, 0, target, 1000);
                        counter.classList.add('counted');
                    }
                }
            });
        }, observerOptions);

        counters.forEach(counter => observer.observe(counter));
    }

    // Count up animation
    countUp(element, start, end, duration) {
        const range = end - start;
        const increment = range / (duration / 16);
        let current = start;

        const timer = setInterval(() => {
            current += increment;
            if (current >= end) {
                element.textContent = end;
                clearInterval(timer);
            } else {
                element.textContent = Math.floor(current);
            }
        }, 16);
    }

    // Load user information
    loadUserInfo() {
        try {
            const userInfo = API.getUserInfo();
            
            if (userInfo) {
                this.currentUser = userInfo;
                this.updateUserDisplay();
            } else {
                // Token may have been decoded but no stored user info
                this.redirectToLogin();
            }
        } catch (error) {
            console.error('Error loading user info:', error);
            notifications.error('Error', 'Failed to load user information');
            setTimeout(() => this.redirectToLogin(), 2000);
        }
    }

    // Update user display information
    updateUserDisplay() {
        const userNameElement = document.getElementById('userName');
        if (userNameElement && this.currentUser) {
            // Try to extract first name from email or use a default
            const nameFromEmail = this.currentUser.email ? this.currentUser.email.split('@')[0] : 'User';
            const displayName = this.currentUser.name || this.currentUser.given_name || nameFromEmail;
            userNameElement.textContent = displayName.charAt(0).toUpperCase() + displayName.slice(1);
        }
    }

    // Setup navigation
    setupNavigation() {
        const navLinks = document.querySelectorAll('[data-section]');
        
        // Check for hash in URL
        const hash = window.location.hash.slice(1);
        
        if (hash && hash !== 'dashboard') {
            // Find and activate the section from hash
            const targetLink = Array.from(navLinks).find(link => 
                link.getAttribute('data-section') === hash
            );
            
            if (targetLink) {
                this.switchSection(hash);
                return;
            }
        }
        
        // Default to first link (dashboard)
        if (navLinks.length > 0) {
            navLinks[0].classList.add('active');
        }
    }

    // Switch between sections with smooth animations
    switchSection(sectionName) {
        // Get all sections
        const sections = document.querySelectorAll('.section');
        const selectedSection = document.getElementById(sectionName);
        
        if (!selectedSection) {
            console.warn(`Section "${sectionName}" not found`);
            return;
        }

        // Fade out current section
        sections.forEach(section => {
            if (!section.classList.contains('d-none')) {
                section.style.opacity = '0';
                section.style.transform = 'translateY(20px)';
                
                setTimeout(() => {
                    section.classList.add('d-none');
                }, 200);
            }
        });

        // Fade in selected section
        setTimeout(() => {
            selectedSection.classList.remove('d-none');
            selectedSection.style.opacity = '0';
            selectedSection.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                selectedSection.style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
                selectedSection.style.opacity = '1';
                selectedSection.style.transform = 'translateY(0)';
            }, 50);
        }, 250);

        // Update active nav link with animation
        document.querySelectorAll('[data-section]').forEach(link => {
            const isActive = link.getAttribute('data-section') === sectionName;
            
            if (isActive) {
                link.classList.add('active');
                link.style.transform = 'translateX(8px)';
                setTimeout(() => {
                    link.style.transform = '';
                }, 300);
            } else {
                link.classList.remove('active');
            }
        });

        // Scroll to top smoothly
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Logout with confirmation
    async logout() {
        const confirmed = await notifications.confirm(
            'Confirm Logout',
            'Are you sure you want to logout?',
            { type: 'warning', confirmText: 'Yes, Logout', cancelText: 'Cancel' }
        );

        if (confirmed) {
            // Show loading notification
            const loadingId = notifications.showLoading('Logging Out', 'Please wait...');

            // Clear token and user info
            API.auth.logout();

            // Hide loading and show success
            setTimeout(() => {
                notifications.hideLoading(loadingId);
                notifications.success('Logged Out', 'You have been logged out successfully.');

                // Redirect to login
                setTimeout(() => {
                    window.location.href = '../index.html';
                }, 1000);
            }, 500);
        }
    }

    // Show toast notification (wrapper for notifications.js)
    showToast(title, message, type = 'info', duration = 5000) {
        return notifications.show(title, message, type, duration);
    }

    // Show success toast
    showSuccess(title, message) {
        return notifications.success(title, message);
    }

    // Show error toast
    showError(title, message) {
        return notifications.error(title, message);
    }

    // Show warning toast
    showWarning(title, message) {
        return notifications.warning(title, message);
    }

    // Show info toast
    showInfo(title, message) {
        return notifications.info(title, message);
    }

    // Show loading indicator
    showLoading(title, message) {
        return notifications.showLoading(title, message);
    }

    // Hide loading indicator
    hideLoading(id) {
        notifications.hideLoading(id);
    }

    // Redirect to login
    redirectToLogin() {
        window.location.href = '../index.html';
    }
}

// Initialize Dashboard Manager when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Check if user is authenticated
    const token = localStorage.getItem('authToken');
    if (!token || API.isTokenExpired()) {
        // Redirect to login
        window.location.href = '../index.html';
    } else {
        // Create global dashboard manager instance
        window.dashboardManager = new DashboardManager();
    }
});
