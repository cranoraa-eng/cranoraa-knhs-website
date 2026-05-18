import { useState, useEffect } from 'react';
import api from '../utils/api';
import { getUser } from '../utils/auth';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

const CATEGORY_CONFIG = {
  general:       { label: 'General',       color: 'bg-violet-50 text-violet-600 border-violet-100' },
  academic:      { label: 'Academic',      color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
  events:        { label: 'Events',        color: 'bg-amber-50 text-amber-600 border-amber-100' },
  emergency:     { label: 'Emergency',     color: 'bg-rose-50 text-rose-600 border-rose-100' },
  holiday:       { label: 'Holiday',       color: 'bg-blue-50 text-blue-600 border-blue-100' },
  system_update: { label: 'System Update', color: 'bg-slate-50 text-slate-600 border-slate-100' },
};

const STATUS_CONFIG = {
  draft:   { label: 'Draft',   color: 'bg-slate-100 text-slate-500' },
  live:    { label: 'Live',    color: 'bg-emerald-500 text-white' },
  expired: { label: 'Expired', color: 'bg-rose-500 text-white' },
};

const EMPTY_FORM = {
  title: '', category: 'general', priority: 'info', status: 'live',
  target_audience: 'all', content: '', is_pinned: false, is_public: false,
  expiration_date: '', attachments: [],
};

const Announcements = () => {
  const user = getUser();
  const canManage = user?.role === 'admin' || user?.role === 'teacher';

  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [search, setSearch]               = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showModal, setShowModal]         = useState(false);
  const [showView, setShowView]           = useState(false);
  const [selected, setSelected]           = useState(null);
  const [form, setForm]                   = useState(EMPTY_FORM);
  const [isEditing, setIsEditing]         = useState(false);
  const [saving, setSaving]               = useState(false);
  const [zoomedImage, setZoomedImage]     = useState(null);

  useEffect(() => { fetchAnnouncements(); }, [categoryFilter]);

  useEffect(() => {
    const t = setTimeout(fetchAnnouncements, 400);
    return () => clearTimeout(t);
  }, [search]);

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const params = {};
      if (categoryFilter !== 'all') params.category = categoryFilter;
      if (search) params.search = search;
      const r = await api.get('/announcements/', { params });
      setAnnouncements(r.data);
    } catch (err) {
      if (err.code === 'ERR_NETWORK') {
        console.warn('Backend server is unreachable.');
      } else {
        toast.error('Failed to load announcements');
      }
    }
    finally { setLoading(false); }
  };

  const openCreate = () => { setForm(EMPTY_FORM); setIsEditing(false); setShowModal(true); };
  const openEdit = (a) => {
    setSelected(a);
    setForm({ title: a.title, category: a.category, priority: a.priority, status: a.status,
      target_audience: a.target_audience, content: a.content, is_pinned: a.is_pinned,
      is_public: a.is_public, expiration_date: a.expiration_date || '', attachments: [] });
    setIsEditing(true);
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) return toast.error('Title and content are required');
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (k === 'attachments') {
          if (v && v.length > 0) {
            v.forEach(file => fd.append('attachments', file));
          }
        } else if (k === 'expiration_date') {
          if (v && v.trim() !== '') fd.append(k, v);
        } else if (v !== null && v !== undefined) {
          fd.append(k, v);
        }
      });
      
      const config = {
        headers: { 'Content-Type': 'multipart/form-data' }
      };

      if (isEditing) {
        await api.patch(`/announcements/${selected.id}/`, fd, config);
        toast.success('Announcement updated');
      } else {
        await api.post('/announcements/', fd, config);
        toast.success('Announcement created');
      }
      setShowModal(false);
      fetchAnnouncements();
    } catch (err) {
      console.error('Error saving announcement:', err);
      const msg = err.response?.data ? Object.entries(err.response.data).map(([k, v]) => `${k}: ${v}`).join(', ') : 'Failed to save announcement';
      toast.error(msg);
    }
    finally { setSaving(false); }
  };

  const handleDelete = async (a) => {
    const result = await Swal.fire({
      title: 'Delete Announcement?',
      text: `"${a.title}" will be permanently removed.`,
      icon: 'warning', showCancelButton: true,
      confirmButtonColor: '#ef4444', cancelButtonColor: '#6b7280',
      confirmButtonText: 'Delete',
    });
    if (!result.isConfirmed) return;
    try { await api.delete(`/announcements/${a.id}/`); toast.success('Deleted'); fetchAnnouncements(); }
    catch { toast.error('Failed to delete'); }
  };

  const handlePin    = async (a) => { try { await api.patch(`/announcements/${a.id}/`, { is_pinned: !a.is_pinned }); fetchAnnouncements(); } catch {} };
  const handlePublish = async (a) => { try { await api.post(`/announcements/${a.id}/publish/`); toast.success('Published'); fetchAnnouncements(); } catch {} };
  const handleArchive = async (a) => { try { await api.post(`/announcements/${a.id}/archive/`); toast.success('Archived'); fetchAnnouncements(); } catch {} };
  const handleRead    = async (a) => { try { await api.post(`/announcements/${a.id}/mark_read/`); fetchAnnouncements(); } catch {} };

  const handleDeleteAttachment = async (attId) => {
    if (!selected) return;
    try {
      await api.post(`/announcements/${selected.id}/delete_attachment/`, { attachment_id: attId });
      toast.success('Attachment removed');
      // Update local state
      const updatedSelected = {
        ...selected,
        attachments: selected.attachments.filter(a => a.id !== attId)
      };
      setSelected(updatedSelected);
      // Update announcements list too
      setAnnouncements(announcements.map(a => a.id === selected.id ? updatedSelected : a));
    } catch (err) {
      toast.error('Failed to remove attachment');
    }
  };

  const isImage = (url) => url && /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
  const attachUrl = (url) => url?.startsWith('http') ? url : `http://127.0.0.1:8000${url}`;

  const pinned = announcements.filter(a => a.is_pinned);
  const regular = announcements.filter(a => !a.is_pinned);
  const sorted = [...pinned, ...regular];

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Announcements</h1>
          <p className="text-slate-500 font-medium mt-2">Stay updated with the latest news and events from Kiwalan NHS</p>
        </div>
        {canManage && (
          <button onClick={openCreate}
            className="flex items-center justify-center gap-3 bg-violet-600 hover:bg-violet-700 text-white font-black py-4 px-8 rounded-2xl transition-all shadow-xl shadow-violet-200 active:scale-95 shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            Create New
          </button>
        )}
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1 group">
          <svg className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-violet-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input 
            type="text" 
            placeholder="Search by title or content..." 
            value={search} 
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-14 pr-6 py-4 bg-white border-2 border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-violet-500/5 focus:border-violet-500 transition-all font-medium text-slate-900 placeholder:text-slate-400 shadow-sm" 
          />
        </div>
        <div className="flex gap-4">
          <select 
            value={categoryFilter} 
            onChange={e => setCategoryFilter(e.target.value)}
            className="px-6 py-4 bg-white border-2 border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-violet-500/5 focus:border-violet-500 transition-all font-black text-slate-600 appearance-none cursor-pointer shadow-sm min-w-[180px]"
          >
            <option value="all">All Categories</option>
            {Object.entries(CATEGORY_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-32">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600" />
        </div>
      ) : sorted.length === 0 ? (
        <div className="bg-white border-2 border-slate-100 rounded-[3rem] p-24 text-center shadow-sm">
          <div className="w-24 h-24 bg-violet-50 rounded-full flex items-center justify-center mx-auto mb-8">
            <svg className="w-10 h-10 text-violet-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
            </svg>
          </div>
          <h3 className="text-2xl font-black text-slate-900 mb-2">No announcements found</h3>
          <p className="text-slate-400 font-medium">Try adjusting your search or filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {sorted.map(a => {
            const cat = CATEGORY_CONFIG[a.category] || CATEGORY_CONFIG.general;
            const stat = STATUS_CONFIG[a.status] || STATUS_CONFIG.draft;
            return (
              <div key={a.id} className={`group bg-white border-2 border-slate-100 rounded-[2.5rem] p-8 shadow-sm hover:shadow-2xl hover:shadow-violet-500/5 transition-all duration-300 flex flex-col relative overflow-hidden ${a.priority === 'critical' ? 'ring-2 ring-rose-500/20' : ''}`}>
                {a.is_pinned && (
                  <div className="absolute top-6 right-6">
                    <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 shadow-inner">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
                    </div>
                  </div>
                )}

                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-6">
                    <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${cat.color}`}>
                      {cat.label}
                    </span>
                    {a.priority === 'critical' && (
                      <span className="px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-rose-500 text-white shadow-lg shadow-rose-200">
                        Critical
                      </span>
                    )}
                  </div>

                  <h2 className="text-xl font-black text-slate-900 leading-tight mb-4 group-hover:text-violet-600 transition-colors">{a.title}</h2>
                  <p className="text-slate-500 font-medium text-sm line-clamp-3 leading-relaxed mb-6">{a.content}</p>
                </div>

                <div className="pt-6 border-t border-slate-50 mt-auto flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 font-black text-[10px]">
                      {a.author_name?.[0]}
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-900 leading-none">{a.author_name}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-1">{new Date(a.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {canManage && (
                      <>
                        <button onClick={() => openEdit(a)} className="p-2.5 rounded-xl bg-slate-50 text-slate-400 hover:bg-violet-50 hover:text-violet-600 transition-all">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                        <button onClick={() => handleDelete(a)} className="p-2.5 rounded-xl bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </>
                    )}
                    <button onClick={() => { setSelected(a); setShowView(true); }} className="p-2.5 rounded-xl bg-violet-600 text-white shadow-lg shadow-violet-200 hover:bg-violet-700 transition-all">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268-2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Create / Edit Modal ── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-800">{isEditing ? 'Edit Announcement' : 'New Announcement'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Title <span className="text-red-400">*</span></label>
                <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="Announcement title..." required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Category</label>
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm">
                    {Object.entries(CATEGORY_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Priority</label>
                  <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm">
                    <option value="info">Info</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Audience</label>
                  <select value={form.target_audience} onChange={e => setForm(f => ({ ...f, target_audience: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm">
                    <option value="all">All Users</option>
                    <option value="students">Students</option>
                    <option value="teachers">Teachers</option>
                    <option value="admins">Admins</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Status</label>
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm">
                    <option value="draft">Draft</option>
                    <option value="live">Live</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Content <span className="text-red-400">*</span></label>
                <textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                  rows={5} required placeholder="Write your announcement here..."
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm resize-none" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Expiration Date</label>
                  <input type="datetime-local" value={form.expiration_date}
                    onChange={e => setForm(f => ({ ...f, expiration_date: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Attachments</label>
                  <input type="file" accept=".jpg,.jpeg,.png,.gif,.webp,.pdf" multiple
                    onChange={e => setForm(f => ({ ...f, attachments: Array.from(e.target.files) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                  
                  {/* Show files currently being selected for upload */}
                  {form.attachments && form.attachments.length > 0 && (
                    <div className="mt-2 space-y-1">
                      <p className="text-[10px] font-bold text-purple-600 uppercase tracking-tight">New files to upload:</p>
                      {form.attachments.map((file, i) => (
                        <div key={i} className="flex items-center justify-between bg-purple-50 px-2 py-1 rounded text-[11px] text-purple-700 border border-purple-100">
                          <span className="truncate max-w-[150px]">{file.name}</span>
                          <button type="button" onClick={() => setForm(f => ({ ...f, attachments: f.attachments.filter((_, idx) => idx !== i) }))}
                            className="text-purple-400 hover:text-purple-600">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Show existing attachments when editing */}
                   {isEditing && selected?.attachments?.length > 0 && (
                     <div className="mt-3 space-y-1">
                       <p className="text-[10px] font-bold text-gray-500 uppercase tracking-tight">Existing attachments:</p>
                       {selected.attachments.map((att, i) => (
                         <div key={i} className="flex items-center justify-between bg-gray-50 px-2 py-1 rounded text-[11px] text-gray-600 border border-gray-100">
                           <span className="truncate max-w-[150px]">{att.filename}</span>
                           <button type="button" onClick={() => handleDeleteAttachment(att.id)}
                             className="text-red-400 hover:text-red-600 ml-2" title="Delete from server">
                             <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                             </svg>
                           </button>
                         </div>
                       ))}
                     </div>
                   )}
                </div>
              </div>

              <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer">
                <input type="checkbox" checked={form.is_pinned}
                  onChange={e => setForm(f => ({ ...f, is_pinned: e.target.checked }))}
                  className="w-4 h-4 text-purple-600 rounded" />
                <span className="text-sm font-medium text-gray-700">📌 Pin to top</span>
              </label>

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving}
                  className="flex-1 bg-[#2D1B4D] hover:bg-[#3D2B5D] disabled:opacity-60 text-white font-medium py-2.5 rounded-lg transition-colors text-sm">
                  {saving ? 'Saving...' : isEditing ? 'Update' : 'Publish'}
                </button>
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2.5 rounded-lg transition-colors text-sm">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── View Modal ── */}
      {showView && selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${(CATEGORY_CONFIG[selected.category] || CATEGORY_CONFIG.general).color}`}>
                  {(CATEGORY_CONFIG[selected.category] || CATEGORY_CONFIG.general).label}
                </span>
                {selected.priority === 'critical' && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200">🚨 Critical</span>
                )}
                {selected.is_pinned && <span className="text-xs text-amber-600">📌 Pinned</span>}
              </div>
              <button onClick={() => setShowView(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-1">{selected.title}</h2>
              <div className="flex items-center gap-3 mb-4 text-xs text-gray-400">
                <span>By {selected.author_name || 'Admin'}</span>
                <span>·</span>
                <span>{new Date(selected.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                {selected.expiration_date && <><span>·</span><span>Expires {new Date(selected.expiration_date).toLocaleDateString()}</span></>}
              </div>
              <div className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{selected.content}</div>

              {(selected.attachments && selected.attachments.length > 0) && (
                <div className="mt-5 p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    Attachments ({selected.attachments.length})
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {selected.attachments.map((att, idx) => {
                      const url = attachUrl(att.url);
                      return (
                        <div key={idx} className="relative group">
                          {att.is_image ? (
                            <div className="cursor-pointer" onClick={() => setZoomedImage(url)}>
                              <img src={url} alt={att.filename}
                                className="w-full h-32 object-cover rounded-lg border border-gray-200"
                                onError={e => { 
                                  e.target.onerror = null; 
                                  e.target.src = 'https://via.placeholder.com/300x200?text=Image+Not+Found'; 
                                }} />
                              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
                                </svg>
                              </div>
                              <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] px-2 py-1 truncate rounded-b-lg">
                                {att.filename}
                              </div>
                            </div>
                          ) : (
                            <a href={url} target="_blank" rel="noreferrer"
                              className="flex items-center gap-2 p-3 bg-white rounded-lg border border-gray-200 hover:border-purple-300 transition-colors shadow-sm">
                              <div className="w-8 h-8 bg-purple-100 rounded flex items-center justify-center flex-shrink-0">
                                <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-[11px] font-medium text-gray-700 truncate">{att.filename}</p>
                                <p className="text-[9px] text-gray-400">Click to download</p>
                              </div>
                            </a>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {selected.attachment_url && !selected.attachments?.length && (
                <div className="mt-5 p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Attachment</p>
                  {isImage(selected.attachment_url) ? (
                    <img src={attachUrl(selected.attachment_url)} alt="Attachment"
                      className="max-h-80 w-auto rounded-lg mx-auto object-contain"
                      onError={e => { e.target.style.display = 'none'; }} />
                  ) : (
                    <a href={attachUrl(selected.attachment_url)} target="_blank" rel="noreferrer"
                      className="flex items-center gap-2 text-purple-600 hover:text-purple-800 text-sm font-medium">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Download attachment
                    </a>
                  )}
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end">
              <button onClick={() => setShowView(false)}
                className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors text-sm">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Image Zoom Modal ── */}
      {zoomedImage && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4" onClick={() => setZoomedImage(null)}>
          <button onClick={() => setZoomedImage(null)} className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <img src={zoomedImage} alt="Zoomed attachment" className="max-w-full max-h-full object-contain" />
        </div>
      )}
    </div>
  );
};

export default Announcements;
