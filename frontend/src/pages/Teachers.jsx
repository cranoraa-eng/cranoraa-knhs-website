import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { getUser } from '../utils/auth';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import { useScrollLock } from '../hooks/useScrollLock';
import { LoadingSpinner, EmptyState, Button } from '../components/ui';

const Teachers = () => {
  const user = getUser();
  const navigate = useNavigate();
  const [teachers, setTeachers] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeMenu, setActiveMenu] = useState(null);
  const [editingRolesId, setEditingRolesId] = useState(null);
  const [roleForm, setRoleForm] = useState({ staff_title: '', additional_roles: [] });
  const [newTeacher, setNewTeacher] = useState({
    title: '',
    first_name: '',
    last_name: '',
    email: '',
    sex: '',
    staff_title: 'teacher'
  });

  useScrollLock(showAddModal || showEditModal || showImportModal);

  useEffect(() => {
    fetchTeachers();
    fetchClassrooms();
  }, []);

  const fetchTeachers = async () => {
    try {
      const response = await api.get('/users/?role=staff');
      setTeachers(Array.isArray(response.data) ? response.data : []);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch teachers:', err);
      toast.error('Failed to load teachers');
      setTeachers([]);
      setLoading(false);
    }
  };

  const fetchClassrooms = async () => {
    try {
      const response = await api.get('/classrooms/');
      setClassrooms(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error('Failed to fetch classrooms:', err);
      setClassrooms([]);
    }
  };

  const STAFF_TITLES = [
    { value: 'teacher', label: 'Teacher' },
    { value: 'registrar', label: 'Registrar' },
    { value: 'advisory', label: 'Advisory' },
    { value: 'principal', label: 'Principal' },
    { value: 'guidance_counselor', label: 'Guidance Counselor' },
    { value: 'it_staff', label: 'IT Staff' },
    { value: 'librarian', label: 'Librarian' },
    { value: 'cashier', label: 'Cashier' },
    { value: 'other', label: 'Other' },
  ];

  const handleAddTeacher = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const response = await api.post('/admin/create-user/', { 
        username: newTeacher.email, 
        ...newTeacher, 
        role: 'staff',
        staff_title: newTeacher.staff_title,
        profile: {
          title: newTeacher.title,
          sex: newTeacher.sex
        }
      });
      
      setShowAddModal(false);
      setNewTeacher({
        email: '',
        first_name: '',
        last_name: '',
        title: '',
        sex: '',
        staff_title: 'teacher'
      });
      fetchTeachers();

      Swal.fire({
        icon: 'success',
        title: 'Staff Account Created',
        html: `
          <div class="text-left space-y-2 text-sm">
            <p><strong>Role:</strong> ${STAFF_TITLES.find(t => t.value === newTeacher.staff_title)?.label || newTeacher.staff_title}</p>
            <p><strong>Full Name:</strong> ${newTeacher.first_name} ${newTeacher.last_name}</p>
            <p><strong>Username/Email:</strong> ${response.data.username}</p>
            <p><strong>Temporary Password:</strong> <span class="bg-yellow-100 px-2 py-1 rounded font-mono text-lg border border-yellow-300 select-all">${response.data.temporary_password}</span></p>
            <p class="text-xs text-slate-500 mt-4 italic">Please provide this password to the staff member. They will be required to change it on their first login.</p>
          </div>
        `,
        confirmButtonColor: '#9333ea'
      });
    } catch (err) {
      console.error('Failed to add staff:', err);
      toast.error(err.response?.data?.error || 'Failed to add staff');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditTeacher = async (e) => {
    e.preventDefault();
    try {
      await api.patch(`/users/${editingTeacher.id}/`, {
        first_name: editingTeacher.first_name,
        last_name: editingTeacher.last_name,
        email: editingTeacher.email,
        profile: {
          title: editingTeacher.profile?.title,
          phone_number: editingTeacher.profile?.phone_number,
          sex: editingTeacher.profile?.sex
        }
      });
      setShowEditModal(false);
      setEditingTeacher(null);
      fetchTeachers();
      toast.success('Teacher updated successfully!');
    } catch (err) {
      console.error('Failed to update teacher:', err);
      toast.error(err.response?.data?.error || 'Failed to update teacher');
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Delete Teacher?',
      text: "This action cannot be undone and will remove all teacher records.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        await api.delete(`/users/${id}/`);
        fetchTeachers();
        toast.success('Teacher account deleted');
      } catch (err) {
        console.error('Failed to delete teacher:', err);
        toast.error('Failed to delete teacher');
      }
    }
  };

  const handleStartChat = async (teacherId) => {
    try {
      await api.post('/chat/rooms/get_or_create_private_chat/', { user_id: teacherId });
      navigate('/messages');
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to open chat';
      toast.error(msg);
    }
  };

  const handleSaveRoles = async (teacherId) => {
    try {
      await api.post(`/users/${teacherId}/update-roles/`, {
        staff_title: roleForm.staff_title,
        additional_roles: roleForm.additional_roles,
      });
      setEditingRolesId(null);
      fetchTeachers();
      toast.success('Roles updated');
    } catch (err) {
      console.error('Failed to update roles:', err);
      toast.error(err.response?.data?.error || 'Failed to update roles');
    }
  };

  const openRoleEditor = (teacher) => {
    const allTitles = [teacher.staff_title, ...(teacher.additional_roles || '').split(',').filter(Boolean)];
    setRoleForm({
      staff_title: teacher.staff_title || 'teacher',
      additional_roles: allTitles.filter(t => t !== teacher.staff_title),
    });
    setEditingRolesId(teacher.id);
    setActiveMenu(null);
  };

  const toggleAdditionalRole = (title) => {
    setRoleForm(prev => {
      const exists = prev.additional_roles.includes(title);
      return {
        ...prev,
        additional_roles: exists
          ? prev.additional_roles.filter(t => t !== title)
          : [...prev.additional_roles, title],
      };
    });
  };

  const handleResetPassword = async (teacherId) => {
    const { value: password } = await Swal.fire({
      title: 'Reset Password',
      input: 'text',
      inputLabel: 'Enter temporary password',
      inputPlaceholder: 'Leave blank for auto-generation',
      showCancelButton: true,
      confirmButtonText: 'Reset',
      confirmButtonColor: '#f59e0b',
    });

    if (password !== undefined) {
      try {
        const response = await api.post(`/users/${teacherId}/reset_password/`, { password });
        Swal.fire({
          icon: 'success',
          title: 'Password Reset',
          html: `New temporary password: <strong>${response.data.temporary_password}</strong><br/>The teacher will be forced to change it on login.`,
        });
        fetchTeachers();
      } catch (err) {
        toast.error('Failed to reset password');
      }
    }
  };

  const handleToggleStatus = async (teacher, newStatus) => {
    try {
      const response = await api.post(`/users/${teacher.id}/update_status/`, { status: newStatus });
      toast.success(response.data.status);
      fetchTeachers();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const handleExportExcel = () => {
    const data = teachers.map(t => ({
      'Title': t.profile?.title || '',
      'First Name': t.first_name,
      'Last Name': t.last_name,
      'Email': t.email,
      'Phone': t.profile?.phone_number || '',
      'Temp Password': t.must_change_password ? (t.temp_password_storage || 'Pending') : 'Changed',
      'Status': t.account_status
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Teachers");
    XLSX.writeFile(wb, `teachers_export_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Excel exported successfully');
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Faculty Directory', 14, 20);
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 28);

    const headers = ['Name', 'Email', 'Phone', 'Status'];
    const colWidths = [70, 60, 30, 22];
    let y = 40;

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

    teachers.forEach((t, index) => {
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
      
      const name = `${t.profile?.title || ''} ${t.first_name} ${t.last_name}`.trim();
      const email = t.email;
      const phone = t.profile?.phone_number || '—';
      const status = t.account_status;

      let cx = 14;
      doc.text(name.substring(0, 40), cx, y); cx += colWidths[0];
      doc.text(email.substring(0, 35), cx, y); cx += colWidths[1];
      doc.text(String(phone), cx, y); cx += colWidths[2];
      doc.text(String(status), cx, y);

      y += 7;
      if (index % 2 === 0) {
        doc.setFillColor(245, 245, 245);
        doc.rect(14, y - 5, 182, 7, 'F');
      }
    });

    doc.save(`teachers_export_${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success('PDF exported successfully');
  };

  const handleImportExcel = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const loadingToast = toast.loading('Reading file...');
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

          toast.loading('Importing teachers...', { id: loadingToast });
          const response = await api.post('/users/import_teachers_csv/', formData, {
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
                  <p class="mb-4 text-sm font-bold text-emerald-600">Successfully created ${created_count} teachers!</p>
                  <div class="max-h-60 overflow-y-auto border border-slate-200 rounded-lg">
                    <table class="w-full text-[10px] text-left">
                      <thead class="bg-slate-50 border-b border-slate-200">
                        <tr>
                          <th class="px-3 py-2">Name</th>
                          <th class="px-3 py-2">Email</th>
                          <th class="px-3 py-2">Temp Password</th>
                        </tr>
                      </thead>
                      <tbody class="divide-y divide-slate-100">
                        ${created_users.map(u => `
                          <tr>
                            <td class="px-3 py-2 font-bold">${u.name}</td>
                            <td class="px-3 py-2">${u.username}</td>
                            <td class="px-3 py-2 font-mono text-violet-600">${u.password}</td>
                          </tr>
                        `).join('')}
                      </tbody>
                    </table>
                  </div>
                  <p class="mt-4 text-[10px] text-slate-500 italic">Please copy these credentials and provide them to the teachers.</p>
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
          fetchTeachers();
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

  const getTeacherClassrooms = (teacherId) => {
    return classrooms.filter(cls => cls.teacher === teacherId);
  };

  const filteredTeachers = useMemo(() => {
    return teachers.filter(t => {
      const search = searchQuery.toLowerCase();
      const title = t.profile?.title || '';
      const fullName = `${title || ''} ${t.first_name || ''} ${t.last_name || ''}`.trim().toLowerCase();
      const email = (t.email || '').toLowerCase();
      return (
        email.includes(search) ||
        fullName.includes(search)
      );
    });
  }, [teachers, searchQuery]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  const TITLES = ['Mr.', 'Ms.', 'Mrs.', 'Dr.', 'Prof.'];

  return (
    <div className="page-bottom-safe bg-slate-50/50">
      {/* DepEd Official Header */}
      <div className="bg-white border-b-4 border-violet-600 px-4 md:px-6 py-3 md:py-4 mb-3 md:mb-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 md:h-12 md:w-12 rounded-md bg-violet-600 flex items-center justify-center shrink-0">
            <svg className="w-6 h-6 md:w-7 md:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg md:text-2xl font-extrabold text-slate-900 uppercase tracking-tight">
              Faculty Management
            </h1>
            <p className="text-xs md:text-sm font-bold text-violet-700 uppercase tracking-wide mt-0.5">
              Staff Accounts & Assignments
            </p>
          </div>
        </div>
      </div>

      <div className="p-1.5 md:p-6 space-y-2 md:space-y-6">
      {/* Action buttons */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 md:gap-4 mb-3 md:mb-4">
        <div className="flex-1"></div>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <button
            onClick={() => {
              setNewTeacher({
                email: '',
                first_name: '',
                last_name: '',
                title: '',
              });
              setShowAddModal(true);
            }}
            className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-700 text-white font-bold py-2 px-4 rounded text-sm transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Teacher
          </button>

          <button 
            onClick={() => setShowImportModal(true)}
            className="bg-white border border-slate-200 text-slate-700 font-bold py-2 px-4 rounded text-sm hover:bg-slate-50 flex items-center gap-1.5 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
            Import
          </button>

          <div className="flex items-center gap-1">
            <button 
              onClick={() => {
                const headers = [['Title', 'First Name', 'Last Name', 'Email', 'Sex']];
                const sampleData = [
                  ['Mr.', 'John', 'Doe', 'john.doe@example.com', 'Male'],
                  ['Ms.', 'Jane', 'Smith', 'jane.smith@example.com', 'Female'],
                ];
                
                const ws = XLSX.utils.aoa_to_sheet([...headers, ...sampleData]);
                
                const headerRange = XLSX.utils.decode_range(ws['!ref']);
                for (let C = headerRange.s.c; C <= 4; ++C) {
                  const address = XLSX.utils.encode_col(C) + '1';
                  if (!ws[address]) continue;
                  ws[address].s = {
                    font: { bold: true, color: { rgb: "FFFFFF" } },
                    fill: { fgColor: { rgb: "4F46E5" } }, 
                    alignment: { horizontal: "center" }
                  };
                }

                ws['!cols'] = [
                  { wch: 10 },
                  { wch: 20 },
                  { wch: 20 },
                  { wch: 30 },
                  { wch: 10 },
                ];

                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, "Teacher Template");
                XLSX.writeFile(wb, "KNHS_Teacher_Import_Template.xlsx");
                toast.success('Template downloaded');
              }}
              className="bg-white border border-slate-200 text-slate-700 font-bold py-2 px-4 rounded text-sm hover:bg-slate-50 flex items-center gap-1.5 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              Template
            </button>
            
            <div className="relative group/info">
              <button className="w-8 h-8 flex items-center justify-center rounded bg-white border border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors text-sm font-bold">
                ?
              </button>
              
              <div className="absolute top-full right-0 mt-2 w-64 p-4 bg-slate-900 text-white rounded shadow-xl opacity-0 invisible group-hover/info:opacity-100 group-hover/info:visible transition-all z-[110]">
                <h4 className="text-xs font-bold uppercase tracking-wide text-indigo-400 mb-3 border-b border-white/10 pb-2">Import Instructions</h4>
                <ul className="space-y-2">
                  <li className="flex gap-2">
                    <span className="text-indigo-400 font-bold text-xs">1.</span>
                    <p className="text-xs leading-relaxed text-slate-300">Email is <span className="text-white">required</span> and serves as the username.</p>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-indigo-400 font-bold text-xs">2.</span>
                    <p className="text-xs leading-relaxed text-slate-300">Valid Titles: <span className="text-white">Mr., Ms., Mrs., Dr., Prof.</span></p>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-indigo-400 font-bold text-xs">3.</span>
                    <p className="text-xs leading-relaxed text-slate-300">Sex: <span className="text-white">Male</span> or <span className="text-white">Female</span></p>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-indigo-400 font-bold text-xs">4.</span>
                    <p className="text-xs leading-relaxed text-slate-300">Do <span className="text-rose-400">NOT</span> change the header names.</p>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 bg-white p-1 rounded border border-slate-200">
            <button 
              onClick={handleExportExcel}
              className="p-2 text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
              title="Export Excel"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            </button>
            <button 
              onClick={handleExportPDF}
              className="p-2 text-rose-600 hover:bg-rose-50 rounded transition-colors"
              title="Export PDF"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
            </button>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-3 border border-slate-200 rounded mb-3 md:mb-4">
        <div className="relative max-w-xl">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input 
            type="text" 
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-violet-500 focus:bg-white text-sm"
          />
        </div>
      </div>

      {/* Teachers List */}
      <div className="animate-fade-in-up [animation-delay:200ms]">
        {filteredTeachers.length === 0 ? (
          <EmptyState
            icon={
              <svg className="w-10 h-10 text-violet-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            }
            title="No Staff Found"
            message="Try a different search."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-3">
            {filteredTeachers.map((teacher) => (
              <div key={teacher.id} className="bg-white border border-slate-200 rounded p-3 md:p-4 hover:shadow-md transition-all group relative overflow-visible min-w-0">
                <div className="flex items-start justify-between mb-2 md:mb-3">
                  <div className="min-w-0">
                    <h3 className="text-xs md:text-sm font-bold text-slate-800 leading-tight truncate">
                      {teacher.profile?.title} {teacher.first_name} {teacher.last_name}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      <span className={`text-[9px] font-bold uppercase tracking-wide ${
                        teacher.account_status === 'active' ? 'text-emerald-600' : 
                        teacher.account_status === 'suspended' ? 'text-rose-600' : 
                        'text-slate-400'
                      }`}>
                        {teacher.account_status}
                      </span>
                      <span className="text-[9px] text-slate-300">|</span>
                      <span className="text-[9px] font-bold text-violet-600 bg-violet-50 px-1.5 py-0.5 rounded uppercase">
                        {STAFF_TITLES.find(t => t.value === teacher.staff_title)?.label || teacher.staff_title}
                      </span>
                      {(teacher.additional_roles || '').split(',').filter(Boolean).map(r => (
                        <span key={r} className="text-[9px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded uppercase">
                          {STAFF_TITLES.find(t => t.value === r)?.label || r}
                        </span>
                      ))}
                    </div>
                    {teacher.must_change_password && teacher.temp_password_storage && (
                      <div className="mt-1 flex items-center gap-1">
                        <span className="text-[8px] font-bold text-amber-600 uppercase">Temp:</span>
                        <span className="text-[9px] font-mono font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 border border-amber-200 select-all cursor-help" title="Visible until teacher changes password">
                          {teacher.temp_password_storage}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="relative">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenu(activeMenu === teacher.id ? null : teacher.id);
                      }}
                      className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-all"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                      </svg>
                    </button>

                    {activeMenu === teacher.id && (
                      <>
                        <div className="fixed inset-0 z-[100]" onClick={() => setActiveMenu(null)} />
                        <div className="absolute right-0 mt-1 w-44 bg-white border border-slate-200 rounded shadow-lg z-[110] py-1">
                          {user?.id !== teacher.id && (
                            <button 
                              onClick={() => { setActiveMenu(null); handleStartChat(teacher.id); }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 text-left"
                            >
                              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                              Message
                            </button>
                          )}

                          <button 
                            onClick={() => {
                              setActiveMenu(null);
                              setEditingTeacher({
                                ...teacher,
                                profile: {
                                  title: teacher.profile?.title || '',
                                  phone_number: teacher.profile?.phone_number || ''
                                }
                              });
                              setShowEditModal(true);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 text-left"
                          >
                            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                            Edit
                          </button>

                          <button 
                            onClick={() => { setActiveMenu(null); handleResetPassword(teacher.id); }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 text-left"
                          >
                            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
                            Reset Password
                          </button>

                          <button 
                            onClick={() => openRoleEditor(teacher)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 text-left"
                          >
                            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                            Manage Roles
                          </button>

                          <div className="border-t border-slate-100 mt-1 pt-1 px-3 py-2">
                            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide mb-1 block">Status</label>
                            <select 
                              value={teacher.account_status} 
                              onChange={(e) => { setActiveMenu(null); handleToggleStatus(teacher, e.target.value); }}
                              className="w-full text-xs font-bold px-2 py-1.5 border border-slate-200 rounded bg-white focus:ring-1 focus:ring-violet-500 cursor-pointer uppercase tracking-wide"
                            >
                              <option value="active">Active</option>
                              <option value="inactive">Inactive</option>
                              <option value="suspended">Suspended</option>
                            </select>
                            <button 
                              onClick={() => { setActiveMenu(null); handleDelete(teacher.id); }}
                              className="w-full flex items-center gap-2 px-2 py-1.5 mt-1 text-red-600 hover:bg-red-50 rounded transition-colors text-left"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                              <span className="text-xs font-bold">Delete</span>
                            </button>
                </div>

                {editingRolesId === teacher.id && (
                  <div className="mt-2 pt-2 border-t border-slate-200">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">Manage Roles</p>
                      <button onClick={() => setEditingRolesId(null)} className="text-[9px] text-slate-400 hover:text-slate-600">Cancel</button>
                    </div>
                    <div className="mb-2">
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block mb-1">Primary Role</label>
                      <select
                        value={roleForm.staff_title}
                        onChange={(e) => setRoleForm({ ...roleForm, staff_title: e.target.value })}
                        className="w-full text-[10px] font-bold px-2 py-1.5 border border-slate-200 rounded bg-white focus:ring-1 focus:ring-violet-500"
                      >
                        {STAFF_TITLES.map(t => (
                          <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="mb-2">
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block mb-1">Additional Roles</label>
                      <div className="flex flex-wrap gap-1">
                        {STAFF_TITLES.filter(t => t.value !== roleForm.staff_title).map(t => {
                          const isActive = roleForm.additional_roles.includes(t.value);
                          return (
                            <button
                              key={t.value}
                              onClick={() => toggleAdditionalRole(t.value)}
                              className={`text-[9px] font-bold px-2 py-0.5 rounded border transition-colors ${
                                isActive
                                  ? 'bg-violet-100 text-violet-700 border-violet-300'
                                  : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'
                              }`}
                            >
                              {t.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <button
                      onClick={() => handleSaveRoles(teacher.id)}
                      className="w-full text-[10px] font-bold py-1.5 bg-violet-600 text-white rounded hover:bg-violet-700 transition-colors"
                    >
                      Save Roles
                    </button>
                  </div>
                )}
              </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="space-y-1 mb-2 md:mb-3">
                  <div className="flex items-center text-slate-600 min-w-0">
                    <svg className="w-3 h-3 mr-2 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                    <span className="text-[10px] md:text-xs font-medium truncate">{teacher.email}</span>
                  </div>

                  {teacher.profile?.phone_number && (
                    <div className="flex items-center text-slate-600 min-w-0">
                      <svg className="w-3 h-3 mr-2 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1.01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                      <span className="text-[10px] md:text-xs font-medium">{teacher.profile.phone_number}</span>
                    </div>
                  )}

                  <div className="flex items-center text-slate-600 min-w-0">
                    <svg className="w-3 h-3 mr-2 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    <span className="text-[10px] md:text-xs font-medium uppercase text-slate-500">{teacher.profile?.sex || 'N/A'}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Classes</p>
                    <span className="text-[9px] font-bold text-violet-600 bg-violet-50 px-1.5 py-0.5 rounded uppercase">{getTeacherClassrooms(teacher.id).length}</span>
                  </div>
                  {getTeacherClassrooms(teacher.id).length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {getTeacherClassrooms(teacher.id).map(cls => (
                        <span key={cls.id} className="px-1.5 py-0.5 bg-slate-50 text-slate-600 text-[9px] font-medium border border-slate-100 rounded">
                          {cls.name}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[9px] text-slate-300 italic">No assignments</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Staff Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-lg border border-gray-300 shadow-2xl rounded-sm flex flex-col max-h-[92vh]" onClick={e => e.stopPropagation()}>
            <div className="bg-[#5e2a84] flex items-center justify-between px-5 py-3 flex-shrink-0 border-b-2 border-violet-900">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-7 h-7 rounded-full bg-white/20 border border-white/30 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/>
                  </svg>
                </div>
                <div>
                  <h2 className="text-sm font-black text-white uppercase tracking-widest leading-none">Add New Staff</h2>
                  <p className="text-violet-200 text-[10px] mt-0.5 font-medium uppercase tracking-wide">Create Staff Account</p>
                </div>
              </div>
              <button type="button" onClick={() => setShowAddModal(false)}
                className="ml-4 w-7 h-7 flex items-center justify-center rounded text-white/60 hover:bg-white/20 hover:text-white transition-all">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
            <form onSubmit={handleAddTeacher} className="flex flex-col flex-1 overflow-hidden">
              <div className="px-6 py-5 overflow-y-auto flex-1 space-y-4">
                <div>
                  <label className="block text-xs font-black text-gray-700 uppercase tracking-wider mb-1.5">
                    Staff Role <span className="text-red-600">*</span>
                  </label>
                  <select required value={newTeacher.staff_title} onChange={(e) => setNewTeacher({ ...newTeacher, staff_title: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-sm bg-white text-sm focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500">
                    {STAFF_TITLES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-black text-gray-700 uppercase tracking-wider mb-1.5">
                      Title <span className="text-red-600">*</span>
                    </label>
                    <select required value={newTeacher.title} onChange={(e) => setNewTeacher({ ...newTeacher, title: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-sm bg-white text-sm focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500">
                      <option value="">Title</option>
                      {TITLES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-black text-gray-700 uppercase tracking-wider mb-1.5">
                      First Name <span className="text-red-600">*</span>
                    </label>
                    <input type="text" required value={newTeacher.first_name} onChange={(e) => setNewTeacher({ ...newTeacher, first_name: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-sm bg-white text-sm focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500 placeholder:text-gray-400" />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-gray-700 uppercase tracking-wider mb-1.5">
                      Last Name <span className="text-red-600">*</span>
                    </label>
                    <input type="text" required value={newTeacher.last_name} onChange={(e) => setNewTeacher({ ...newTeacher, last_name: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-sm bg-white text-sm focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500 placeholder:text-gray-400" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black text-gray-700 uppercase tracking-wider mb-1.5">
                      Email Address <span className="text-red-600">*</span>
                    </label>
                    <input type="email" required value={newTeacher.email} onChange={(e) => setNewTeacher({ ...newTeacher, email: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-sm bg-white text-sm focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500 placeholder:text-gray-400" />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-gray-700 uppercase tracking-wider mb-1.5">
                      Sex <span className="text-red-600">*</span>
                    </label>
                    <select required value={newTeacher.sex} onChange={(e) => setNewTeacher({ ...newTeacher, sex: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-sm bg-white text-sm focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500">
                      <option value="">Select Sex</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-end gap-3 flex-shrink-0">
                <button type="button" onClick={() => setShowAddModal(false)}
                  className="px-6 py-2.5 bg-white text-gray-700 text-xs font-black uppercase tracking-widest border border-gray-300 hover:bg-gray-100 rounded-sm">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting}
                  className="px-6 py-2.5 bg-[#5e2a84] text-white text-xs font-black uppercase tracking-widest hover:bg-violet-700 rounded-sm">
                  {isSubmitting ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Teacher Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-lg border border-gray-300 shadow-2xl rounded-sm flex flex-col max-h-[92vh]" onClick={e => e.stopPropagation()}>
            <div className="bg-[#5e2a84] flex items-center justify-between px-5 py-3 flex-shrink-0 border-b-2 border-violet-900">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-7 h-7 rounded-full bg-white/20 border border-white/30 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                  </svg>
                </div>
                <div>
                  <h2 className="text-sm font-black text-white uppercase tracking-widest leading-none">Edit Teacher Record</h2>
                  <p className="text-violet-200 text-[10px] mt-0.5 font-medium uppercase tracking-wide">{editingTeacher.profile?.title} {editingTeacher.first_name} {editingTeacher.last_name}</p>
                </div>
              </div>
              <button type="button" onClick={() => setShowEditModal(false)}
                className="ml-4 w-7 h-7 flex items-center justify-center rounded text-white/60 hover:bg-white/20 hover:text-white transition-all">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
            <form onSubmit={handleEditTeacher} className="flex flex-col flex-1 overflow-hidden">
              <div className="px-6 py-5 overflow-y-auto flex-1 space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-black text-gray-700 uppercase tracking-wider mb-1.5">
                      Title <span className="text-red-600">*</span>
                    </label>
                    <select required value={editingTeacher.profile?.title || ''} onChange={(e) => setEditingTeacher({ ...editingTeacher, profile: { ...editingTeacher.profile, title: e.target.value } })}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-sm bg-white text-sm focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500">
                      <option value="">Title</option>
                      {TITLES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-black text-gray-700 uppercase tracking-wider mb-1.5">
                      First Name <span className="text-red-600">*</span>
                    </label>
                    <input type="text" required value={editingTeacher.first_name} onChange={(e) => setEditingTeacher({ ...editingTeacher, first_name: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-sm bg-white text-sm focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500 placeholder:text-gray-400" />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-gray-700 uppercase tracking-wider mb-1.5">
                      Last Name <span className="text-red-600">*</span>
                    </label>
                    <input type="text" required value={editingTeacher.last_name} onChange={(e) => setEditingTeacher({ ...editingTeacher, last_name: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-sm bg-white text-sm focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500 placeholder:text-gray-400" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black text-gray-700 uppercase tracking-wider mb-1.5">
                      Email Address <span className="text-red-600">*</span>
                    </label>
                    <input type="email" required value={editingTeacher.email} onChange={(e) => setEditingTeacher({ ...editingTeacher, email: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-sm bg-white text-sm focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500 placeholder:text-gray-400" />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-gray-700 uppercase tracking-wider mb-1.5">
                      Sex <span className="text-red-600">*</span>
                    </label>
                    <select required value={editingTeacher.profile?.sex || ''} onChange={(e) => setEditingTeacher({ ...editingTeacher, profile: { ...editingTeacher.profile, sex: e.target.value } })}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-sm bg-white text-sm focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500">
                      <option value="">Select Sex</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-end gap-3 flex-shrink-0">
                <button type="button" onClick={() => setShowEditModal(false)}
                  className="px-6 py-2.5 bg-white text-gray-700 text-xs font-black uppercase tracking-widest border border-gray-300 hover:bg-gray-100 rounded-sm">
                  Cancel
                </button>
                <button type="submit"
                  className="px-6 py-2.5 bg-[#5e2a84] text-white text-xs font-black uppercase tracking-widest hover:bg-violet-700 rounded-sm">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-lg border border-gray-300 shadow-2xl rounded-sm flex flex-col max-h-[92vh]" onClick={e => e.stopPropagation()}>
            <div className="bg-[#5e2a84] flex items-center justify-between px-5 py-3 flex-shrink-0 border-b-2 border-violet-900">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-7 h-7 rounded-full bg-white/20 border border-white/30 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                  </svg>
                </div>
                <div>
                  <h2 className="text-sm font-black text-white uppercase tracking-widest leading-none">Bulk Import Teachers</h2>
                  <p className="text-violet-200 text-[10px] mt-0.5 font-medium uppercase tracking-wide">Upload Excel or CSV</p>
                </div>
              </div>
              <button type="button" onClick={() => setShowImportModal(false)}
                className="ml-4 w-7 h-7 flex items-center justify-center rounded text-white/60 hover:bg-white/20 hover:text-white transition-all">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
            <div className="px-6 py-5 overflow-y-auto flex-1 space-y-5">
              <div className="border-2 border-dashed border-gray-300 rounded p-10 text-center hover:border-violet-400 transition-all group relative">
                <input
                  type="file"
                  accept=".csv, .xlsx, .xls"
                  onChange={handleImportExcel}
                  className="absolute inset-0 opacity-0 cursor-pointer z-10"
                />
                <div className="space-y-4">
                  <div className="w-16 h-16 bg-violet-50 rounded flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                    <svg className="w-8 h-8 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-black text-gray-700 uppercase tracking-tight">Click or drag file here</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Supports CSV, XLSX</p>
                  </div>
                </div>
              </div>
              <div className="bg-amber-50 border border-amber-100 rounded p-4">
                <div className="flex gap-3">
                  <svg className="w-5 h-5 text-amber-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-[10px] font-black text-amber-800 uppercase tracking-widest mb-1">Important Note</p>
                    <p className="text-[9px] font-bold text-amber-700 leading-relaxed uppercase tracking-tight">
                      Ensure your file follows the official template format to avoid errors.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-end gap-3 flex-shrink-0">
              <button type="button" onClick={() => setShowImportModal(false)}
                className="px-6 py-2.5 bg-white text-gray-700 text-xs font-black uppercase tracking-widest border border-gray-300 hover:bg-gray-100 rounded-sm">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default Teachers;

