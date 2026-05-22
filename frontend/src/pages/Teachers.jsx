import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { getUser } from '../utils/auth';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import { jsPDF } from 'jspdf';

const Teachers = () => {
  const user = getUser();
  const navigate = useNavigate();
  const [teachers, setTeachers] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newTeacher, setNewTeacher] = useState({
    email: '',
    first_name: '',
    last_name: '',
    password: '',
    title: '',
    phone_number: ''
  });

  useEffect(() => {
    fetchTeachers();
    fetchClassrooms();
  }, []);

  const fetchTeachers = async () => {
    try {
      const response = await api.get('/users/?role=teacher');
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

  const handleAddTeacher = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const response = await api.post('/admin/create-user/', { 
        username: newTeacher.email, // Use email as username for teachers
        ...newTeacher, 
        role: 'teacher',
        profile: {
          title: newTeacher.title,
          phone_number: newTeacher.phone_number
        }
      });
      
      setShowAddModal(false);
      setNewTeacher({
        email: '',
        first_name: '',
        last_name: '',
        password: '',
        title: '',
        phone_number: ''
      });
      fetchTeachers();

      // Show success with password
      Swal.fire({
        icon: 'success',
        title: 'Teacher Account Created',
        html: `
          <div class="text-left space-y-2 text-sm">
            <p><strong>Username/Email:</strong> ${response.data.username}</p>
            <p><strong>Temporary Password:</strong> <span class="bg-yellow-100 px-2 py-1 rounded font-mono text-lg border border-yellow-300 select-all">${response.data.temporary_password}</span></p>
            <p class="text-xs text-gray-500 mt-4 italic">Please provide this password to the teacher. They will be required to change it on their first login.</p>
          </div>
        `,
        confirmButtonColor: '#9333ea'
      });
    } catch (err) {
      console.error('Failed to add teacher:', err);
      toast.error(err.response?.data?.error || 'Failed to add teacher');
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
          phone_number: editingTeacher.profile?.phone_number
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
    if (window.confirm('Are you sure you want to delete this teacher account? This action cannot be undone.')) {
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
      const response = await api.post('/chat/rooms/get_or_create_private_chat/', { user_id: teacherId });
      navigate('/messages');
    } catch (err) {
      toast.error('Failed to start conversation');
    }
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

  const handleExportCSV = () => {
    const headers = ['Title', 'First Name', 'Last Name', 'Email', 'Phone', 'Temp Password', 'Status'];
    const data = teachers.map(t => [
      t.profile?.title || '',
      t.first_name,
      t.last_name,
      t.email,
      t.profile?.phone_number || '',
      t.must_change_password ? (t.temp_password_storage || 'Pending') : 'Changed',
      t.account_status
    ]);

    const csvContent = [headers, ...data].map(e => e.map(val => `"${val}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `teachers_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('CSV exported successfully');
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

  const getTeacherClassrooms = (teacherId) => {
    return classrooms.filter(cls => cls.teacher === teacherId);
  };

  const filteredTeachers = useMemo(() => {
    return teachers.filter(t => {
      const search = searchQuery.toLowerCase();
      const title = t.profile?.title || '';
      const fullName = `${title} ${t.first_name} ${t.last_name}`.trim().toLowerCase();
      return (
        t.email.toLowerCase().includes(search) ||
        fullName.includes(search)
      );
    });
  }, [teachers, searchQuery]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  const TITLES = ['Mr.', 'Ms.', 'Mrs.', 'Dr.', 'Prof.'];

  return (
    <div className="overflow-y-auto h-[calc(100vh-4rem)] p-1.5 md:p-6 space-y-2 md:space-y-6 bg-gray-50/50 max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 md:gap-6 animate-fade-in-up">
        <div className="text-center md:text-left">
          <h1 className="text-lg md:text-3xl font-black text-gray-800 tracking-tight uppercase">Teachers Management</h1>
          <p className="text-gray-500 text-[8px] md:text-base mt-0.5 font-medium uppercase tracking-widest">Accounts and assignments</p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <button
            onClick={() => {
              setNewTeacher({
                email: '',
                first_name: '',
                last_name: '',
                password: '',
                title: '',
                phone_number: ''
              });
              setShowAddModal(true);
            }}
            className="flex items-center justify-center gap-1.5 bg-[#2D1B4D] hover:bg-[#3D2B5D] text-white font-black py-1.5 md:py-2.5 px-3 md:px-6 rounded-lg md:rounded-xl transition-all shadow-md active:scale-95 text-[8px] md:text-xs uppercase tracking-widest"
          >
            <svg className="w-3.5 h-3.5 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            Add Teacher
          </button>

          <div className="flex items-center gap-1 bg-white p-1 rounded-lg md:rounded-xl border border-gray-200 shadow-sm">
            <button 
              onClick={handleExportCSV}
              className="p-1 md:p-2 text-emerald-600 hover:bg-emerald-50 rounded md:rounded-lg transition-all"
              title="Export CSV"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            </button>
            <button 
              onClick={handleExportPDF}
              className="p-1 md:p-2 text-rose-600 hover:bg-rose-50 rounded md:rounded-lg transition-all"
              title="Export PDF"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
            </button>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-1.5 md:p-4 rounded-xl md:rounded-2xl border border-gray-100 shadow-sm animate-fade-in-up [animation-delay:100ms]">
        <div className="relative group max-w-xl mx-auto">
          <svg className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 md:w-5 md:h-5 text-gray-400 group-focus-within:text-purple-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input 
            type="text" 
            placeholder="Search name or email..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 md:pl-12 pr-3 md:pr-4 py-1.5 md:py-3 bg-gray-50 border border-gray-200 rounded-lg md:rounded-xl focus:outline-none focus:ring-1 focus:ring-purple-500 focus:bg-white text-[10px] md:text-sm font-bold transition-all shadow-inner uppercase tracking-wider"
          />
        </div>
      </div>

      {/* Teachers List */}
      <div className="animate-fade-in-up [animation-delay:200ms]">
        {filteredTeachers.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-10 md:p-16 text-center">
            <div className="w-12 h-12 md:w-20 md:h-20 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-6">
              <svg className="w-6 h-6 md:w-10 md:h-10 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-sm md:text-xl font-black text-gray-700 mb-1 uppercase tracking-tight">No Teachers Found</h3>
            <p className="text-[10px] md:text-base text-gray-400 font-bold uppercase tracking-widest">Try a different search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
            {filteredTeachers.map((teacher) => (
              <div key={teacher.id} className="bg-white border border-gray-200 rounded-lg md:rounded-2xl p-3 md:p-6 hover:shadow-xl transition-all duration-300 group relative border-t-2 md:border-t-4 border-t-purple-500 overflow-hidden min-w-0">
                <div className="absolute top-0 right-0 p-2 md:p-4 flex gap-1 md:gap-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 backdrop-blur-sm rounded-bl-xl border-l border-b border-gray-100">
                  <select 
                    value={teacher.account_status} 
                    onChange={(e) => handleToggleStatus(teacher, e.target.value)}
                    className={`text-[8px] md:text-[10px] font-black px-1 md:px-2 py-0.5 md:py-1 rounded border-0 focus:ring-2 focus:ring-purple-500 cursor-pointer ${
                      teacher.account_status === 'active' ? 'bg-emerald-50 text-emerald-600' : 
                      teacher.account_status === 'suspended' ? 'bg-rose-50 text-rose-600' : 
                      'bg-gray-50 text-gray-600'
                    }`}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
                  </select>
                   <button
                    onClick={() => {
                      setEditingTeacher({
                        ...teacher,
                        profile: {
                          title: teacher.profile?.title || '',
                          phone_number: teacher.profile?.phone_number || ''
                        }
                      });
                      setShowEditModal(true);
                    }}
                    className="p-1 md:p-2 bg-blue-50 text-blue-600 rounded md:rounded-lg hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                    title="Edit Details"
                  >
                    <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                  </button>
                  <button
                    onClick={() => handleResetPassword(teacher.id)}
                    className="p-1 md:p-2 bg-amber-50 text-amber-600 rounded md:rounded-lg hover:bg-amber-600 hover:text-white transition-all shadow-sm"
                    title="Reset Password"
                  >
                    <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
                  </button>
                  <button
                    onClick={() => handleDelete(teacher.id)}
                    className="p-1 md:p-2 bg-red-50 text-red-600 rounded md:rounded-lg hover:bg-red-600 hover:text-white transition-all shadow-sm"
                    title="Delete Account"
                  >
                    <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>

                <div className="flex items-start justify-between mb-3 md:mb-6">
                  <div className="flex items-center gap-2 md:gap-4">
                    <div className="relative flex-shrink-0">
                      <div className="w-10 h-10 md:w-16 md:h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg md:rounded-2xl flex items-center justify-center text-white font-black text-sm md:text-2xl shadow-lg">
                        {teacher.first_name?.charAt(0).toUpperCase()}{teacher.last_name?.charAt(0).toUpperCase()}
                      </div>
                      <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 md:w-5 md:h-5 rounded-full border-2 md:border-4 border-white shadow-sm flex items-center justify-center ${teacher.is_online ? 'bg-green-500' : 'bg-gray-300'}`}>
                        {teacher.is_online && <span className="absolute w-full h-full rounded-full bg-green-500 animate-ping opacity-20"></span>}
                      </div>
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-[11px] md:text-xl font-black text-gray-800 leading-tight uppercase truncate">
                        {teacher.profile?.title} {teacher.first_name} {teacher.last_name}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <p className="text-[7px] md:text-[10px] font-black text-purple-500 uppercase tracking-widest">Faculty</p>
                        <span className="text-[7px] text-gray-300">•</span>
                        <span className={`text-[7px] md:text-[10px] font-black uppercase tracking-widest ${
                          teacher.account_status === 'active' ? 'text-emerald-500' : 
                          teacher.account_status === 'suspended' ? 'text-rose-500' : 
                          'text-gray-400'
                        }`}>
                          {teacher.account_status}
                        </span>
                        <span className="text-[7px] text-gray-300">•</span>
                        <span className={`text-[7px] md:text-[10px] font-black uppercase tracking-widest ${teacher.is_online ? 'text-green-500' : 'text-gray-400'}`}>
                          {teacher.is_online ? 'Online' : 'Offline'}
                        </span>
                      </div>
                      {teacher.must_change_password && teacher.temp_password_storage && (
                        <div className="mt-1 flex items-center gap-1">
                          <span className="text-[7px] font-black text-amber-500 uppercase tracking-widest">Temp Pass:</span>
                          <span className="text-[9px] font-mono font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100 select-all cursor-help" title="Visible until teacher changes password">
                            {teacher.temp_password_storage}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {user?.id !== teacher.id && (
                    <button 
                      onClick={() => handleStartChat(teacher.id)}
                      className="p-1.5 md:p-2.5 bg-violet-50 text-violet-600 rounded-lg md:rounded-xl hover:bg-violet-600 hover:text-white transition-all shadow-sm active:scale-95 flex-shrink-0"
                      title="Send Message"
                    >
                      <svg className="w-3.5 h-3.5 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                    </button>
                  )}
                </div>

                <div className="space-y-1.5 md:space-y-3 mb-3 md:mb-6">
                  <div className="flex items-center text-gray-600 min-w-0">
                    <div className="w-5 h-5 md:w-8 md:h-8 rounded md:rounded-lg bg-gray-50 flex items-center justify-center mr-2 md:mr-3 flex-shrink-0">
                      <svg className="w-2.5 h-2.5 md:w-4 md:h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                    </div>
                    <span className="text-[9px] md:text-sm font-bold truncate tracking-tight">{teacher.email}</span>
                  </div>

                  {teacher.profile?.phone_number && (
                    <div className="flex items-center text-gray-600 min-w-0">
                      <div className="w-5 h-5 md:w-8 md:h-8 rounded md:rounded-lg bg-gray-50 flex items-center justify-center mr-2 md:mr-3 flex-shrink-0">
                        <svg className="w-2.5 h-2.5 md:w-4 md:h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                      </div>
                      <span className="text-[9px] md:text-sm font-bold tracking-tight">{teacher.profile.phone_number}</span>
                    </div>
                  )}
                </div>

                <div className="mt-2 md:mt-4 pt-2 md:pt-5 border-t border-gray-100">
                  <div className="flex items-center justify-between mb-1.5 md:mb-3">
                    <p className="text-[7px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest">Classes</p>
                    <span className="text-[7px] md:text-[10px] font-black text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded-full uppercase tracking-widest">{getTeacherClassrooms(teacher.id).length} Active</span>
                  </div>
                  {getTeacherClassrooms(teacher.id).length > 0 ? (
                    <div className="flex flex-wrap gap-1 md:gap-1.5">
                      {getTeacherClassrooms(teacher.id).map(cls => (
                        <span key={cls.id} className="px-1.5 py-0.5 md:px-2.5 md:py-1 bg-gray-50 text-gray-600 text-[7px] md:text-[10px] font-black rounded md:rounded-lg border border-gray-100 uppercase tracking-tighter">
                          {cls.name}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-gray-300 italic text-[8px] md:text-[11px] font-bold py-1 uppercase tracking-widest">
                      <svg className="w-2.5 h-2.5 md:w-3.5 md:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.268 16c-.77 1.333.192 3 1.732 3z" /></svg>
                      No assignments
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
            <div className="p-8 bg-gradient-to-br from-purple-600 to-indigo-700 text-white relative">
              <h2 className="text-2xl font-black tracking-tight">Add New Teacher</h2>
              <p className="text-purple-100 text-sm mt-1 font-medium opacity-90">Create a new teacher account and profile.</p>
              <button onClick={() => setShowAddModal(false)} className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleAddTeacher} className="p-8 space-y-5 max-h-[70vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Title</label>
                  <select required value={newTeacher.title} onChange={(e) => setNewTeacher({ ...newTeacher, title: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white text-sm font-bold transition-all">
                    <option value="">Title</option>
                    {TITLES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">First Name</label>
                  <input type="text" required value={newTeacher.first_name} onChange={(e) => setNewTeacher({ ...newTeacher, first_name: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white text-sm font-bold transition-all" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Last Name</label>
                  <input type="text" required value={newTeacher.last_name} onChange={(e) => setNewTeacher({ ...newTeacher, last_name: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white text-sm font-bold transition-all" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5 col-span-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email Address</label>
                  <input type="email" required value={newTeacher.email} onChange={(e) => setNewTeacher({ ...newTeacher, email: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white text-sm font-bold transition-all" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Temporary Password</label>
                <input type="password" required value={newTeacher.password} onChange={(e) => setNewTeacher({ ...newTeacher, password: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white text-sm font-bold transition-all" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Phone Number</label>
                <input type="text" value={newTeacher.phone_number} onChange={(e) => setNewTeacher({ ...newTeacher, phone_number: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white text-sm font-bold transition-all" />
              </div>
              <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
                <button type="button" onClick={() => setShowAddModal(false)}
                  className="px-6 py-2.5 text-gray-500 hover:text-gray-700 font-bold text-sm transition-colors">
                  Cancel
                </button>
                <button type="submit"
                  disabled={isSubmitting}
                  className="px-8 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 font-bold text-sm shadow-lg shadow-purple-200 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2">
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Creating...
                    </>
                  ) : 'Create Teacher Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingTeacher && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
            <div className="p-8 bg-gradient-to-br from-blue-600 to-indigo-700 text-white relative">
              <h2 className="text-2xl font-black tracking-tight">Edit Teacher Details</h2>
              <p className="text-blue-100 text-sm mt-1 font-medium opacity-90">Update profile information for {editingTeacher.first_name}.</p>
              <button onClick={() => setShowEditModal(false)} className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleEditTeacher} className="p-8 space-y-5 max-h-[70vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Title</label>
                  <select required value={editingTeacher.profile?.title || ''} onChange={(e) => setEditingTeacher({ ...editingTeacher, profile: { ...editingTeacher.profile, title: e.target.value } })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-sm font-bold transition-all">
                    <option value="">Title</option>
                    {TITLES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">First Name</label>
                  <input type="text" required value={editingTeacher.first_name} onChange={(e) => setEditingTeacher({ ...editingTeacher, first_name: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-sm font-bold transition-all" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Last Name</label>
                  <input type="text" required value={editingTeacher.last_name} onChange={(e) => setEditingTeacher({ ...editingTeacher, last_name: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-sm font-bold transition-all" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5 col-span-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email Address</label>
                  <input type="email" required value={editingTeacher.email} onChange={(e) => setEditingTeacher({ ...editingTeacher, email: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-sm font-bold transition-all" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Phone Number</label>
                <input type="text" value={editingTeacher.profile?.phone_number || ''} onChange={(e) => setEditingTeacher({ ...editingTeacher, profile: { ...editingTeacher.profile, phone_number: e.target.value } })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-sm font-bold transition-all" />
              </div>
              <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
                <button type="button" onClick={() => setShowEditModal(false)}
                  className="px-6 py-2.5 text-gray-500 hover:text-gray-700 font-bold text-sm transition-colors">
                  Cancel
                </button>
                <button type="submit"
                  className="px-8 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold text-sm shadow-lg shadow-blue-200 transition-all active:scale-95">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Teachers;
