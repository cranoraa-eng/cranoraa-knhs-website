import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { LoadingSpinner } from '../components/ui';

const DAYS = ['monday','tuesday','wednesday','thursday','friday','saturday'];
const DAY_FULL = { monday:'Monday', tuesday:'Tuesday', wednesday:'Wednesday', thursday:'Thursday', friday:'Friday', saturday:'Saturday' };
const DAY_SHORT = { monday:'Mon', tuesday:'Tue', wednesday:'Wed', thursday:'Thu', friday:'Fri', saturday:'Sat' };

const COLOR_MAP = [
  'bg-blue-50 border-blue-200 text-blue-700',
  'bg-blue-50 border-blue-200 text-blue-700',
  'bg-emerald-50 border-emerald-200 text-emerald-700',
  'bg-amber-50 border-amber-200 text-amber-700',
  'bg-rose-50 border-rose-200 text-rose-700',
  'bg-indigo-50 border-indigo-200 text-indigo-700',
];

export default function MySchedule() {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState([]);
  const [todaySchedule, setTodaySchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeDay, setActiveDay] = useState(() => {
    const d = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    return DAYS.includes(d) ? d : 'monday';
  });

  useEffect(() => {
    Promise.all([
      api.get('/schedules/my_schedule/'),
      api.get('/schedules/today/'),
    ]).then(([schRes, todayRes]) => {
      setSchedules(schRes.data);
      setTodaySchedule(todayRes.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <LoadingSpinner />
    </div>
  );

  // Group by day
  const byDay = {};
  DAYS.forEach(d => { byDay[d] = []; });
  schedules.forEach((s, idx) => {
    const d = s.time_slot_detail?.day;
    if (d) byDay[d].push({ ...s, _colorIdx: idx % COLOR_MAP.length });
  });

  const todayName = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  const isTeacher = user?.role === 'teacher';

  return (
    <div className="page-bottom-safe bg-slate-50/50">
      {/* DepEd Official Header with Government Seal */}
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 border-b-4 border-yellow-400 px-4 md:px-6 py-4 md:py-6 mb-4 md:mb-6 shadow-lg">
        <div className="max-w-[1600px] mx-auto">
          <div className="flex items-center gap-4">
            {/* Official DepEd Seal */}
            <div className="h-14 w-14 md:h-20 md:h-20 rounded-full bg-white flex items-center justify-center shrink-0 shadow-xl border-4 border-yellow-400">
              <div className="relative">
                <svg className="w-8 h-8 md:w-12 md:h-12 text-blue-900" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                </svg>
                <div className="absolute -top-1 -right-1 w-4 h-4 md:w-6 md:h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                  <svg className="w-2 h-2 md:w-3 md:h-3 text-blue-900" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                  </svg>
                </div>
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-baseline gap-2 flex-wrap">
                <h1 className="text-xl md:text-3xl font-black text-white uppercase tracking-tight">
                  My Schedule
                </h1>
                <span className="px-2 py-0.5 md:px-3 md:py-1 bg-yellow-400 text-blue-900 text-[10px] md:text-xs font-black uppercase tracking-widest rounded-md">
                  Official
                </span>
              </div>
              <p className="text-xs md:text-sm font-bold text-blue-100 uppercase tracking-wide mt-1">
                Department of Education • {isTeacher ? 'Teaching Schedule' : 'Student Class Schedule'}
              </p>
              <p className="text-[10px] md:text-xs text-blue-200 mt-1 font-medium">
                {isTeacher ? 'Faculty Timetable • KNHS Academic Affairs' : 'Class Timetable • KNHS Registrar'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-2 md:px-6 space-y-4 md:space-y-6 pb-6">
      {/* Today's Classes */}
      <div className="bg-gradient-to-br from-[#1A0B2E] to-[#2D1452] rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[10px] font-black text-blue-300 uppercase tracking-widest">Today</p>
            <h3 className="text-lg font-black">{new Date().toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric' })}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
            <svg className="w-5 h-5 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          </div>
        </div>
        {todaySchedule.length === 0 ? (
          <p className="text-blue-300 text-sm font-medium">No classes scheduled for today.</p>
        ) : (
          <div className="space-y-2">
            {todaySchedule.map(s => (
              <div key={s.id} className="flex items-center gap-4 p-3 rounded-xl bg-white/10 border border-white/10">
                <div className="text-center min-w-[60px]">
                  <p className="text-xs font-black text-blue-200">{s.time_slot_detail?.start_time_display}</p>
                  <p className="text-[9px] text-blue-400">{s.time_slot_detail?.end_time_display}</p>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">{s.subject_name}</p>
                  <p className="text-[10px] text-blue-300 truncate">
                    {isTeacher ? s.classroom_name : s.teacher_name}
                    {s.room_name ? ` · 📍 ${s.room_name}` : ''}
                  </p>
                </div>
                <span className="text-[9px] font-black text-blue-300 uppercase tracking-widest bg-white/10 px-2 py-1 rounded-lg">{s.subject_code}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Weekly View */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {/* Day Tabs */}
        <div className="flex overflow-x-auto border-b border-slate-100 scrollbar-none">
          {DAYS.map(d => {
            const count = byDay[d].length;
            const isToday = d === todayName;
            return (
              <button key={d} onClick={() => setActiveDay(d)}
                className={`flex-shrink-0 px-4 py-3 text-xs font-black uppercase tracking-widest border-b-2 transition-all relative ${
                  activeDay === d ? 'border-blue-600 text-blue-600 bg-blue-50/50' : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}>
                {DAY_SHORT[d]}
                {isToday && <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                {count > 0 && <span className="ml-1 text-[9px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full font-black">{count}</span>}
              </button>
            );
          })}
        </div>

        {/* Day Content */}
        <div className="p-4">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">{DAY_FULL[activeDay]}</p>
          {byDay[activeDay].length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-slate-300 text-sm font-bold">No classes on {DAY_FULL[activeDay]}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {byDay[activeDay].sort((a,b) => (a.time_slot_detail?.start_time||'').localeCompare(b.time_slot_detail?.start_time||'')).map(s => (
                <div key={s.id} className={`flex gap-4 p-4 rounded-2xl border ${COLOR_MAP[s._colorIdx]}`}>
                  <div className="text-center min-w-[64px]">
                    <p className="text-sm font-black">{s.time_slot_detail?.start_time_display}</p>
                    <p className="text-[10px] opacity-70">{s.time_slot_detail?.end_time_display}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-sm truncate">{s.subject_name}</p>
                    <p className="text-[11px] opacity-80 truncate mt-0.5">
                      {isTeacher ? `Section: ${s.classroom_name}` : `Teacher: ${s.teacher_name}`}
                    </p>
                    {s.room_name && <p className="text-[10px] opacity-60 mt-0.5">📍 {s.room_name}{s.room_building ? `, ${s.room_building}` : ''}</p>}
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] font-black opacity-70 uppercase tracking-widest">{s.subject_code}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 text-center">
          <p className="text-2xl font-black text-blue-600">{schedules.length}</p>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Total Classes</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 text-center">
          <p className="text-2xl font-black text-emerald-600">{todaySchedule.length}</p>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Today</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 text-center">
          <p className="text-2xl font-black text-blue-600">{DAYS.filter(d => byDay[d].length > 0).length}</p>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">School Days</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 text-center">
          <p className="text-2xl font-black text-amber-600">{new Set(schedules.map(s => s.subject_name)).size}</p>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Subjects</p>
        </div>
      </div>

      </div>
    </div>
  );
}

