import { useState, useEffect } from 'react';
import api from '../utils/api';
import Swal from 'sweetalert2';

const EnrollmentManagement = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeActionMenu, setActiveActionMenu] = useState(null);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const response = await api.get('/enrollment-applications/');
      setApplications(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching enrollment applications:', error);
      setLoading(false);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to fetch enrollment applications.',
      });
    }
  };

  const handleApprove = async (id) => {
    const { value: remarks } = await Swal.fire({
      title: 'Approve Application',
      input: 'textarea',
      inputLabel: 'Remarks (optional)',
      inputPlaceholder: 'Enter any remarks...',
      showCancelButton: true,
      confirmButtonText: 'Approve',
      confirmButtonColor: '#10B981',
    });

    if (remarks !== undefined) {
      try {
        await api.post(`/enrollment-applications/${id}/approve/`, { remarks });
        Swal.fire({
          icon: 'success',
          title: 'Approved',
          text: 'Application has been approved.',
        });
        fetchApplications();
      } catch (error) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to approve application.',
        });
      }
    }
  };

  const handleReject = async (id) => {
    const { value: remarks } = await Swal.fire({
      title: 'Reject Application',
      input: 'textarea',
      inputLabel: 'Remarks (optional)',
      inputPlaceholder: 'Enter reason for rejection...',
      showCancelButton: true,
      confirmButtonText: 'Reject',
      confirmButtonColor: '#EF4444',
    });

    if (remarks !== undefined) {
      try {
        await api.post(`/enrollment-applications/${id}/reject/`, { remarks });
        Swal.fire({
          icon: 'success',
          title: 'Rejected',
          text: 'Application has been rejected.',
        });
        fetchApplications();
      } catch (error) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to reject application.',
        });
      }
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Delete Application?',
      text: 'This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#EF4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Delete',
    });
    if (!result.isConfirmed) return;

    try {
      await api.delete(`/enrollment-applications/${id}/`);
      Swal.fire({
        icon: 'success',
        title: 'Deleted',
        text: 'Application has been deleted.',
      });
      fetchApplications();
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to delete application.',
      });
    }
  };

  const viewDetails = (application) => {
    setSelectedApplication(application);
  };

  const closeDetails = () => {
    setSelectedApplication(null);
  };

  const downloadFile = (url, filename) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredApplications = applications.filter((app) => {
    const matchesFilter = filter === 'all' || app.status === filter;
    const matchesSearch =
      app.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'under_review':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 rounded-full border-2 border-slate-100 border-t-violet-600 animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-2 md:p-6 max-w-full overflow-x-hidden bg-slate-50/50 page-bottom-safe">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 md:mb-8 gap-2 min-w-0">
        <div className="min-w-0">
          <h1 className="text-lg md:text-3xl font-black text-slate-800 tracking-tight truncate uppercase">Enrollment Management</h1>
          <p className="text-[8px] md:text-sm font-black text-slate-400 uppercase tracking-widest mt-0.5 truncate">Review and manage student admission applications</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-slate-100 p-2 md:p-4 mb-4 md:mb-8 flex flex-col md:flex-row gap-2 md:gap-4 min-w-0">
        <div className="relative flex-1 min-w-0 group">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 group-focus-within:text-violet-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search applicants..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 md:py-2.5 bg-slate-50 border-transparent rounded-lg md:rounded-xl text-[10px] md:text-sm font-bold focus:bg-white focus:ring-2 focus:ring-violet-500 transition-all outline-none"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="flex-1 md:flex-none px-3 py-1.5 md:px-4 md:py-2.5 bg-slate-50 border-transparent rounded-lg md:rounded-xl text-[10px] md:text-sm font-black uppercase tracking-wider text-slate-500 focus:bg-white focus:ring-2 focus:ring-violet-500 outline-none transition-all cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="under_review">Under Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Applications Table */}
      <div className="bg-white rounded-xl md:rounded-3xl shadow-sm border border-slate-100 overflow-hidden min-w-0">
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200">
          <table className="w-full text-left min-w-0">
            <thead className="bg-slate-50/50 text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
              <tr>
                <th className="px-3 py-2 md:px-6 md:py-4">Applicant</th>
                <th className="px-3 py-2 md:px-6 md:py-4">Grade</th>
                <th className="px-3 py-2 md:px-6 md:py-4">Status</th>
                <th className="px-3 py-2 md:px-6 md:py-4 hidden sm:table-cell">Submitted</th>
                <th className="px-3 py-2 md:px-6 md:py-4 text-center">Opt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredApplications.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center">
                    <p className="text-xs md:text-sm font-bold text-slate-400">No applications found</p>
                  </td>
                </tr>
              ) : (
                filteredApplications.map((application) => (
                  <tr key={application.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-3 py-2 md:px-6 md:py-4">
                      <div className="flex flex-col min-w-0">
                        <span className="text-[10px] md:text-sm font-black text-slate-800 truncate uppercase tracking-tight">
                          {application.last_name}, {application.first_name}
                        </span>
                        <span className="text-[8px] md:text-[10px] text-slate-400 font-bold truncate">{application.email}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2 md:px-6 md:py-4">
                      <div className="flex items-center gap-1 whitespace-nowrap">
                        <span className="text-[10px] md:text-sm font-black text-slate-700">G{application.grade_level}</span>
                        {application.is_als && <span className="text-[7px] md:text-[8px] font-black bg-violet-100 text-violet-600 px-1 py-0.5 rounded uppercase tracking-tighter">ALS</span>}
                      </div>
                    </td>
                    <td className="px-3 py-2 md:px-6 md:py-4">
                      <span className={`px-1.5 py-0.5 md:px-2 md:py-1 text-[7px] md:text-[9px] font-black uppercase tracking-wider rounded-md border ${getStatusColor(application.status)}`}>
                        {application.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-3 py-2 md:px-6 md:py-4 text-[9px] md:text-xs font-bold text-slate-400 whitespace-nowrap hidden sm:table-cell">
                      {new Date(application.submitted_at).toLocaleDateString()}
                    </td>
                    <td className="px-3 py-2 md:px-6 md:py-4 text-center relative">
                      {/* Desktop Actions */}
                      <div className="hidden md:flex items-center justify-center gap-1.5">
                        <button onClick={() => viewDetails(application)} className="p-1.5 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-all" title="View Details">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        </button>
                        {(application.status === 'pending' || application.status === 'under_review') && (
                          <>
                            <button onClick={() => handleApprove(application.id)} className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all" title="Approve">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                            </button>
                            <button onClick={() => handleReject(application.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all" title="Reject">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                          </>
                        )}
                        <button onClick={() => handleDelete(application.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Delete">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>

                      {/* Mobile Actions Hamburger */}
                      <div className="md:hidden">
                        <button 
                          onClick={() => setActiveActionMenu(activeActionMenu === application.id ? null : application.id)}
                          className={`p-1 rounded-md transition-all ${activeActionMenu === application.id ? 'bg-violet-100 text-violet-600' : 'text-slate-400'}`}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16m-7 6h7" /></svg>
                        </button>
                        
                        {activeActionMenu === application.id && (
                          <div className="absolute right-2 top-full mt-1 bg-white border border-slate-100 rounded-lg shadow-xl z-50 py-1 min-w-[100px] animate-in fade-in slide-in-from-top-1 duration-200">
                            <button onClick={() => { viewDetails(application); setActiveActionMenu(null); }} className="w-full text-left px-3 py-1.5 text-[9px] font-black uppercase text-slate-600 hover:bg-violet-50 hover:text-violet-600 transition-colors flex items-center gap-2">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                              View
                            </button>
                            {(application.status === 'pending' || application.status === 'under_review') && (
                              <>
                                <button onClick={() => { handleApprove(application.id); setActiveActionMenu(null); }} className="w-full text-left px-3 py-1.5 text-[9px] font-black uppercase text-emerald-600 hover:bg-emerald-50 transition-colors flex items-center gap-2">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                  Approve
                                </button>
                                <button onClick={() => { handleReject(application.id); setActiveActionMenu(null); }} className="w-full text-left px-3 py-1.5 text-[9px] font-black uppercase text-rose-600 hover:bg-rose-50 transition-colors flex items-center gap-2">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                  Reject
                                </button>
                              </>
                            )}
                            <button onClick={() => { handleDelete(application.id); setActiveActionMenu(null); }} className="w-full text-left px-3 py-1.5 text-[9px] font-black uppercase text-red-500 hover:bg-red-50 transition-colors flex items-center gap-2">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Modal */}
      {selectedApplication && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-2 md:p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl md:rounded-[2rem] shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
            <div className="p-4 md:p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="min-w-0">
                <h2 className="text-sm md:text-2xl font-black text-slate-800 uppercase tracking-tight truncate">Application Details</h2>
                <p className="text-[7px] md:text-xs font-black text-slate-400 uppercase tracking-widest truncate">Review complete student record</p>
              </div>
              <button
                onClick={closeDetails}
                className="p-1.5 md:p-2 hover:bg-white rounded-full transition-all text-slate-400 hover:text-slate-600 shadow-sm"
              >
                <svg className="w-4 h-4 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-4 md:p-8 overflow-y-auto space-y-4 md:space-y-8 scrollbar-thin scrollbar-thumb-slate-200">
              {/* Personal Information */}
              <div>
                <h3 className="text-[9px] md:text-sm font-black text-violet-600 uppercase tracking-[0.2em] mb-3 md:mb-4 flex items-center gap-2">
                  <span className="w-1 h-3 md:w-1.5 md:h-4 bg-violet-600 rounded-full"></span>
                  Personal Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-6 text-[10px] md:text-sm">
                  <div className="bg-slate-50/50 p-2 md:p-3 rounded-xl border border-slate-100">
                    <span className="block text-[7px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Full Name</span>
                    <span className="font-bold text-slate-800 uppercase">{selectedApplication.first_name} {selectedApplication.middle_name} {selectedApplication.last_name}</span>
                  </div>
                  <div className="bg-slate-50/50 p-2 md:p-3 rounded-xl border border-slate-100">
                    <span className="block text-[7px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Sex</span>
                    <span className="font-bold text-slate-800 uppercase">{selectedApplication.sex}</span>
                  </div>
                  <div className="bg-slate-50/50 p-2 md:p-3 rounded-xl border border-slate-100">
                    <span className="block text-[7px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Date of Birth</span>
                    <span className="font-bold text-slate-800 uppercase">{selectedApplication.date_of_birth}</span>
                  </div>
                  <div className="bg-slate-50/50 p-2 md:p-3 rounded-xl border border-slate-100">
                    <span className="block text-[7px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Nationality</span>
                    <span className="font-bold text-slate-800 uppercase">{selectedApplication.nationality}</span>
                  </div>
                  <div className="bg-slate-50/50 p-2 md:p-3 rounded-xl border border-slate-100 sm:col-span-2">
                    <span className="block text-[7px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Place of Birth</span>
                    <span className="font-bold text-slate-800 uppercase truncate block">{selectedApplication.place_of_birth || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Address */}
              <div>
                <h3 className="text-[9px] md:text-sm font-black text-blue-600 uppercase tracking-[0.2em] mb-3 md:mb-4 flex items-center gap-2">
                  <span className="w-1 h-3 md:w-1.5 md:h-4 bg-blue-600 rounded-full"></span>
                  Residence
                </h3>
                <div className="bg-slate-50/50 p-3 md:p-4 rounded-xl md:rounded-2xl border border-slate-100 text-[10px] md:text-sm">
                  <p className="font-bold text-slate-800 uppercase tracking-tight leading-relaxed">
                    {selectedApplication.street_address}, {selectedApplication.barangay}<br />
                    {selectedApplication.city_municipality}, {selectedApplication.province}<br />
                    <span className="text-slate-400 font-black">Zip:</span> {selectedApplication.zip_code || 'N/A'}
                  </p>
                </div>
              </div>

              {/* Parent/Guardian */}
              <div>
                <h3 className="text-[9px] md:text-sm font-black text-emerald-600 uppercase tracking-[0.2em] mb-3 md:mb-4 flex items-center gap-2">
                  <span className="w-1 h-3 md:w-1.5 md:h-4 bg-emerald-600 rounded-full"></span>
                  Parental Records
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 text-[10px] md:text-sm">
                  <div className="bg-emerald-50/30 p-3 md:p-4 rounded-xl border border-emerald-100/50">
                    <span className="block text-[7px] md:text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-1.5">Father</span>
                    <p className="font-bold text-slate-800 uppercase">{selectedApplication.father_name}</p>
                    <p className="text-[8px] md:text-xs text-slate-500 mt-1 font-medium">{selectedApplication.father_occupation || 'No occupation'}</p>
                    <p className="text-[8px] md:text-xs text-emerald-700 mt-1 font-black">{selectedApplication.father_contact || 'No contact'}</p>
                  </div>
                  <div className="bg-rose-50/30 p-3 md:p-4 rounded-xl border border-rose-100/50">
                    <span className="block text-[7px] md:text-[9px] font-black text-rose-600 uppercase tracking-widest mb-1.5">Mother</span>
                    <p className="font-bold text-slate-800 uppercase">{selectedApplication.mother_name}</p>
                    <p className="text-[8px] md:text-xs text-slate-500 mt-1 font-medium">{selectedApplication.mother_occupation || 'No occupation'}</p>
                    <p className="text-[8px] md:text-xs text-rose-700 mt-1 font-black">{selectedApplication.mother_contact || 'No contact'}</p>
                  </div>
                </div>
              </div>

              {/* Academic Information */}
              <div>
                <h3 className="text-[9px] md:text-sm font-black text-yellow-600 uppercase tracking-[0.2em] mb-3 md:mb-4 flex items-center gap-2">
                  <span className="w-1 h-3 md:w-1.5 md:h-4 bg-yellow-600 rounded-full"></span>
                  Academic Records
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-6 text-[10px] md:text-sm">
                  <div className="bg-slate-50/50 p-2 md:p-3 rounded-xl border border-slate-100">
                    <span className="block text-[7px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Grade Level</span>
                    <span className="font-bold text-slate-800 uppercase">Grade {selectedApplication.grade_level} {selectedApplication.is_als ? '(ALS)' : ''}</span>
                  </div>
                  <div className="bg-slate-50/50 p-2 md:p-3 rounded-xl border border-slate-100">
                    <span className="block text-[7px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">LRN</span>
                    <span className="font-bold text-slate-800">{selectedApplication.lrn || 'N/A'}</span>
                  </div>
                  <div className="bg-slate-50/50 p-2 md:p-3 rounded-xl border border-slate-100 sm:col-span-2">
                    <span className="block text-[7px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Previous School</span>
                    <span className="font-bold text-slate-800 uppercase block truncate">{selectedApplication.previous_school || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div>
                <h3 className="text-[9px] md:text-sm font-black text-indigo-600 uppercase tracking-[0.2em] mb-3 md:mb-4 flex items-center gap-2">
                  <span className="w-1 h-3 md:w-1.5 md:h-4 bg-indigo-600 rounded-full"></span>
                  Contact & Emergency
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 text-[10px] md:text-sm">
                  <div className="bg-slate-50/50 p-2 md:p-3 rounded-xl border border-slate-100">
                    <span className="block text-[7px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Student Phone</span>
                    <span className="font-bold text-slate-800">{selectedApplication.phone_number}</span>
                  </div>
                  <div className="bg-slate-50/50 p-2 md:p-3 rounded-xl border border-slate-100">
                    <span className="block text-[7px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Emergency Contact</span>
                    <p className="font-bold text-slate-800 uppercase">{selectedApplication.emergency_contact_name}</p>
                    <p className="text-[8px] md:text-[10px] text-slate-500 font-bold mt-0.5">{selectedApplication.emergency_contact_relationship} • {selectedApplication.emergency_contact_phone}</p>
                  </div>
                </div>
              </div>

              {/* Uploaded Documents */}
              <div>
                <h3 className="text-[9px] md:text-sm font-black text-rose-500 uppercase tracking-[0.2em] mb-3 md:mb-4 flex items-center gap-2">
                  <span className="w-1 h-3 md:w-1.5 md:h-4 bg-rose-500 rounded-full"></span>
                  Documents
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-3 text-[9px] md:text-xs font-bold">
                  {[
                    { key: 'birth_certificate', label: 'Birth Certificate' },
                    { key: 'report_card', label: 'Report Card' },
                    { key: 'form_138', label: 'Form 138' },
                    { key: 'certificate_of_completion', label: 'Completion Cert' },
                    { key: 'good_moral_certificate', label: 'Good Moral' },
                    { key: 'last_school_attended_cert', label: 'Last School Cert' }
                  ].map(doc => selectedApplication[doc.key] && (
                    <div key={doc.key} className="flex items-center justify-between bg-slate-50 p-2 md:p-3 rounded-xl border border-slate-100 group/doc hover:bg-white hover:border-violet-200 transition-all">
                      <span className="text-slate-500 uppercase truncate pr-2">{doc.label}</span>
                      <button
                        onClick={() => downloadFile(selectedApplication[doc.key], doc.key)}
                        className="text-violet-600 bg-violet-50 px-2 py-1 rounded-lg hover:bg-violet-600 hover:text-white transition-all shadow-sm active:scale-95 shrink-0 uppercase tracking-tighter"
                      >
                        Get
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Status and Remarks */}
              <div>
                <h3 className="text-[9px] md:text-sm font-black text-slate-500 uppercase tracking-[0.2em] mb-3 md:mb-4 flex items-center gap-2">
                  <span className="w-1 h-3 md:w-1.5 md:h-4 bg-gray-400 rounded-full"></span>
                  Process Status
                </h3>
                <div className="bg-slate-100/50 p-3 md:p-4 rounded-xl border border-slate-200 text-[10px] md:text-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[7px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest">Current:</span>
                    <span className={`px-2 py-0.5 text-[8px] md:text-[10px] font-black uppercase tracking-wider rounded-md border ${getStatusColor(selectedApplication.status)}`}>
                      {selectedApplication.status.replace('_', ' ')}
                    </span>
                  </div>
                  {selectedApplication.remarks && (
                    <div>
                      <span className="block text-[7px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Remarks:</span>
                      <p className="text-slate-600 font-medium italic">"{selectedApplication.remarks}"</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-3 md:p-6 bg-slate-50/80 border-t border-slate-100 flex flex-col sm:flex-row justify-end gap-2 md:gap-3 shrink-0">
              {(selectedApplication.status === 'pending' || selectedApplication.status === 'under_review') ? (
                <>
                  <button onClick={() => { handleReject(selectedApplication.id); closeDetails(); }} className="flex-1 sm:flex-none px-4 md:px-6 py-2 md:py-3 bg-white text-rose-600 border border-rose-100 font-black uppercase text-[9px] md:text-xs rounded-xl md:rounded-2xl hover:bg-rose-600 hover:text-white transition-all shadow-sm active:scale-95">Reject</button>
                  <button onClick={() => { handleApprove(selectedApplication.id); closeDetails(); }} className="flex-1 sm:flex-none px-4 md:px-6 py-2 md:py-3 bg-emerald-600 text-white font-black uppercase text-[9px] md:text-xs rounded-xl md:rounded-2xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 active:scale-95">Approve</button>
                </>
              ) : (
                <button onClick={() => { handleDelete(selectedApplication.id); closeDetails(); }} className="flex-1 sm:flex-none px-4 md:px-6 py-2 md:py-3 bg-gray-800 text-white font-black uppercase text-[9px] md:text-xs rounded-xl md:rounded-2xl hover:bg-black transition-all active:scale-95">Delete</button>
              )}
              <button onClick={closeDetails} className="flex-1 sm:flex-none px-4 md:px-6 py-2 md:py-3 bg-white text-slate-400 border border-slate-200 font-black uppercase text-[9px] md:text-xs rounded-xl md:rounded-2xl hover:bg-slate-50 transition-all active:scale-95">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnrollmentManagement;
