import { useState, useEffect } from 'react';
import api from '../utils/api';
import Swal from 'sweetalert2';

const EnrollmentManagement = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

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
        return 'bg-gray-100 text-gray-800';
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
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Enrollment Applications</h1>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="under_review">Under Review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Applications Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Applicant
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Grade Level
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Submitted
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredApplications.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                  No enrollment applications found.
                </td>
              </tr>
            ) : (
              filteredApplications.map((application) => (
                <tr key={application.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {application.last_name}, {application.first_name}
                      </div>
                      <div className="text-sm text-gray-500">{application.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    Grade {application.grade_level}
                    {application.is_als && <span className="ml-2 text-xs text-purple-600">(ALS)</span>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(application.status)}`}>
                      {application.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(application.submitted_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => viewDetails(application)}
                      className="text-purple-600 hover:text-purple-900 mr-3"
                    >
                      View Details
                    </button>
                    {application.status === 'pending' || application.status === 'under_review' ? (
                      <>
                        <button
                          onClick={() => handleApprove(application.id)}
                          className="text-green-600 hover:text-green-900 mr-3"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(application.id)}
                          className="text-red-600 hover:text-red-900 mr-3"
                        >
                          Reject
                        </button>
                      </>
                    ) : null}
                    <button
                      onClick={() => handleDelete(application.id)}
                      className="text-gray-600 hover:text-gray-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Details Modal */}
      {selectedApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Application Details</h2>
                <button
                  onClick={closeDetails}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Personal Information */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 bg-purple-50 p-2 rounded">Personal Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="font-medium">Name:</span> {selectedApplication.first_name} {selectedApplication.middle_name} {selectedApplication.last_name}</div>
                  <div><span className="font-medium">Sex:</span> {selectedApplication.sex}</div>
                  <div><span className="font-medium">Date of Birth:</span> {selectedApplication.date_of_birth}</div>
                  <div><span className="font-medium">Place of Birth:</span> {selectedApplication.place_of_birth || 'N/A'}</div>
                  <div><span className="font-medium">Nationality:</span> {selectedApplication.nationality}</div>
                  <div><span className="font-medium">Religion:</span> {selectedApplication.religion || 'N/A'}</div>
                </div>
              </div>

              {/* Address */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 bg-blue-50 p-2 rounded">Address</h3>
                <div className="text-sm">
                  <p>{selectedApplication.street_address}</p>
                  <p>{selectedApplication.barangay}, {selectedApplication.city_municipality}, {selectedApplication.province}</p>
                  <p>Zip Code: {selectedApplication.zip_code || 'N/A'}</p>
                </div>
              </div>

              {/* Parent/Guardian */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 bg-green-50 p-2 rounded">Parent/Guardian Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="font-medium">Father:</span> {selectedApplication.father_name}</div>
                  <div><span className="font-medium">Father's Occupation:</span> {selectedApplication.father_occupation || 'N/A'}</div>
                  <div><span className="font-medium">Father's Contact:</span> {selectedApplication.father_contact || 'N/A'}</div>
                  <div><span className="font-medium">Mother:</span> {selectedApplication.mother_name}</div>
                  <div><span className="font-medium">Mother's Occupation:</span> {selectedApplication.mother_occupation || 'N/A'}</div>
                  <div><span className="font-medium">Mother's Contact:</span> {selectedApplication.mother_contact || 'N/A'}</div>
                  {selectedApplication.guardian_name && (
                    <>
                      <div><span className="font-medium">Guardian:</span> {selectedApplication.guardian_name}</div>
                      <div><span className="font-medium">Guardian Relationship:</span> {selectedApplication.guardian_relationship}</div>
                      <div><span className="font-medium">Guardian Contact:</span> {selectedApplication.guardian_contact}</div>
                    </>
                  )}
                </div>
              </div>

              {/* Academic Information */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 bg-yellow-50 p-2 rounded">Academic Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="font-medium">Grade Level:</span> Grade {selectedApplication.grade_level}</div>
                  <div><span className="font-medium">ALS Applicant:</span> {selectedApplication.is_als ? 'Yes' : 'No'}</div>
                  <div><span className="font-medium">LRN:</span> {selectedApplication.lrn || 'N/A'}</div>
                  <div><span className="font-medium">Previous School:</span> {selectedApplication.previous_school || 'N/A'}</div>
                  <div className="col-span-2"><span className="font-medium">Previous School Address:</span> {selectedApplication.previous_school_address || 'N/A'}</div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 bg-indigo-50 p-2 rounded">Contact Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="font-medium">Email:</span> {selectedApplication.email}</div>
                  <div><span className="font-medium">Phone:</span> {selectedApplication.phone_number}</div>
                  <div><span className="font-medium">Emergency Contact:</span> {selectedApplication.emergency_contact_name}</div>
                  <div><span className="font-medium">Emergency Relationship:</span> {selectedApplication.emergency_contact_relationship}</div>
                  <div className="col-span-2"><span className="font-medium">Emergency Phone:</span> {selectedApplication.emergency_contact_phone}</div>
                </div>
              </div>

              {/* Uploaded Documents */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 bg-red-50 p-2 rounded">Uploaded Documents</h3>
                <div className="grid grid-cols-1 gap-3 text-sm">
                  {selectedApplication.birth_certificate && (
                    <div className="flex items-center justify-between bg-gray-50 p-2 rounded">
                      <span>Birth Certificate</span>
                      <button
                        onClick={() => downloadFile(selectedApplication.birth_certificate, 'birth_certificate')}
                        className="text-purple-600 hover:text-purple-900"
                      >
                        Download
                      </button>
                    </div>
                  )}
                  {selectedApplication.report_card && (
                    <div className="flex items-center justify-between bg-gray-50 p-2 rounded">
                      <span>Report Card</span>
                      <button
                        onClick={() => downloadFile(selectedApplication.report_card, 'report_card')}
                        className="text-purple-600 hover:text-purple-900"
                      >
                        Download
                      </button>
                    </div>
                  )}
                  {selectedApplication.form_138 && (
                    <div className="flex items-center justify-between bg-gray-50 p-2 rounded">
                      <span>Form 138 (Grade 6 Certificate)</span>
                      <button
                        onClick={() => downloadFile(selectedApplication.form_138, 'form_138')}
                        className="text-purple-600 hover:text-purple-900"
                      >
                        Download
                      </button>
                    </div>
                  )}
                  {selectedApplication.certificate_of_completion && (
                    <div className="flex items-center justify-between bg-gray-50 p-2 rounded">
                      <span>Certificate of Completion</span>
                      <button
                        onClick={() => downloadFile(selectedApplication.certificate_of_completion, 'certificate_of_completion')}
                        className="text-purple-600 hover:text-purple-900"
                      >
                        Download
                      </button>
                    </div>
                  )}
                  {selectedApplication.good_moral_certificate && (
                    <div className="flex items-center justify-between bg-gray-50 p-2 rounded">
                      <span>Certificate of Good Moral Character</span>
                      <button
                        onClick={() => downloadFile(selectedApplication.good_moral_certificate, 'good_moral_certificate')}
                        className="text-purple-600 hover:text-purple-900"
                      >
                        Download
                      </button>
                    </div>
                  )}
                  {selectedApplication.last_school_attended_cert && (
                    <div className="flex items-center justify-between bg-gray-50 p-2 rounded">
                      <span>Last School Attended Certificate</span>
                      <button
                        onClick={() => downloadFile(selectedApplication.last_school_attended_cert, 'last_school_attended_cert')}
                        className="text-purple-600 hover:text-purple-900"
                      >
                        Download
                      </button>
                    </div>
                  )}
                  {!selectedApplication.birth_certificate && !selectedApplication.report_card && !selectedApplication.form_138 && 
                   !selectedApplication.certificate_of_completion && !selectedApplication.good_moral_certificate && 
                   !selectedApplication.last_school_attended_cert && (
                    <p className="text-gray-500 italic">No documents uploaded.</p>
                  )}
                </div>
              </div>

              {/* Status and Remarks */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 bg-gray-100 p-2 rounded">Status & Remarks</h3>
                <div className="text-sm">
                  <div className="mb-2">
                    <span className="font-medium">Current Status:</span>{' '}
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(selectedApplication.status)}`}>
                      {selectedApplication.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  {selectedApplication.remarks && (
                    <div>
                      <span className="font-medium">Remarks:</span> {selectedApplication.remarks}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                {selectedApplication.status === 'pending' || selectedApplication.status === 'under_review' ? (
                  <>
                    <button
                      onClick={() => {
                        handleDelete(selectedApplication.id);
                        closeDetails();
                      }}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => {
                        handleReject(selectedApplication.id);
                        closeDetails();
                      }}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => {
                        handleApprove(selectedApplication.id);
                        closeDetails();
                      }}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      Approve
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      handleDelete(selectedApplication.id);
                      closeDetails();
                    }}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                  >
                    Delete
                  </button>
                )}
                <button
                  onClick={closeDetails}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnrollmentManagement;
