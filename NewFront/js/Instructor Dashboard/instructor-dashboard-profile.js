// =====================================================
// Instructor Dashboard - Profile Management Module
// Handles instructor profile viewing and editing
// =====================================================

// ===== PROFILE SECTION =====
InstructorDashboard.prototype.loadProfile = async function() {
    console.log('👤 Loading instructor profile...');

    try {
        const response = await API.instructor.getMyProfile();
        console.log('📊 Full profile response:', response);
        console.log('📊 Response.data:', response.data);

        if (response.success && response.data) {
            const profile = response.data.Data || response.data.data || response.data;
            console.log('✅ Profile loaded:', profile);

            this.currentProfile = profile;

            document.getElementById('displayFirstName').textContent = profile.firstName || profile.FirstName || '-';
            document.getElementById('displayLastName').textContent = profile.lastName || profile.LastName || '-';
            document.getElementById('displayEmail').textContent = profile.email || profile.Email || '-';
            document.getElementById('displayContactNumber').textContent = profile.contactNumber || profile.ContactNumber || '-';
            document.getElementById('displayDepartment').textContent = profile.departmentName || profile.DepartmentName || '-';

            document.getElementById('editFirstName').value = profile.firstName || profile.FirstName || '';
            document.getElementById('editLastName').value = profile.lastName || profile.LastName || '';
            document.getElementById('editEmail').value = profile.email || profile.Email || '';
            document.getElementById('editContactNumber').value = profile.contactNumber || profile.ContactNumber || '';

            const firstName = profile.firstName || profile.FirstName || '';
            const lastName = profile.lastName || profile.LastName || '';
            const fullName = `${firstName} ${lastName}`.trim() || 'Instructor';
            const userNameElement = document.getElementById('userName');
            if (userNameElement) {
                userNameElement.textContent = fullName;
            }

            const form = document.getElementById('editProfileForm');
            if (form && !form.hasAttribute('data-listener-set')) {
                form.setAttribute('data-listener-set', 'true');
                form.addEventListener('submit', (e) => this.saveProfile(e));
            }

            // Setup real-time phone validation
            const phoneInput = document.getElementById('editContactNumber');
            if (phoneInput && !phoneInput.hasAttribute('data-validation-set')) {
                phoneInput.setAttribute('data-validation-set', 'true');
                
                let validationTimeout;
                
                phoneInput.addEventListener('input', async (e) => {
                    const phone = e.target.value.trim();
                    const errorDiv = document.getElementById('contactNumberError');
                    const currentPhone = this.currentProfile?.contactNumber || this.currentProfile?.ContactNumber || '';
                    
                    errorDiv.style.display = 'none';
                    errorDiv.textContent = '';
                    
                    if (!phone) return;
                    
                    // Format validation
                    if (!/^\d{11}$/.test(phone)) {
                        errorDiv.textContent = 'Contact number must be exactly 11 digits';
                        errorDiv.style.display = 'block';
                        return;
                    }
                    
                    // Skip duplicate check if same as current
                    if (phone === currentPhone) return;
                    
                    // Debounce duplicate check
                    clearTimeout(validationTimeout);
                    validationTimeout = setTimeout(async () => {
                        try {
                            // Check phone uniqueness using dedicated endpoint
                            const checkResponse = await API.request('/Instructor/check-phone/' + encodeURIComponent(phone), {
                                method: 'GET'
                            });
                            
                            if (checkResponse.success && checkResponse.data) {
                                const isUnique = checkResponse.data.isUnique;
                                if (!isUnique) {
                                    errorDiv.textContent = 'This phone number is already existed';
                                    errorDiv.style.display = 'block';
                                }
                            }
                        } catch (error) {
                            console.log('Phone validation check failed:', error);
                            // Silently handle - validation will happen on submit
                        }
                    }, 800);
                });
            }

            this.showDisplayProfileView();
        } else {
            console.error('❌ Failed to load profile:', response.error);
            this.showToast('Error', 'Failed to load profile: ' + (response.error || 'Unknown error'), 'error');
        }
    } catch (error) {
        console.error('❌ Error loading profile:', error);
        this.showToast('Error', 'Failed to load profile: ' + error.message, 'error');
    }
};

InstructorDashboard.prototype.showDisplayProfileView = function() {
    console.log('👁️ Showing profile display view');
    document.getElementById('profileDisplayView').classList.remove('d-none');
    document.getElementById('profileEditView').classList.add('d-none');
};

InstructorDashboard.prototype.showEditProfileForm = function() {
    console.log('✏️ Showing profile edit form');
    document.getElementById('profileDisplayView').classList.add('d-none');
    document.getElementById('profileEditView').classList.remove('d-none');
};

InstructorDashboard.prototype.saveProfile = async function(e) {
    e.preventDefault();
    console.log('💾 Saving profile changes...');

    const errorDiv = document.getElementById('contactNumberError');
    
    try {
        errorDiv.textContent = '';
        errorDiv.style.display = 'none';

        const contactNumber = document.getElementById('editContactNumber').value.trim();

        if (contactNumber && !/^\d{11}$/.test(contactNumber)) {
            errorDiv.textContent = 'Contact number must be exactly 11 digits';
            errorDiv.style.display = 'block';
            return;
        }

        // Check if there's already a visible error
        if (errorDiv.style.display === 'block' && errorDiv.textContent) {
            this.showToast('Error', errorDiv.textContent, 'error');
            return; // Don't submit if there's an error
        }

        const updateData = {
            contactNumber: contactNumber || null
        };

        console.log('📤 Sending update:', updateData);

        const response = await API.instructor.updateMyProfile(updateData);
        console.log('📊 Profile update response:', response);

        if (response.success) {
            this.showToast('Success', 'Contact number updated successfully!', 'success');
            
            await this.loadProfile();
            this.showDisplayProfileView();
        } else {
            // Extract the actual error message
            let errorMsg = response.error || 'Failed to update profile';
            
            console.error('❌ Profile update failed:', errorMsg);
            errorDiv.textContent = errorMsg;
            errorDiv.style.display = 'block';
            this.showToast('Error', errorMsg, 'error');
        }
    } catch (error) {
        console.error('❌ Exception saving profile:', error);
        let errorMsg = error.message || 'An error occurred while updating profile';
        errorDiv.textContent = errorMsg;
        errorDiv.style.display = 'block';
        this.showToast('Error', errorMsg, 'error');
    }
};