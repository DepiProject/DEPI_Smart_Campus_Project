// =====================================================
// Client-Side Pagination & Data Management Utility
// Minimizes API requests by caching and paginating data on frontend
// =====================================================

class PaginationManager {
    constructor(options = {}) {
        this.data = [];
        this.filteredData = [];
        this.currentPage = 1;
        this.itemsPerPage = options.itemsPerPage || 10;
        this.totalPages = 0;
        this.searchTerm = '';
        this.sortField = null;
        this.sortDirection = 'asc';
        this.filters = {};
        
        // Callbacks
        this.onPageChange = options.onPageChange || (() => {});
        this.onDataChange = options.onDataChange || (() => {});
    }

    /**
     * Load data and initialize pagination
     * @param {Array} data - Array of data items
     */
    setData(data) {
        this.data = Array.isArray(data) ? data : [];
        this.filteredData = [...this.data];
        this.currentPage = 1;
        this.calculateTotalPages();
        this.onDataChange(this.getCurrentPageData());
        return this;
    }

    /**
     * Add new item to data
     * @param {Object} item - Item to add
     */
    addItem(item) {
        this.data.unshift(item);
        this.applyFilters();
        this.onDataChange(this.getCurrentPageData());
        return this;
    }

    /**
     * Update existing item
     * @param {Function} matcher - Function to find item
     * @param {Object} updates - Updates to apply
     */
    updateItem(matcher, updates) {
        const index = this.data.findIndex(matcher);
        if (index !== -1) {
            this.data[index] = { ...this.data[index], ...updates };
            this.applyFilters();
            this.onDataChange(this.getCurrentPageData());
        }
        return this;
    }

    /**
     * Remove item from data
     * @param {Function} matcher - Function to find item
     */
    removeItem(matcher) {
        this.data = this.data.filter(item => !matcher(item));
        this.applyFilters();
        
        // Adjust current page if needed
        if (this.getCurrentPageData().length === 0 && this.currentPage > 1) {
            this.currentPage--;
        }
        
        this.onDataChange(this.getCurrentPageData());
        return this;
    }

    /**
     * Search data
     * @param {string} term - Search term
     * @param {Array} fields - Fields to search in
     */
    search(term, fields = []) {
        this.searchTerm = term.toLowerCase().trim();
        this.applyFilters();
        this.currentPage = 1;
        this.onDataChange(this.getCurrentPageData());
        return this;
    }

    /**
     * Sort data
     * @param {string} field - Field to sort by
     * @param {string} direction - Sort direction (asc/desc)
     */
    sort(field, direction = null) {
        // Toggle direction if same field
        if (this.sortField === field && !direction) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortField = field;
            this.sortDirection = direction || 'asc';
        }

        this.filteredData.sort((a, b) => {
            const aVal = this.getNestedValue(a, field);
            const bVal = this.getNestedValue(b, field);

            if (aVal === null || aVal === undefined) return 1;
            if (bVal === null || bVal === undefined) return -1;

            const comparison = this.compareValues(aVal, bVal);
            return this.sortDirection === 'asc' ? comparison : -comparison;
        });

        this.onDataChange(this.getCurrentPageData());
        return this;
    }

    /**
     * Apply custom filter
     * @param {string} key - Filter key
     * @param {Function} filterFn - Filter function
     */
    addFilter(key, filterFn) {
        this.filters[key] = filterFn;
        this.applyFilters();
        this.currentPage = 1;
        this.onDataChange(this.getCurrentPageData());
        return this;
    }

    /**
     * Remove filter
     * @param {string} key - Filter key
     */
    removeFilter(key) {
        delete this.filters[key];
        this.applyFilters();
        this.onDataChange(this.getCurrentPageData());
        return this;
    }

    /**
     * Clear all filters
     */
    clearFilters() {
        this.searchTerm = '';
        this.filters = {};
        this.applyFilters();
        this.currentPage = 1;
        this.onDataChange(this.getCurrentPageData());
        return this;
    }

    /**
     * Apply all filters and search
     */
    applyFilters() {
        this.filteredData = this.data.filter(item => {
            // Apply search
            if (this.searchTerm) {
                const searchFields = Object.values(item).join(' ').toLowerCase();
                if (!searchFields.includes(this.searchTerm)) {
                    return false;
                }
            }

            // Apply custom filters
            for (const filterFn of Object.values(this.filters)) {
                if (!filterFn(item)) {
                    return false;
                }
            }

            return true;
        });

        this.calculateTotalPages();
    }

    /**
     * Calculate total pages
     */
    calculateTotalPages() {
        this.totalPages = Math.ceil(this.filteredData.length / this.itemsPerPage);
        if (this.totalPages === 0) this.totalPages = 1;
    }

    /**
     * Get current page data
     */
    getCurrentPageData() {
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        return this.filteredData.slice(startIndex, endIndex);
    }

    /**
     * Go to specific page
     * @param {number} page - Page number
     */
    goToPage(page) {
        if (page < 1 || page > this.totalPages) return this;
        
        this.currentPage = page;
        this.onPageChange(this.currentPage, this.totalPages);
        this.onDataChange(this.getCurrentPageData());
        return this;
    }

    /**
     * Go to next page
     */
    nextPage() {
        return this.goToPage(this.currentPage + 1);
    }

    /**
     * Go to previous page
     */
    previousPage() {
        return this.goToPage(this.currentPage - 1);
    }

    /**
     * Go to first page
     */
    firstPage() {
        return this.goToPage(1);
    }

    /**
     * Go to last page
     */
    lastPage() {
        return this.goToPage(this.totalPages);
    }

    /**
     * Set items per page
     * @param {number} count - Items per page
     */
    setItemsPerPage(count) {
        this.itemsPerPage = count;
        this.calculateTotalPages();
        this.currentPage = 1;
        this.onDataChange(this.getCurrentPageData());
        return this;
    }

    /**
     * Get pagination info
     */
    getInfo() {
        const startItem = (this.currentPage - 1) * this.itemsPerPage + 1;
        const endItem = Math.min(this.currentPage * this.itemsPerPage, this.filteredData.length);
        
        return {
            currentPage: this.currentPage,
            totalPages: this.totalPages,
            itemsPerPage: this.itemsPerPage,
            totalItems: this.filteredData.length,
            totalDataItems: this.data.length,
            startItem,
            endItem,
            hasNextPage: this.currentPage < this.totalPages,
            hasPreviousPage: this.currentPage > 1
        };
    }

    /**
     * Render pagination controls
     * @param {string} containerId - Container element ID
     */
    renderControls(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const info = this.getInfo();
        
        const html = `
            <div class="d-flex justify-content-between align-items-center flex-wrap gap-3">
                <div class="text-muted small">
                    <i class="bi bi-info-circle me-1"></i>
                    Showing ${info.startItem} to ${info.endItem} of ${info.totalItems} 
                    ${info.totalDataItems !== info.totalItems ? `(filtered from ${info.totalDataItems})` : ''}
                </div>
                
                <div class="d-flex align-items-center gap-2">
                    <select class="form-select form-select-sm" style="width: auto;" id="${containerId}-per-page">
                        <option value="5" ${this.itemsPerPage === 5 ? 'selected' : ''}>5 per page</option>
                        <option value="10" ${this.itemsPerPage === 10 ? 'selected' : ''}>10 per page</option>
                        <option value="25" ${this.itemsPerPage === 25 ? 'selected' : ''}>25 per page</option>
                        <option value="50" ${this.itemsPerPage === 50 ? 'selected' : ''}>50 per page</option>
                        <option value="100" ${this.itemsPerPage === 100 ? 'selected' : ''}>100 per page</option>
                    </select>
                    
                    <nav>
                        <ul class="pagination pagination-sm mb-0">
                            <li class="page-item ${!info.hasPreviousPage ? 'disabled' : ''}">
                                <a class="page-link" href="#" data-page="first">
                                    <i class="bi bi-chevron-double-left"></i>
                                </a>
                            </li>
                            <li class="page-item ${!info.hasPreviousPage ? 'disabled' : ''}">
                                <a class="page-link" href="#" data-page="prev">
                                    <i class="bi bi-chevron-left"></i>
                                </a>
                            </li>
                            ${this.generatePageNumbers(info)}
                            <li class="page-item ${!info.hasNextPage ? 'disabled' : ''}">
                                <a class="page-link" href="#" data-page="next">
                                    <i class="bi bi-chevron-right"></i>
                                </a>
                            </li>
                            <li class="page-item ${!info.hasNextPage ? 'disabled' : ''}">
                                <a class="page-link" href="#" data-page="last">
                                    <i class="bi bi-chevron-double-right"></i>
                                </a>
                            </li>
                        </ul>
                    </nav>
                </div>
            </div>
        `;

        container.innerHTML = html;

        // Add event listeners
        container.querySelectorAll('.page-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = link.getAttribute('data-page');
                
                if (page === 'first') this.firstPage();
                else if (page === 'prev') this.previousPage();
                else if (page === 'next') this.nextPage();
                else if (page === 'last') this.lastPage();
                else this.goToPage(parseInt(page));
                
                this.renderControls(containerId);
            });
        });

        // Items per page change
        const perPageSelect = document.getElementById(`${containerId}-per-page`);
        if (perPageSelect) {
            perPageSelect.addEventListener('change', (e) => {
                this.setItemsPerPage(parseInt(e.target.value));
                this.renderControls(containerId);
            });
        }
    }

    /**
     * Generate page number buttons
     */
    generatePageNumbers(info) {
        const maxButtons = 5;
        let startPage = Math.max(1, info.currentPage - Math.floor(maxButtons / 2));
        let endPage = Math.min(info.totalPages, startPage + maxButtons - 1);

        if (endPage - startPage < maxButtons - 1) {
            startPage = Math.max(1, endPage - maxButtons + 1);
        }

        let html = '';
        for (let i = startPage; i <= endPage; i++) {
            html += `
                <li class="page-item ${i === info.currentPage ? 'active' : ''}">
                    <a class="page-link" href="#" data-page="${i}">${i}</a>
                </li>
            `;
        }
        return html;
    }

    /**
     * Get nested value from object
     */
    getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => current?.[key], obj);
    }

    /**
     * Compare values for sorting
     */
    compareValues(a, b) {
        if (typeof a === 'string' && typeof b === 'string') {
            return a.localeCompare(b);
        }
        if (a < b) return -1;
        if (a > b) return 1;
        return 0;
    }
}

// Create global instance factory
window.createPagination = (options) => new PaginationManager(options);

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PaginationManager };
}
