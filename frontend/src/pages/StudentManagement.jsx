import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { getUser } from '../utils/auth';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';

const StudentManagement = () => {
  const user = getUser();
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newStudent, setNewStudent] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    grade_level: '',
    password: '',
    sex: ''
  });

  const GRADE_ORDER = ['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const response = await api.get('/users/?role=student');
      setStudents(Array.isArray(response.data) ? response.data : []);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch students:', err);
      toast.error('Failed to load students');
      setStudents([]);
      setLoading(false);
    }
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const response = await api.post('/admin/create-user/', {
        ...newStudent,
        role: 'student',
        profile: {
          lrn: newStudent.username,
          grade_level: newStudent.grade_level,
          sex: newStudent.sex
        }
      });
      
      setShowAddModal(false);
      setNewStudent({ username: '', first_name: '', last_name: '', email: '', password: '', grade_level: '', sex: '' });
      fetchStudents();

      // Show success with password
      Swal.fire({
        icon: 'success',
        title: 'Account Created',
        html: `
          <div class="text-left space-y-2 text-sm">
            <p><strong>Student ID:</strong> ${response.data.username}</p>
            <p><strong>Temporary Password:</strong> <span class="bg-yellow-100 px-2 py-1 rounded font-mono text-lg border border-yellow-300 select-all">${response.data.temporary_password}</span></p>
            <p class="text-xs text-gray-500 mt-4 italic">Please provide this password to the student. They will be required to change it on their first login.</p>
          </div>
        `,
        confirmButtonColor: '#9333ea'
      });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create student');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImportExcel = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const loadingToast = toast.loading('Processing file...');
    try {
      const reader = new FileReader();
      reader.onload = async (evt) => {
        try {
          const bstr = evt.target.result;
          const wb = XLSX.read(bstr, { type: 'binary' });
          const wsname = wb.SheetNames[0];
          const ws = wb.Sheets[wsname];
          
          // Convert sheet to CSV format for the backend
          const csvData = XLSX.utils.sheet_to_csv(ws);
          
          const blob = new Blob([csvData], { type: 'text/csv' });
          const formData = new FormData();
          formData.append('file', blob, 'import.csv');

          toast.loading('Importing students...', { id: loadingToast });
          const response = await api.post('/users/import_csv/', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          toast.dismiss(loadingToast);
          
          const { created_count, created_users, errors } = response.data;

          if (created_count > 0) {
            Swal.fire({
              icon: 'success',
              title: 'Import Successful',
              width: '600px',
              html: `
                <div class="text-left">
                  <p class="mb-4 text-sm font-bold text-emerald-600">Successfully created ${created_count} students!</p>
                  <div class="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
                    <table class="w-full text-[10px] text-left">
                      <thead class="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th class="px-3 py-2">Name</th>
                          <th class="px-3 py-2">ID</th>
                          <th class="px-3 py-2">Temp Password</th>
                        </tr>
                      </thead>
                      <tbody class="divide-y divide-gray-100">
                        ${created_users.map(u => `
                          <tr>
                            <td class="px-3 py-2 font-bold">${u.name}</td>
                            <td class="px-3 py-2">${u.username}</td>
                            <td class="px-3 py-2 font-mono text-purple-600">${u.password}</td>
                          </tr>
                        `).join('')}
                      </tbody>
                    </table>
                  </div>
                  <p class="mt-4 text-[10px] text-gray-500 italic">Please copy these credentials and provide them to the students.</p>
                  ${errors.length > 0 ? `
                    <div class="mt-4 p-3 bg-red-50 rounded-lg">
                      <p class="text-[10px] font-bold text-red-600 mb-1">Errors (${errors.length}):</p>
                      <ul class="text-[9px] text-red-500 list-disc list-inside">
                        ${errors.map(e => `<li>${e}</li>`).join('')}
                      </ul>
                    </div>
                  ` : ''}
                </div>
              `,
              confirmButtonColor: '#9333ea'
            });
          } else if (errors.length > 0) {
            Swal.fire({
              icon: 'error',
              title: 'Import Failed',
              html: `
                <div class="text-left text-sm text-red-500">
                  <ul class="list-disc list-inside">${errors.map(e => `<li>${e}</li>`).join('')}</ul>
                </div>
              `
            });
          }
          
          setShowImportModal(false);
          fetchStudents();
        } catch (err) {
          toast.dismiss(loadingToast);
          toast.error('Failed to parse Excel file');
        }
      };
      reader.readAsBinaryString(file);
    } catch (err) {
      toast.dismiss(loadingToast);
      toast.error('Failed to read file');
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this! All associated data (grades, attendance) will be deleted.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        await api.delete(`/users/${id}/`);
        fetchStudents();
        toast.success('Student account deleted');
      } catch (err) {
        console.error('Failed to delete student:', err);
        toast.error('Failed to delete student');
      }
    }
  };

  const handleResetPassword = async (studentId) => {
    const result = await Swal.fire({
      title: 'Reset Password',
      text: 'Enter a new temporary password or leave blank for auto-generation:',
      input: 'text',
      inputPlaceholder: 'New password (optional)',
      showCancelButton: true,
      confirmButtonText: 'Reset',
      confirmButtonColor: '#f59e0b',
    });

    if (result.isConfirmed) {
      try {
        const response = await api.post(`/users/${studentId}/reset_password/`, { password: result.value });
        Swal.fire({
          icon: 'success',
          title: 'Password Reset',
          html: `New temporary password: <strong>${response.data.temporary_password}</strong><br/>Please provide this to the student. They will be forced to change it on login.`,
        });
      } catch (err) {
        toast.error('Failed to reset password');
      }
    }
  };

  const handleStartChat = async (studentId) => {
    try {
      await api.post('/chat/rooms/get_or_create_private_chat/', { user_id: studentId });
      navigate('/messages');
    } catch (err) {
      toast.error('Failed to start conversation');
    }
  };

  const handleToggleStatus = async (student, newStatus) => {
    try {
      const response = await api.post(`/users/${student.id}/update_status/`, { status: newStatus });
      toast.success(response.data.status);
      fetchStudents();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const handleExportExcel = () => {
    const data = students.map(s => {
      const row = {
        'First Name': s.first_name,
        'Last Name': s.last_name,
        'Student ID': s.profile?.registration_number || s.username,
        'Sex': s.profile?.sex || 'N/A',
        'Classroom': s.profile?.classroom_name || 'N/A',
        'Email': s.email || '',
        'Temp Password': s.must_change_password ? (s.temp_password_storage || 'Pending') : 'Changed',
        'Status': s.account_status
      };

      // Only include Grade Level for admins
      if (user?.role === 'admin') {
        return {
          ...row,
          'Grade Level': s.profile?.grade_level || 'N/A'
        };
      }
      return row;
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Students");
    XLSX.writeFile(wb, `students_export_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Excel exported successfully');
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Student Directory', 14, 20);
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 28);

    const headers = user?.role === 'admin' 
      ? ['Name', 'LRN', 'Grade', 'Classroom', 'Status']
      : ['Name', 'LRN', 'Classroom', 'Status'];
    
    const colWidths = user?.role === 'admin'
       ? [55, 37, 25, 40, 25]
       : [65, 40, 52, 25];
    
    let y = 40;

    // Header background
    doc.setFillColor(45, 27, 77); // #2D1B4D
    doc.rect(14, y - 5, 182, 7, 'F');
    doc.setTextColor(255);
    doc.setFont("helvetica", "bold");
    
    let x = 14;
    headers.forEach((h, i) => {
      doc.text(h, x, y);
      x += colWidths[i];
    });

    y += 10;
    doc.setTextColor(0);
    doc.setFont("helvetica", "normal");

    students.forEach((s, index) => {
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
      
      const name = `${s.first_name} ${s.last_name}`;
      const lrn = s.profile?.registration_number || s.username || '—';
      const grade = s.profile?.grade_level || 'N/A';
      const classroom = s.profile?.classroom_name || 'N/A';
      const status = s.account_status;

      let cx = 14;
      doc.text(name.substring(0, 35), cx, y); cx += colWidths[0];
      doc.text(String(lrn), cx, y); cx += colWidths[1];
      
      if (user?.role === 'admin') {
        doc.text(String(grade), cx, y); cx += colWidths[2];
      }
      
      doc.text(String(classroom).substring(0, 20), cx, y); cx += colWidths[3];
      doc.text(String(status), cx, y);

      y += 7;
      // Zebra striping
      if (index % 2 === 0) {
        doc.setFillColor(245, 245, 245);
        doc.rect(14, y - 5, 182, 7, 'F');
      }
    });

    doc.save(`students_export_${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success('PDF exported successfully');
  };

  const organizedData = useMemo(() => {
    const filtered = students.filter(s => {
      const search = searchQuery.toLowerCase();
      const fullName = `${s.first_name || ''} ${s.last_name || ''}`.toLowerCase();
      const lrn = (s.profile?.registration_number || s.username || '').toLowerCase();
      const email = (s.email || '').toLowerCase();
      return (
        email.includes(search) ||
        fullName.includes(search) ||
        lrn.includes(search)
      );
    });

    // Group by Grade -> Classroom
    const groups = {};
    
    filtered.forEach(s => {
      const grade = s.profile?.grade_level || 'Unassigned';
      const classroom = s.profile?.classroom_name || 'No Classroom';
      
      if (!groups[grade]) groups[grade] = {};
      if (!groups[grade][classroom]) groups[grade][classroom] = [];
      groups[grade][classroom].push(s);
    });

    // Sort Grades
    const sortedGrades = Object.keys(groups).sort((a, b) => {
      const indexA = GRADE_ORDER.indexOf(a);
      const indexB = GRADE_ORDER.indexOf(b);
      if (indexA === -1 && indexB === -1) return a.localeCompare(b);
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });

    return sortedGrades.map(grade => ({
      grade,
      classrooms: Object.keys(groups[grade]).sort().map(classroom => ({
        name: classroom,
        students: groups[grade][classroom].sort((a, b) => a.last_name.localeCompare(b.last_name))
      }))
    }));
  }, [students, searchQuery]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  const ProfileField = ({ label, value }) => (
    <div className="border-b border-gray-50 py-3 last:border-0">
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">{label}</p>
      <p className="text-sm font-bold text-gray-700">{value || <span className="text-gray-300 font-normal">Not provided</span>}</p>
    </div>
  );

  return (
    <div className="overflow-y-auto h-[calc(100vh-4rem)] p-1.5 md:p-6 space-y-2 md:space-y-6 bg-gray-50/50 max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 md:gap-6">
        <div className="text-center md:text-left">
          <h1 className="text-lg md:text-3xl font-black text-gray-800 tracking-tight uppercase">
            {user?.role === 'teacher' ? 'Advisory Class' : 'Student Management'}
          </h1>
          <p className="text-gray-500 text-[8px] md:text-base mt-0.5 font-medium uppercase tracking-widest">
            {user?.role === 'teacher' ? 'Manage your advisory students' : 'All registered students'}
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <button 
            onClick={() => setShowAddModal(true)}
            className="bg-purple-600 text-white px-3 py-1.5 md:px-5 md:py-2.5 rounded-xl md:rounded-2xl border border-purple-700 shadow-lg hover:bg-purple-700 flex items-center gap-2 transition-all active:scale-95"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
            <span className="text-[10px] md:text-sm font-bold uppercase tracking-wider">Add Student</span>
          </button>
          <button 
            onClick={() => setShowImportModal(true)}
            className="bg-indigo-600 text-white px-3 py-1.5 md:px-5 md:py-2.5 rounded-xl md:rounded-2xl border border-indigo-700 shadow-lg hover:bg-indigo-700 flex items-center gap-2 transition-all active:scale-95"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
            <span className="text-[10px] md:text-sm font-bold uppercase tracking-wider">Import Excel</span>
          </button>

          <div className="flex items-center gap-1">
            <button 
              onClick={() => {
                const headers = [['Student ID', 'First Name', 'Last Name', 'Grade Level', 'Sex', 'Email']];
                const sampleData = [
                  ['128150150092', 'Arc', 'Capisen', 'Grade 12', 'Male', ''],
                  ['128150150093', 'Arcc', 'Capisenq', 'Grade 12', 'Female', ''],
                  ['128150150094', 'Arcy', 'Capisenw', 'Grade 12', 'Male', ''],
                ];
                
                const ws = XLSX.utils.aoa_to_sheet([...headers, ...sampleData]);
                
                // Apply basic styling to headers
                const headerRange = XLSX.utils.decode_range(ws['!ref']);
                for (let C = headerRange.s.c; C <= 5; ++C) {
                  const address = XLSX.utils.encode_col(C) + '1';
                  if (!ws[address]) continue;
                  ws[address].s = {
                    font: { bold: true, color: { rgb: "FFFFFF" } },
                    fill: { fgColor: { rgb: "4F46E5" } }, // Indigo 600
                    alignment: { horizontal: "center" }
                  };
                }

                // Set column widths
                ws['!cols'] = [
                  { wch: 20 }, // Student ID
                  { wch: 20 }, // First Name
                  { wch: 20 }, // Last Name
                  { wch: 15 }, // Grade Level
                  { wch: 10 }, // Sex
                  { wch: 30 }, // Email
                ];

                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, "Student Template");
                XLSX.writeFile(wb, "KNHS_Student_Import_Template.xlsx");
                toast.success('Professional template downloaded');
              }}
              className="bg-emerald-600 text-white px-3 py-1.5 md:px-5 md:py-2.5 rounded-xl md:rounded-2xl border border-emerald-700 shadow-lg hover:bg-emerald-700 flex items-center gap-2 transition-all active:scale-95"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              <span className="text-[10px] md:text-sm font-bold uppercase tracking-wider">Download Template</span>
            </button>
            
            <div className="relative group/info">
              <button className="w-6 h-6 md:w-10 md:h-10 flex items-center justify-center rounded-xl md:rounded-2xl bg-white text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all border border-gray-200 shadow-sm active:scale-90">
                <span className="font-black text-xs md:text-lg">!</span>
              </button>
              
              <div className="absolute top-full right-0 mt-2 w-64 md:w-80 p-4 md:p-6 bg-slate-900/95 backdrop-blur-md text-white rounded-2xl md:rounded-3xl shadow-2xl opacity-0 invisible group-hover/info:opacity-100 group-hover/info:visible transition-all z-[110] border border-white/10 scale-95 group-hover/info:scale-100 origin-top-right">
                <h4 className="text-[10px] md:text-xs font-black uppercase tracking-[0.2em] text-indigo-400 mb-3 md:mb-4 border-b border-white/10 pb-2">Import Instructions</h4>
                <ul className="space-y-2 md:space-y-3">
                  <li className="flex gap-2 md:gap-3">
                    <span className="text-indigo-400 font-black text-[10px] md:text-xs mt-0.5">01</span>
                    <p className="text-[9px] md:text-[11px] font-bold leading-relaxed text-gray-300">Student ID must be exactly <span className="text-white">12 digits (LRN)</span>.</p>
                  </li>
                  <li className="flex gap-2 md:gap-3">
                    <span className="text-indigo-400 font-black text-[10px] md:text-xs mt-0.5">02</span>
                    <p className="text-[9px] md:text-[11px] font-bold leading-relaxed text-gray-300">Email is <span className="text-white">optional</span> - you can leave it blank.</p>
                  </li>
                  <li className="flex gap-2 md:gap-3">
                    <span className="text-indigo-400 font-black text-[10px] md:text-xs mt-0.5">03</span>
                    <p className="text-[9px] md:text-[11px] font-bold leading-relaxed text-gray-300">Grade Level: <span className="text-white">Grade 7 to Grade 12</span>.</p>
                  </li>
                  <li className="flex gap-2 md:gap-3">
                    <span className="text-indigo-400 font-black text-[10px] md:text-xs mt-0.5">04</span>
                    <p className="text-[9px] md:text-[11px] font-bold leading-relaxed text-gray-300">Do <span className="text-rose-400">NOT</span> change the header names in the first row.</p>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-1 bg-white p-1 rounded-xl md:rounded-2xl border border-gray-200 shadow-sm">
            <button 
              onClick={handleExportExcel}
              className="p-1.5 md:p-2.5 text-emerald-600 hover:bg-emerald-50 rounded-lg md:rounded-xl transition-all"
              title="Export Excel"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            </button>
            <button 
              onClick={handleExportPDF}
              className="p-1.5 md:p-2.5 text-rose-600 hover:bg-rose-50 rounded-lg md:rounded-xl transition-all"
              title="Export PDF"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
            </button>
          </div>
          <div className="bg-white px-3 py-1.5 md:px-5 md:py-2.5 rounded-xl md:rounded-2xl border border-gray-200 shadow-sm flex items-center gap-2 md:gap-3">
            <div>
              <p className="text-[7px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest">
                {user?.role === 'teacher' ? 'Advisory Students' : 'Total Students'}
              </p>
              <p className="text-sm md:text-xl font-black text-gray-800 leading-none">{students.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-1.5 md:p-4 rounded-xl md:rounded-2xl border border-gray-100 shadow-sm">
        <div className="relative group max-w-xl mx-auto">
          <svg className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 md:w-5 md:h-5 text-gray-400 group-focus-within:text-purple-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input 
            type="text" 
            placeholder="Search name or LRN..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 md:pl-12 pr-3 md:pr-4 py-1.5 md:py-3 bg-gray-50 border border-gray-200 rounded-lg md:rounded-xl focus:outline-none focus:ring-1 focus:ring-purple-500 focus:bg-white text-[10px] md:text-sm font-bold transition-all shadow-inner uppercase tracking-wider" 
          />
        </div>
      </div>

      {/* Organized List */}
      <div className="space-y-4 md:space-y-10 pb-6 md:pb-10">
        {organizedData.length === 0 ? (
          <div className="bg-white rounded-2xl md:rounded-3xl border border-gray-200 shadow-sm p-10 md:p-20 text-center">
            <div className="w-12 h-12 md:w-24 md:h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-6">
              <svg className="w-6 h-6 md:w-12 md:h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <h3 className="text-sm md:text-2xl font-black text-gray-700 mb-1 md:mb-2 uppercase tracking-tight">No Students Found</h3>
            <p className="text-[10px] md:text-base text-gray-400 font-bold uppercase tracking-widest">Try a different search.</p>
          </div>
        ) : (
          organizedData.map((gradeGroup) => (
            <div key={gradeGroup.grade} className="space-y-2 md:space-y-6">
              <div className="flex items-center gap-2 md:gap-4 px-1 md:px-2">
                <h2 className="text-xs md:text-xl font-black text-gray-800 uppercase tracking-tight">{gradeGroup.grade}</h2>
                <div className="h-px flex-1 bg-gradient-to-r from-gray-200 to-transparent"></div>
              </div>

              <div className="grid grid-cols-1 gap-3 md:gap-8">
                {gradeGroup.classrooms.map((cls) => (
                  <div key={cls.name} className="bg-white rounded-lg md:rounded-2xl border border-gray-200 shadow-sm overflow-hidden min-w-0">
                    <div className="px-3 py-1.5 md:px-6 md:py-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 md:gap-3">
                        <div className="w-5 h-5 md:w-8 md:h-8 bg-indigo-100 rounded md:rounded-lg flex items-center justify-center">
                          <svg className="w-3 h-3 md:w-4 md:h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                        </div>
                        <h3 className="font-black text-gray-700 text-[9px] md:text-sm uppercase tracking-wider">{cls.name}</h3>
                      </div>
                      <span className="text-[7px] md:text-[10px] font-black text-indigo-500 bg-indigo-50 px-1.5 py-0.5 md:px-2.5 md:py-1 rounded-full uppercase tracking-widest">
                        {cls.students.length}
                      </span>
                    </div>

                    <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-200 max-w-full">
                      <table className="w-full text-left min-w-[400px] md:min-w-full">
                        <thead>
                          <tr className="text-[7px] md:text-[10px] font-black text-white uppercase tracking-widest border-b border-gray-50 bg-[#2D1B4D]">
                            <th className="px-3 py-1.5 md:px-6 md:py-4 w-10 md:w-16">#</th>
                            <th className="px-3 py-1.5 md:px-6 md:py-4">Student</th>
                            <th className="hidden md:table-cell px-6 py-4">Sex</th>
                            <th className="hidden md:table-cell px-6 py-4">Email</th>
                            <th className="hidden md:table-cell px-6 py-4">LRN</th>
                            <th className="px-3 py-1.5 md:px-6 md:py-4 text-center">Status</th>
                            <th className="px-3 py-1.5 md:px-6 md:py-4 text-center">Opt</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {cls.students.map((student, idx) => (
                            <tr key={student.id} className="group hover:bg-purple-50 transition-colors">
                              <td className="px-3 py-1 md:px-6 md:py-4 text-[7px] md:text-xs font-black text-gray-300">{idx + 1}</td>
                              <td className="px-3 py-1 md:px-6 md:py-4">
                                <div className="flex items-center gap-1.5 md:gap-3">
                                  <div className="relative flex-shrink-0">
                                    <div className="w-6 h-6 md:w-8 md:h-8 rounded md:rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-black text-[8px] md:text-xs shadow-sm">
                                      {student.first_name?.charAt(0)}{student.last_name?.charAt(0)}
                                    </div>
                                    <div className={`absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 md:w-2.5 md:h-2.5 rounded-full border border-white shadow-sm ${student.is_online ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                  </div>
                                  <div className="flex flex-col min-w-0">
                                    <span className="text-[9px] md:text-sm font-black text-gray-800 leading-tight uppercase tracking-tighter truncate">{student.first_name} {student.last_name}</span>
                                    <span className={`text-[6px] md:text-[9px] font-black uppercase tracking-widest truncate ${student.is_online ? 'text-green-500' : 'text-gray-400'}`}>
                                      {student.is_online ? 'Online' : 'Offline'}
                                    </span>
                                  </div>
                                </div>
                              </td>
                              <td className="hidden md:table-cell px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-widest">{student.profile?.sex || 'N/A'}</td>
                              <td className="hidden md:table-cell px-6 py-4 text-sm font-medium text-gray-500">{student.email}</td>
                              <td className="hidden md:table-cell px-6 py-4">
                                <div className="flex flex-col">
                                  <span className="text-xs font-black text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full w-fit">
                                    {student.profile?.registration_number || student.username || '—'}
                                  </span>
                                  {student.must_change_password && student.temp_password_storage && (
                                    <div className="mt-1 flex items-center gap-1 group/pass">
                                      <span className="text-[8px] font-black text-amber-500 uppercase tracking-widest">Temp Pass:</span>
                                      <span className="text-[10px] font-mono font-bold text-amber-600 bg-amber-50 px-1 rounded border border-amber-100 select-all cursor-help" title="Visible until student changes password">
                                        {student.temp_password_storage}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="px-3 py-1 md:px-6 md:py-4 text-center">
                                <select 
                                  value={student.account_status} 
                                  onChange={(e) => handleToggleStatus(student, e.target.value)}
                                  className={`text-[7px] md:text-[10px] font-black px-1.5 py-0.5 md:px-2 md:py-1 rounded uppercase tracking-widest border-0 focus:ring-2 focus:ring-purple-500 cursor-pointer transition-all ${
                                    student.account_status === 'active' ? 'bg-emerald-100 text-emerald-600' : 
                                    student.account_status === 'suspended' ? 'bg-rose-100 text-rose-600' : 
                                    'bg-gray-100 text-gray-600'
                                  }`}
                                >
                                  <option value="active">Active</option>
                                  <option value="inactive">Inactive</option>
                                  <option value="suspended">Suspended</option>
                                </select>
                              </td>
                              <td className="px-3 py-1 md:px-6 md:py-4">
                                <div className="flex items-center justify-center gap-0.5 md:gap-2">
                                  <button
                                    onClick={() => handleStartChat(student.id)}
                                    className="p-1 md:p-2 text-violet-500 hover:bg-violet-50 rounded md:rounded-lg transition-all active:scale-90"
                                    title="Send Message"
                                  >
                                    <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => { setSelectedStudent(student); setShowProfileModal(true); }}
                                    className="p-1 md:p-2 text-blue-500 hover:bg-blue-50 rounded md:rounded-lg transition-all active:scale-90"
                                    title="View Profile"
                                  >
                                    <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => handleResetPassword(student.id)}
                                    className="p-1 md:p-2 text-amber-500 hover:bg-amber-50 rounded md:rounded-lg transition-all active:scale-90"
                                    title="Reset Password"
                                  >
                                    <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => handleDelete(student.id)}
                                    className="p-1 md:p-2 text-red-500 hover:bg-red-50 rounded md:rounded-lg transition-all active:scale-90"
                                    title="Delete Student"
                                  >
                                    <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Profile Modal */}
      {showProfileModal && selectedStudent && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
            <div className="p-8 bg-gradient-to-br from-indigo-600 to-purple-700 text-white relative">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-white font-black text-3xl border border-white/30 shadow-inner">
                    {selectedStudent.first_name?.charAt(0).toUpperCase()}{selectedStudent.last_name?.charAt(0).toUpperCase()}
                  </div>
                  <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-4 border-indigo-600 shadow-sm ${selectedStudent.is_online ? 'bg-green-500' : 'bg-gray-300'}`} title={selectedStudent.is_online ? 'Online' : 'Offline'}>
                    {selectedStudent.is_online && <span className="absolute w-full h-full rounded-full bg-green-500 animate-ping opacity-20"></span>}
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-3xl font-black tracking-tight">{selectedStudent.first_name} {selectedStudent.last_name}</h2>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${selectedStudent.is_online ? 'bg-green-500/20 border-green-400 text-green-200' : 'bg-white/10 border-white/20 text-white/60'}`}>
                      {selectedStudent.is_online ? 'Online' : 'Offline'}
                    </span>
                  </div>
                  <p className="text-indigo-100 text-sm font-bold uppercase tracking-widest opacity-90">{selectedStudent.email}</p>
                </div>
              </div>
              <button onClick={() => setShowProfileModal(false)} className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1 max-h-[60vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200">
              <div className="md:col-span-2 mb-4">
                <h3 className="text-xs font-black text-indigo-500 uppercase tracking-[0.2em] pb-2 border-b-2 border-indigo-50">Personal Information</h3>
              </div>
              <ProfileField label="LRN (Learner Reference Number)" value={selectedStudent.profile?.registration_number} />
              <ProfileField label="Grade Level" value={selectedStudent.profile?.grade_level} />
              <ProfileField label="Sex" value={selectedStudent.profile?.sex} />
              <ProfileField label="Date of Birth" value={selectedStudent.profile?.date_of_birth} />
              <ProfileField label="Nationality" value={selectedStudent.profile?.nationality} />
              <ProfileField label="Province / State" value={selectedStudent.profile?.state} />
              
              <div className="md:col-span-2 mt-6 mb-4">
                <h3 className="text-xs font-black text-indigo-500 uppercase tracking-[0.2em] pb-2 border-b-2 border-indigo-50">Family & Contact</h3>
              </div>
              <ProfileField label="Father's Name" value={selectedStudent.profile?.father_name} />
              <ProfileField label="Mother's Name" value={selectedStudent.profile?.mother_name} />
              <ProfileField label="Phone Number" value={selectedStudent.profile?.phone_number} />
              <ProfileField label="Home Address" value={selectedStudent.profile?.address} />
              <div className="md:col-span-2">
                <ProfileField label="Emergency Contact Info" value={selectedStudent.profile?.contact_information} />
              </div>
            </div>

            <div className="p-8 border-t border-gray-100 bg-gray-50/50 flex items-center justify-end gap-3">
              <button
                onClick={() => handleStartChat(selectedStudent.id)}
                className="px-6 py-2.5 bg-violet-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-violet-200 hover:bg-violet-700 transition-all active:scale-95 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                Message Student
              </button>
              <button
                onClick={() => setShowProfileModal(false)}
                className="px-6 py-2.5 bg-white text-gray-700 border border-gray-200 rounded-xl font-bold text-sm hover:bg-gray-50 transition-all active:scale-95"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-6 bg-purple-600 text-white">
              <h2 className="text-xl font-black uppercase tracking-tight">Create Student Account</h2>
            </div>
            <form onSubmit={handleAddStudent} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Student ID / LRN</label>
                <input 
                  type="text" 
                  value={newStudent.username}
                  onChange={e => setNewStudent({...newStudent, username: e.target.value})}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-purple-500 outline-none"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">First Name</label>
                  <input 
                    type="text" 
                    value={newStudent.first_name}
                    onChange={e => setNewStudent({...newStudent, first_name: e.target.value})}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-purple-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Last Name</label>
                  <input 
                    type="text" 
                    value={newStudent.last_name}
                    onChange={e => setNewStudent({...newStudent, last_name: e.target.value})}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-purple-500 outline-none"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Grade Level</label>
                  <select 
                    value={newStudent.grade_level}
                    onChange={e => setNewStudent({...newStudent, grade_level: e.target.value})}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-purple-500 outline-none"
                    required
                  >
                    <option value="">Select Grade</option>
                    {GRADE_ORDER.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Sex</label>
                  <select 
                    value={newStudent.sex}
                    onChange={e => setNewStudent({...newStudent, sex: e.target.value})}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-purple-500 outline-none"
                    required
                  >
                    <option value="">Select Sex</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Email (Optional)</label>
                <input 
                  type="email" 
                  value={newStudent.email}
                  onChange={e => setNewStudent({...newStudent, email: e.target.value})}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Temporary Password</label>
                <input 
                  type="text" 
                  value={newStudent.password}
                  onChange={e => setNewStudent({...newStudent, password: e.target.value})}
                  placeholder="Leave blank for auto-gen"
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-6 py-2 bg-gray-100 text-gray-600 rounded-xl font-bold text-sm">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-6 py-2 bg-purple-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-purple-200">
                  {isSubmitting ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden p-8 text-center">
            <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
            </div>
            <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tight mb-2">Bulk Import Students</h2>
            <p className="text-sm text-gray-500 font-medium mb-8">Upload an Excel file (.xlsx, .xls) with headers: <br/><code className="bg-gray-100 px-2 py-1 rounded text-xs">Student ID, First Name, Last Name, Grade Level, Sex, Email</code></p>
            
            <input 
              type="file" 
              accept=".xlsx, .xls" 
              onChange={handleImportExcel}
              className="hidden" 
              id="excel-upload"
            />
            <label 
              htmlFor="excel-upload"
              className="w-full block bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl cursor-pointer transition-all active:scale-95 shadow-lg shadow-indigo-100 mb-4"
            >
              Select Excel File
            </label>
            <button onClick={() => setShowImportModal(false)} className="text-gray-400 font-bold text-sm hover:text-gray-600">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentManagement;
