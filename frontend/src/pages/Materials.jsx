import { useState, useEffect, useMemo } from 'react';
import api from '../utils/api';
import { getUser } from '../utils/auth';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import { LoadingSpinner, Button, EmptyState } from '../components/ui';

const GRADE_LEVEL_ORDER = ['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];

const MATERIAL_TYPE_CONFIG = {
  dlp:        { label: 'Daily Lesson Plan (DLP)',    color: 'bg-violet-100 text-violet-700 border-violet-200', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  dll:        { label: 'Daily Lesson Log (DLL)',     color: 'bg-violet-100 text-violet-700 border-violet-200',       icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
  module:     { label: 'Learning Module',            color: 'bg-green-100 text-green-700 border-green-200',    icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
  activity:   { label: 'Learning Activity Sheet',    color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' },
  assessment: { label: 'Assessment Material',        color: 'bg-red-100 text-red-700 border-red-200',          icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
  other:      { label: 'Other',                      color: 'bg-slate-100 text-slate-700 border-slate-200',       icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z' },
};

const EMPTY_FORM = {
  title: '',
  description: '',
  material_type: 'dlp',
  classroom: '',
  quarter: '',
  week: '',
  file: null
};

const Materials = () => {
  const [materials, setMaterials] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState('');
  const [materialTypeFilter, setMaterialTypeFilter] = useState('all');
  const [quarterFilter, setQuarterFilter] = useState('all');
  const [newMaterial, setNewMaterial] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const user = getUser();
  const canManage = user?.role === 'admin' || user?.role === 'teacher';

  const sortedClassrooms = useMemo(() => {
    return [...classrooms].sort((a, b) => {
      const getGrade = (name) => GRADE_LEVEL_ORDER.find(g => name.toLowerCase().includes(g.toLowerCase())) || '';
      const gradeA = getGrade(a.name);
      const gradeB = getGrade(b.name);
      const indexA = GRADE_LEVEL_ORDER.indexOf(gradeA);
      const indexB = GRADE_LEVEL_ORDER.indexOf(gradeB);
      if (indexA === -1 && indexB === -1) return a.name.localeCompare(b.name);
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB || a.name.localeCompare(b.name);
    });
  }, [classrooms]);

  useEffect(() => {
    fetchMaterials();
    fetchClassrooms();
  }, [selectedClass, materialTypeFilter, quarterFilter]);

  const fetchMaterials = async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedClass) params.classroom = selectedClass;
      if (materialTypeFilter !== 'all') params.material_type = materialTypeFilter;
      if (quarterFilter !== 'all') params.quarter = quarterFilter;
      if (searchQuery) params.search = searchQuery;
      
      const response = await api.get('/materials/', { params });
      setMaterials(response.data);
    } catch (err) {
      toast.error('Failed to load materials');
    } finally {
      setLoading(false);
    }
  };

  const fetchClassrooms = async () => {
    try {
      const response = await api.get('/classrooms/');
      setClassrooms(response.data);
    } catch (err) {
      console.error('Failed to fetch classrooms:', err);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!newMaterial.title.trim() || !newMaterial.file) {
      return toast.error('Title and file are required');
    }

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('title', newMaterial.title);
      formData.append('description', newMaterial.description);
      formData.append('material_type', newMaterial.material_type);
      if (newMaterial.classroom) formData.append('classroom', newMaterial.classroom);
      if (newMaterial.quarter) formData.append('quarter', newMaterial.quarter);
      if (newMaterial.week) formData.append('week', newMaterial.week);
      formData.append('file', newMaterial.file);
      
      await api.post('/materials/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      toast.success('Material uploaded successfully');
      setNewMaterial(EMPTY_FORM);
      setShowUploadModal(false);
      fetchMaterials();
    } catch (err) {
      console.error('Failed to upload material:', err);
      toast.error(err.response?.data?.error || 'Failed to upload material');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (material) => {
    const result = await Swal.fire({
      title: 'Delete Material?',
      text: `Are you sure you want to delete "${material.title}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Delete'
    });

    if (result.isConfirmed) {
      try {
        await api.delete(`/materials/${material.id}/`);
        toast.success('Material deleted');
        fetchMaterials();
      } catch (err) {
        toast.error('Failed to delete material');
      }
    }
  };

  const getFileUrl = (path) => {
    if (!path) return '#';
    // Files are now Supabase URLs (absolute). Legacy local paths are no longer generated.
    return path.startsWith('http') ? path : `${import.meta.env.VITE_API_URL?.replace('/api', '') || ''}${path}`;
  };

  return (
    <div className="page-bottom-safe">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Learning Materials</h1>
          <p className="text-slate-500 mt-1">Repository for lesson plans, modules, and learning resources</p>
        </div>
        {canManage && (
          <Button onClick={() => setShowUploadModal(true)} variant="primary">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Upload Material
          </Button>
        )}
      </div>

      {/* Filters & Search */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 md:p-5 mb-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="relative col-span-2 md:col-span-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input 
              type="text" 
              placeholder="Search materials..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchMaterials()}
              className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm" 
            />
          </div>
          
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm bg-slate-50/50"
          >
            <option value="">All Classes</option>
            <option value="null">General Materials</option>
            {sortedClassrooms.map(cls => (
              <option key={cls.id} value={cls.id}>{cls.name}</option>
            ))}
          </select>

          <select
            value={materialTypeFilter}
            onChange={(e) => setMaterialTypeFilter(e.target.value)}
            className="px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm bg-slate-50/50"
          >
            <option value="all">All Types</option>
            {Object.entries(MATERIAL_TYPE_CONFIG).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>

          <select
            value={quarterFilter}
            onChange={(e) => setQuarterFilter(e.target.value)}
            className="px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm bg-slate-50/50"
          >
            <option value="all">All Quarters</option>
            <option value="1">Quarter 1</option>
            <option value="2">Quarter 2</option>
            <option value="3">Quarter 3</option>
            <option value="4">Quarter 4</option>
          </select>
        </div>
      </div>

      {/* Materials Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center h-64">
          <LoadingSpinner />
          <p className="text-slate-500 animate-pulse mt-4">Loading materials...</p>
        </div>
      ) : materials.length === 0 ? (
        <EmptyState
          icon={
            <svg className="w-10 h-10 text-violet-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
          }
          title="No Materials Found"
          message="We couldn't find any learning materials matching your current filters."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {materials.map((material) => {
            const config = MATERIAL_TYPE_CONFIG[material.material_type] || MATERIAL_TYPE_CONFIG.other;
            return (
              <div key={material.id} className="group bg-white border border-slate-100 rounded-2xl p-5 hover:shadow-xl hover:shadow-violet-500/5 transition-all duration-300 relative">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-2.5 rounded-xl ${config.color.split(' ')[0]} ${config.color.split(' ')[1]}`}>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={config.icon} />
                    </svg>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg border ${config.color}`}>
                      {config.label.split(' (')[0]}
                    </span>
                    {canManage && (
                      <button
                        onClick={() => handleDelete(material)}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        title="Delete Material"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>

                <h3 className="text-lg font-bold text-slate-800 mb-2 group-hover:text-violet-600 transition-colors line-clamp-1">
                  {material.title}
                </h3>
                
                {material.description && (
                  <p className="text-sm text-slate-500 mb-4 line-clamp-2 min-h-[2.5rem]">
                    {material.description}
                  </p>
                )}

                <div className="flex flex-wrap gap-3 mb-5">
                  {material.classroom_name ? (
                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-red-600 bg-red-50 px-2 py-1 rounded-md border border-red-100">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      {material.classroom_name} (Restricted)
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-violet-600 bg-violet-50 px-2 py-1 rounded-md border border-violet-100">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 002 2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      General Resource (Public)
                    </div>
                  )}
                  {material.quarter && (
                    <div className="text-[11px] font-bold text-violet-600 bg-violet-50 px-2 py-1 rounded-md">
                      Q{material.quarter}
                    </div>
                  )}
                  {material.week && (
                    <div className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
                      Week {material.week}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-[10px] font-bold">
                      {(material.uploaded_by_name || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-slate-700 leading-none">{material.uploaded_by_name}</span>
                      <span className="text-[9px] text-slate-400 mt-1">{new Date(material.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  {material.file ? (
                    <a
                      href={getFileUrl(material.file)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-700 text-white text-[11px] font-bold py-1.5 px-3 rounded-lg transition-all shadow-sm shadow-violet-200"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Download
                    </a>
                  ) : (
                    <span className="text-[10px] font-medium text-slate-300 italic">No file attached</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg border border-gray-300 shadow-2xl rounded-sm flex flex-col max-h-[92vh]" onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="bg-[#5e2a84] flex items-center justify-between px-5 py-3 flex-shrink-0 border-b-2 border-violet-900">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-7 h-7 rounded-full bg-white/20 border border-white/30 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                  </svg>
                </div>
                <div>
                  <h2 className="text-sm font-black text-white uppercase tracking-widest leading-none">Upload Learning Material</h2>
                  <p className="text-violet-200 text-[10px] mt-0.5 font-medium uppercase tracking-wide">Publish Educational Resource</p>
                </div>
              </div>
              <button type="button" onClick={() => setShowUploadModal(false)}
                className="ml-4 w-7 h-7 flex items-center justify-center rounded text-white/60 hover:bg-white/20 hover:text-white transition-all">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleUpload} className="flex-1 overflow-y-auto flex flex-col">
              <div className="px-6 py-5 flex-1 space-y-4">
                {/* Title Field */}
                <div>
                  <label className="block text-xs font-black text-gray-700 uppercase tracking-wider mb-1.5">
                    Title <span className="text-red-600">*</span>
                  </label>
                  <input type="text" required placeholder="e.g., Advanced Calculus - Unit 1"
                    value={newMaterial.title} onChange={(e) => setNewMaterial({ ...newMaterial, title: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-sm bg-white text-sm focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500 placeholder:text-gray-400" />
                </div>

                {/* Description Field */}
                <div>
                  <label className="block text-xs font-black text-gray-700 uppercase tracking-wider mb-1.5">Description</label>
                  <textarea rows={2} placeholder="Describe the learning objectives or content..."
                    value={newMaterial.description} onChange={(e) => setNewMaterial({ ...newMaterial, description: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-sm bg-white text-sm focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500 placeholder:text-gray-400 resize-none" />
                </div>

                {/* Material Type & Access Level Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black text-gray-700 uppercase tracking-wider mb-1.5">Material Type</label>
                    <select value={newMaterial.material_type} onChange={(e) => setNewMaterial({ ...newMaterial, material_type: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-sm bg-white text-sm focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500">
                      {Object.entries(MATERIAL_TYPE_CONFIG).map(([k, v]) => (
                        <option key={k} value={k}>{v.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-black text-gray-700 uppercase tracking-wider mb-1.5">Access Level</label>
                    <select value={newMaterial.classroom} onChange={(e) => setNewMaterial({ ...newMaterial, classroom: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-sm bg-white text-sm focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500">
                      <option value="">No specific class</option>
                      {sortedClassrooms.map((cls) => (
                        <option key={cls.id} value={cls.id}>{cls.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black text-gray-700 uppercase tracking-wider mb-1.5">Quarter</label>
                    <select value={newMaterial.quarter} onChange={(e) => setNewMaterial({ ...newMaterial, quarter: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-sm bg-white text-sm focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500">
                      <option value="">Select Quarter</option>
                      <option value="1">Quarter 1</option>
                      <option value="2">Quarter 2</option>
                      <option value="3">Quarter 3</option>
                      <option value="4">Quarter 4</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-black text-gray-700 uppercase tracking-wider mb-1.5">Week Number</label>
                    <input type="number" min="1" max="10" placeholder="e.g., 1" value={newMaterial.week}
                      onChange={(e) => setNewMaterial({ ...newMaterial, week: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-sm bg-white text-sm focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500 placeholder:text-gray-400" />
                  </div>
                </div>

                {/* Dropzone */}
                <div>
                  <label className="block text-xs font-black text-gray-700 uppercase tracking-wider mb-1.5">
                    File Attachment <span className="text-red-600">*</span>
                  </label>
                  <div className="relative group">
                    <input type="file" required onChange={(e) => setNewMaterial({ ...newMaterial, file: e.target.files[0] })}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                    <div className={`w-full px-6 py-6 border-2 border-dashed rounded flex flex-col items-center justify-center transition-all duration-300
                      ${newMaterial.file ? 'border-violet-500 bg-violet-50' : 'border-gray-300 bg-gray-50 group-hover:border-violet-400 group-hover:bg-violet-50/30'}`}>
                      <div className={`p-2.5 rounded mb-2 transition-all duration-300
                        ${newMaterial.file ? 'bg-violet-600 text-white' : 'bg-white text-violet-500 group-hover:scale-110'}`}>
                        {newMaterial.file ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                        )}
                      </div>
                      <p className="text-[13px] font-semibold text-gray-700 text-center px-4">
                        {newMaterial.file ? newMaterial.file.name : 'Click to upload or drag & drop'}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-1 font-medium">Supported formats: PDF, DOCX, PPTX, or Images</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-end gap-3 flex-shrink-0">
                <button type="button" onClick={() => setShowUploadModal(false)}
                  className="px-6 py-2.5 bg-white text-gray-700 text-xs font-black uppercase tracking-widest border border-gray-300 hover:bg-gray-100 rounded-sm">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="px-6 py-2.5 bg-[#5e2a84] text-white text-xs font-black uppercase tracking-widest hover:bg-violet-700 rounded-sm">
                  {saving ? 'Uploading...' : 'Publish Material'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Materials;
