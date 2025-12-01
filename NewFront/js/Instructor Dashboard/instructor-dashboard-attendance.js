// =====================================================
// Instructor Dashboard - Attendance Management Module
// Handles all attendance-related functionality
// =====================================================

// ===== ATTENDANCE SECTION =====
InstructorDashboard.prototype.loadAttendance = async function() {
    console.log('📋 Loading attendance management...');
    console.log('📌 Current Instructor ID:', this.currentInstructorId);

    try {
        if (!this.currentInstructorId) {
            console.error('❌ Instructor ID is not available!');
            this.showToast('Error', 'Instructor ID not available. Please refresh.', 'error');
            return;
        }

        this.instructorId = this.currentInstructorId;
        console.log('✅ Set instructorId to:', this.instructorId);

        await this.loadAttendanceStats();
        await this.loadAttendanceRecords();
        await this.loadRecentActivity();

        console.log('✅ Attendance section loaded successfully');
        
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('refresh') === 'true') {
            console.log('🔄 Auto-refreshing from mark-attendance return');
            window.history.replaceState({}, '', window.location.pathname + '#attendance');
        }
    } catch (error) {
        console.error('❌ Error loading attendance:', error);
        this.showToast('Error', 'Failed to load attendance data: ' + error.message, 'error');
    }
};

InstructorDashboard.prototype.loadAttendanceStats = async function() {
    try {
        const instructorId = this.instructorId || this.currentInstructorId;
        
        if (!instructorId) {
            console.warn('⚠️ Instructor ID not available for stats');
            document.getElementById('totalAttendanceRecords').textContent = '0';
            document.getElementById('totalPresent').textContent = '0';
            document.getElementById('totalAbsent').textContent = '0';
            document.getElementById('totalLate').textContent = '0';
            return;
        }
        
        console.log('📊 Loading stats for instructor ID:', instructorId);

        const coursesResponse = await API.request(`/Course/instructor/${instructorId}`, {
            method: 'GET'
        });

        if (!coursesResponse.success) {
            console.error('Failed to load courses for stats');
            return;
        }

        let courses = coursesResponse.data?.data || coursesResponse.data?.Data || coursesResponse.data || [];
        if (!Array.isArray(courses)) {
            courses = [courses];
        }

        let allRecords = [];
        for (const course of courses) {
            const courseId = course.id || course.Id || course.courseId || course.CourseId;
            try {
                const attendanceResponse = await API.request(`/Attendance/filter?courseId=${courseId}`, {
                    method: 'GET'
                });
                if (attendanceResponse.success) {
                    let records = attendanceResponse.data?.data || attendanceResponse.data?.Data || attendanceResponse.data || [];
                    if (!Array.isArray(records)) {
                        records = [records];
                    }
                    allRecords = allRecords.concat(records);
                }
            } catch (err) {
                console.warn('Could not load attendance for course:', courseId);
            }
        }

        const stats = {
            total: allRecords.length,
            present: allRecords.filter(r => (r.status || r.Status || '').toLowerCase() === 'present').length,
            absent: allRecords.filter(r => (r.status || r.Status || '').toLowerCase() === 'absent').length,
            late: allRecords.filter(r => (r.status || r.Status || '').toLowerCase() === 'late').length
        };

        document.getElementById('totalAttendanceRecords').textContent = stats.total;
        document.getElementById('totalPresent').textContent = stats.present;
        document.getElementById('totalAbsent').textContent = stats.absent;
        document.getElementById('totalLate').textContent = stats.late;

    } catch (error) {
        console.error('Error loading attendance stats:', error);
        document.getElementById('totalAttendanceRecords').textContent = '0';
        document.getElementById('totalPresent').textContent = '0';
        document.getElementById('totalAbsent').textContent = '0';
        document.getElementById('totalLate').textContent = '0';
    }
};

InstructorDashboard.prototype.loadAttendanceRecords = async function() {
    try {
        const instructorId = this.instructorId || this.currentInstructorId;
        
        if (!instructorId) {
            console.warn('⚠️ Instructor ID not available for records');
            return;
        }
        
        console.log('📋 Loading records for instructor ID:', instructorId);

        const coursesResponse = await API.request(`/Course/instructor/${instructorId}`, {
            method: 'GET'
        });

        if (!coursesResponse.success) {
            console.error('Failed to load courses');
            return;
        }

        let courses = coursesResponse.data?.data || coursesResponse.data?.Data || coursesResponse.data || [];
        if (!Array.isArray(courses)) {
            courses = [courses];
        }

        const fromDate = document.getElementById('filterFromDate').value;
        const toDate = document.getElementById('filterToDate').value;

        let records = [];
        for (const course of courses) {
            const courseId = course.id || course.Id || course.courseId || course.CourseId;
            const courseName = course.name || course.Name || course.courseName || course.CourseName;
            
            try {
                let url = `/Attendance/filter?courseId=${courseId}`;
                if (fromDate) url += `&from=${fromDate}`;
                if (toDate) url += `&to=${toDate}`;
                
                const attendanceResponse = await API.request(url, {
                    method: 'GET'
                });
                
                if (attendanceResponse.success) {
                    let courseRecords = attendanceResponse.data?.data || attendanceResponse.data?.Data || attendanceResponse.data || [];
                    if (!Array.isArray(courseRecords)) {
                        courseRecords = [courseRecords];
                    }
                    courseRecords = courseRecords.map(r => ({
                        ...r,
                        courseName: courseName
                    }));
                    records = records.concat(courseRecords);
                }
            } catch (err) {
                console.warn('Could not load attendance for course:', courseId);
            }
        }

        if (fromDate || toDate) {
            records = records.filter(record => {
                const recordDate = new Date(record.date || record.Date);
                if (fromDate && recordDate < new Date(fromDate)) return false;
                if (toDate && recordDate > new Date(toDate)) return false;
                return true;
            });
        }

        records.sort((a, b) => new Date(b.date || b.Date) - new Date(a.date || a.Date));

        const tbody = document.getElementById('attendanceRecordsBody');
        if (records.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No records found</td></tr>';
            return;
        }

        tbody.innerHTML = records.map(record => {
            const studentName = record.studentName || record.StudentName || 'Unknown';
            const courseName = record.courseName || record.CourseName || 'Unknown';
            const date = new Date(record.date || record.Date).toLocaleDateString();
            const status = record.status || record.Status || '';
            const attendanceId = record.id || record.Id || record.attendanceId || record.AttendanceId;

            let statusBadge = '';
            switch (status.toLowerCase()) {
                case 'present':
                    statusBadge = '<span class="status-badge status-present">Present</span>';
                    break;
                case 'absent':
                    statusBadge = '<span class="status-badge status-absent">Absent</span>';
                    break;
                case 'late':
                    statusBadge = '<span class="status-badge status-late">Late</span>';
                    break;
                case 'excused':
                    statusBadge = '<span class="status-badge status-excused">Excused</span>';
                    break;
                default:
                    statusBadge = `<span class="status-badge">${status}</span>`;
            }

            return `
                <tr>
                    <td>${studentName}</td>
                    <td>${courseName}</td>
                    <td>${date}</td>
                    <td>${statusBadge}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-danger" onclick="instructorDashboard.deleteAttendance(${attendanceId})">
                            <i class="bi bi-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');

    } catch (error) {
        console.error('Error loading attendance records:', error);
    }
};

InstructorDashboard.prototype.loadRecentActivity = async function() {
    try {
        const instructorId = this.instructorId || this.currentInstructorId;
        
        if (!instructorId) {
            console.warn('⚠️ Instructor ID not available for recent activity');
            return;
        }
        
        console.log('📱 Loading recent activity for instructor ID:', instructorId);

        const coursesResponse = await API.request(`/Course/instructor/${instructorId}`, {
            method: 'GET'
        });

        if (!coursesResponse.success) return;

        let courses = coursesResponse.data?.data || coursesResponse.data?.Data || coursesResponse.data || [];
        if (!Array.isArray(courses)) {
            courses = [courses];
        }

        let records = [];
        for (const course of courses) {
            const courseId = course.id || course.Id || course.courseId || course.CourseId;
            try {
                const attendanceResponse = await API.request(`/Attendance/filter?courseId=${courseId}`, {
                    method: 'GET'
                });
                if (attendanceResponse.success) {
                    let courseRecords = attendanceResponse.data?.data || attendanceResponse.data?.Data || attendanceResponse.data || [];
                    if (!Array.isArray(courseRecords)) {
                        courseRecords = [courseRecords];
                    }
                    records = records.concat(courseRecords);
                }
            } catch (err) {
                console.warn('Could not load attendance for course:', courseId);
            }
        }

        records.sort((a, b) => new Date(b.date || b.Date) - new Date(a.date || a.Date));
        records = records.slice(0, 10);

        const container = document.getElementById('recentActivityList');
        if (records.length === 0) {
            container.innerHTML = '<p class="text-muted text-center">No recent activity</p>';
            return;
        }

        container.innerHTML = records.map(record => {
            const studentName = record.studentName || record.StudentName || 'Unknown';
            const status = record.status || record.Status || '';
            const date = new Date(record.date || record.Date).toLocaleDateString();
            
            let icon = '';
            let colorClass = '';
            switch (status.toLowerCase()) {
                case 'present':
                    icon = 'check-circle-fill';
                    colorClass = 'text-success';
                    break;
                case 'absent':
                    icon = 'x-circle-fill';
                    colorClass = 'text-danger';
                    break;
                case 'late':
                    icon = 'clock-fill';
                    colorClass = 'text-warning';
                    break;
                case 'excused':
                    icon = 'info-circle-fill';
                    colorClass = 'text-info';
                    break;
            }

            return `
                <div class="recent-activity-item">
                    <div class="d-flex align-items-start">
                        <i class="bi bi-${icon} ${colorClass} me-2 mt-1"></i>
                        <div class="flex-grow-1">
                            <p class="mb-0 small"><strong>${studentName}</strong></p>
                            <p class="mb-0 small text-muted">${status} - ${date}</p>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

    } catch (error) {
        console.error('Error loading recent activity:', error);
    }
};

InstructorDashboard.prototype.deleteAttendance = async function(attendanceId) {
    if (!confirm('Are you sure you want to delete this attendance record?')) {
        return;
    }

    try {
        const response = await API.request(`/Attendance/${attendanceId}`, {
            method: 'DELETE'
        });

        if (response.success) {
            this.showToast('Success', 'Attendance record deleted', 'success');
            await this.loadAttendanceStats();
            await this.loadAttendanceRecords();
            await this.loadRecentActivity();
        } else {
            this.showToast('Error', 'Failed to delete attendance record', 'error');
        }

    } catch (error) {
        console.error('Error deleting attendance:', error);
        this.showToast('Error', 'Failed to delete attendance record', 'error');
    }
};

InstructorDashboard.prototype.refreshAttendance = async function() {
    console.log('🔄 Refreshing attendance data...');
    
    const fromDate = document.getElementById('filterFromDate');
    const toDate = document.getElementById('filterToDate');
    if (fromDate) fromDate.value = '';
    if (toDate) toDate.value = '';
    
    await this.loadAttendanceStats();
    await this.loadAttendanceRecords();
    await this.loadRecentActivity();
    
    this.showToast('Success', 'Attendance data refreshed successfully!', 'success');
};

// ===== EXCEL UPLOAD FUNCTIONS =====
InstructorDashboard.prototype.handleExcelUpload = async function(event) {
    console.log('📤 Uploading Excel file for attendance...');
    
    const file = event.target.files[0];
    if (!file) {
        return;
    }

    const validTypes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls)$/)) {
        this.showToast('Error', 'Please upload a valid Excel file (.xlsx or .xls)', 'error');
        event.target.value = '';
        return;
    }

    try {
        const data = await this.readExcelFile(file);
        
        if (!data || data.length === 0) {
            this.showToast('Error', 'Excel file is empty', 'error');
            event.target.value = '';
            return;
        }

        console.log('📊 Excel data parsed:', data);
        await this.processAttendanceData(data);
        event.target.value = '';

    } catch (error) {
        console.error('❌ Error processing Excel file:', error);
        this.showToast('Error', error.message || 'Failed to process Excel file', 'error');
        event.target.value = '';
    }
};

InstructorDashboard.prototype.readExcelFile = function(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet);
                resolve(jsonData);
            } catch (error) {
                reject(new Error('Failed to parse Excel file: ' + error.message));
            }
        };
        
        reader.onerror = () => {
            reject(new Error('Failed to read file'));
        };
        
        reader.readAsArrayBuffer(file);
    });
};

InstructorDashboard.prototype.processAttendanceData = async function(data) {
    console.log('🔄 Processing attendance data...');
    
    const requiredColumns = ['Student Code', 'Course Code', 'Date', 'Status'];
    const firstRow = data[0];
    const missingColumns = requiredColumns.filter(col => !(col in firstRow));
    
    if (missingColumns.length > 0) {
        throw new Error(`Missing required columns: ${missingColumns.join(', ')}\n\nRequired columns: Student Code, Course Code, Date, Status`);
    }

    const validStatuses = ['Present', 'Absent', 'Late', 'Excused'];
    
    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    this.showToast('Info', `Processing ${data.length} attendance records...`, 'info');

    for (let i = 0; i < data.length; i++) {
        const row = data[i];
        const rowNum = i + 2;

        try {
            if (!row['Student Code']) {
                throw new Error(`Row ${rowNum}: Student Code is required`);
            }
            if (!row['Course Code']) {
                throw new Error(`Row ${rowNum}: Course Code is required`);
            }
            if (!row['Date']) {
                throw new Error(`Row ${rowNum}: Date is required`);
            }
            if (!row['Status']) {
                throw new Error(`Row ${rowNum}: Status is required`);
            }

            const status = row['Status'].trim();
            if (!validStatuses.includes(status)) {
                throw new Error(`Row ${rowNum}: Invalid status '${status}'. Must be: Present, Absent, Late, or Excused`);
            }

            let attendanceDate;
            try {
                attendanceDate = this.parseExcelDate(row['Date']);
            } catch (dateError) {
                throw new Error(`Row ${rowNum}: Invalid date format. Use MM/DD/YYYY or YYYY-MM-DD`);
            }

            const courseResponse = await API.request(`/Course/code/${row['Course Code']}`, {
                method: 'GET'
            });

            if (!courseResponse.success || !courseResponse.data?.data) {
                throw new Error(`Row ${rowNum}: Course '${row['Course Code']}' not found`);
            }

            const course = courseResponse.data.data;
            const courseId = course.id || course.Id;

            const enrollmentResponse = await API.request(`/Enrollment/course/${courseId}`, {
                method: 'GET'
            });

            if (!enrollmentResponse.success || !enrollmentResponse.data?.data) {
                throw new Error(`Row ${rowNum}: No enrollments found for course '${row['Course Code']}'`);
            }

            let enrollments = enrollmentResponse.data.data;
            if (!Array.isArray(enrollments)) {
                enrollments = [enrollments];
            }

            const enrollment = enrollments.find(e => 
                (e.studentCode || '').toString().trim().toLowerCase() === row['Student Code'].toString().trim().toLowerCase()
            );

            if (!enrollment) {
                throw new Error(`Row ${rowNum}: Student '${row['Student Code']}' not enrolled in course '${row['Course Code']}'`);
            }

            const studentId = enrollment.studentId || enrollment.id;

            const attendanceData = {
                studentId: studentId,
                courseId: courseId,
                attendanceDate: attendanceDate,
                status: status,
                remarks: row['Remarks'] || ''
            };

            const response = await API.attendance.markAttendance(attendanceData);

            if (response.success) {
                successCount++;
                console.log(`✅ Row ${rowNum}: Attendance marked successfully`);
            } else {
                throw new Error(response.error || 'Failed to mark attendance');
            }

        } catch (error) {
            errorCount++;
            errors.push(`Row ${rowNum}: ${error.message}`);
            console.error(`❌ Row ${rowNum}:`, error);
        }
    }

    console.log(`📊 Processing complete: ${successCount} success, ${errorCount} errors`);

    if (successCount > 0) {
        this.showToast('Success', `Successfully marked ${successCount} attendance record(s)`, 'success');
        await this.loadAttendanceRecords();
    }

    if (errorCount > 0) {
        const errorMessage = `Failed to process ${errorCount} record(s):\n\n${errors.slice(0, 5).join('\n')}${errors.length > 5 ? `\n... and ${errors.length - 5} more` : ''}`;
        console.error('Errors:', errors);
        this.showToast('Warning', errorMessage, 'warning');
    }

    if (successCount === 0 && errorCount > 0) {
        throw new Error('No records were processed successfully');
    }
};

InstructorDashboard.prototype.parseExcelDate = function(dateValue) {
    if (typeof dateValue === 'number') {
        const excelEpoch = new Date(1899, 11, 30);
        const date = new Date(excelEpoch.getTime() + dateValue * 86400000);
        return date.toISOString();
    }

    if (typeof dateValue === 'string') {
        const date = new Date(dateValue);
        if (isNaN(date.getTime())) {
            throw new Error('Invalid date');
        }
        return date.toISOString();
    }

    if (dateValue instanceof Date) {
        return dateValue.toISOString();
    }

    throw new Error('Invalid date format');
};

InstructorDashboard.prototype.downloadCourseExcelTemplate = async function() {
    console.log('📥 Generating Excel template for selected course...');
    
    const select = document.getElementById('templateCourseSelect');
    const courseCode = select.value;
    
    if (!courseCode) {
        this.showToast('Error', 'Please select a course first', 'error');
        return;
    }
    
    try {
        const courseDetailsResponse = await API.request(`/Course/code/${courseCode}`, {
            method: 'GET'
        });
        
        if (!courseDetailsResponse.success || !courseDetailsResponse.data?.data) {
            this.showToast('Error', 'Failed to load course details', 'error');
            return;
        }
        
        const courseDetails = courseDetailsResponse.data.data;
        const courseId = courseDetails.id || courseDetails.Id || courseDetails.courseId || courseDetails.CourseId;
        const courseName = courseDetails.name || courseDetails.courseName || courseDetails.Name || courseDetails.CourseName;
        
        console.log(`✅ Got courseId ${courseId} for ${courseCode}`);
        
        const enrollmentResponse = await API.request(`/Enrollment/course/${courseId}`, {
            method: 'GET'
        });

        if (!enrollmentResponse.success) {
            this.showToast('Error', 'Failed to load enrollments', 'error');
            return;
        }

        let enrollments = enrollmentResponse.data?.data || enrollmentResponse.data?.Data || enrollmentResponse.data || [];
        
        if (!Array.isArray(enrollments)) {
            enrollments = [enrollments];
        }

        enrollments = enrollments.filter(e => {
            if (!e) return false;
            const status = (e.status || e.Status || '').toString().trim().toLowerCase();
            return status === 'approved' || status === 'enrolled';
        });

        console.log(`✅ Found ${enrollments.length} approved students in ${courseCode}`);

        if (enrollments.length === 0) {
            this.showToast('Warning', `No students enrolled in ${courseCode}`, 'warning');
            return;
        }

        const templateData = enrollments.map(enrollment => ({
            'Student Code': enrollment.studentCode || enrollment.StudentCode || '',
            'Student Name': enrollment.studentName || enrollment.StudentName || '',
            'Course Code': courseCode,
            'Course Name': courseName,
            'Date': new Date().toLocaleDateString('en-US'),
            'Status': 'Present',
            'Remarks': ''
        }));

        const worksheet = XLSX.utils.json_to_sheet(templateData);
        
        worksheet['!cols'] = [
            { wch: 15 },
            { wch: 25 },
            { wch: 12 },
            { wch: 30 },
            { wch: 12 },
            { wch: 12 },
            { wch: 30 }
        ];

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance');
        
        const instructions = [
            { 'Instructions': 'ATTENDANCE MARKING TEMPLATE' },
            { 'Instructions': '' },
            { 'Instructions': `Course: ${courseCode} - ${courseName}` },
            { 'Instructions': `Students Enrolled: ${enrollments.length}` },
            { 'Instructions': '' },
            { 'Instructions': 'HOW TO USE:' },
            { 'Instructions': '1. Go to "Attendance" sheet' },
            { 'Instructions': '2. Select status from dropdown: Present, Absent, Late, or Excused' },
            { 'Instructions': '3. Update the Date if needed (format: MM/DD/YYYY)' },
            { 'Instructions': '4. Add optional remarks' },
            { 'Instructions': '5. Save the file' },
            { 'Instructions': '6. Upload using "Upload Excel to Mark Attendance" button' },
            { 'Instructions': '' },
            { 'Instructions': 'IMPORTANT NOTES:' },
            { 'Instructions': '• Do NOT change Student Code or Course Code' },
            { 'Instructions': '• Do NOT add or remove rows' },
            { 'Instructions': '• Status must be: Present, Absent, Late, or Excused' }
        ];
        
        const instructionsSheet = XLSX.utils.json_to_sheet(instructions);
        instructionsSheet['!cols'] = [{ wch: 70 }];
        XLSX.utils.book_append_sheet(workbook, instructionsSheet, 'Instructions');
        
        const filename = `Attendance_${courseCode}_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(workbook, filename);
        
        this.showToast('Success', `Template downloaded with ${enrollments.length} student(s) from ${courseCode}`, 'success');
        
    } catch (error) {
        console.error('❌ Error generating template:', error);
        this.showToast('Error', 'Failed to generate template: ' + error.message, 'error');
    }
};