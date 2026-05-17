import { useState, useEffect } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { getUser } from '../utils/auth';
import api from '../utils/api';
import toast from 'react-hot-toast';

const Field = ({ label, value }) => (
  <div>
    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-0.5">{label}</p>
    <p className="text-sm font-semibold text-gray-800">{value || <span className="text-gray-300 font-normal">Not set</span>}</p>
  </div>
);

const Input = ({ label, value, onChange, type = 'text', required }) => (
  <div>
    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
      {label}{required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
    />
  </div>
);

const Profile = () => {
  const user = getUser();
  const [searchParams] = useSearchParams();
  const studentId = searchParams.get('student_id');
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    title: '', first_name: '', middle_name: '', last_name: '',
    sex: '', date_of_birth: '', nationality: '', state: '',
    father_name: '', mother_name: '', contact_information: '',
    phone_number: '', address: '', registration_number: '', grade_level: '',
  });

  // Redirect admin users as profile page is not necessary for them,
  // unless they are viewing a student profile
  if (user?.role === 'admin' && !studentId) {
    return <Navigate to="/dashboard" replace />;
  }

  useEffect(() => { fetchProfile(); }, [studentId]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const url = studentId ? `/student/profile/?student_id=${studentId}` : '/student/profile/';
      const r = await api.get(url);
      setProfile(r.data);
      setForm({
        title:               r.data.profile?.title || '',
        first_name:          r.data.first_name || '',
        middle_name:         r.data.profile?.middle_name || '',
        last_name:           r.data.last_name || '',
        sex:                 r.data.profile?.sex || '',
        date_of_birth:       r.data.profile?.date_of_birth || '',
        nationality:         r.data.profile?.nationality || '',
        state:               r.data.profile?.state || '',
        father_name:         r.data.profile?.father_name || '',
        mother_name:         r.data.profile?.mother_name || '',
        contact_information: r.data.profile?.contact_information || '',
        phone_number:        r.data.profile?.phone_number || '',
        address:             r.data.profile?.address || '',
        registration_number: r.data.profile?.registration_number || '',
        grade_level:         r.data.profile?.grade_level || '',
      });
    } catch { toast.error('Failed to load profile'); }
    finally { setLoading(false); }
  };

  const handleSave = async () => {
    if (studentId) return;
    if (!form.first_name.trim() || !form.last_name.trim())
      return toast.error('First name and last name are required');
    setSaving(true);
    try {
      await api.put('/student/profile/', form);
      toast.success('Profile updated');
      setEditing(false);
      fetchProfile();
    } catch { toast.error('Failed to update profile'); }
    finally { setSaving(false); }
  };

  const set = (field) => (val) => setForm(f => ({ ...f, [field]: val }));

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600" />
    </div>
  );

  const fullName = [profile?.first_name, profile?.profile?.middle_name, profile?.last_name]
    .filter(Boolean).join(' ') || 'No name set';

  const initials = [profile?.first_name, profile?.last_name]
    .filter(Boolean).map(n => n[0].toUpperCase()).join('') || '?';

  const age = profile?.profile?.date_of_birth
    ? Math.floor((Date.now() - new Date(profile.profile.date_of_birth)) / (365.25 * 24 * 3600 * 1000))
    : null;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            {studentId ? 'Student Profile' : 'My Profile'}
          </h1>
          <p className="text-gray-500 mt-1">
            {studentId ? 'Viewing student information' : 'View and update your personal information'}
          </p>
        </div>
        {!editing && !studentId && (
          <button onClick={() => setEditing(true)}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-colors shadow-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit Profile
          </button>
        )}
      </div>

      {/* Profile card */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">

        {/* Banner + avatar */}
        <div className="h-28 bg-gradient-to-r from-[#2D1B4D] to-[#4B2D7F] px-6 flex items-end pb-3">
          <div className="flex items-end gap-4">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#9F7AEA] to-[#6B46C1] flex items-center justify-center text-white text-2xl font-bold border-4 border-white/20 shadow-lg flex-shrink-0 mb-[-2.5rem]">
              {initials}
            </div>
            <div className="pb-1">
              <h2 className="text-xl font-bold" style={{ color: '#ffffff' }}>{fullName}</h2>
              <div className="flex flex-wrap gap-2 mt-0.5">
                <span className="text-xs capitalize font-medium" style={{ color: '#e9d5ff' }}>{user?.role}</span>
                <span className="text-xs" style={{ color: '#c4b5fd' }}>{profile?.email}</span>
                {profile?.profile?.registration_number && (
                  <span className="text-xs font-mono" style={{ color: '#c4b5fd' }}>LRN: {profile.profile.registration_number}</span>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="px-6 pb-6 pt-14">

          {editing ? (
            /* ── Edit form ── */
            <div className="space-y-6">
              {/* Name */}
              <div>
                <h3 className="text-sm font-bold text-gray-700 mb-3 pb-1 border-b border-gray-100">Name</h3>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  {user?.role === 'teacher' && (
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Title</label>
                      <select value={form.title} onChange={e => set('title')(e.target.value)}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm">
                        <option value="">Select</option>
                        <option value="Mr.">Mr.</option>
                        <option value="Ms.">Ms.</option>
                        <option value="Mrs.">Mrs.</option>
                        <option value="Dr.">Dr.</option>
                        <option value="Prof.">Prof.</option>
                      </select>
                    </div>
                  )}
                  <div className={user?.role === 'teacher' ? 'sm:col-span-1' : 'sm:col-span-1'}>
                    <Input label="First Name" value={form.first_name} onChange={set('first_name')} required />
                  </div>
                  <Input label="Middle Name" value={form.middle_name} onChange={set('middle_name')} />
                  <Input label="Last Name" value={form.last_name} onChange={set('last_name')} required />
                </div>
              </div>

              {/* Personal */}
              <div>
                <h3 className="text-sm font-bold text-gray-700 mb-3 pb-1 border-b border-gray-100">Personal Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Sex</label>
                    <select value={form.sex} onChange={e => set('sex')(e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm">
                      <option value="">Select</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <Input label="Date of Birth" value={form.date_of_birth} onChange={set('date_of_birth')} type="date" />
                  <Input label="Nationality" value={form.nationality} onChange={set('nationality')} />
                  <Input label="Province / State" value={form.state} onChange={set('state')} />
                </div>
              </div>

              {/* Family */}
              <div>
                <h3 className="text-sm font-bold text-gray-700 mb-3 pb-1 border-b border-gray-100">Family</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="Father's Name" value={form.father_name} onChange={set('father_name')} />
                  <Input label="Mother's Name" value={form.mother_name} onChange={set('mother_name')} />
                </div>
              </div>

              {/* School */}
              <div>
                <h3 className="text-sm font-bold text-gray-700 mb-3 pb-1 border-b border-gray-100">School</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="LRN (Learner Reference Number)" value={form.registration_number} onChange={set('registration_number')} />
                  <Input label="Grade Level" value={form.grade_level} onChange={set('grade_level')} />
                </div>
              </div>

              {/* Contact */}
              <div>
                <h3 className="text-sm font-bold text-gray-700 mb-3 pb-1 border-b border-gray-100">Contact</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="Phone Number" value={form.phone_number} onChange={set('phone_number')} />
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Address</label>
                    <textarea value={form.address} onChange={e => set('address')(e.target.value)} rows={2}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm resize-none" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Emergency Contact</label>
                    <textarea value={form.contact_information} onChange={e => set('contact_information')(e.target.value)} rows={2}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm resize-none"
                      placeholder="Name, relationship, phone number..." />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button onClick={handleSave} disabled={saving}
                  className="flex-1 sm:flex-none bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white font-medium py-2.5 px-6 rounded-lg transition-colors text-sm">
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button onClick={() => setEditing(false)}
                  className="flex-1 sm:flex-none bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2.5 px-6 rounded-lg transition-colors text-sm">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            /* ── View mode ── */
            <div className="space-y-6">
              {/* Personal */}
              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Personal Information</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4">
                  {user?.role === 'teacher' && <Field label="Title" value={profile?.profile?.title} />}
                  <Field label="First Name"   value={profile?.first_name} />
                  <Field label="Middle Name"  value={profile?.profile?.middle_name} />
                  <Field label="Last Name"    value={profile?.last_name} />
                  <Field label="Sex"          value={profile?.profile?.sex ? profile.profile.sex.charAt(0).toUpperCase() + profile.profile.sex.slice(1) : null} />
                  <Field label="Date of Birth" value={profile?.profile?.date_of_birth
                    ? new Date(profile.profile.date_of_birth + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                    : null} />
                  <Field label="Age"          value={age !== null ? `${age} years old` : null} />
                  <Field label="Nationality"  value={profile?.profile?.nationality} />
                  <Field label="Province / State" value={profile?.profile?.state} />
                </div>
              </div>

              <div className="border-t border-gray-100" />

              {/* Family */}
              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Family</h3>
                <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                  <Field label="Father's Name" value={profile?.profile?.father_name} />
                  <Field label="Mother's Name" value={profile?.profile?.mother_name} />
                </div>
              </div>

              <div className="border-t border-gray-100" />

              {/* Contact */}
              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Contact</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                  <Field label="Email"        value={profile?.email} />
                  <Field label="Phone Number" value={profile?.profile?.phone_number} />
                  <div className="sm:col-span-2">
                    <Field label="Address"    value={profile?.profile?.address} />
                  </div>
                  <div className="sm:col-span-2">
                    <Field label="Emergency Contact" value={profile?.profile?.contact_information} />
                  </div>
                </div>
              </div>

              {(profile?.profile?.registration_number || profile?.profile?.grade_level) && (
                <>
                  <div className="border-t border-gray-100" />
                  <div>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">School</h3>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                      <Field label="LRN" value={profile?.profile?.registration_number} />
                      <Field label="Grade Level" value={profile?.profile?.grade_level} />
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
