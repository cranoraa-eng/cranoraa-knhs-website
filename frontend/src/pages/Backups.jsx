import { useState, useEffect } from 'react';
import api from '../utils/api';

const Backups = () => {
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchBackups();
  }, []);

  const fetchBackups = async () => {
    try {
      const response = await api.get('/admin/backups/');
      setBackups(response.data);
    } catch (error) {
      console.error('Error fetching backups:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBackup = async () => {
    if (!window.confirm('Are you sure you want to create a new backup? This may take a few minutes.')) return;
    
    setCreating(true);
    try {
      await api.post('/admin/backups/');
      alert('Backup created successfully!');
      fetchBackups();
    } catch (error) {
      console.error('Error creating backup:', error);
      alert('Failed to create backup: ' + (error.response?.data?.error || error.message));
    } finally {
      setCreating(false);
    }
  };

  const handleRestore = async (id) => {
    if (!window.confirm('Are you sure you want to restore this backup? This will overwrite current data.')) return;
    
    try {
      await api.post(`/admin/backups/${id}/restore/`);
      alert('Backup restored successfully! The page will reload.');
      window.location.reload();
    } catch (error) {
      console.error('Error restoring backup:', error);
      alert('Failed to restore backup: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this backup?')) return;
    
    try {
      await api.delete(`/admin/backups/${id}/`);
      fetchBackups();
    } catch (error) {
      console.error('Error deleting backup:', error);
      alert('Failed to delete backup');
    }
  };

  const handleDownload = async (id, filename) => {
    try {
      const response = await api.get(`/admin/backups/${id}/download/`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error downloading backup:', error);
      alert('Failed to download backup: ' + (error.response?.data?.error || error.message));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="overflow-y-auto h-[calc(100vh-4rem)] p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Database Backups</h1>
        <button
          onClick={handleCreateBackup}
          disabled={creating}
          className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {creating ? 'Creating Backup...' : '+ Create Backup'}
        </button>
      </div>
      
      <div className="bg-white border border-gray-300 rounded-lg p-6 shadow-sm">
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="text-sm font-semibold text-yellow-800 mb-2">Backup Information</h3>
          <p className="text-xs text-yellow-700">
            Backups are created as SQL dumps of the entire database. Regular backups are recommended before major changes.
            Restoring a backup will overwrite all current data.
          </p>
        </div>

        {backups.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No backups found. Create your first backup.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-300">
                  <th className="text-left py-3 text-sm font-semibold text-gray-600">Filename</th>
                  <th className="text-left py-3 text-sm font-semibold text-gray-600">Created At</th>
                  <th className="text-left py-3 text-sm font-semibold text-gray-600">Size</th>
                  <th className="text-center py-3 text-sm font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {backups.map((backup) => (
                  <tr key={backup.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 text-sm font-semibold text-gray-800">{backup.filename}</td>
                    <td className="py-3 text-sm text-gray-800">
                      {new Date(backup.created_at).toLocaleString()}
                    </td>
                    <td className="py-3 text-sm text-gray-800">{backup.size}</td>
                    <td className="py-3 text-sm text-gray-800 text-center">
                      <div className="flex justify-center space-x-2">
                        <button
                          onClick={() => handleDownload(backup.id, backup.filename)}
                          className="text-blue-600 hover:text-blue-700 text-sm"
                        >
                          Download
                        </button>
                        <button
                          onClick={() => handleRestore(backup.id)}
                          className="text-green-600 hover:text-green-700 text-sm"
                        >
                          Restore
                        </button>
                        <button
                          onClick={() => handleDelete(backup.id)}
                          className="text-red-600 hover:text-red-700 text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Backups;
