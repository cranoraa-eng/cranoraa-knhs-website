import { useState, useEffect } from 'react';
import api, { MEDIA_ROOT } from '../utils/api';
import { getUser } from '../utils/auth';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

const CATEGORY_CONFIG = {
  general:       { label: 'General',       color: 'bg-purple-100 text-purple-700 border-purple-200' },
  academic:      { label: 'Academic',      color: 'bg-green-100 text-green-700 border-green-200' },
  events:        { label: 'Events',        color: 'bg-amber-100 text-amber-700 border-amber-200' },
  emergency:     { label: 'Emergency',     color: 'bg-red-100 text-red-700 border-red-200' },
  holiday:       { label: 'Holiday',       color: 'bg-blue-100 text-blue-700 border-blue-200' },
  system_update: { label: 'System Update', color: 'bg-gray-100 text-gray-700 border-gray-200' },
};

const STATUS_CONFIG = {
  draft:   { label: 'Draft',   color: 'bg-gray-100 text-gray-600' },
  live:    { label: 'Live',    color: 'bg-green-100 text-green-700' },
  expired: { label: 'Expired', color: 'bg-red-100 text-red-600' },
};

const EMPTY_FORM = {
  title: '', category: 'general', priority: 'info', status: 'live',
  target_audience: 'all', target_classrooms: [], content: '', is_pinned: false, is_public: false,
  event_date: '', end_date: '', attachments: [],
};

const Announcements = () => {
  const user = getUser();
  const canManage = user?.role === 'admin' || user?.role === 'teacher';

  const [announcements, setAnnouncements] = useState([]);
  const [classrooms, setClassrooms]     = useState([]);
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

  const [selectedIds, setSelectedIds]     = useState([]);
  const [processing, setProcessing]       = useState(false);

  useEffect(() => { 
    fetchAnnouncements(); 
    if (canManage) fetchClassrooms();
  }, [categoryFilter]);

  useEffect(() => {
    const t = setTimeout(fetchAnnouncements, 400);
    return () => clearTimeout(t);
  }, [search]);

  const fetchClassrooms = async () => {
    try {
      const r = await api.get('/classrooms/');
      setClassrooms(r.data);
    } catch (err) {
      console.error('Failed to load classrooms');
    }
  };

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
      target_audience: a.target_audience, target_classrooms: a.target_classrooms || [], 
      content: a.content, is_pinned: a.is_pinned,
      is_public: a.is_public, event_date: a.event_date || '', end_date: a.end_date || '', attachments: [] });
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
        } else if (k === 'target_classrooms') {
          if (v && v.length > 0) {
            v.forEach(id => fd.append('target_classrooms', id));
          }
        } else if (k === 'event_date' || k === 'end_date') {
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
      text: "This action cannot be undone.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      customClass: { popup: 'rounded-3xl' }
    });

    if (result.isConfirmed) {
      try {
        await api.delete(`/announcements/${a.id}/`);
        setAnnouncements(prev => prev.filter(item => item.id !== a.id));
        toast.success('Announcement deleted');
      } catch (error) {
        toast.error('Failed to delete announcement');
      }
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    
    const result = await Swal.fire({
      title: `Delete ${selectedIds.length} Announcements?`,
      text: "This action cannot be undone.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete them',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      customClass: { popup: 'rounded-3xl' }
    });

    if (result.isConfirmed) {
      try {
        await api.post('/announcements/bulk_delete/', { ids: selectedIds });
        setAnnouncements(prev => prev.filter(a => !selectedIds.includes(a.id)));
        setSelectedIds([]);
        toast.success(`${selectedIds.length} announcements deleted`);
      } catch (error) {
        toast.error('Failed to delete from server');
      }
    }
  };

  const handleDeleteAll = async () => {
    const result = await Swal.fire({
      title: 'Delete ALL Announcements?',
      text: "This will permanently remove every announcement from the system.",
      icon: 'error',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete ALL',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      customClass: { popup: 'rounded-3xl' }
    });

    if (result.isConfirmed) {
      try {
        await api.post('/announcements/delete_all/');
        setAnnouncements([]);
        setSelectedIds([]);
        toast.success('All announcements deleted');
      } catch (error) {
        toast.error('Failed to delete from server');
      }
    }
  };


  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === sorted.length) setSelectedIds([]);
    else setSelectedIds(sorted.map(a => a.id));
  };

  const handlePin    = async (a) => { try { await api.patch(`/announcements/${a.id}/`, { is_pinned: !a.is_pinned }); fetchAnnouncements(); } catch {} };
  const handlePublish = async (a) => { try { await api.post(`/announcements/${a.id}/publish/`); toast.success('Published'); fetchAnnouncements(); } catch {} };
  const handleArchive = async (a) => { try { await api.post(`/announcements/${a.id}/archive/`); toast.success('Archived'); fetchAnnouncements(); } catch {} };
  const handleRead    = async (a) => { try { await api.post(`/announcements/${a.id}/mark-read/`); fetchAnnouncements(); } catch {} };

  const handleDeleteAttachment = async (attId) => {
    if (!selected) return;
    try {
      await api.post(`/announcements/${selected.id}/delete-attachment/`, { attachment_id: attId });
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
  const attachUrl = (url) => url?.startsWith('http') ? url : `${MEDIA_ROOT}${url}`;

  const pinned = announcements.filter(a => a.is_pinned);
  const regular = announcements.filter(a => !a.is_pinned);
  const sorted = [...pinned, ...regular];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Announcements</h1>
          <p className="text-gray-500 mt-1">School news, updates, and notices</p>
        </div>
        {canManage && (
          <button onClick={openCreate}
            className="flex items-center gap-2 bg-[#2D1B4D] hover:bg-[#3D2B5D] text-white font-medium py-2 px-4 rounded-lg transition-colors shadow-sm">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Announcement
          </button>
        )}
      </div>

      {/* Filters & Actions */}
      <div className="flex flex-col space-y-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input type="text" placeholder="Search announcements..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm" />
          </div>
          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
            className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm">
            <option value="all">All Categories</option>
            {Object.entries(CATEGORY_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>

        {canManage && sorted.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 bg-gray-50 p-3 rounded-xl border border-gray-200 animate-fadeIn">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" 
                  checked={selectedIds.length === sorted.length && sorted.length > 0}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500" />
                <span className="text-xs font-bold text-gray-600 uppercase tracking-wider group-hover:text-purple-600 transition-colors">
                  {selectedIds.length === sorted.length ? 'Deselect All' : 'Select All'}
                </span>
              </label>
              
              {selectedIds.length > 0 && (
                <div className="h-4 w-px bg-gray-300 mx-1"></div>
              )}

              {selectedIds.length > 0 && (
                <button onClick={handleBulkDelete}
                  className="flex items-center gap-1.5 text-xs font-black text-red-600 uppercase tracking-widest hover:bg-red-50 px-2 py-1 rounded-lg transition-all">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  Delete Selected ({selectedIds.length})
                </button>
              )}

              {user?.role === 'admin' && (
                <button onClick={handleDeleteAll}
                  className="flex items-center gap-1.5 text-xs font-black text-red-500/60 uppercase tracking-widest hover:text-red-600 hover:bg-red-50 px-2 py-1 rounded-lg transition-all">
                  Delete All
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600" />
        </div>
      ) : sorted.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-16 text-center">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-1">No announcements yet</h3>
          <p className="text-gray-400 text-sm">School updates and notices will appear here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sorted.map(a => {
            const cat = CATEGORY_CONFIG[a.category] || CATEGORY_CONFIG.general;
            const stat = STATUS_CONFIG[a.status] || STATUS_CONFIG.draft;
            const isSelected = selectedIds.includes(a.id);

            return (
              <div key={a.id} className={`bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-all ${a.priority === 'critical' ? 'border-l-4 border-l-red-500' : 'border-l-4 border-l-purple-500'} ${isSelected ? 'ring-2 ring-purple-500 bg-purple-50/30' : ''}`}>
                <div className="p-5 flex gap-4">
                  {canManage && (
                    <div className="flex-shrink-0 pt-1">
                      <input type="checkbox" 
                        checked={isSelected}
                        onChange={() => toggleSelect(a.id)}
                        className="w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500 cursor-pointer" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    {/* Top row */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          {a.is_pinned && (
                            <span className="flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                              📌 Pinned
                            </span>
                          )}
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${cat.color}`}>{cat.label}</span>
                          {a.priority === 'critical' && (
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200">🚨 Critical</span>
                          )}
                          {a.is_public && (
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100 flex items-center gap-1">
                              🌐 Public
                            </span>
                          )}
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${stat.color}`}>{stat.label}</span>
                        </div>
                        <h2 className="text-lg font-bold text-gray-800 leading-tight">{a.title}</h2>
                        <p className="text-gray-500 text-sm mt-1 line-clamp-2">{a.content}</p>
                      </div>

                      {/* Actions */}
                      {canManage && (
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button onClick={() => handlePin(a)} title={a.is_pinned ? 'Unpin' : 'Pin'}
                            className={`p-1.5 rounded-lg transition-colors ${a.is_pinned ? 'text-amber-600 bg-amber-50 hover:bg-amber-100' : 'text-gray-400 hover:bg-gray-100'}`}>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                            </svg>
                          </button>
                          {a.status === 'draft' && (
                            <button onClick={() => handlePublish(a)} title="Publish"
                              className="p-1.5 rounded-lg text-green-600 hover:bg-green-50 transition-colors">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </button>
                          )}
                          {a.status === 'live' && (
                            <button onClick={() => handleArchive(a)} title="Archive"
                              className="p-1.5 rounded-lg text-orange-500 hover:bg-orange-50 transition-colors">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                              </svg>
                            </button>
                          )}
                          <button onClick={() => openEdit(a)} title="Edit"
                            className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button onClick={() => handleDelete(a)} title="Delete"
                            className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#9F7AEA] to-[#6B46C1] flex items-center justify-center text-white text-xs font-bold">
                          {(a.author_name || 'A').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-700">{a.author_name || 'Admin'}</p>
                          <p className="text-xs text-gray-400">{new Date(a.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          {a.read_count || 0}
                        </span>
                        {(a.attachment_url || (a.attachments && a.attachments.length > 0)) && (
                          <span className="flex items-center gap-1 text-xs text-gray-400">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                            </svg>
                            {a.attachments?.length > 0 ? `${a.attachments.length} Attachment(s)` : 'Attachment'}
                          </span>
                        )}
                        <button onClick={() => { setSelected(a); setShowView(true); if (!a.is_read) handleRead(a); }}
                          className="text-xs font-semibold text-purple-600 hover:text-purple-800 transition-colors">
                          Read more →
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Create / Edit Modal ── */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 border border-white/20">
            <div className="px-5 py-4 bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 text-white relative">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-sm font-black tracking-[0.2em] uppercase leading-none">{isEditing ? 'Edit Post' : 'New Broadcast'}</h2>
                  <p className="text-indigo-100 text-[9px] mt-1 font-bold uppercase tracking-widest opacity-70">Internal Communication Hub</p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center transition-all group">
                <svg className="w-4 h-4 text-white/50 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-none">
              <div className="space-y-1">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em]">Headline <span className="text-rose-400">*</span></label>
                  <span className="text-[9px] font-bold text-slate-300">{form.title.length}/100</span>
                </div>
                <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="Clear and concise title" required maxLength={100}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white text-xs font-bold transition-all placeholder:text-slate-300" />
              </div>

              <div className="grid grid-cols-4 gap-2">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">Type</label>
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-[10px] font-black uppercase tracking-tight cursor-pointer">
                    {Object.entries(CATEGORY_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">Priority</label>
                  <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
                    className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-[10px] font-black uppercase tracking-tight cursor-pointer">
                    <option value="info">Normal</option>
                    <option value="critical">Urgent</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">Group</label>
                  <select value={form.target_audience} onChange={e => setForm(f => ({ ...f, target_audience: e.target.value }))}
                    className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-[10px] font-black uppercase tracking-tight cursor-pointer">
                    <option value="all">Everyone</option>
                    <option value="students">Students</option>
                    <option value="teachers">Teachers</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">Status</label>
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                    className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-[10px] font-black uppercase tracking-tight cursor-pointer">
                    <option value="draft">Draft</option>
                    <option value="live">Live</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1 flex items-center gap-1.5">
                  Target Sections 
                  <span className="text-[8px] font-bold text-indigo-500 lowercase opacity-60">(Optional: Click to select)</span>
                </label>
                <div className="flex flex-wrap gap-1 p-2 bg-slate-50/50 rounded-xl border border-slate-100 max-h-[80px] overflow-y-auto scrollbar-none">
                  {classrooms.map(cls => (
                    <button
                      key={cls.id}
                      type="button"
                      onClick={() => {
                        const current = form.target_classrooms || [];
                        const updated = current.includes(cls.id) ? current.filter(id => id !== cls.id) : [...current, cls.id];
                        setForm(f => ({ ...f, target_classrooms: updated }));
                      }}
                      className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest transition-all border ${
                        (form.target_classrooms || []).includes(cls.id)
                          ? 'bg-indigo-600 text-white border-indigo-700 shadow-sm scale-95'
                          : 'bg-white text-slate-400 border-slate-200 hover:border-indigo-300 hover:text-indigo-500'
                      }`}
                    >
                      {cls.name}
                    </button>
                  ))}
                  {classrooms.length === 0 && <span className="text-[8px] font-bold text-slate-300 uppercase tracking-widest p-1">No sections available</span>}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">Message Content <span className="text-rose-400">*</span></label>
                <textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                  rows={3} required placeholder="What do you want to announce?"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white text-xs font-medium leading-relaxed resize-none scrollbar-none" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">Event Date</label>
                  <input type="datetime-local" value={form.event_date}
                    onChange={e => setForm(f => ({ ...f, event_date: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-[10px] font-bold uppercase" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">Expiry Date</label>
                  <input type="datetime-local" value={form.end_date}
                    onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-[10px] font-bold uppercase" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">Media & Documents</label>
                <div className="relative group/upload">
                  <input type="file" accept=".jpg,.jpeg,.png,.gif,.webp,.pdf" multiple
                    onChange={e => setForm(f => ({ ...f, attachments: Array.from(e.target.files) }))}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                  <div className="w-full px-4 py-2.5 bg-slate-50 border border-dashed border-slate-300 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover/upload:border-indigo-400 group-hover/upload:text-indigo-500 group-hover/upload:bg-indigo-50/30 transition-all flex items-center justify-center gap-2">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                    Upload Attachments
                  </div>
                </div>
                
                {/* File list indicators */}
                {(form.attachments?.length > 0 || (isEditing && selected?.attachments?.length > 0)) && (
                  <div className="flex flex-wrap gap-1.5">
                    {form.attachments?.map((file, i) => (
                      <div key={i} className="flex items-center gap-1.5 bg-indigo-50 text-indigo-700 px-2 py-1 rounded-lg border border-indigo-100 text-[8px] font-black uppercase tracking-tighter">
                        <span className="truncate max-w-[80px]">{file.name}</span>
                        <button type="button" onClick={() => setForm(f => ({ ...f, attachments: f.attachments.filter((_, idx) => idx !== i) }))} className="hover:text-rose-500 transition-colors">
                          <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </div>
                    ))}
                    {isEditing && selected?.attachments?.map((att, i) => (
                      <div key={`old-${i}`} className="flex items-center gap-1.5 bg-slate-100 text-slate-600 px-2 py-1 rounded-lg border border-slate-200 text-[8px] font-black uppercase tracking-tighter">
                        <span className="truncate max-w-[80px]">{att.filename}</span>
                        <button type="button" onClick={() => handleDeleteAttachment(att.id)} className="hover:text-rose-500 transition-colors">
                          <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <label className="flex items-center gap-2.5 p-2.5 bg-slate-50/80 border border-slate-100 rounded-xl cursor-pointer hover:bg-white hover:border-amber-200 transition-all group">
                  <div className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all ${form.is_pinned ? 'bg-amber-500 border-amber-600' : 'bg-white border-slate-300'}`}>
                    {form.is_pinned && <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/></svg>}
                  </div>
                  <input type="checkbox" checked={form.is_pinned} className="hidden"
                    onChange={e => setForm(f => ({ ...f, is_pinned: e.target.checked }))} />
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest group-hover:text-amber-600">Pin Post</span>
                </label>

                <label className="flex items-center gap-2.5 p-2.5 bg-slate-50/80 border border-slate-100 rounded-xl cursor-pointer hover:bg-white hover:border-blue-200 transition-all group">
                  <div className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all ${form.is_public ? 'bg-blue-500 border-blue-600' : 'bg-white border-slate-300'}`}>
                    {form.is_public && <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/></svg>}
                  </div>
                  <input type="checkbox" checked={form.is_public} className="hidden"
                    onChange={e => setForm(f => ({ ...f, is_public: e.target.checked }))} />
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest group-hover:text-blue-600">Public Access</span>
                </label>
              </div>

              <div className="flex gap-2.5 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="flex-[2.5] bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-black py-3 rounded-2xl shadow-xl shadow-indigo-100 transition-all active:scale-[0.98] text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2">
                  {saving ? (
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  ) : isEditing ? 'Update Broadcast' : 'Deploy Post'}
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
                {selected.is_public && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">🌐 Public Website</span>
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
                {selected.event_date && (
                  <>
                    <span>·</span>
                    <span>
                      Event: {new Date(selected.event_date).toLocaleDateString()}
                      {selected.end_date && ` - ${new Date(selected.end_date).toLocaleDateString()}`}
                    </span>
                  </>
                )}
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
