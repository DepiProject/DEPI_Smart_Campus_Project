// =====================================================
// Frontend Notification System
// Reduces API calls by handling notifications on client-side
// =====================================================

class NotificationManager {
    constructor() {
        this.container = null;
        this.notifications = [];
        this.maxNotifications = 5;
        this.defaultDuration = 5000;
        this.init();
    }

    // Initialize notification container
    init() {
        // Check if container exists, create if not
        this.container = document.getElementById('alertContainer');
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = 'alertContainer';
            this.container.className = 'notification-container';
            document.body.appendChild(this.container);
        }
    }

    /**
     * Show a notification
     * @param {string} title - Notification title
     * @param {string} message - Notification message
     * @param {string} type - Notification type: success, error, warning, info
     * @param {number} duration - Duration in milliseconds (0 = no auto-dismiss)
     * @param {object} options - Additional options
     */
    show(title, message, type = 'info', duration = null, options = {}) {
        const notification = this.createNotification(title, message, type, duration, options);
        this.addNotification(notification);
        return notification.id;
    }

    // Convenience methods for different types
    success(title, message, duration = null) {
        return this.show(title, message, 'success', duration);
    }

    error(title, message, duration = null) {
        return this.show(title, message, 'error', duration || 7000);
    }

    warning(title, message, duration = null) {
        return this.show(title, message, 'warning', duration);
    }

    info(title, message, duration = null) {
        return this.show(title, message, 'info', duration);
    }

    // Create notification element
    createNotification(title, message, type, duration, options) {
        const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const autoDismiss = duration !== 0;
        const dismissDuration = duration || this.defaultDuration;

        // Icon mapping
        const icons = {
            success: '<i class="bi bi-check-circle-fill"></i>',
            error: '<i class="bi bi-x-circle-fill"></i>',
            warning: '<i class="bi bi-exclamation-triangle-fill"></i>',
            info: '<i class="bi bi-info-circle-fill"></i>'
        };

        // Create notification element
        const notificationEl = document.createElement('div');
        notificationEl.id = id;
        notificationEl.className = `notification notification-${type} animate-fadeInRight`;
        notificationEl.setAttribute('role', 'alert');

        // Build notification HTML
        notificationEl.innerHTML = `
            <div class="notification-icon">
                ${icons[type] || icons.info}
            </div>
            <div class="notification-content">
                <div class="notification-title">${this.escapeHtml(title)}</div>
                ${message ? `<div class="notification-message">${this.escapeHtml(message)}</div>` : ''}
            </div>
            <button class="notification-close" aria-label="Close">
                <i class="bi bi-x-lg"></i>
            </button>
            ${autoDismiss ? `<div class="notification-progress"></div>` : ''}
        `;

        // Add close button event
        const closeBtn = notificationEl.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => this.dismiss(id));

        // Store notification data
        const notification = {
            id,
            element: notificationEl,
            type,
            autoDismiss,
            duration: dismissDuration,
            timer: null
        };

        return notification;
    }

    // Add notification to container
    addNotification(notification) {
        // Remove oldest if max reached
        if (this.notifications.length >= this.maxNotifications) {
            const oldest = this.notifications[0];
            this.dismiss(oldest.id);
        }

        // Add to container
        this.container.appendChild(notification.element);
        this.notifications.push(notification);

        // Trigger animation
        setTimeout(() => {
            notification.element.classList.add('show');
        }, 10);

        // Auto dismiss if enabled
        if (notification.autoDismiss) {
            this.startProgressBar(notification);
            notification.timer = setTimeout(() => {
                this.dismiss(notification.id);
            }, notification.duration);
        }

        // Add hover pause
        notification.element.addEventListener('mouseenter', () => {
            if (notification.timer) {
                clearTimeout(notification.timer);
                this.pauseProgressBar(notification);
            }
        });

        notification.element.addEventListener('mouseleave', () => {
            if (notification.autoDismiss) {
                const remainingTime = this.getRemainingTime(notification);
                notification.timer = setTimeout(() => {
                    this.dismiss(notification.id);
                }, remainingTime);
                this.resumeProgressBar(notification, remainingTime);
            }
        });
    }

    // Dismiss notification
    dismiss(id) {
        const index = this.notifications.findIndex(n => n.id === id);
        if (index === -1) return;

        const notification = this.notifications[index];

        // Clear timer if exists
        if (notification.timer) {
            clearTimeout(notification.timer);
        }

        // Animate out
        notification.element.classList.remove('show');
        notification.element.classList.add('animate-fadeOutRight');

        // Remove from DOM after animation
        setTimeout(() => {
            if (notification.element && notification.element.parentNode) {
                notification.element.parentNode.removeChild(notification.element);
            }
            this.notifications.splice(index, 1);
        }, 300);
    }

    // Dismiss all notifications
    dismissAll() {
        [...this.notifications].forEach(notification => {
            this.dismiss(notification.id);
        });
    }

    // Start progress bar animation
    startProgressBar(notification) {
        const progressBar = notification.element.querySelector('.notification-progress');
        if (progressBar) {
            progressBar.style.animation = `progress ${notification.duration}ms linear`;
            notification.progressStartTime = Date.now();
        }
    }

    // Pause progress bar
    pauseProgressBar(notification) {
        const progressBar = notification.element.querySelector('.notification-progress');
        if (progressBar) {
            const computedStyle = window.getComputedStyle(progressBar);
            const width = computedStyle.width;
            progressBar.style.width = width;
            progressBar.style.animation = 'none';
        }
    }

    // Resume progress bar
    resumeProgressBar(notification, remainingTime) {
        const progressBar = notification.element.querySelector('.notification-progress');
        if (progressBar) {
            progressBar.style.animation = `progress ${remainingTime}ms linear`;
        }
    }

    // Get remaining time for notification
    getRemainingTime(notification) {
        if (!notification.progressStartTime) return notification.duration;
        const elapsed = Date.now() - notification.progressStartTime;
        return Math.max(0, notification.duration - elapsed);
    }

    // Escape HTML to prevent XSS
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Show loading notification
    showLoading(title, message = 'Please wait...') {
        const id = `loading-${Date.now()}`;
        
        const notificationEl = document.createElement('div');
        notificationEl.id = id;
        notificationEl.className = 'notification notification-info notification-loading animate-fadeInRight';
        
        notificationEl.innerHTML = `
            <div class="notification-icon">
                <div class="spinner-border spinner-border-sm text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
            </div>
            <div class="notification-content">
                <div class="notification-title">${this.escapeHtml(title)}</div>
                ${message ? `<div class="notification-message">${this.escapeHtml(message)}</div>` : ''}
            </div>
        `;

        this.container.appendChild(notificationEl);
        
        setTimeout(() => {
            notificationEl.classList.add('show');
        }, 10);

        return id;
    }

    // Update loading notification
    updateLoading(id, title, message) {
        const notification = document.getElementById(id);
        if (notification) {
            const titleEl = notification.querySelector('.notification-title');
            const messageEl = notification.querySelector('.notification-message');
            
            if (titleEl) titleEl.textContent = title;
            if (messageEl) messageEl.textContent = message;
        }
    }

    // Hide loading notification
    hideLoading(id) {
        const notification = document.getElementById(id);
        if (notification) {
            notification.classList.remove('show');
            notification.classList.add('animate-fadeOutRight');
            
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }
    }

    // Show confirmation dialog
    async confirm(title, message, options = {}) {
        return new Promise((resolve) => {
            const id = `confirm-${Date.now()}`;
            const confirmText = options.confirmText || 'Confirm';
            const cancelText = options.cancelText || 'Cancel';
            const type = options.type || 'warning';

            const icons = {
                success: 'bi-check-circle',
                error: 'bi-x-circle',
                warning: 'bi-exclamation-triangle',
                info: 'bi-info-circle'
            };

            const modal = document.createElement('div');
            modal.className = 'modal fade';
            modal.id = id;
            modal.setAttribute('tabindex', '-1');
            
            modal.innerHTML = `
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header border-0">
                            <h5 class="modal-title d-flex align-items-center gap-2">
                                <i class="bi ${icons[type]} text-${type}"></i>
                                ${this.escapeHtml(title)}
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <p class="mb-0">${this.escapeHtml(message)}</p>
                        </div>
                        <div class="modal-footer border-0">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">${cancelText}</button>
                            <button type="button" class="btn btn-${type}" id="${id}-confirm">${confirmText}</button>
                        </div>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);
            
            const bsModal = new bootstrap.Modal(modal);
            bsModal.show();

            // Handle confirm
            document.getElementById(`${id}-confirm`).addEventListener('click', () => {
                bsModal.hide();
                resolve(true);
            });

            // Handle cancel/close
            modal.addEventListener('hidden.bs.modal', () => {
                setTimeout(() => {
                    document.body.removeChild(modal);
                }, 100);
                resolve(false);
            });
        });
    }
}

// Create global instance
const notifications = new NotificationManager();

// Add notification styles to document
const style = document.createElement('style');
style.textContent = `
    .notification-container {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        z-index: 9999;
        pointer-events: none;
        max-width: 450px;
        width: 90%;
    }

    .notification {
        background: white;
        border-radius: 12px;
        padding: 16px;
        margin-bottom: 12px;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
        display: flex;
        align-items: flex-start;
        gap: 12px;
        pointer-events: all;
        opacity: 0;
        transform: scale(0.9);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        position: relative;
        overflow: hidden;
    }

    .notification.show {
        opacity: 1;
        transform: scale(1);
    }

    .notification-icon {
        font-size: 24px;
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
    }

    .notification-success {
        border-left: 4px solid #22c55e;
    }

    .notification-success .notification-icon {
        color: #22c55e;
    }

    .notification-error {
        border-left: 4px solid #ef4444;
    }

    .notification-error .notification-icon {
        color: #ef4444;
    }

    .notification-warning {
        border-left: 4px solid #f59e0b;
    }

    .notification-warning .notification-icon {
        color: #f59e0b;
    }

    .notification-info {
        border-left: 4px solid #06b6d4;
    }

    .notification-info .notification-icon {
        color: #06b6d4;
    }

    .notification-content {
        flex: 1;
        min-width: 0;
    }

    .notification-title {
        font-weight: 600;
        font-size: 14px;
        color: #1e293b;
        margin-bottom: 4px;
    }

    .notification-message {
        font-size: 13px;
        color: #64748b;
        line-height: 1.4;
    }

    .notification-close {
        background: none;
        border: none;
        color: #94a3b8;
        cursor: pointer;
        padding: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        transition: color 0.2s;
        font-size: 14px;
    }

    .notification-close:hover {
        color: #475569;
    }

    .notification-progress {
        position: absolute;
        bottom: 0;
        left: 0;
        height: 3px;
        background: currentColor;
        opacity: 0.3;
        width: 100%;
    }

    @keyframes progress {
        from {
            width: 100%;
        }
        to {
            width: 0%;
        }
    }

    .animate-fadeOutRight {
        animation: fadeOutRight 0.3s ease-out forwards;
    }

    @keyframes fadeOutRight {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(100%);
        }
    }

    @media (max-width: 576px) {
        .notification-container {
            top: 10px;
            right: 10px;
            left: 10px;
            max-width: none;
        }

        .notification {
            padding: 12px;
        }

        .notification-icon {
            font-size: 20px;
            width: 28px;
            height: 28px;
        }
    }
`;
document.head.appendChild(style);

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { NotificationManager, notifications };
}
