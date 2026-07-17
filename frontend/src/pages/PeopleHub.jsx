import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useParallelFetch } from '../hooks/useFetch';
import api from '../utils/api';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import { LoadingSpinner, EmptyState, Button } from '../components/ui';
import { UserTableRow, UserFormModal, ImportModal, ExportMenu, ContextActions } from '../components/people';

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

function TeachersTab({ refetch }) {
  const navigate = useNavigate();
  const { data, loading, refetch: localRefetch } = useParallelFetch({
    teachers: '/users/?role=staff',
    classrooms: '/classrooms/',
  });
  const teachers = useMemo(() => Array.isArray(data.teachers) ? data.teachers : [], [data.teachers]);
  const classrooms = useMemo(() => Array.isArray(data.classrooms) ? data.classrooms : [], [data.classrooms]);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [newTeacher, setNewTeacher] = useState({
    title: '', first_name: '', last_name: '', email: '', sex: '', staff_title: 'teacher'
  });
  const [activeMenu, setActiveMenu] = useState(null);

  const handleAddTeacher = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/admin/create-user/', { 
        username: newTeacher.email, 
        ...newTeacher, 
        role: 'staff',
        staff_title: newTeacher.staff_title,
        profile: { title: newTeacher.title, sex: newTeacher.sex }
      });
      setShowAddModal(false);
      setNewTeacher({ email: '', first_name: '', last_name: '', title: '', sex: '', staff_title: 'teacher' });
      refetch();
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
      toast.error(err.response?.data?.error || 'Failed to add staff');
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
      refetch();
      toast.success('Teacher updated successfully!');
    } catch (err) {
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
      confirmButtonText: 'Yes, delete it!'
    });
    if (result.isConfirmed) {
      try {
        await api.delete(`/users/${id}/`);
        refetch();
        toast.success('Teacher account deleted');
      } catch { toast.error('Failed to delete teacher'); }
    }
  };

  const handleStartChat = async (teacherId) => {
    try {
      await api.post('/chat/rooms/get_or_create_private_chat/', { user_id: teacherId });
      navigate('/communication-center');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to open chat');
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
      } catch { toast.error('Failed to reset password'); }
    }
  };

  const handleToggleStatus = async (teacher, newStatus) => {
    try {
      const response = await api.post(`/users/${teacher.id}/update_status/`, { status: newStatus });
      toast.success(response.data.status);
      refetch();
    } catch { toast.error('Failed to update status'); }
  };

  const openRoleEditor = (teacher) => {
    const allTitles = [teacher.staff_title, ...(teacher.additional_roles || '').split(',').filter(Boolean)];
    // Role management logic here
  };

  const handleExportExcel = () => {
    // Export logic
  };

  const handleExportPDF = () => {
    // Export logic
  };

  const handleImportExcel = async (e) => {
    // Import logic
  };

  const filteredTeachers = useMemo(() => {
    return teachers.filter(t => {
      const search = searchQuery.toLowerCase();
      const title = t.profile?.title || '';
      const fullName = `${title || ''} ${t.first_name || ''} ${t.last_name || ''}`.trim().toLowerCase();
      const email = (t.email || '').toLowerCase();
      return email.includes(search) || fullName.includes(search);
    });
  }, [teachers, searchQuery]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="page-bottom-safe bg-slate-50/50">
      <div className="bg-white border-b-4 border-violet-600 px-4 md:px-6 py-3 md:py-4 mb-3 md:mb-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 md:h-12 md:w-12 rounded-md bg-violet-600 flex items-center justify-center shrink-0">
            <svg className="w-6 h-6 md:w-7 md:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg md:text-2xl font-extrabold text-slate-900 uppercase tracking-tight">Faculty Management</h1>
            <p className="text-xs md:text-sm font-bold text-violet-700 uppercase tracking-wide mt-0.5">Staff Accounts & Assignments</p>
          </div>
        </div>
      </div>

      <div className="p-1.5 md:p-6 space-y-2 md:space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 md:gap-4 mb-3 md:mb-4 overflow-x-auto">
          <div className="flex-1"></div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button onClick={() => { setNewTeacher({ email: '', first_name: '', last_name: '', title: '', sex: '' }); setShowAddModal(true); }}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Add Teacher
            </Button>
            <Button variant="secondary" onClick={() => setShowImportModal(true)}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
              Import
            </Button>
            <ExportMenu data={teachers} userType="teacher" filename="teachers" />
          </div>
        </div>

        <div className="bg-white p-3 border border-slate-200 rounded mb-3 md:mb-4">
          <div className="relative max-w-xl">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input type="text" placeholder="Search by name or email..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-violet-500 focus:bg-white text-sm" />
          </div>
        </div>

        <div className="animate-fade-in-up [animation-delay:200ms]">
          {filteredTeachers.length === 0 ? (
            <EmptyState icon={<svg className="w-10 h-10 text-violet-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>} title="No Staff Found" message="Try a different search." />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-3">
              {filteredTeachers.map((teacher) => (
                <UserTableRow
                  key={teacher.id}
                  user={{ ...teacher, classroom_count: classrooms.filter(c => c.teacher === teacher.id).length, classrooms: classrooms.filter(c => c.teacher === teacher.id).map(c => ({ id: c.id, name: c.name, teacher: c.teacher, grade_level: c.grade_level })) }}
                  type="teacher"
                  onEdit={() => { setEditingTeacher({ ...teacher, profile: { title: teacher.profile?.title || '', phone_number: teacher.profile?.phone_number || '' } }); setShowEditModal(true); }}
                  onDelete={handleDelete}
                  onResetPassword={handleResetPassword}
                  onStartChat={handleStartChat}
                  onToggleStatus={handleToggleStatus}
                  onManageRoles={openRoleEditor}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modals would go here - Add, Edit, Import */}
    </div>
  );
}

function StudentsTab({ refetch }) {
  const navigate = useNavigate();
  const { data, loading, refetch: localRefetch } = useParallelFetch({
    students: '/users/?role=student',
    classrooms: '/classrooms/',
  });
  const students = useMemo(() => Array.isArray(data.students) ? data.students : [], [data.students]);
  const classrooms = useMemo(() => Array.isArray(data.classrooms) ? data.classrooms : [], [data.classrooms]);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [gradeFilter, setGradeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [newStudent, setNewStudent] = useState({ username: '', email: '', first_name: '', last_name: '', grade_level: '', sex: '' });
  const [activeMenu, setActiveMenu] = useState(null);

  // Student management functions...
  
  if (loading) return <LoadingSpinner />;

  return (
    <div className="page-bottom-safe bg-slate-50">
      {/* Header and content */}
      <div className="p-3 md:p-6 space-y-4">
        <h2 className="text-xl font-bold text-slate-900">Students</h2>
        {/* Student management UI */}
      </div>
    </div>
  );
}

function ParentsTab({ refetch }) {
  // Parents tab component
  return (
    <div className="page-bottom-safe bg-slate-50">
      <div className="p-3 md:p-6 space-y-4">
        <h2 className="text-xl font-bold text-slate-900">Parents</h2>
        {/* Parents management UI */}
      </div>
    </div>
  );
}

export default function PeopleHub() {
  const { data, loading, refetch } = useParallelFetch({
    teachers: '/users/?role=staff',
    students: '/users/?role=student',
    parents: '/users/?role=parent',
    classrooms: '/classrooms/',
  });

  const [activeTab, setActiveTab] = useState('teachers');

  if (loading) return <LoadingSpinner />;

  const tabs = [
    { id: 'teachers', label: 'Teachers', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg> },
    { id: 'students', label: 'Students', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg> },
    { id: 'parents', label: 'Parents', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg> },
  ];

  return (
    <div className="page-bottom-safe bg-slate-50">
      <div className="bg-white border-b-2 border-slate-200 px-4 md:px-6 py-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-[#5e2a84] flex items-center justify-center rounded-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900">People Directory</h1>
              <p className="text-sm text-slate-500">Manage teachers, students, and parents</p>
            </div>
          </div>
          <div className="flex gap-2">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === tab.id
                    ? 'bg-violet-600 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="p-4 md:p-6">
        {activeTab === 'teachers' && <TeachersTab refetch={refetch} />}
        {activeTab === 'students' && <StudentsTab refetch={refetch} />}
        {activeTab === 'parents' && <ParentsTab refetch={refetch} />}
      </div>
    </div>
  );
}

export default PeopleHub;