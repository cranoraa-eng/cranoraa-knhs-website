import { useState, useEffect } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';

const RegisterSubjects = () => {
  const [assignments, setAssignments] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClassroom, setSelectedClassroom] = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/classroom-subjects/'),
      api.get('/enrollments/'),
    ])
      .then(([subRes, enrRes]) => {
        setAssignments(subRes.data);
        setEnrollments(enrRes.data);
      })
      .catch(() => toast.error('Failed to load data'))
      .finally(() => setLoading(false));
  }, []);

  // Classrooms the student is enrolled in
  const myClassrooms = [...new Map(
    enrollments.map(e => [e.classroom, { id: e.classroom, name: assignments.find(a => a.classroom === e.classroom)?.classroom_name || `Classroom ${e.classroom}` }])
  ).values()];

  const displayClassroom = selectedClassroom || myClassrooms[0]?.id;

  const subjectsForClassroom = assignments.filter(a => String(a.classroom) === String(displayClassroom));
  const enrollment = enrollments.find(e => String(e.classroom) === String(displayClassroom));

  const quarters = ['q1', 'q2', 'q3', 'q4'];
  const quarterLabels = ['Q1', 'Q2', 'Q3', 'Q4'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 rounded-full border-2 border-slate-100 border-t-violet-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-800">My Subject Load</h1>
        <p className="text-slate-500 mt-1">Your enrolled subjects and grade summary</p>
      </div>

      {myClassrooms.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-16 text-center">
          <div className="w-16 h-16 bg-violet-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-700 mb-1">Not Enrolled</h3>
          <p className="text-slate-400 text-sm">You are not enrolled in any classroom yet. Contact your school administrator.</p>
        </div>
      ) : (
        <>
          {/* Classroom selector */}
          {myClassrooms.length > 1 && (
            <div className="mb-5">
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Classroom</label>
              <select
                value={displayClassroom}
                onChange={e => setSelectedClassroom(e.target.value)}
                className="px-4 py-2.5 border border-slate-200 rounded-xl bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 transition-all"
              >
                {myClassrooms.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          )}

          {/* Grade summary card */}
          {enrollment && (
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-5 mb-5 text-white shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="font-bold text-lg">{myClassrooms.find(c => String(c.id) === String(displayClassroom))?.name}</div>
                  <div className="text-purple-200 text-sm">Current Enrollment</div>
                </div>
                {enrollment.transmuted_average && (
                  <div className="text-right">
                    <div className="text-3xl font-bold">{enrollment.transmuted_average}</div>
                    <div className="text-purple-200 text-sm">{enrollment.descriptive_equivalent || 'Average'}</div>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-4 gap-3 mt-3">
                {quarters.map((q, i) => (
                  <div key={q} className="bg-white/10 rounded-lg p-3 text-center">
                    <div className="text-xs text-purple-200 mb-1">{quarterLabels[i]}</div>
                    <div className="text-xl font-bold">{enrollment[q] ?? '—'}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Subjects list */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-semibold text-slate-800">Assigned Subjects</h2>
              <span className="text-sm text-slate-400">{subjectsForClassroom.length} subject{subjectsForClassroom.length !== 1 ? 's' : ''}</span>
            </div>

            {subjectsForClassroom.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-sm">
                No subjects assigned to this classroom yet.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {subjectsForClassroom.map((a, i) => (
                  <div key={a.id} className="flex items-center gap-4 px-6 py-4 hover:bg-violet-50 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-violet-100 text-violet-700 font-bold text-sm flex items-center justify-center flex-shrink-0">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-slate-800">{a.subject_name}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{a.subject_code}</div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-sm text-slate-600">{a.teacher_name}</div>
                      <div className="text-xs text-slate-400">Teacher</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-700">
            <strong>Note:</strong> Subject enrollment is managed by your school administrator. If you believe there is an error in your subject load, please contact your class adviser or the registrar.
          </div>
        </>
      )}
    </div>
  );
};

export default RegisterSubjects;
