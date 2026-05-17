import { useState, useEffect } from 'react';
import api from '../utils/api';
import Swal from 'sweetalert2';

const WebsiteContentManagement = () => {
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newContent, setNewContent] = useState({ section: '', content: '' });

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

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/website-content/', newContent);
      Swal.fire({
        icon: 'success',
        title: 'Created!',
        text: 'Content created successfully.',
        timer: 1500,
        showConfirmButton: false,
      });
      setShowCreateModal(false);
      setNewContent({ section: '', content: '' });
      fetchContent();
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to create content.',
      });
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        await api.delete(`/website-content/${id}/`);
        Swal.fire({
          icon: 'success',
          title: 'Deleted!',
          text: 'Content deleted successfully.',
          timer: 1500,
          showConfirmButton: false,
        });
        fetchContent();
      } catch (error) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to delete content.',
        });
      }
    }
  };

  const groupedContent = content.reduce((acc, item) => {
    if (!item.section) return acc;
    
    // Define section groups
    const sectionGroups = {
      'home': ['home_hero_title', 'home_hero_subtitle', 'home_announcement'],
      'about': ['about_title', 'about_content', 'about_mission', 'about_vision', 'about_history'],
      'programs': ['programs_title', 'programs_subtitle', 'programs_academic', 'programs_tech', 'programs_sports', 'programs_arts'],
      'contact': ['contact_title', 'contact_content', 'contact_address', 'contact_email', 'contact_phone', 'contact_office_hours'],
    };
    
    let group = 'other';
    for (const [groupName, sections] of Object.entries(sectionGroups)) {
      if (sections.some(s => item.section.startsWith(s))) {
        group = groupName;
        break;
      }
    }
    
    if (!acc[group]) {
      acc[group] = [];
    }
    acc[group].push(item);
    return acc;
  }, {});

  const sectionLabels = {
    'home': 'Home Page',
    'about': 'About Page',
    'programs': 'Programs Page',
    'contact': 'Contact Page',
    'other': 'Other Content'
  };

  const getSectionLabel = (section) => {
    return sectionLabels[section] || section.charAt(0).toUpperCase() + section.slice(1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 overflow-y-auto h-[calc(100vh-4rem)]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Website Content Management</h1>
          <p className="text-gray-600">Edit the content displayed on the public website</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-[#2D1B4D] hover:bg-[#3D2B5D] text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 shadow-md flex items-center"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Content
        </button>
      </div>

      {Object.entries(groupedContent).map(([section, items]) => (
        <div key={section} className="mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">{getSectionLabel(section)}</h2>
          <div className="bg-white rounded-lg shadow border border-gray-200">
            {items.sort((a, b) => a.section.localeCompare(b.section)).map((item) => (
              <div key={item.id} className="p-4 border-b border-gray-200 last:border-b-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      {item.section.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </label>
                    {editingId === item.id ? (
                      <textarea
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        rows={4}
                      />
                    ) : (
                      <p className="text-gray-600 whitespace-pre-wrap">{item.content || '(No content)'}</p>
                    )}
                  </div>
                  <div className="ml-4 flex space-x-2">
                    {editingId === item.id ? (
                      <>
                        <button
                          onClick={() => handleSave(item.id)}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                          Save
                        </button>
                        <button
                          onClick={handleCancel}
                          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleEdit(item)}
                          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
                {item.updated_by_name && (
                  <p className="text-xs text-gray-400 mt-2">
                    Last updated by {item.updated_by_name} on {new Date(item.updated_at).toLocaleDateString()}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Add New Content</h3>
              <form onSubmit={handleCreate}>
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Section Key
                  </label>
                  <input
                    type="text"
                    value={newContent.section}
                    onChange={(e) => setNewContent({ ...newContent, section: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="e.g., home_hero_title"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Use format: page_section_name (e.g., home_hero_title)</p>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Content
                  </label>
                  <textarea
                    value={newContent.content}
                    onChange={(e) => setNewContent({ ...newContent, content: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    rows={4}
                    required
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setNewContent({ section: '', content: '' });
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Create
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WebsiteContentManagement;
