import { useState, useEffect } from 'react';
import api, { ROOT_URL } from '../utils/api';

const LatestNews = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchAnnouncements();
    // Poll for updates every 5 minutes
    const interval = setInterval(fetchAnnouncements, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const response = await api.get('/announcements/public/');
      setAnnouncements(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching announcements:', error);
      setLoading(false);
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      'academic': 'bg-purple-100 text-purple-800',
      'events': 'bg-green-100 text-green-800',
      'emergency': 'bg-red-100 text-red-800',
      'holiday': 'bg-blue-100 text-blue-800',
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const handleReadMore = (announcement) => {
    setSelectedAnnouncement(announcement);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedAnnouncement(null);
  };

  const attachUrl = (url) => url?.startsWith('http') ? url : `${ROOT_URL}${url}`;

  if (loading) {
    return (
      <div className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">Latest News</h2>
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (announcements.length === 0) {
    return null;
  }

  return (
    <div className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="mb-12 text-center text-3xl font-bold text-slate-800">Latest News</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {announcements.slice(0, 4).map((announcement) => (
            <div key={announcement.id} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg">
              <div className="flex items-center mb-4">
                <span className={`${getCategoryColor(announcement.category)} text-xs font-semibold px-3 py-1 rounded-full`}>
                  {announcement.category.charAt(0).toUpperCase() + announcement.category.slice(1)}
                </span>
                {announcement.is_pinned && (
                  <span className="bg-yellow-100 text-yellow-800 text-xs font-semibold px-3 py-1 rounded-full ml-2">
                    Pinned
                  </span>
                )}
                <span className="ml-auto text-sm text-slate-500">
                  {formatDate(announcement.created_at)}
                </span>
              </div>
              <h3 className="mb-2 line-clamp-2 text-lg font-bold text-slate-800">
                {announcement.title}
              </h3>
              <p className="mb-4 line-clamp-3 text-slate-600">
                {announcement.content}
              </p>
              <button
                onClick={() => handleReadMore(announcement)}
                className="font-semibold text-violet-600 hover:text-violet-800"
              >
                Read more →
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {showModal && selectedAnnouncement && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onClick={closeModal}>
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-slate-200 bg-white" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <span className={`${getCategoryColor(selectedAnnouncement.category)} text-xs font-semibold px-3 py-1 rounded-full`}>
                    {selectedAnnouncement.category.charAt(0).toUpperCase() + selectedAnnouncement.category.slice(1)}
                  </span>
                  {selectedAnnouncement.is_pinned && (
                    <span className="bg-yellow-100 text-yellow-800 text-xs font-semibold px-3 py-1 rounded-full">
                      Pinned
                    </span>
                  )}
                </div>
                <button
                  onClick={closeModal}
                  className="text-2xl font-bold text-slate-500 hover:text-slate-700"
                >
                  ×
                </button>
              </div>
              
              <h2 className="mb-4 text-2xl font-bold text-slate-800">
                {selectedAnnouncement.title}
              </h2>
              
              <div className="mb-4 text-sm text-slate-500">
                Posted on {formatDate(selectedAnnouncement.created_at)}
              </div>
              
              {selectedAnnouncement.attachment_url && (
                <div className="mb-6">
                  <img
                    src={attachUrl(selectedAnnouncement.attachment_url)}
                    alt="Announcement attachment"
                    className="w-full h-auto rounded-lg"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
              )}
              
              <div className="prose max-w-none">
                <p className="whitespace-pre-line leading-relaxed text-slate-700">
                  {selectedAnnouncement.content}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LatestNews;
