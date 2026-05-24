import { useState, useEffect } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { getUser } from '../utils/auth';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';

const Field = ({ label, value }) => (
  <div>
    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</p>
    <p className="text-sm font-semibold text-slate-800">{value || <span className="text-slate-300 font-normal italic">Not set</span>}</p>
  </div>
);

const Input = ({ label, value, onChange, type = 'text', required }) => (
  <div>
    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
      {label}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-white text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 transition-all"
    />
  </div>
);

const Profile = () => {
  const user = getUser();
  const { refreshUser } = useAuth();
  const [searchParams] = useSearchParams();
  const studentId = searchParams.get('student_id');
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [profilePic, setProfilePic] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    title: '', first_name: '', middle_name: '', last_name: '', email: '',
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
      setProfilePic(r.data.profile?.profile_picture);
      setForm({
        title:               r.data.profile?.title || '',
        first_name:          r.data.first_name || '',
        middle_name:         r.data.profile?.middle_name || '',
        last_name:           r.data.last_name || '',
        email:               r.data.email || '',
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

  const handleProfilePicUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('profile_picture', file);

    setUploading(true);
    try {
      const url = studentId ? `/student/profile/?student_id=${studentId}` : '/student/profile/';
      const response = await api.post(url, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setProfilePic(response.data.profile_picture);
      toast.success('Profile picture updated');
      if (!studentId) refreshUser();
    } catch (err) {
      toast.error('Failed to upload picture');
    } finally {
      setUploading(false);
    }
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
      refreshUser();
      fetchProfile();
    } catch { toast.error('Failed to update profile'); }
    finally { setSaving(false); }
  };

  const set = (field) => (val) => setForm(f => ({ ...f, [field]: val }));

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="relative w-10 h-10">
        <div className="absolute inset-0 rounded-full border-2 border-slate-100" />
        <div className="absolute inset-0 rounded-full border-2 border-violet-600 border-t-transparent animate-spin" />
      </div>
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
    <div className="space-y-5 animate-fade-in">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            {studentId ? 'Student Profile' : 'My Profile'}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {studentId ? 'Viewing student information' : 'View and update your personal information'}
          </p>
        </div>
        {!editing && !studentId && (
          <button
            onClick={() => setEditing(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-bold hover:bg-violet-700 active:scale-95 transition-all shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit Profile
          </button>
        )}
      </div>

      {/* ── Profile card ── */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">

        {/* Banner + avatar */}
        <div className="h-28 bg-[#1A0B2E] px-6 flex items-end pb-3 relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
          <div className="absolute top-0 right-0 w-48 h-48 bg-violet-600/15 rounded-full translate-x-1/3 -translate-y-1/3 blur-2xl pointer-events-none" />
          <div className="relative flex items-end gap-4">
            <div className="relative group/avatar">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-black border-4 border-white/20 shadow-xl flex-shrink-0 mb-[-2.5rem] overflow-hidden">
                {profilePic ? (
                  <img src={profilePic} alt="Profile" className="w-full h-full object-cover" />
                ) : initials}
                {!studentId && (
                  <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity cursor-pointer z-10">
                    <input type="file" className="hidden" accept="image/*" onChange={handleProfilePicUpload} />
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </label>
                )}
              </div>
              {uploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-2xl mb-[-2.5rem]">
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
            <div className="pb-1">
              <h2 className="text-xl font-black text-white">{fullName}</h2>
              <div className="flex flex-wrap gap-2 mt-0.5">
                <span className="text-xs font-bold capitalize text-violet-300">{user?.role}</span>
                <span className="text-xs text-violet-300/70">{profile?.email}</span>
                {profile?.profile?.registration_number && (
                  <span className="text-xs font-mono text-violet-300/70">LRN: {profile.profile.registration_number}</span>
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
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 pb-2 border-b border-slate-100">Name</h3>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  {user?.role === 'teacher' && (
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Title</label>
                      <select value={form.title} onChange={e => set('title')(e.target.value)}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 transition-all">
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
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 pb-2 border-b border-slate-100">Personal Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Sex</label>
                    <select value={form.sex} onChange={e => set('sex')(e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 transition-all">
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
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 pb-2 border-b border-slate-100">Family</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="Father's Name" value={form.father_name} onChange={set('father_name')} />
                  <Input label="Mother's Name" value={form.mother_name} onChange={set('mother_name')} />
                </div>
              </div>

              {/* School */}
              <div>
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 pb-2 border-b border-slate-100">School</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="LRN (Learner Reference Number)" value={form.registration_number} onChange={set('registration_number')} />
                  <Input label="Grade Level" value={form.grade_level} onChange={set('grade_level')} />
                </div>
              </div>

              {/* Contact */}
              <div>
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 pb-2 border-b border-slate-100">Contact</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="Email Address (Optional)" value={form.email} onChange={set('email')} type="email" />
                  <Input label="Phone Number" value={form.phone_number} onChange={set('phone_number')} />
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Address</label>
                    <textarea value={form.address} onChange={e => set('address')(e.target.value)} rows={2}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 transition-all resize-none" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Emergency Contact</label>
                    <textarea value={form.contact_information} onChange={e => set('contact_information')(e.target.value)} rows={2}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 transition-all resize-none"
                      placeholder="Name, relationship, phone number…" />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button onClick={handleSave} disabled={saving}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-bold hover:bg-violet-700 active:scale-95 transition-all disabled:opacity-50">
                  {saving && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
                <button onClick={() => setEditing(false)}
                  className="px-6 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-sm font-bold hover:bg-slate-200 active:scale-95 transition-all">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            /* ── View mode ── */
            <div className="space-y-6">
              {/* Personal */}
              <div>
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Personal Information</h3>
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

              <div className="border-t border-slate-100" />

              {/* Family */}
              <div>
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Family</h3>
                <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                  <Field label="Father's Name" value={profile?.profile?.father_name} />
                  <Field label="Mother's Name" value={profile?.profile?.mother_name} />
                </div>
              </div>

              <div className="border-t border-slate-100" />

              {/* Contact */}
              <div>
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Contact</h3>
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
                  <div className="border-t border-slate-100" />
                  <div>
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">School</h3>
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
