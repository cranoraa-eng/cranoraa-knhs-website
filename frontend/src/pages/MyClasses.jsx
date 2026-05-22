import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { getUser } from '../utils/auth';
import toast from 'react-hot-toast';

const MyClasses = () => {
  const user = getUser();
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyClasses();
  }, []);

  const fetchMyClasses = async () => {
    try {
      // Use the dedicated endpoint for teacher's assigned subjects
      const res = await api.get('/classroom-subjects/by_teacher/');
      setAssignments(res.data);
    } catch (err) {
      toast.error('Failed to load assigned classes');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600" />
      </div>
    );
  }

  return (
    <div className="overflow-y-auto h-[calc(100vh-4rem)] p-1.5 md:p-6 space-y-4 md:space-y-8 bg-gray-50/50">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-in-up">
        <div>
          <h1 className="text-xl md:text-3xl font-black text-gray-800 tracking-tight uppercase">My Assigned Classes</h1>
          <p className="text-gray-500 text-[10px] md:text-sm font-medium uppercase tracking-[0.2em] mt-1">Classrooms and subjects you handle</p>
        </div>
      </div>

      {assignments.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-12 md:p-20 text-center animate-fade-in-up">
          <div className="w-16 h-16 md:w-24 md:h-24 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 md:w-14 md:h-14 text-purple-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h3 className="text-lg md:text-xl font-black text-gray-700 mb-2 uppercase tracking-tight">No Classes Assigned</h3>
          <p className="text-[10px] md:text-sm text-gray-400 font-bold uppercase tracking-widest leading-relaxed">
            You haven't been assigned to any classrooms yet.<br/>Please coordinate with the school administration.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 animate-fade-in-up">
          {assignments.map((a) => (
            <div key={a.id} className="bg-white border border-gray-200 rounded-2xl p-5 md:p-6 hover:shadow-xl transition-all duration-300 group relative border-t-4 border-t-indigo-500 overflow-hidden">
              {/* Classroom Info */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white font-black text-lg md:text-2xl shadow-lg">
                    {a.classroom_name?.match(/\d+/)?.[0] || 'C'}
                  </div>
                  <div>
                    <h3 className="text-sm md:text-xl font-black text-gray-800 leading-tight uppercase truncate">
                      {a.classroom_name}
                    </h3>
                    <p className="text-[8px] md:text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] mt-1">Section Assignment</p>
                  </div>
                </div>
              </div>

              {/* Subject Info */}
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 group-hover:bg-indigo-50/50 group-hover:border-indigo-100 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Teaching Subject</span>
                    <span className="text-[8px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">{a.subject_code}</span>
                  </div>
                  <h4 className="text-xs md:text-base font-black text-slate-800 uppercase tracking-tight">{a.subject_name}</h4>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => navigate('/grade-input')}
                    className="flex flex-col items-center justify-center gap-2 p-3 bg-white border border-slate-200 rounded-xl hover:bg-violet-600 hover:text-white hover:border-violet-600 transition-all active:scale-95 group/btn"
                  >
                    <svg className="w-5 h-5 text-violet-500 group-hover/btn:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    <span className="text-[9px] font-black uppercase tracking-widest">Input Grades</span>
                  </button>
                  <button
                    onClick={() => navigate('/attendance')}
                    className="flex flex-col items-center justify-center gap-2 p-3 bg-white border border-slate-200 rounded-xl hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-all active:scale-95 group/btn"
                  >
                    <svg className="w-5 h-5 text-emerald-500 group-hover/btn:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 8l2 2 4-4" />
                    </svg>
                    <span className="text-[9px] font-black uppercase tracking-widest">Attendance</span>
                  </button>
                </div>
              </div>

              {/* Decorative accent */}
              <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-indigo-50 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-700" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyClasses;
