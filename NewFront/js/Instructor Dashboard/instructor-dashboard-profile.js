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

    try {
        document.getElementById('contactNumberError').textContent = '';

        const contactNumber = document.getElementById('editContactNumber').value.trim();

        if (contactNumber && !/^\d{11}$/.test(contactNumber)) {
            document.getElementById('contactNumberError').textContent = 'Contact number must be exactly 11 digits';
            return;
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
            let errorMsg = 'Unknown error';
            if (response.data) {
                errorMsg = response.data.Message || response.data.message || 
                          response.data.Error || response.data.error || errorMsg;
            } else if (response.error) {
                errorMsg = response.error;
            }
            
            console.error('❌ Profile update failed:', errorMsg);
            this.showToast('Error', 'Failed to update profile: ' + errorMsg, 'error');
        }
    } catch (error) {
        console.error('❌ Exception saving profile:', error);
        this.showToast('Error', 'An error occurred: ' + error.message, 'error');
    }
};