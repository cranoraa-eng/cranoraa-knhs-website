import { useState, useEffect } from 'react';
import api from '../utils/api';
import Swal from 'sweetalert2';

const WebsiteContentManagement = () => {
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

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

  const categories = [
    { id: 'all', label: 'All Content', icon: 'M4 6h16M4 10h16M4 14h16M4 18h16' },
    { id: 'home', label: 'Home Page', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { id: 'about', label: 'About Page', icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    { id: 'programs', label: 'Programs', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
    { id: 'contact', label: 'Contact', icon: 'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z' },
  ];

  const filteredContent = activeCategory === 'all' 
    ? content 
    : content.filter(item => item.category === activeCategory);

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
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Website Content Management</h1>
          <p className="text-gray-600">Live editor for your public school website</p>
        </div>
        <div className="flex gap-2">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center bg-white border border-gray-300 text-gray-700 font-semibold py-2 px-4 rounded-lg hover:bg-gray-50 transition-all shadow-sm"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            View Live Site
          </a>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex overflow-x-auto pb-4 mb-6 gap-2 no-scrollbar">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`flex items-center whitespace-nowrap px-6 py-3 rounded-xl font-semibold transition-all shadow-sm ${
              activeCategory === cat.id
                ? 'bg-purple-600 text-white shadow-purple-200 shadow-lg scale-105'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={cat.icon} />
            </svg>
            {cat.label}
          </button>
        ))}
      </div>

      {/* Content List */}
      <div className="space-y-8">
        {Object.entries(groupedContent).map(([categoryName, items]) => (
          <div key={categoryName} className="animate-fadeIn">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <span className="w-2 h-8 bg-purple-600 rounded-full mr-3"></span>
              {categoryName}
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {items.map((item) => (
                <div key={item.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow overflow-hidden">
                  <div className="p-5 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center">
                    <h3 className="font-bold text-gray-700">
                      {item.section_display || item.section}
                    </h3>
                    <div className="flex gap-2">
                      {editingId === item.id ? (
                        <>
                          <button
                            onClick={() => handleSave(item.id)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Save Changes"
                          >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </button>
                          <button
                            onClick={handleCancel}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Cancel"
                          >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleEdit(item)}
                          className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                          title="Edit Content"
                        >
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="p-5">
                    {editingId === item.id ? (
                      <textarea
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="w-full px-4 py-3 border-2 border-purple-100 rounded-xl focus:outline-none focus:border-purple-500 transition-colors"
                        rows={item.content.length > 100 ? 6 : 3}
                        autoFocus
                      />
                    ) : (
                      <div className="relative group">
                        <p className="text-gray-600 whitespace-pre-wrap leading-relaxed">
                          {item.content || <span className="text-gray-300 italic">No content set</span>}
                        </p>
                        <div className="absolute inset-0 bg-purple-50/0 group-hover:bg-purple-50/5 transition-colors pointer-events-none rounded-lg"></div>
                      </div>
                    )}
                    <div className="mt-4 flex items-center justify-between text-xs text-gray-400">
                      <span className="flex items-center">
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Last edited {new Date(item.updated_at).toLocaleDateString()}
                      </span>
                      {item.updated_by_name && (
                        <span className="flex items-center">
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          {item.updated_by_name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WebsiteContentManagement;
