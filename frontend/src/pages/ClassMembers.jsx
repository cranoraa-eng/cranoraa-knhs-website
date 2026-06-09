import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { getUser } from '../utils/auth';
import toast from 'react-hot-toast';
import { LoadingSpinner, EmptyState } from '../components/ui';

const ClassMembers = () => {
  const user = getUser();
  const navigate = useNavigate();
  const [enrollments, setEnrollments] = useState([]);   // student's own enrollments
  const [subjects, setSubjects]       = useState([]);   // classroom-subjects
  const [loading, setLoading]         = useState(true);
  const [selectedClassroom, setSelectedClassroom] = useState(null);
  const [classmates, setClassmates]   = useState([]);

  useEffect(() => {
    // Get the student's enrollments to find their classroom(s)
    api.get('/enrollments/')
      .then(r => {
        setEnrollments(r.data);
        if (r.data.length > 0) {
          setSelectedClassroom(r.data[0]);
        }
      })
      .catch(() => toast.error('Failed to load classroom info'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedClassroom) return;
    const cid = selectedClassroom.classroom;

    // Load subjects and classmates in parallel
    Promise.all([
      api.get(`/classroom-subjects/by_classroom/?classroom_id=${cid}`),
      api.get(`/enrollments/?classroom=${cid}`),
    ]).then(([subRes, classRes]) => {
      setSubjects(subRes.data);
      setClassmates(classRes.data);
    }).catch(() => toast.error('Failed to load classroom details'));
  }, [selectedClassroom]);

  const handleStartChat = async (userId) => {
    try {
      await api.post('/chat/rooms/get_or_create_private_chat/', { user_id: userId });
      navigate('/messages');
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to start chat';
      toast.error(msg);
    }
  };

  const formatName = (fullName = '') => {
    const parts = fullName.trim().split(/\s+/);
    if (parts.length < 2) return fullName.toUpperCase();
    const last = parts.pop();
    return `${last.toUpperCase()}, ${parts.join(' ').toUpperCase()}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (enrollments.length === 0) {
    return (
      <div className="overflow-y-auto h-[calc(100vh-4rem)] p-6">
        <h1 className="text-3xl font-bold text-slate-800 mb-6">My Classroom</h1>
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-16 text-center">
          <div className="w-16 h-16 bg-violet-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-700 mb-1">Not Enrolled</h3>
          <p className="text-slate-400 text-sm">You are not enrolled in any classroom yet. Contact your school administrator.</p>
        </div>
      </div>
    );
  }

  const classroom = selectedClassroom;

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-800">My Classroom</h1>
        <p className="text-slate-500 mt-1">Your class information, subjects, and classmates</p>
      </div>

      {/* Classroom selector if enrolled in multiple */}
      {enrollments.length > 1 && (
        <div className="mb-5">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Select Classroom</label>
          <select
            value={selectedClassroom?.classroom}
            onChange={e => setSelectedClassroom(enrollments.find(en => String(en.classroom) === e.target.value))}
            className="px-4 py-2.5 border border-slate-200 rounded-xl bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 transition-all"
          >
            {enrollments.map(en => (
              <option key={en.classroom} value={en.classroom} className="text-slate-800">{en.classroom_name || `Classroom ${en.classroom}`}</option>
            ))}
          </select>
        </div>
      )}

      {/* Classroom info banner */}
      <div className="bg-gradient-to-r from-[#2D1B4D] to-[#4B2D7F] rounded-2xl p-6 text-white shadow-lg mb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center text-2xl font-bold flex-shrink-0">
            {classroom?.classroom_name?.match(/\d+/)?.[0] || '?'}
          </div>
          <div>
            <h2 className="text-xl font-bold" style={{ color: '#ffffff' }}>{classroom?.classroom_name || `Classroom ${classroom?.classroom}`}</h2>
            <div className="flex flex-wrap gap-4 mt-2 text-violet-200 text-sm">
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Adviser: <span className="text-white font-bold">{classroom?.classroom_advisor || 'No Adviser'}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {classmates.length} student{classmates.length !== 1 ? 's' : ''}
              </span>
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                {subjects.length} subject{subjects.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subjects */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-violet-50 to-indigo-50">
            <h3 className="font-semibold text-slate-800">Subjects & Teachers</h3>
            <p className="text-xs text-slate-400 mt-0.5">{subjects.length} subject{subjects.length !== 1 ? 's' : ''} this year</p>
          </div>
          {subjects.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-sm">No subjects assigned yet.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {subjects.map((s, i) => (
                <div key={s.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-violet-50 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-slate-800 text-sm">{s.subject_name}</div>
                    <div className="text-xs text-slate-400">{s.subject_code}</div>
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-medium text-slate-600">{s.teacher_name}</div>
                    <div className="text-xs text-slate-400">Teacher</div>
                  </div>
                  {s.teacher && user?.id !== s.teacher && (
                    <button 
                      onClick={() => handleStartChat(s.teacher)}
                      className="p-1.5 text-violet-600 hover:bg-violet-100 rounded-lg transition-all active:scale-95"
                      title="Send Message"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Classmates */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-violet-50 to-indigo-50">
            <h3 className="font-semibold text-slate-800">Classmates</h3>
            <p className="text-xs text-slate-400 mt-0.5">{classmates.length} student{classmates.length !== 1 ? 's' : ''} enrolled</p>
          </div>
          {classmates.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-sm">No classmates found.</div>
          ) : (
            <div className="divide-y divide-slate-100 max-h-[420px] overflow-y-auto">
              {classmates.sort((a, b) => {
                const sexOrder = { 'female': 1, 'male': 2, 'other': 3 };
                const sexA = sexOrder[a.student_sex?.toLowerCase()] || 4;
                const sexB = sexOrder[b.student_sex?.toLowerCase()] || 4;
                if (sexA !== sexB) return sexA - sexB;
                return formatName(a.student_name).localeCompare(formatName(b.student_name));
              }).map((m, i) => {
                const name = formatName(m.student_name || `Student ${m.student}`);
                const initials = name.split(', ').reverse().join(' ').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
                return (
                  <div key={m.id} className="flex items-center gap-3 px-5 py-3 hover:bg-violet-50 transition-colors">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0 shadow-sm ${
                      m.student_sex?.toLowerCase() === 'female' 
                        ? 'bg-rose-400' 
                        : 'bg-violet-400'
                    }`}>
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-slate-800 text-xs md:text-sm uppercase tracking-tight">{name}</div>
                      <div className="text-[10px] text-slate-400 font-medium">{m.student_email}</div>
                    </div>
                    {user?.id !== m.student && (
                      <button 
                        onClick={() => handleStartChat(m.student)}
                        className="p-1.5 text-violet-600 hover:bg-violet-100 rounded-lg transition-all active:scale-95"
                        title="Send Message"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                      </button>
                    )}
                    <span className="text-xs text-slate-400 ml-2">#{i + 1}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClassMembers;
