import { useState, useEffect, useCallback } from 'react';
import api, { MEDIA_ROOT } from '../utils/api';
import { getUser } from '../utils/auth';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import { useScrollLock } from '../hooks/useScrollLock';
import PostComposerModal from '../components/announcements/PostComposerModal';
import AnnouncementCommentsPanel from '../components/announcements/AnnouncementCommentsPanel';
import PostMediaCarousel from '../components/announcements/PostMediaCarousel';

const CATEGORY_CONFIG = {
  general:       { label: 'General',       color: 'bg-slate-50 text-slate-700 border-slate-200' },
  academic:      { label: 'Academic',      color: 'bg-slate-50 text-slate-700 border-slate-200' },
  events:        { label: 'Events',        color: 'bg-slate-50 text-slate-700 border-slate-200' },
  emergency:     { label: 'Emergency',     color: 'bg-red-50 text-red-700 border-red-200' },
  holiday:       { label: 'Holiday',       color: 'bg-slate-50 text-slate-700 border-slate-200' },
  system_update: { label: 'System Update', color: 'bg-slate-50 text-slate-700 border-slate-200' },
};

const STATUS_CONFIG = {
  draft:   { label: 'Draft',   color: 'bg-slate-100 text-slate-600 border-slate-200' },
  live:    { label: 'Live',    color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  expired: { label: 'Expired', color: 'bg-red-50 text-red-700 border-red-200' },
};

const formatFeedTime = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
};

const getFeedMedia = (announcement, attachUrlFn) => {
  const items = [];
  if (announcement.attachments?.length) {
    announcement.attachments.forEach((att) => {
      if (att.url) {
        items.push({
          url: attachUrlFn(att.url),
          filename: att.filename || 'File',
          is_image: att.is_image,
        });
      }
    });
  }
  if (items.length === 0 && announcement.attachment_url) {
    const url = attachUrlFn(announcement.attachment_url);
    items.push({
      url,
      filename: 'Attachment',
      is_image: /\.(jpg|jpeg|png|gif|webp)$/i.test(url),
    });
  }
  return items;
};

const shouldClampContent = (text) => (text || '').length > 280;

const EMPTY_FORM = {
  title: '', category: 'general', priority: 'info', status: 'live',
  target_audience: 'all', target_classrooms: [], content: '', is_pinned: false, is_public: false,
  event_date: '', end_date: '', attachments: [],
};

const Announcements = () => {
  const user = getUser();
  const canManage = user?.role === 'admin' || user?.role === 'teacher';
  const canComment = ['student', 'teacher', 'admin'].includes(user?.role);

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
  const [zoomGallery, setZoomGallery]     = useState(null);

  const [selectedIds, setSelectedIds]     = useState([]);
  const [processing, setProcessing]       = useState(false);
  const [liveCommentCount, setLiveCommentCount] = useState(0);

  useScrollLock(showModal || showView || zoomGallery);

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
        } else if (typeof v === 'boolean') {
          fd.append(k, v ? 'true' : 'false');
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

  const attachUrl = (url) => url?.startsWith('http') ? url : `${MEDIA_ROOT}${url}`;

  const openImageZoom = (mediaItems, startIndex = 0) => {
    const images = mediaItems.filter((m) => m.is_image).map((m) => m.url);
    if (!images.length) return;
    const imageIndex = mediaItems.slice(0, startIndex + 1).filter((m) => m.is_image).length - 1;
    setZoomGallery({
      urls: images,
      index: Math.max(0, Math.min(imageIndex, images.length - 1)),
    });
  };

  const pinned = announcements.filter(a => a.is_pinned);
  const regular = announcements.filter(a => !a.is_pinned);
  const sorted = [...pinned, ...regular];

  const openPost = (a) => {
    setSelected(a);
    setLiveCommentCount(a.comment_count || 0);
    setShowView(true);
    if (!a.is_read) handleRead(a);
  };

  const handleCommentCountChange = useCallback((count) => {
    setLiveCommentCount(count);
    if (selected?.id) {
      setAnnouncements((prev) =>
        prev.map((item) => (item.id === selected.id ? { ...item, comment_count: count } : item))
      );
      setSelected((s) => (s ? { ...s, comment_count: count } : s));
    }
  }, [selected?.id]);

  const authorInitial = (name) => (name || 'S').charAt(0).toUpperCase();

  return (
    <div className="animate-fade-in page-bottom-safe min-h-0 -mx-3 md:-mx-6 bg-[#f0f2f5]">
      {/* DepEd Official Header */}
      <div className="bg-white border-b-4 border-blue-600 px-4 md:px-6 py-3 md:py-4 mb-3 md:mb-4">
        <div className="max-w-[680px] mx-auto flex items-center gap-3">
          <div className="h-10 w-10 md:h-12 md:w-12 rounded-md bg-blue-600 flex items-center justify-center shrink-0">
            <svg className="w-6 h-6 md:w-7 md:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg md:text-2xl font-extrabold text-slate-900 uppercase tracking-tight">
              School Announcements
            </h1>
            <p className="text-xs md:text-sm font-bold text-blue-700 uppercase tracking-wide mt-0.5">
              Official News & Updates
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-[680px] mx-auto space-y-3 md:space-y-4 px-3 md:px-6 py-3 md:py-4">
        {/* Search & filters — compact feed toolbar */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200/80 p-3 space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"
                fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search posts…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-100 border-0 rounded-full text-sm text-slate-800 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:bg-white transition-all"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="px-4 py-2 bg-slate-100 border-0 rounded-full text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30 cursor-pointer"
            >
              <option value="all">All posts</option>
              {Object.entries(CATEGORY_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>

          {canManage && sorted.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
              <label className="flex items-center gap-2 cursor-pointer no-min font-semibold text-slate-600">
                <input
                  type="checkbox"
                  checked={selectedIds.length === sorted.length && sorted.length > 0}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                {selectedIds.length === sorted.length ? 'Deselect all' : 'Select all'}
              </label>
              {selectedIds.length > 0 && (
                <button
                  onClick={handleBulkDelete}
                  className="px-3 py-1 rounded-full bg-red-50 text-red-600 font-semibold hover:bg-red-100 transition-colors no-min"
                >
                  Delete ({selectedIds.length})
                </button>
              )}
              {user?.role === 'admin' && (
                <button
                  onClick={handleDeleteAll}
                  className="ml-auto text-red-500 font-semibold hover:underline no-min"
                >
                  Delete all
                </button>
              )}
            </div>
          )}
        </div>

        {/* Composer — Facebook "What's on your mind?" */}
        {canManage && (
          <div className="bg-white rounded-lg shadow-sm border border-slate-200/80 p-3 md:p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                {authorInitial(user?.full_name || user?.username)}
              </div>
              <button
                type="button"
                onClick={openCreate}
                className="flex-1 text-left px-4 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200/80 text-slate-500 text-sm font-medium transition-colors"
              >
                What would you like to announce?
              </button>
            </div>
            <div className="flex items-center justify-around mt-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={openCreate}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-50 text-sm font-semibold transition-colors no-min"
              >
                <span className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </span>
                Photo
              </button>
              <button
                type="button"
                onClick={openCreate}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-50 text-sm font-semibold transition-colors no-min"
              >
                <span className="w-6 h-6 rounded-full bg-rose-100 flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                  </svg>
                </span>
                Announce
              </button>
            </div>
          </div>
        )}

        {/* Feed posts */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm p-4 animate-pulse">
                <div className="flex gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-slate-200" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-28 bg-slate-200 rounded" />
                    <div className="h-2 w-16 bg-slate-100 rounded" />
                  </div>
                </div>
                <div className="h-4 w-full bg-slate-100 rounded mb-2" />
                <div className="h-4 w-4/5 bg-slate-100 rounded" />
                <div className="h-48 w-full bg-slate-100 rounded-lg mt-4" />
              </div>
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-slate-200/80">
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                <svg className="w-7 h-7 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-slate-800 mb-1">No posts in your feed</h3>
              <p className="text-sm text-slate-500">School updates will show up here when they are published.</p>
              {canManage && (
                <button
                  type="button"
                  onClick={openCreate}
                  className="mt-4 px-5 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
                >
                  Create first post
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-3 md:space-y-4">
            {sorted.map(a => {
              const cat = CATEGORY_CONFIG[a.category] || CATEGORY_CONFIG.general;
              const stat = STATUS_CONFIG[a.status] || STATUS_CONFIG.draft;
              const isSelected = selectedIds.includes(a.id);
              const feedMedia = getFeedMedia(a, attachUrl);
              const clamped = shouldClampContent(a.content);

              return (
                <article
                  key={a.id}
                  className={`bg-white rounded-lg shadow-sm border border-slate-200/80 overflow-hidden transition-shadow hover:shadow-md
                    ${a.priority === 'critical' ? 'ring-2 ring-red-200 ring-offset-0' : ''}
                    ${isSelected ? 'ring-2 ring-blue-400' : ''}`}
                >
                  {/* Post header — avatar, name, time */}
                  <div className="px-3 md:px-4 pt-3 md:pt-4 pb-2 flex items-start gap-2">
                    {canManage && (
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(a.id)}
                        className="mt-2.5 w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer shrink-0"
                      />
                    )}
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                      {authorInitial(a.author_name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-[15px] font-semibold text-slate-900 leading-tight truncate">
                            {a.author_name || 'School Admin'}
                          </p>
                          <p className="text-xs text-slate-500 flex flex-wrap items-center gap-1 mt-0.5">
                            <span>{formatFeedTime(a.created_at)}</span>
                            <span aria-hidden="true">·</span>
                            <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold border ${cat.color}`}>
                              {cat.label}
                            </span>
                            {a.is_pinned && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="text-amber-600 font-semibold">Pinned</span>
                              </>
                            )}
                          </p>
                        </div>
                        {canManage && (
                          <div className="flex items-center gap-0.5 shrink-0">
                            <button onClick={() => handlePin(a)} title={a.is_pinned ? 'Unpin' : 'Pin'}
                              className={`p-2 rounded-full transition-colors no-min ${a.is_pinned ? 'text-amber-600 bg-amber-50' : 'text-slate-500 hover:bg-slate-100'}`}>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                              </svg>
                            </button>
                            {a.status === 'draft' && (
                              <button onClick={() => handlePublish(a)} title="Publish"
                                className="p-2 rounded-full text-emerald-600 hover:bg-emerald-50 no-min">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </button>
                            )}
                            {a.status === 'live' && (
                              <button onClick={() => handleArchive(a)} title="Archive"
                                className="p-2 rounded-full text-amber-600 hover:bg-amber-50 no-min">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                                </svg>
                              </button>
                            )}
                            <button onClick={() => openEdit(a)} title="Edit"
                              className="p-2 rounded-full text-slate-500 hover:bg-slate-100 no-min">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button onClick={() => handleDelete(a)} title="Delete"
                              className="p-2 rounded-full text-slate-500 hover:bg-red-50 hover:text-red-600 no-min">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        )}
                      </div>
                      {(a.priority === 'critical' || a.is_public || stat.label !== 'Live') && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {a.priority === 'critical' && (
                            <span className="px-2 py-0.5 rounded-full bg-red-50 text-red-700 text-[10px] font-bold uppercase">Urgent</span>
                          )}
                          {a.is_public && (
                            <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold uppercase">Public</span>
                          )}
                          {stat.label !== 'Live' && (
                            <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase ${stat.color}`}>{stat.label}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Post body */}
                  <div className="px-3 md:px-4 pb-2">
                    <h2 className="text-[17px] font-semibold text-slate-900 leading-snug mb-1.5">{a.title}</h2>
                    <p className={`text-[15px] text-slate-800 leading-relaxed whitespace-pre-wrap ${clamped ? 'line-clamp-5' : ''}`}>
                      {a.content}
                    </p>
                    {clamped && (
                      <button
                        type="button"
                        onClick={() => openPost(a)}
                        className="text-sm font-semibold text-slate-500 hover:text-blue-700 mt-1 no-min"
                      >
                        See more
                      </button>
                    )}
                  </div>

                  {feedMedia.length > 0 && (
                    <div className="border-y border-slate-100">
                      <PostMediaCarousel
                        items={feedMedia}
                        onImageClick={(_, idx) => openImageZoom(feedMedia, idx)}
                      />
                    </div>
                  )}

                  {/* Engagement stats */}
                  <div className="px-3 md:px-4 py-2 flex items-center justify-between text-xs text-slate-500 border-b border-slate-100">
                    <span className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <span className="w-4 h-4 rounded-full bg-blue-600 flex items-center justify-center">
                          <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                          </svg>
                        </span>
                        {a.read_count || 0} view{(a.read_count || 0) === 1 ? '' : 's'}
                      </span>
                      {(a.comment_count || 0) > 0 && (
                        <span>{a.comment_count} comment{(a.comment_count || 0) === 1 ? '' : 's'}</span>
                      )}
                    </span>
                  </div>

                  {/* Action bar */}
                  <div className="px-2 py-1 grid grid-cols-3 divide-x divide-slate-100">
                    <button
                      type="button"
                      onClick={() => openPost(a)}
                      className="flex items-center justify-center gap-2 py-2.5 rounded-lg text-slate-600 hover:bg-slate-50 text-sm font-semibold transition-colors no-min"
                    >
                      <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      View
                    </button>
                    <button
                      type="button"
                      onClick={() => openPost(a)}
                      className="flex items-center justify-center gap-2 py-2.5 rounded-lg text-slate-600 hover:bg-slate-50 text-sm font-semibold transition-colors no-min"
                    >
                      <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      Comment{(a.comment_count || 0) > 0 ? ` (${a.comment_count})` : ''}
                    </button>
                    <button
                      type="button"
                      onClick={() => { navigator.clipboard?.writeText(window.location.origin + `/announcements/${a.id}`).catch(() => {}); toast.success('Link copied'); }}
                      className="flex items-center justify-center gap-2 py-2.5 rounded-lg text-slate-600 hover:bg-slate-50 text-sm font-semibold transition-colors no-min"
                    >
                      <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                      </svg>
                      Share
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {canManage && (
        <PostComposerModal
          open={showModal}
          onClose={() => setShowModal(false)}
          form={form}
          setForm={setForm}
          isEditing={isEditing}
          saving={saving}
          onSubmit={handleSave}
          classrooms={classrooms}
          authorInitial={authorInitial(user?.full_name || user?.username)}
          existingAttachments={
            isEditing && selected?.attachments
              ? selected.attachments.map((att) => ({
                  ...att,
                  url: attachUrl(att.url),
                }))
              : []
          }
          onRemoveExistingAttachment={isEditing ? handleDeleteAttachment : undefined}
        />
      )}


      {/* ── View Modal ── */}
      {showView && selected && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-slate-200/60 animate-in zoom-in-95 duration-300 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-50/60 border-b border-slate-200/60 flex-shrink-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider ${(CATEGORY_CONFIG[selected.category] || CATEGORY_CONFIG.general).color}`}>
                  {(CATEGORY_CONFIG[selected.category] || CATEGORY_CONFIG.general).label}
                </span>
                {selected.priority === 'critical' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 text-[10px] font-bold uppercase tracking-wider">Critical</span>
                )}
                {selected.is_public && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-50 text-slate-700 border border-slate-200 text-[10px] font-bold uppercase tracking-wider">Public</span>
                )}
                {selected.is_pinned && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-50 text-slate-700 border border-slate-200 text-[10px] font-bold uppercase tracking-wider">Pinned</span>
                )}
              </div>
              <button
                onClick={() => setShowView(false)}
                className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all no-min"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-1">{selected.title}</h2>
              <div className="flex items-center gap-3 mb-5 text-xs text-slate-400">
                <span>By {selected.author_name || 'Admin'}</span>
                <span>·</span>
                <span>{new Date(selected.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                {selected.event_date && (
                  <>
                    <span>·</span>
                    <span>
                      Event: {new Date(selected.event_date).toLocaleDateString()}
                      {selected.end_date && ` – ${new Date(selected.end_date).toLocaleDateString()}`}
                    </span>
                  </>
                )}
              </div>
              <div className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">{selected.content}</div>

              {(() => {
                const detailMedia = getFeedMedia(selected, attachUrl);
                if (detailMedia.length === 0) return null;
                return (
                  <div className="mt-5 rounded-xl border border-slate-200 overflow-hidden">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 pt-3 pb-2 bg-slate-50">
                      Attachments ({detailMedia.length})
                    </p>
                    <PostMediaCarousel
                      items={detailMedia}
                      maxHeight="360px"
                      className="rounded-b-xl"
                      onImageClick={(_, idx) => openImageZoom(detailMedia, idx)}
                    />
                  </div>
                );
              })()}

              <AnnouncementCommentsPanel
                announcementId={selected.id}
                canComment={canComment}
                currentUserId={user?.id}
                currentUserRole={user?.role}
                initialCount={liveCommentCount}
                onCountChange={handleCommentCountChange}
              />
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end shrink-0">
              <button type="button" onClick={() => setShowView(false)}
                className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors text-sm">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Image zoom (with carousel when multiple images) ── */}
      {zoomGallery && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-[110] p-4"
          onClick={() => setZoomGallery(null)}
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            onClick={() => setZoomGallery(null)}
            className="absolute top-4 right-4 z-20 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 no-min"
            aria-label="Close"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {zoomGallery.urls.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setZoomGallery((g) => ({
                    ...g,
                    index: (g.index - 1 + g.urls.length) % g.urls.length,
                  }));
                }}
                className="absolute left-3 md:left-6 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-white/15 text-white border border-white/30 flex items-center justify-center hover:bg-white/25 no-min"
                aria-label="Previous image"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setZoomGallery((g) => ({
                    ...g,
                    index: (g.index + 1) % g.urls.length,
                  }));
                }}
                className="absolute right-3 md:right-6 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-white/15 text-white border border-white/30 flex items-center justify-center hover:bg-white/25 no-min"
                aria-label="Next image"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <span className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 px-3 py-1 rounded-full bg-black/50 text-white text-sm font-semibold tabular-nums">
                {zoomGallery.index + 1} / {zoomGallery.urls.length}
              </span>
            </>
          )}

          <img
            src={zoomGallery.urls[zoomGallery.index]}
            alt=""
            className="max-w-full max-h-full object-contain pointer-events-none"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};

export default Announcements;

