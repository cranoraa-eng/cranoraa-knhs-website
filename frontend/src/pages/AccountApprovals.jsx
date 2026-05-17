import { useState, useEffect } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

const ROLE_BADGE = {
  teacher: 'bg-blue-100 text-blue-700',
  student: 'bg-green-100 text-green-700',
  admin:   'bg-purple-100 text-purple-700',
};

const AccountApprovals = () => {
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null); // id of user being processed

  useEffect(() => { fetchPending(); }, []);

  const fetchPending = async () => {
    setLoading(true);
    try {
      const res = await api.get('/users/pending/');
      setPending(res.data);
    } catch {
      toast.error('Failed to load pending accounts');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (user) => {
    const result = await Swal.fire({
      title: 'Approve Account?',
      html: `Approve <strong>${user.first_name || user.username} ${user.last_name || ''}</strong> as <strong>${user.role}</strong>?<br><small class="text-gray-500">${user.email}</small><br><br>They will receive an email notification.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#16a34a',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Approve',
    });
    if (!result.isConfirmed) return;

    setProcessing(user.id);
    try {
      await api.post(`/users/${user.id}/approve/`);
      toast.success(`${user.email} approved`);
      fetchPending();
    } catch {
      toast.error('Failed to approve account');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (user) => {
    const result = await Swal.fire({
      title: 'Reject Account?',
      html: `Reject <strong>${user.first_name || user.username} ${user.last_name || ''}</strong>?<br><small class="text-gray-500">${user.email}</small>`,
      input: 'textarea',
      inputLabel: 'Reason (optional — will be emailed to the user)',
      inputPlaceholder: 'e.g. Unable to verify your identity. Please contact the school office.',
      inputAttributes: { rows: 3 },
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Reject & Remove',
    });
    if (!result.isConfirmed) return;

    setProcessing(user.id);
    try {
      await api.post(`/users/${user.id}/reject/`, { reason: result.value || undefined });
      toast.success(`${user.email} rejected and removed`);
      fetchPending();
    } catch {
      toast.error('Failed to reject account');
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div className="overflow-y-auto h-[calc(100vh-4rem)] p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Account Approvals</h1>
          <p className="text-gray-500 mt-1">
            Review and approve new user registrations
          </p>
        </div>
        <button
          onClick={fetchPending}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-300 hover:border-gray-400 px-3 py-2 rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Pending Approval', value: pending.length, color: 'text-amber-600 bg-amber-50 border-amber-200' },
          { label: 'Teachers Pending', value: pending.filter(u => u.role === 'teacher').length, color: 'text-blue-600 bg-blue-50 border-blue-200' },
          { label: 'Students Pending', value: pending.filter(u => u.role === 'student').length, color: 'text-green-600 bg-green-50 border-green-200' },
        ].map((s, i) => (
          <div key={i} className={`border rounded-xl p-4 ${s.color}`}>
            <div className="text-3xl font-bold">{s.value}</div>
            <div className="text-sm font-medium mt-1 opacity-80">{s.label}</div>
          </div>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600" />
        </div>
      ) : pending.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-16 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-1">All caught up!</h3>
          <p className="text-gray-400 text-sm">No accounts are pending approval right now.</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-amber-50 flex items-center gap-2">
            <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="text-sm font-semibold text-amber-700">
              {pending.length} account{pending.length !== 1 ? 's' : ''} waiting for your review
            </span>
          </div>

          <div className="divide-y divide-gray-100">
            {pending.map(user => (
              <div key={user.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-5 hover:bg-gray-50 transition-colors">
                {/* User info */}
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                    {(user.first_name || user.username || '?').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-800">
                        {user.first_name && user.last_name
                          ? `${user.first_name} ${user.last_name}`
                          : user.username}
                      </span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${ROLE_BADGE[user.role] || 'bg-gray-100 text-gray-600'}`}>
                        {user.role}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500 mt-0.5">{user.email}</div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      Registered {new Date(user.profile?.date_of_birth || Date.now()).toLocaleDateString()} ·
                      Email verified ✓
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleApprove(user)}
                    disabled={processing === user.id}
                    className="flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    {processing === user.id ? (
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                    Approve
                  </button>
                  <button
                    onClick={() => handleReject(user)}
                    disabled={processing === user.id}
                    className="flex items-center gap-1.5 px-4 py-2 bg-red-100 hover:bg-red-200 disabled:opacity-60 text-red-700 text-sm font-medium rounded-lg transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountApprovals;
