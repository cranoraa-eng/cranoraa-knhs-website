import { useState, useEffect } from 'react';
import api from '../utils/api';
import Swal from 'sweetalert2';

const WebsiteContentManagement = () => {
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSection, setNewSection] = useState({
    category: 'home',
    section: '',
    content: ''
  });

  const categories = [
    { id: 'all', label: 'All Content', icon: 'M4 6h16M4 10h16M4 14h16M4 18h16' },
    { id: 'home', label: 'Home Page', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { id: 'about', label: 'About Page', icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    { id: 'programs', label: 'Programs', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
    { id: 'contact', label: 'Contact', icon: 'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z' },
    { id: 'other', label: 'Other', icon: 'M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z' },
  ];

  const sectionSuggestions = {
    home: ['home_hero_title', 'home_hero_subtitle', 'home_feature_1_title', 'home_feature_1_content'],
    about: ['about_title', 'about_subtitle', 'about_mission_title', 'about_mission_content'],
    contact: ['contact_title', 'contact_subtitle', 'contact_address', 'contact_email'],
    programs: ['programs_title', 'programs_subtitle', 'programs_academic_title'],
    other: []
  };

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      const response = await api.get('/website-content/');
      setContent(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching website content:', error);
      setLoading(false);
    }
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setEditValue(item.content);
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditValue('');
  };

  const handleSave = async (id) => {
    try {
      await api.put(`/website-content/${id}/`, { content: editValue });
      Swal.fire({
        icon: 'success',
        title: 'Updated!',
        text: 'Content updated successfully.',
        timer: 1500,
        showConfirmButton: false,
      });
      setEditingId(null);
      setEditValue('');
      fetchContent();
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to update content.',
      });
    }
  };

  const handleDelete = async (id, section) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: `You are about to delete the "${section}" section. This cannot be undone!`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        await api.delete(`/website-content/${id}/`);
        Swal.fire('Deleted!', 'Section has been removed.', 'success');
        fetchContent();
      } catch (error) {
        Swal.fire('Error', 'Failed to delete section.', 'error');
      }
    }
  };

  const handleAddSection = async (e) => {
    e.preventDefault();
    if (!newSection.section || !newSection.content) {
      Swal.fire('Error', 'Please fill in all fields', 'error');
      return;
    }

    try {
      await api.post('/website-content/', newSection);
      Swal.fire({
        icon: 'success',
        title: 'Added!',
        text: 'New section added successfully.',
        timer: 1500,
        showConfirmButton: false,
      });
      setShowAddModal(false);
      setNewSection({ category: 'home', section: '', content: '' });
      fetchContent();
    } catch (error) {
      const errorMsg = error.response?.data?.section ? 'This section name already exists.' : 'Failed to add section.';
      Swal.fire('Error', errorMsg, 'error');
    }
  };

  const filteredContent = content.filter(item => {
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
    const matchesSearch = item.section.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const groupedContent = filteredContent.reduce((acc, item) => {
    const cat = item.category_display || 'Other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-full">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8 gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Mini Website Editor</h1>
          <p className="text-gray-500 mt-1">Customize your public portal's content in real-time</p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center bg-purple-600 hover:bg-purple-700 text-white font-bold py-2.5 px-5 rounded-xl transition-all shadow-lg shadow-purple-200 active:scale-95"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add New Content
          </button>
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center bg-white border border-gray-200 text-gray-700 font-bold py-2.5 px-5 rounded-xl hover:bg-gray-50 transition-all shadow-sm active:scale-95"
          >
            <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Live Site
          </a>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-8 flex flex-col md:flex-row gap-4">
        <div className="relative flex-grow">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Search by section name or content..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl leading-5 bg-gray-50 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all sm:text-sm"
          />
        </div>
        <div className="flex overflow-x-auto gap-2 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center whitespace-nowrap px-4 py-2 rounded-xl font-bold transition-all ${
                activeCategory === cat.id
                  ? 'bg-purple-100 text-purple-700 ring-1 ring-purple-300'
                  : 'bg-white text-gray-500 hover:bg-gray-50'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content List */}
      <div className="space-y-10">
        {Object.entries(groupedContent).length > 0 ? (
          Object.entries(groupedContent).map(([categoryName, items]) => (
            <div key={categoryName} className="animate-fadeIn">
              <div className="flex items-center mb-6">
                <div className="h-px bg-gray-200 flex-grow"></div>
                <h2 className="px-4 text-sm font-black text-gray-400 uppercase tracking-widest">
                  {categoryName}
                </h2>
                <div className="h-px bg-gray-200 flex-grow"></div>
              </div>
              
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {items.map((item) => (
                  <div key={item.id} className="group bg-white rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl hover:border-purple-100 transition-all duration-300 overflow-hidden">
                    <div className="px-6 py-4 bg-gray-50/50 border-b border-gray-100 flex justify-between items-center group-hover:bg-purple-50/30 transition-colors">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center mr-3">
                          <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </div>
                        <h3 className="font-bold text-gray-800 text-sm">
                          {item.section_display || item.section}
                        </h3>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {editingId === item.id ? (
                          <>
                            <button onClick={() => handleSave(item.id)} className="p-2 text-green-600 hover:bg-green-100 rounded-xl transition-colors">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </button>
                            <button onClick={handleCancel} className="p-2 text-gray-400 hover:bg-gray-100 rounded-xl transition-colors">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => handleEdit(item)} className="p-2 text-purple-600 hover:bg-purple-100 rounded-xl transition-colors">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                            </button>
                            <button onClick={() => handleDelete(item.id, item.section)} className="p-2 text-red-400 hover:bg-red-50 rounded-xl transition-colors">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="p-6">
                      {editingId === item.id ? (
                        <textarea
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="w-full px-4 py-3 border-2 border-purple-100 rounded-2xl focus:outline-none focus:border-purple-500 transition-colors bg-purple-50/20"
                          rows={item.content.length > 100 ? 8 : 4}
                          autoFocus
                        />
                      ) : (
                        <p className="text-gray-600 whitespace-pre-wrap leading-relaxed min-h-[4rem]">
                          {item.content || <span className="text-gray-300 italic">Empty section</span>}
                        </p>
                      )}
                      <div className="mt-6 pt-4 border-t border-gray-50 flex items-center text-[11px] font-bold text-gray-400 uppercase tracking-tighter">
                        <span className="mr-auto">{item.section}</span>
                        {item.updated_by_name && (
                          <span className="bg-gray-100 px-2 py-0.5 rounded-md">{item.updated_by_name}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-100">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-800">No content found</h3>
            <p className="text-gray-500">Try adjusting your search or category filters</p>
          </div>
        )}
      </div>

      {/* Add Section Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-xl overflow-hidden animate-slideUp">
            <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-purple-50/30">
              <div>
                <h2 className="text-2xl font-black text-gray-900">Add New Section</h2>
                <p className="text-sm text-purple-600 font-bold">Expand your website's content</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-white rounded-full transition-colors shadow-sm">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleAddSection} className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase mb-2 tracking-widest">Category</label>
                  <select
                    value={newSection.category}
                    onChange={(e) => setNewSection({ ...newSection, category: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none font-bold text-gray-700"
                  >
                    {categories.filter(c => c.id !== 'all').map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase mb-2 tracking-widest">Section Key</label>
                  <input
                    list="section-suggestions"
                    placeholder="e.g. about_history"
                    value={newSection.section}
                    onChange={(e) => setNewSection({ ...newSection, section: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none font-bold text-gray-700"
                  />
                  <datalist id="section-suggestions">
                    {sectionSuggestions[newSection.category]?.map(s => (
                      <option key={s} value={s} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-gray-400 uppercase mb-2 tracking-widest">Content Text</label>
                <textarea
                  placeholder="Enter the text that will appear on the website..."
                  value={newSection.content}
                  onChange={(e) => setNewSection({ ...newSection, content: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none font-bold text-gray-700"
                  rows={6}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-grow py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold rounded-2xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-grow py-3.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-2xl shadow-lg shadow-purple-200 transition-all active:scale-95"
                >
                  Create Section
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default WebsiteContentManagement;
