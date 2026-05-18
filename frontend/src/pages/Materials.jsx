import { useState, useEffect, useMemo } from 'react';
import api, { ROOT_URL } from '../utils/api';
import { getUser } from '../utils/auth';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

const GRADE_LEVEL_ORDER = ['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];

const MATERIAL_TYPE_CONFIG = {
  dlp:        { label: 'Daily Lesson Plan (DLP)',    color: 'bg-purple-100 text-purple-700 border-purple-200', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  dll:        { label: 'Daily Lesson Log (DLL)',     color: 'bg-blue-100 text-blue-700 border-blue-200',       icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
  module:     { label: 'Learning Module',            color: 'bg-green-100 text-green-700 border-green-200',    icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
  activity:   { label: 'Learning Activity Sheet',    color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' },
  assessment: { label: 'Assessment Material',        color: 'bg-red-100 text-red-700 border-red-200',          icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
  other:      { label: 'Other',                      color: 'bg-gray-100 text-gray-700 border-gray-200',       icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z' },
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
    return path.startsWith('http') ? path : `${ROOT_URL}${path}`;
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Learning Materials</h1>
          <p className="text-gray-500 mt-1">Repository for lesson plans, modules, and learning resources</p>
        </div>
        {canManage && (
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 bg-[#2D1B4D] hover:bg-[#3D2B5D] text-white font-medium py-2.5 px-5 rounded-xl transition-all shadow-sm hover:shadow-md"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Upload Material
          </button>
        )}
      </div>

      {/* Filters & Search */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative md:col-span-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input 
              type="text" 
              placeholder="Search materials..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchMaterials()}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm" 
            />
          </div>
          
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm bg-gray-50/50"
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
            className="px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm bg-gray-50/50"
          >
            <option value="all">All Types</option>
            {Object.entries(MATERIAL_TYPE_CONFIG).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>

          <select
            value={quarterFilter}
            onChange={(e) => setQuarterFilter(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm bg-gray-50/50"
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
          <p className="text-gray-500 animate-pulse">Loading materials...</p>
        </div>
      ) : materials.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-20 text-center">
          <div className="w-20 h-20 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">No Materials Found</h3>
          <p className="text-gray-500 max-w-xs mx-auto">We couldn't find any learning materials matching your current filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {materials.map((material) => {
            const config = MATERIAL_TYPE_CONFIG[material.material_type] || MATERIAL_TYPE_CONFIG.other;
            return (
              <div key={material.id} className="group bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-xl hover:shadow-purple-500/5 transition-all duration-300 relative">
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
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        title="Delete Material"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>

                <h3 className="text-lg font-bold text-gray-800 mb-2 group-hover:text-purple-600 transition-colors line-clamp-1">
                  {material.title}
                </h3>
                
                {material.description && (
                  <p className="text-sm text-gray-500 mb-4 line-clamp-2 min-h-[2.5rem]">
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
                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded-md border border-purple-100">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 002 2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      General Resource (Public)
                    </div>
                  )}
                  {material.quarter && (
                    <div className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md">
                      Q{material.quarter}
                    </div>
                  )}
                  {material.week && (
                    <div className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
                      Week {material.week}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white text-[10px] font-bold">
                      {(material.uploaded_by_name || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-gray-700 leading-none">{material.uploaded_by_name}</span>
                      <span className="text-[9px] text-gray-400 mt-1">{new Date(material.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  {material.file ? (
                    <a
                      href={getFileUrl(material.file)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-bold py-1.5 px-3 rounded-lg transition-all shadow-sm shadow-purple-200"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Download
                    </a>
                  ) : (
                    <span className="text-[10px] font-medium text-gray-300 italic">No file attached</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[100] p-4 transition-all duration-300">
          <div className="bg-white rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] w-full max-w-lg max-h-[90vh] flex flex-col animate-in fade-in zoom-in duration-300 border border-gray-100/50">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">Upload Learning Material</h2>
                <p className="text-[10px] font-bold text-gray-400 mt-0.5 uppercase tracking-widest">Share resources with your classes</p>
              </div>
              <button 
                onClick={() => setShowUploadModal(false)} 
                className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-all duration-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleUpload} className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
              {/* Title Field */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-0.5">
                  Title <span className="text-purple-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Advanced Calculus - Unit 1"
                  value={newMaterial.title}
                  onChange={(e) => setNewMaterial({ ...newMaterial, title: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 text-sm text-gray-700 transition-all placeholder:text-gray-400"
                />
              </div>

              {/* Description Field */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-0.5">Description</label>
                <textarea
                  rows={2}
                  placeholder="Describe the learning objectives or content..."
                  value={newMaterial.description}
                  onChange={(e) => setNewMaterial({ ...newMaterial, description: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 text-sm text-gray-700 transition-all placeholder:text-gray-400 resize-none"
                />
              </div>

              {/* Material Type & Access Level Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-0.5">Material Type</label>
                  <div className="relative group">
                    <select
                      value={newMaterial.material_type}
                      onChange={(e) => setNewMaterial({ ...newMaterial, material_type: e.target.value })}
                      className="appearance-none w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 text-sm text-gray-700 transition-all cursor-pointer"
                    >
                      {Object.entries(MATERIAL_TYPE_CONFIG).map(([k, v]) => (
                        <option key={k} value={k}>{v.label}</option>
                      ))}
                    </select>
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 group-hover:text-gray-600 transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-0.5">Access Level</label>
                  <div className="relative group">
                    <select
                      value={newMaterial.classroom}
                      onChange={(e) => setNewMaterial({ ...newMaterial, classroom: e.target.value })}
                      className="appearance-none w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 text-sm text-gray-700 transition-all cursor-pointer"
                    >
                      <option value="">No specific class</option>
                      {sortedClassrooms.map((cls) => (
                        <option key={cls.id} value={cls.id}>{cls.name}</option>
                      ))}
                    </select>
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 group-hover:text-gray-600 transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-0.5">Quarter</label>
                  <div className="relative group">
                    <select
                      value={newMaterial.quarter}
                      onChange={(e) => setNewMaterial({ ...newMaterial, quarter: e.target.value })}
                      className="appearance-none w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 text-sm text-gray-700 transition-all cursor-pointer"
                    >
                      <option value="">Select Quarter</option>
                      <option value="1">Quarter 1</option>
                      <option value="2">Quarter 2</option>
                      <option value="3">Quarter 3</option>
                      <option value="4">Quarter 4</option>
                    </select>
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 group-hover:text-gray-600 transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-0.5">Week Number</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    placeholder="e.g., 1"
                    value={newMaterial.week}
                    onChange={(e) => setNewMaterial({ ...newMaterial, week: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 text-sm text-gray-700 transition-all placeholder:text-gray-400"
                  />
                </div>
              </div>

              {/* Dropzone */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-0.5">
                  File Attachment <span className="text-purple-500">*</span>
                </label>
                <div className="relative group">
                  <input
                    type="file"
                    required
                    onChange={(e) => setNewMaterial({ ...newMaterial, file: e.target.files[0] })}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className={`w-full px-6 py-6 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center transition-all duration-300 
                    ${newMaterial.file 
                      ? 'border-purple-500 bg-purple-50/40' 
                      : 'border-gray-200 bg-slate-50/50 group-hover:border-purple-400 group-hover:bg-purple-50/30'}`}
                  >
                    <div className={`p-2.5 rounded-xl shadow-sm mb-2 transition-all duration-300 
                      ${newMaterial.file ? 'bg-purple-600 text-white' : 'bg-white text-purple-500 group-hover:scale-110'}`}
                    >
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
                    <p className="text-[10px] text-gray-400 mt-1 font-medium">
                      Supported formats: PDF, DOCX, PPTX, or Images
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="flex-1 px-6 py-3 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all active:scale-95"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-[1.5] bg-[#4F46E5] text-white rounded-xl hover:bg-[#4338CA] font-bold text-sm py-3 transition-all shadow-lg shadow-indigo-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Publishing...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      <span>Publish Material</span>
                    </>
                  )}
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
