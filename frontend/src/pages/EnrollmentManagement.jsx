import { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import Swal from 'sweetalert2';

const STATUS_CONFIG = {
  pending: { color: 'bg-amber-100 text-amber-800 border-amber-200', label: 'Pending' },
  under_review: { color: 'bg-blue-100 text-blue-800 border-blue-200', label: 'Under Review' },
  pending_requirements: { color: 'bg-orange-100 text-orange-800 border-orange-200', label: 'Pending Req' },
  approved: { color: 'bg-emerald-100 text-emerald-800 border-emerald-200', label: 'Approved' },
  rejected: { color: 'bg-rose-100 text-rose-800 border-rose-200', label: 'Rejected' },
  enrolled: { color: 'bg-violet-100 text-violet-800 border-violet-200', label: 'Enrolled' },
};

const GRADE_LEVELS = ['','7','8','9','10','11','12'];
const ENROLLMENT_TYPES = ['','new','returning','transferee','sh_applicant','parent_assisted'];

const EnrollmentManagement = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [selected, setSelected] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [filter, setFilter] = useState('all');
  const [gradeFilter, setGradeFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [schoolYearFilter, setSchoolYearFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeMenu, setActiveMenu] = useState(null);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [enrollApp, setEnrollApp] = useState(null);
  const [enrollClassroom, setEnrollClassroom] = useState('');
  const [enrollParentEmail, setEnrollParentEmail] = useState('');
  const [enrolling, setEnrolling] = useState(false);
  const [classrooms, setClassrooms] = useState([]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [appRes, analyticsRes, clsRes] = await Promise.all([
        api.get('/enrollment-applications/'),
        api.get('/enrollment-applications/analytics/'),
        api.get('/classrooms/'),
      ]);
      setApplications(appRes.data.results || appRes.data);
      setAnalytics(analyticsRes.data);
      setClassrooms(clsRes.data.results || clsRes.data);
    } catch { Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to load data.' }); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleAction = async (id, action, opts = {}) => {
    try {
      const res = await api.post(`/enrollment-applications/${id}/${action}/`, opts);
      Swal.fire({ icon: 'success', title: 'Done', text: res.data.status || 'Action completed.' });
      fetchAll();
      if (selected?.id === id && action !== 'enroll_student') setSelected(null);
      return res.data;
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.error || 'Action failed.' });
    }
  };

  const handleView = async (app) => {
    setSelected(app);
    if (app.status === 'pending') {
      try {
        await api.post(`/enrollment-applications/${app.id}/approve/`, { remarks: '' });
        fetchAll();
      } catch {}
    }
  };

  const promptApproveApplication = async (id) => {
    const { value } = await Swal.fire({
      title: 'Approve Application?', input: 'textarea', inputLabel: 'Remarks',
      inputPlaceholder: 'Optional remarks...', showCancelButton: true, confirmButtonText: 'Approve',
      confirmButtonColor: '#10B981',
    });
    if (value !== undefined) handleAction(id, 'approve_application', { remarks: value });
  };

  const promptReject = async (id) => {
    const { value } = await Swal.fire({
      title: 'Reject Application', input: 'textarea', inputLabel: 'Reason for rejection',
      inputPlaceholder: 'Required: provide a reason...', showCancelButton: true,
      confirmButtonText: 'Reject', confirmButtonColor: '#EF4444',
      preConfirm: (v) => { if (!v) { Swal.showValidationMessage('Reason required'); } },
    });
    if (value) handleAction(id, 'reject', { remarks: value });
  };

  const promptRequestDocs = async (id) => {
    const { value } = await Swal.fire({
      title: 'Request Requirements', html: `
        <textarea id="msg" class="swal2-textarea" placeholder="Message to applicant...">Please submit the missing documents.</textarea>
        <div class="text-left mt-3 text-xs font-bold text-slate-500">Document types to flag as missing:</div>
        <div class="flex flex-wrap gap-2 mt-2" id="doc-types">
          ${['Birth Cert','Report Card','Form 138','Completion Cert','Good Moral','ID Picture'].map((l, i) =>
            `<label class="flex items-center gap-1 text-xs cursor-pointer"><input type="checkbox" class="doc-cb" value="${['birth_certificate','report_card','form_138','certificate_of_completion','good_moral','id_picture'][i]}"> ${l}</label>`
          ).join('')}
        </div>
      `, showCancelButton: true, confirmButtonText: 'Send', confirmButtonColor: '#F59E0B',
      preConfirm: () => {
        const msg = document.getElementById('msg').value;
        const types = [...document.querySelectorAll('.doc-cb:checked')].map(c => c.value);
        return { message: msg, document_types: types };
      }
    });
    if (value) handleAction(id, 'request_requirements', value);
  };

  const enrollStudent = async () => {
    if (!enrollApp || enrolling) return;
    setEnrolling(true);
    try {
      const { username, temp_password } = await handleAction(enrollApp.id, 'enroll_student', {
        classroom_id: enrollClassroom || '', parent_email: enrollParentEmail || '',
      }) || {};
      if (username) {
        Swal.fire({
          icon: 'success', title: 'Student Enrolled!', html: `
            <div class="text-left space-y-2">
              <p><strong>Username:</strong> ${username}</p>
              <p><strong>Password:</strong> ${temp_password}</p>
              <p class="text-xs text-amber-600 font-bold">Save these credentials. They will not be shown again.</p>
            </div>
          `, confirmButtonText: 'OK',
        });
      }
      setShowEnrollModal(false);
      setEnrollApp(null);
      setEnrollClassroom('');
      setEnrollParentEmail('');
    } finally {
      setEnrolling(false);
    }
  };

  const assignSection = async (id) => {
    const classroomOptions = classrooms.reduce((acc, c) => {
      const count = applications.filter(a => a.assigned_classroom === c.id && a.status === 'enrolled').length;
      acc[c.id] = `${c.name} (${count}/${c.capacity || 40})`;
      return acc;
    }, {});

    const { value } = await Swal.fire({
      title: 'Assign Section',
      html: `
        <div class="text-left">
          <p class="text-xs text-slate-500 mb-3">Select a section for this applicant. Shows current enrollment / capacity.</p>
          <div id="swal-select" class="swal2-select" style="width:100%;padding:8px;border:1px solid #e2e8f0;border-radius:8px;font-size:14px;">
            <option value="">-- Select Section --</option>
            ${classrooms.map(c => {
              const count = applications.filter(a => a.assigned_classroom === c.id && a.status === 'enrolled').length;
              return `<option value="${c.id}">${c.name} (${count}/${c.capacity || 40})</option>`;
            }).join('')}
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Assign',
      confirmButtonColor: '#7C3AED',
      didOpen: () => {
        const select = document.getElementById('swal-select');
        if (select) {
          select.addEventListener('change', (e) => {
            select.value = e.target.value;
          });
        }
      },
      preConfirm: () => {
        return document.getElementById('swal-select')?.value || '';
      }
    });
    if (value) handleAction(id, 'assign_section', { classroom_id: value });
  };

  const editCapacity = async (classroomId, currentCapacity) => {
    const { value } = await Swal.fire({
      title: 'Update Classroom Capacity',
      input: 'number',
      inputValue: currentCapacity || 40,
      inputAttributes: { min: 1, max: 200 },
      inputLabel: 'Maximum students',
      showCancelButton: true,
      confirmButtonText: 'Update',
      confirmButtonColor: '#7C3AED',
    });
    if (value) {
      try {
        await api.post('/enrollment-applications/update-classroom-capacity/', {
          classroom_id: classroomId,
          capacity: parseInt(value),
        });
        Swal.fire({ icon: 'success', title: 'Updated', text: 'Classroom capacity updated.' });
        fetchAll();
      } catch (err) {
        Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.error || 'Failed to update capacity.' });
      }
    }
  };

  const verifyDoc = async (appId, docId, status) => {
    const endpoint = status === 'verified' ? 'verify_document' : 'reject_document';
    let notes = '';
    if (status === 'rejected') {
      const { value } = await Swal.fire({ title: 'Reason for rejection', input: 'textarea', showCancelButton: true, confirmButtonText: 'Reject', confirmButtonColor: '#EF4444' });
      if (!value) return;
      notes = value;
    }
    await handleAction(appId, endpoint, { document_id: docId, notes });
  };

  const filtered = applications.filter(app => {
    if (filter !== 'all' && app.status !== filter) return false;
    if (gradeFilter && app.grade_level !== gradeFilter) return false;
    if (typeFilter && app.enrollment_type !== typeFilter) return false;
    if (schoolYearFilter && app.school_year !== schoolYearFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      if (!app.first_name.toLowerCase().includes(q) && !app.last_name.toLowerCase().includes(q) && !app.email.toLowerCase().includes(q) && !(app.enrollment_number || '').toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const bulkAction = async (action) => {
    if (!selectedIds.length) { Swal.fire({ icon: 'warning', text: 'Select applications first.' }); return; }
    const confirmed = await Swal.fire({ title: `${action} ${selectedIds.length} application(s)?`, showCancelButton: true, confirmButtonText: 'Confirm', confirmButtonColor: action === 'reject' ? '#EF4444' : '#7C3AED' });
    if (!confirmed.isConfirmed) return;
    for (const id of selectedIds) {
      if (action === 'approve') {
        await handleAction(id, 'approve', { remarks: '' });
      } else if (action === 'reject') {
        await handleAction(id, 'reject', { remarks: 'Bulk rejected by admin' });
      }
    }
    setSelectedIds([]);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 rounded-full border-2 border-slate-100 border-t-violet-600 animate-spin" />
    </div>
  );

  return (
    <div className="space-y-4 md:space-y-6 page-bottom-safe max-w-[1600px] mx-auto">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">Enrollment Management</h1>
          <p className="text-slate-500 text-xs md:text-sm mt-0.5">Review, approve, and manage student applications</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => { const a = document.createElement('a'); a.href = '/api/enrollment-applications/export_csv/'; a.click(); }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            CSV
          </button>
          <button onClick={() => { const a = document.createElement('a'); a.href = '/api/enrollment-applications/export-summary-pdf/'; a.click(); }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
            PDF Report
          </button>
        </div>
      </div>

      {analytics && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: 'Total', value: analytics.total, color: 'text-slate-900', bg: 'bg-slate-50 border-slate-200' },
            { label: 'Pending', value: analytics.pending, color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
            { label: 'Under Review', value: (analytics.status_breakdown?.under_review || 0), color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
            { label: 'Approved', value: analytics.approved, color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
            { label: 'Enrolled', value: analytics.enrolled, color: 'text-violet-700', bg: 'bg-violet-50 border-violet-200' },
            { label: 'Rejected', value: analytics.rejected, color: 'text-rose-700', bg: 'bg-rose-50 border-rose-200' },
          ].map(s => (
            <div key={s.label} className={`${s.bg} border rounded-xl p-4`}>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{s.label}</p>
              <p className={`text-2xl font-black mt-1 ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search name, email, or enrollment #..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-300/40" />
          </div>
          <select value={filter} onChange={e => setFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-300/40">
            <option value="all">All Status</option>
            {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <select value={gradeFilter} onChange={e => setGradeFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-300/40">
            <option value="">All Grades</option>
            {GRADE_LEVELS.filter(Boolean).map(g => <option key={g} value={g}>Grade {g}</option>)}
          </select>
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-300/40">
            <option value="">All Types</option>
            {[{ v: 'new', l: 'New' }, { v: 'returning', l: 'Returning' }, { v: 'transferee', l: 'Transferee' }, { v: 'sh_applicant', l: 'SHS' }, { v: 'parent_assisted', l: 'Parent-Assisted' }].map(t =>
              <option key={t.v} value={t.v}>{t.l}</option>
            )}
          </select>
          <select value={schoolYearFilter} onChange={e => setSchoolYearFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-300/40">
            <option value="">All Years</option>
            <option value="2025-2026">2025-2026</option>
            <option value="2026-2027">2026-2027</option>
          </select>
        </div>

        {selectedIds.length > 0 && (
          <div className="px-4 py-2 bg-violet-50 border-b border-violet-100 flex items-center gap-3">
            <span className="text-xs font-bold text-violet-800">{selectedIds.length} selected</span>
            <button onClick={() => bulkAction('approve')} className="px-3 py-1 rounded-lg bg-emerald-600 text-white text-[10px] font-bold hover:bg-emerald-700">Approve All</button>
            <button onClick={() => bulkAction('reject')} className="px-3 py-1 rounded-lg bg-rose-600 text-white text-[10px] font-bold hover:bg-rose-700">Reject All</button>
            <button onClick={() => setSelectedIds([])} className="text-[10px] font-bold text-slate-500 hover:text-slate-700">Clear</button>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="px-3 py-3 w-8"><input type="checkbox" onChange={e => setSelectedIds(e.target.checked ? filtered.map(a => a.id) : [])} checked={selectedIds.length === filtered.length && filtered.length > 0} className="w-4 h-4 text-violet-600 rounded" /></th>
                <th className="px-3 py-3">Applicant</th>
                <th className="px-3 py-3">Enrollment #</th>
                <th className="px-3 py-3">Grade</th>
                <th className="px-3 py-3">Type</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3 hidden md:table-cell">Submitted</th>
                <th className="px-3 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr><td colSpan={8} className="px-6 py-12 text-center text-sm text-slate-400 font-bold">No applications found</td></tr>
              ) : filtered.map(app => (
                <tr key={app.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-3 py-3"><input type="checkbox" checked={selectedIds.includes(app.id)} onChange={() => toggleSelect(app.id)} className="w-4 h-4 text-violet-600 rounded" /></td>
                  <td className="px-3 py-3">
                    <button onClick={() => setSelected(app)} className="text-left">
                      <p className="text-sm font-bold text-slate-900">{app.last_name}, {app.first_name}</p>
                      <p className="text-[10px] text-slate-400">{app.email}</p>
                    </button>
                  </td>
                  <td className="px-3 py-3 text-xs font-bold text-violet-700">{app.enrollment_number || '—'}</td>
                  <td className="px-3 py-3">
                    <span className="text-sm font-bold text-slate-700">G{app.grade_level}</span>
                    {app.strand && <span className="text-[9px] text-slate-400 ml-1">{app.strand}</span>}
                  </td>
                  <td className="px-3 py-3 text-[10px] text-slate-500 font-semibold">{app.enrollment_type?.replace('_', ' ') || '—'}</td>
                  <td className="px-3 py-3">
                    <span className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded-md border ${(STATUS_CONFIG[app.status] || STATUS_CONFIG.pending).color}`}>
                      {(STATUS_CONFIG[app.status] || STATUS_CONFIG.pending).label}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-xs text-slate-400 hidden md:table-cell">{new Date(app.submitted_at).toLocaleDateString()}</td>
                  <td className="px-3 py-3 text-center relative">
                    <div className="hidden md:flex items-center justify-center gap-1">
                      <button onClick={() => handleView(app)} className="p-1.5 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-all" title="View">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                      </button>
                      {(app.status === 'pending' || app.status === 'under_review') && (
                        <>
                          <button onClick={() => promptReject(app.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg" title="Reject">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                          {app.status === 'under_review' && (
                            <button onClick={() => promptApproveApplication(app.id)} className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg" title="Approve">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                            </button>
                          )}
                        </>
                      )}
                      {app.status === 'approved' && (
                        <button onClick={() => { setEnrollApp(app); setShowEnrollModal(true); }} className="p-1.5 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg" title="Enroll">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
                        </button>
                      )}
                      {app.enrolled_student && (
                        <span className="text-[9px] font-bold text-violet-600 bg-violet-50 px-2 py-1 rounded-lg">Enrolled</span>
                      )}
                    </div>
                    <div className="md:hidden">
                      <button onClick={() => setActiveMenu(activeMenu === app.id ? null : app.id)} className={`p-1 rounded-md ${activeMenu === app.id ? 'bg-violet-100 text-violet-600' : 'text-slate-400'}`}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16m-7 6h7" /></svg>
                      </button>
                      {activeMenu === app.id && (
                        <div className="absolute right-0 top-full mt-1 bg-white border border-slate-100 rounded-xl shadow-xl z-50 py-1 min-w-[130px]">
                          <button onClick={() => { handleView(app); setActiveMenu(null); }} className="w-full text-left px-3 py-2 text-[10px] font-bold text-slate-600 hover:bg-violet-50 flex items-center gap-2">View</button>
                          {(app.status === 'pending' || app.status === 'under_review') && (
                            <>
                              <button onClick={() => { promptReject(app.id); setActiveMenu(null); }} className="w-full text-left px-3 py-2 text-[10px] font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2">Reject</button>
                              {app.status === 'under_review' && (
                                <button onClick={() => { promptApproveApplication(app.id); setActiveMenu(null); }} className="w-full text-left px-3 py-2 text-[10px] font-bold text-emerald-600 hover:bg-emerald-50 flex items-center gap-2">Approve</button>
                              )}
                            </>
                          )}
                          <button onClick={() => { promptRequestDocs(app.id); setActiveMenu(null); }} className="w-full text-left px-3 py-2 text-[10px] font-bold text-amber-600 hover:bg-amber-50 flex items-center gap-2">Request Docs</button>
                          {(app.status === 'pending' || app.status === 'under_review') && (
                            <button onClick={() => { assignSection(app.id); setActiveMenu(null); }} className="w-full text-left px-3 py-2 text-[10px] font-bold text-blue-600 hover:bg-blue-50 flex items-center gap-2">Set Section</button>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-slate-900">{selected.full_name || `${selected.first_name} ${selected.last_name}`}</h2>
                <p className="text-xs text-slate-400">{selected.enrollment_number} &middot; {selected.email}</p>
              </div>
              <button onClick={() => setSelected(null)} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition-all">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              <div className="flex items-center justify-between">
                <span className={`px-3 py-1 text-xs font-bold uppercase rounded-lg border ${(STATUS_CONFIG[selected.status] || STATUS_CONFIG.pending).color}`}>
                  {(STATUS_CONFIG[selected.status] || STATUS_CONFIG.pending).label}
                </span>
                {selected.assigned_classroom && <span className="text-xs font-bold text-violet-600">Section: {selected.assigned_classroom}</span>}
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-slate-50 p-3 rounded-xl"><p className="text-[9px] font-bold text-slate-400 uppercase">Type</p><p className="font-bold text-slate-800">{selected.enrollment_type?.replace('_', ' ') || 'New'}</p></div>
                <div className="bg-slate-50 p-3 rounded-xl"><p className="text-[9px] font-bold text-slate-400 uppercase">Grade</p><p className="font-bold text-slate-800">Grade {selected.grade_level}{selected.strand ? ` - ${selected.strand}` : ''}</p></div>
                <div className="bg-slate-50 p-3 rounded-xl"><p className="text-[9px] font-bold text-slate-400 uppercase">School Year</p><p className="font-bold text-slate-800">{selected.school_year || 'N/A'}</p></div>
                <div className="bg-slate-50 p-3 rounded-xl"><p className="text-[9px] font-bold text-slate-400 uppercase">Sex</p><p className="font-bold text-slate-800">{selected.sex}</p></div>
                <div className="bg-slate-50 p-3 rounded-xl"><p className="text-[9px] font-bold text-slate-400 uppercase">DOB</p><p className="font-bold text-slate-800">{selected.date_of_birth} ({selected.age || '?'} yrs)</p></div>
                <div className="bg-slate-50 p-3 rounded-xl"><p className="text-[9px] font-bold text-slate-400 uppercase">LRN</p><p className="font-bold text-slate-800">{selected.lrn || 'N/A'}</p></div>
                <div className="col-span-2 bg-slate-50 p-3 rounded-xl"><p className="text-[9px] font-bold text-slate-400 uppercase">Address</p><p className="font-bold text-slate-800">{selected.street_address}, {selected.barangay}, {selected.city_municipality}, {selected.province}</p></div>
              </div>

              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">Parents / Guardian</p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-emerald-50 p-3 rounded-xl"><p className="text-[9px] font-bold text-emerald-600 uppercase">Father</p><p className="font-bold text-slate-800">{selected.father_name || 'N/A'}</p><p className="text-xs text-slate-500">{selected.father_contact || ''}</p>{selected.father_email && <p className="text-[10px] text-slate-400">{selected.father_email}</p>}</div>
                  <div className="bg-rose-50 p-3 rounded-xl"><p className="text-[9px] font-bold text-rose-600 uppercase">Mother</p><p className="font-bold text-slate-800">{selected.mother_name || 'N/A'}</p><p className="text-xs text-slate-500">{selected.mother_contact || ''}</p>{selected.mother_email && <p className="text-[10px] text-slate-400">{selected.mother_email}</p>}</div>
                  {selected.guardian_name && <div className="bg-amber-50 p-3 rounded-xl col-span-2"><p className="text-[9px] font-bold text-amber-600 uppercase">Guardian</p><p className="font-bold text-slate-800">{selected.guardian_name} ({selected.guardian_relationship})</p><p className="text-xs text-slate-500">{selected.guardian_contact || ''}</p></div>}
                  {selected.linked_parent_email && <div className="bg-violet-50 p-3 rounded-xl col-span-2 border border-violet-200"><p className="text-[9px] font-bold text-violet-600 uppercase">Linked Parent Account</p><p className="text-xs text-violet-700 font-semibold">{selected.linked_parent_email}</p></div>}
                </div>
              </div>

              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">Documents</p>
                {selected.documents && selected.documents.length > 0 ? (
                  <div className="space-y-2">
                    {selected.documents.map(doc => (
                      <div key={doc.id} className="flex items-center justify-between bg-slate-50 p-3 rounded-xl">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-sm font-medium text-slate-700 truncate">{doc.document_type_display}</span>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                            doc.verification_status === 'verified' ? 'bg-emerald-100 text-emerald-700' :
                            doc.verification_status === 'rejected' ? 'bg-rose-100 text-rose-700' :
                            doc.verification_status === 'missing' ? 'bg-amber-100 text-amber-700' :
                            'bg-slate-200 text-slate-600'
                          }`}>{doc.verification_status_display}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <a href={doc.file_url} target="_blank" rel="noreferrer" className="p-1.5 text-slate-400 hover:text-violet-600 rounded-lg" title="View">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                          </a>
                          {doc.verification_status !== 'verified' && (
                            <button onClick={() => verifyDoc(selected.id, doc.id, 'verified')} className="p-1.5 text-emerald-400 hover:text-emerald-600 rounded-lg" title="Verify">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                            </button>
                          )}
                          {doc.verification_status !== 'rejected' && (
                            <button onClick={() => verifyDoc(selected.id, doc.id, 'rejected')} className="p-1.5 text-rose-400 hover:text-rose-600 rounded-lg" title="Reject">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400">No documents uploaded</p>
                )}
              </div>

              {selected.status_history && selected.status_history.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-3">Status Timeline</p>
                  <div className="space-y-0">
                    {selected.status_history.map((h, i) => (
                      <div key={h.id} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className={`w-4 h-4 rounded-full border-2 ${i === 0 ? 'bg-violet-500 border-violet-500' : 'bg-white border-slate-300'}`} />
                          {i < selected.status_history.length - 1 && <div className="w-0.5 h-6 bg-slate-200" />}
                        </div>
                        <div className="pb-3">
                          <p className="text-sm font-semibold text-slate-800">{h.from_status_display || 'Submitted'} &rarr; {h.to_status_display}</p>
                          {h.notes && <p className="text-xs text-slate-500">{h.notes}</p>}
                          <p className="text-[10px] text-slate-400">{new Date(h.created_at).toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selected.remarks && (
                <div className="bg-slate-50 p-4 rounded-xl">
                  <p className="text-[9px] font-bold text-slate-400 uppercase">Remarks</p>
                  <p className="text-sm text-slate-700 mt-1">{selected.remarks}</p>
                </div>
              )}
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between gap-2">
              <div className="flex gap-2">
                <button onClick={() => promptRequestDocs(selected.id)} className="px-4 py-2 rounded-lg border border-amber-200 bg-amber-50 text-amber-700 text-xs font-bold hover:bg-amber-100">Request Docs</button>
                <button onClick={() => assignSection(selected.id)} className="px-4 py-2 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 text-xs font-bold hover:bg-blue-100">Set Section</button>
                <a href={`/api/enrollment-applications/export-form-pdf/?id=${selected.id}`} target="_blank" rel="noreferrer"
                  className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs font-bold hover:bg-slate-50">Print Form</a>
              </div>
              <div className="flex gap-2">
                {(selected.status === 'pending' || selected.status === 'under_review') && (
                  <>
                    <button onClick={() => { promptReject(selected.id); }} className="px-4 py-2 rounded-lg border border-rose-200 bg-white text-rose-600 text-xs font-bold hover:bg-rose-50">Reject</button>
                    {selected.status === 'under_review' && (
                      <button onClick={() => { promptApproveApplication(selected.id); }} className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700">Approve</button>
                    )}
                  </>
                )}
                {selected.status === 'approved' && (
                  <button onClick={() => { setEnrollApp(selected); setShowEnrollModal(true); }} className="px-4 py-2 rounded-lg bg-violet-600 text-white text-xs font-bold hover:bg-violet-700">Enroll Student</button>
                )}
                <button onClick={() => setSelected(null)} className="px-4 py-2 rounded-lg border border-slate-200 text-slate-500 text-xs font-bold hover:bg-slate-50">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showEnrollModal && enrollApp && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Enroll Student</h3>
            <p className="text-sm text-slate-500 mb-4">Create account for {enrollApp.first_name} {enrollApp.last_name}</p>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Assign Section</label>
                <select value={enrollClassroom} onChange={e => setEnrollClassroom(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400/30">
                  <option value="">Auto-assign</option>
                  {classrooms.filter(c => String(c.grade_level) === String(enrollApp.grade_level)).map(c => {
                    const count = applications.filter(a => a.assigned_classroom === c.id && a.status === 'enrolled').length;
                    return <option key={c.id} value={c.id}>{c.name} ({count}/{c.capacity || 40})</option>;
                  })}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Parent Email (optional)</label>
                <input type="email" value={enrollParentEmail} onChange={e => setEnrollParentEmail(e.target.value)}
                  placeholder="parent@email.com" className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400/30" />
                <p className="text-[10px] text-slate-400 mt-1">If a parent account exists with this email, it will be linked.</p>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
                <strong>Note:</strong> A student account will be created automatically. Save the credentials shown after enrollment.
              </div>
              <div className="flex gap-3">
                <button onClick={() => { setShowEnrollModal(false); setEnrollApp(null); setEnrollClassroom(''); setEnrollParentEmail(''); }}
                  className="flex-1 py-2.5 rounded-lg border border-slate-200 text-slate-600 text-sm font-bold hover:bg-slate-50">Cancel</button>
                <button onClick={enrollStudent} disabled={enrolling}
                  className="flex-1 py-2.5 rounded-lg bg-violet-600 text-white text-sm font-bold hover:bg-violet-700 disabled:opacity-50">
                  {enrolling ? 'Enrolling...' : 'Enroll Now'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnrollmentManagement;
