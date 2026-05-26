import { useState, useEffect, useMemo } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import { useScrollLock } from '../hooks/useScrollLock';

const emptyForm = { first_name: '', last_name: '', email: '', password: '' };

export default function ParentManagement() {
  const [parents, setParents] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [selectedParent, setSelectedParent] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [linkSearch, setLinkSearch] = useState('');
  const [linkedIds, setLinkedIds] = useState([]);
  const [linkSaving, setLinkSaving] = useState(false);

  useScrollLock(showAddModal || showLinkModal);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [pRes, sRes] = await Promise.all([
        api.get('/users/?role=parent'),
        api.get('/users/?role=student'),
      ]);
      setParents(Array.isArray(pRes.data) ? pRes.data : []);
      setStudents(Array.isArray(sRes.data) ? sRes.data : []);
    } catch { toast.error('Failed to load data'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      const res = await api.post('/admin/create-user/', {
        username: form.email,
        email: form.email,
        first_name: form.first_name,
        last_name: form.last_name,
        password: form.password || undefined,
        role: 'parent',
      });
      setShowAddModal(false);
      setForm(emptyForm);
      fetchAll();
      Swal.fire({
        icon: 'success',
        title: 'Parent Account Created',
        html: `
          <div class="text-left space-y-2 text-sm">
            <p><strong>Name:</strong> ${form.first_name} ${form.last_name}</p>
            <p><strong>Email / Username:</strong> ${res.data.username}</p>
            <p><strong>Temporary Password:</strong>
              <span class="bg-yellow-100 px-2 py-1 rounded font-mono text-base border border-yellow-300 select-all ml-1">
                ${res.data.temporary_password}
              </span>
            </p>
            <p class="text-xs text-slate-500 mt-3 italic">
              Share these credentials with the parent. They must change their password on first login.
            </p>
          </div>`,
        confirmButtonColor: '#9333ea',
      });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create parent account');
    } finally { setSaving(false); }
  };

  const openLinkModal = (parent) => {
    setSelectedParent(parent);
    const current = parent.profile?.linked_students || [];
    setLinkedIds(current.map(s => (typeof s === 'object' ? s.id : s)));
    setLinkSearch('');
    setShowLinkModal(true);
  };

  const toggleLink = (studentId) => {
    setLinkedIds(prev =>
      prev.includes(studentId) ? prev.filter(id => id !== studentId) : [...prev, studentId]
    );
  };

  const saveLinks = async () => {
    if (!selectedParent) return;
    setLinkSaving(true);
    try {
      await api.patch(`/users/${selectedParent.id}/`, {
        profile: { linked_students: linkedIds },
      });
      toast.success('Linked students updated');
      setShowLinkModal(false);
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update links');
    } finally { setLinkSaving(false); }
  };

  const handleDelete = async (id, name) => {
    const result = await Swal.fire({
      title: `Delete ${name}?`,
      text: 'This will permanently remove the parent account.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Yes, delete',
    });
    if (!result.isConfirmed) return;
    try {
      await api.delete(`/users/${id}/`);
      toast.success('Parent account deleted');
      fetchAll();
    } catch { toast.error('Failed to delete'); }
  };

  const handleResetPassword = async (parentId) => {
    const { value: pw } = await Swal.fire({
      title: 'Reset Password',
      input: 'text',
      inputLabel: 'New temporary password (leave blank to auto-generate)',
      inputPlaceholder: 'Optional',
      showCancelButton: true,
      confirmButtonText: 'Reset',
      confirmButtonColor: '#f59e0b',
    });
    if (pw === undefined) return;
    try {
      const res = await api.post(`/users/${parentId}/reset_password/`, { password: pw });
      Swal.fire({
        icon: 'success',
        title: 'Password Reset',
        html: `New temporary password: <strong class="font-mono text-lg">${res.data.temporary_password}</strong>`,
      });
    } catch { toast.error('Failed to reset password'); }
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return parents.filter(p => {
      const name = `${p.first_name} ${p.last_name}`.toLowerCase();
      const email = (p.email || '').toLowerCase();
      return name.includes(q) || email.includes(q);
    });
  }, [parents, search]);

  const filteredStudents = useMemo(() => {
    const q = linkSearch.toLowerCase();
    return students.filter(s => {
      const name = `${s.first_name} ${s.last_name}`.toLowerCase();
      const id = (s.username || '').toLowerCase();
      return name.includes(q) || id.includes(q);
    });
  }, [students, linkSearch]);

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="w-10 h-10 rounded-full border-2 border-slate-100 border-t-violet-600 animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6 page-bottom-safe">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight uppercase">Parent Management</h1>
          <p className="text-slate-500 text-sm mt-0.5">Create parent accounts and link them to their children</p>
        </div>
        <button
          onClick={() => { setForm(emptyForm); setShowAddModal(true); }}
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-bold py-2.5 px-5 rounded-xl transition-all shadow-md text-sm uppercase tracking-widest"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          Add Parent
        </button>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex gap-3">
        <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div className="text-sm text-blue-700">
          <p className="font-bold">How it works:</p>
          <p className="text-blue-600 text-xs mt-0.5">
            1. Create a parent account with their email. &nbsp;
            2. Click <strong>Link Children</strong> to connect them to their student(s). &nbsp;
            3. Share the temporary password — they log in at <strong>/login → Parent tab</strong>.
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or email..."
          className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
        />
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-16 h-16 bg-violet-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-violet-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <p className="text-slate-500 font-bold text-sm">No parent accounts yet.</p>
            <p className="text-slate-400 text-xs mt-1">Click "Add Parent" to create the first one.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-separate border-spacing-0">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Parent</th>
                  <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest hidden md:table-cell">Email</th>
                  <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Linked Children</th>
                  <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest hidden sm:table-cell">Status</th>
                  <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest hidden lg:table-cell">Temp Password</th>
                  <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(p => {
                  const linked = p.profile?.linked_students || [];
                  return (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-black text-sm flex-shrink-0">
                            {p.first_name?.[0]}{p.last_name?.[0]}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-800">{p.first_name} {p.last_name}</p>
                            <p className="text-[10px] text-violet-500 font-black uppercase tracking-widest">Parent</p>
                            {/* Show email inline on mobile */}
                            <p className="text-[10px] text-slate-400 md:hidden">{p.email || '—'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-500 hidden md:table-cell">{p.email || '—'}</td>
                      <td className="px-5 py-4">
                        {linked.length === 0 ? (
                          <span className="text-[10px] text-slate-400 italic">No children linked</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {linked.slice(0, 3).map((s, i) => (
                              <span key={i} className="px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 text-[10px] font-bold">
                                {typeof s === 'object' ? `${s.first_name} ${s.last_name}` : `Student #${s}`}
                              </span>
                            ))}
                            {linked.length > 3 && (
                              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold">+{linked.length - 3} more</span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-4 hidden sm:table-cell">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase ${
                          p.account_status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                          p.account_status === 'suspended' ? 'bg-rose-100 text-rose-700' :
                          'bg-slate-100 text-slate-500'
                        }`}>{p.account_status}</span>
                      </td>
                      <td className="px-5 py-4 hidden lg:table-cell">
                        {p.must_change_password && p.temp_password_storage ? (
                          <span className="font-mono text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-100 select-all cursor-help" title="Visible until parent changes password">
                            {p.temp_password_storage}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400">Changed</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openLinkModal(p)}
                            title="Link Children"
                            className="p-2 rounded-lg text-violet-600 hover:bg-violet-50 transition-all"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleResetPassword(p.id)}
                            title="Reset Password"
                            className="p-2 rounded-lg text-amber-600 hover:bg-amber-50 transition-all"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(p.id, `${p.first_name} ${p.last_name}`)}
                            title="Delete Account"
                            className="p-2 rounded-lg text-rose-500 hover:bg-rose-50 transition-all"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Parent Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-lg font-black text-slate-900">Create Parent Account</h3>
              <p className="text-slate-500 text-xs mt-1">A temporary password will be generated automatically.</p>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1">First Name *</label>
                  <input required value={form.first_name} onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300" />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1">Last Name *</label>
                  <input required value={form.last_name} onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1">Email Address *</label>
                <input required type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="parent@email.com"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300" />
                <p className="text-[10px] text-slate-400 mt-1">This will also be their username for login.</p>
              </div>
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1">Password (optional)</label>
                <input type="text" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="Leave blank to auto-generate"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={saving}
                  className="px-6 py-2 rounded-xl bg-violet-600 text-white font-bold text-sm hover:bg-violet-700 disabled:opacity-50">
                  {saving ? 'Creating…' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Link Children Modal */}
      {showLinkModal && selectedParent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col">
            <div className="p-6 border-b border-slate-100 flex-shrink-0">
              <h3 className="text-lg font-black text-slate-900">
                Link Children — {selectedParent.first_name} {selectedParent.last_name}
              </h3>
              <p className="text-slate-500 text-xs mt-1">
                Select the students linked to this parent. Changes are saved when you click Save.
              </p>
            </div>
            <div className="p-4 border-b border-slate-100 flex-shrink-0">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input type="text" value={linkSearch} onChange={e => setLinkSearch(e.target.value)}
                  placeholder="Search students by name or ID..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-300" />
              </div>
              {linkedIds.length > 0 && (
                <p className="text-[10px] text-violet-600 font-black uppercase tracking-widest mt-2">
                  {linkedIds.length} student{linkedIds.length !== 1 ? 's' : ''} selected
                </p>
              )}
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {filteredStudents.length === 0 ? (
                <p className="text-center text-slate-400 text-sm py-8">No students found.</p>
              ) : filteredStudents.map(s => {
                const isLinked = linkedIds.includes(s.id);
                return (
                  <button key={s.id} onClick={() => toggleLink(s.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                      isLinked
                        ? 'bg-violet-50 border-violet-300 shadow-sm'
                        : 'bg-white border-slate-200 hover:border-violet-200 hover:bg-violet-50/30'
                    }`}>
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                      isLinked ? 'bg-violet-600 border-violet-600' : 'border-slate-300'
                    }`}>
                      {isLinked && (
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-xs flex-shrink-0">
                      {s.first_name?.[0]}{s.last_name?.[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-800 truncate">{s.first_name} {s.last_name}</p>
                      <p className="text-[10px] text-slate-400 truncate">
                        {s.username} · {s.profile?.grade_level || 'No grade'} · {s.profile?.classroom_name || 'No class'}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="p-4 border-t border-slate-100 flex justify-end gap-3 flex-shrink-0">
              <button onClick={() => setShowLinkModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50">Cancel</button>
              <button onClick={saveLinks} disabled={linkSaving}
                className="px-6 py-2 rounded-xl bg-violet-600 text-white font-bold text-sm hover:bg-violet-700 disabled:opacity-50">
                {linkSaving ? 'Saving…' : 'Save Links'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
