import { useState, useEffect } from 'react';
import api from '../utils/api';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';

const COLORS = ['#16a34a', '#2563eb', '#0891b2', '#d97706', '#dc2626'];

const GradeDistribution = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [academicYear, setAcademicYear] = useState(localStorage.getItem('knhs_academic_year') || '2025-2026');
  const [filterLevel, setFilterLevel] = useState('all');
  const [filterSubject, setFilterSubject] = useState('all');
  const [filterQuarter, setFilterQuarter] = useState('all');

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/grade-distribution/?academic_year=${academicYear}&grade_level=${filterLevel}&subject_id=${filterSubject}&quarter=${filterQuarter}`);
      setData(res.data);
    } catch (err) {
      console.error('Failed to fetch distribution stats', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [academicYear, filterLevel, filterSubject, filterQuarter]);

  const meta = data?.meta || { subjects: [], grade_levels: [] };

  // Group subjects by grade level for the dropdown
  const subjectsByLevel = meta.subjects.reduce((acc, s) => {
    const level = s.grade_level || 'Other';
    if (!acc[level]) acc[level] = [];
    acc[level].push(s);
    return acc;
  }, {});

  const handleLevelChange = (level) => {
    setFilterLevel(level);
    if (level === 'all') return;
    
    // Check if current subject belongs to the selected level
    const levelSubjects = meta.subjects.filter(s => s.grade_level === level);
    const isSubjectInLevel = levelSubjects.some(s => String(s.id) === String(filterSubject));
    
    if (!isSubjectInLevel) {
      setFilterSubject('all');
    }
  };

  const handleYearChange = (dir) => {
    const [start, end] = academicYear.split('-').map(Number);
    const newYear = dir === 'next' ? `${start + 1}-${end + 1}` : `${start - 1}-${end - 1}`;
    setAcademicYear(newYear);
    localStorage.setItem('knhs_academic_year', newYear);
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-2">
        <div className="text-center lg:text-left">
          <h1 className="text-2xl md:text-3xl font-black text-gray-800 tracking-tight">Grade Analytics</h1>
          <p className="text-gray-500 text-sm md:text-base mt-1 font-medium">Academic performance overview for {academicYear}</p>
        </div>
        
        <div className="flex flex-wrap items-center justify-center lg:justify-end gap-3 bg-white p-3 rounded-2xl border border-gray-100 shadow-sm">
          {/* Grade Level Filter */}
          <div className="relative group flex-1 min-w-[140px]">
            <select 
              value={filterLevel} 
              onChange={e => handleLevelChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-[13px] font-bold focus:ring-2 focus:ring-purple-500 outline-none bg-white shadow-sm transition-all hover:border-purple-300 appearance-none pr-10 cursor-pointer"
            >
              <option value="all">All Grade Levels</option>
              {meta.grade_levels.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 group-hover:text-purple-500 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
            </div>
          </div>

          {/* Subject Filter */}
          <div className="relative group flex-1 min-w-[140px]">
            <select 
              value={filterSubject} 
              onChange={e => setFilterSubject(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-[13px] font-bold focus:ring-2 focus:ring-purple-500 outline-none bg-white shadow-sm transition-all hover:border-purple-300 appearance-none pr-10 cursor-pointer disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed"
              disabled={filterLevel === 'all'}
            >
              <option value="all">{filterLevel === 'all' ? 'Select Level First' : 'All Subjects'}</option>
              {filterLevel !== 'all' && Object.keys(subjectsByLevel)
                .filter(level => level === filterLevel)
                .sort((a, b) => {
                  const numA = parseInt(a.match(/\d+/)?.[0] || '999');
                  const numB = parseInt(b.match(/\d+/)?.[0] || '999');
                  return numA - numB;
                }).map(level => (
                  <optgroup key={level} label={level}>
                    {subjectsByLevel[level].map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </optgroup>
                ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 group-hover:text-purple-500 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
            </div>
          </div>

          {/* Quarter Filter */}
          <div className="relative group flex-1 min-w-[140px]">
            <select 
              value={filterQuarter} 
              onChange={e => setFilterQuarter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-[13px] font-bold focus:ring-2 focus:ring-purple-500 outline-none bg-white shadow-sm transition-all hover:border-purple-300 appearance-none pr-10 cursor-pointer"
            >
              <option value="all">All Quarters</option>
              <option value="1">Q1 — 1st Quarter</option>
              <option value="2">Q2 — 2nd Quarter</option>
              <option value="3">Q3 — 3rd Quarter</option>
              <option value="4">Q4 — 4th Quarter</option>
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 group-hover:text-purple-500 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
            </div>
          </div>

          <YearSelector academicYear={academicYear} onYearChange={handleYearChange} />
        </div>
      </div>

      {!data || data.total_students === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-16 text-center text-gray-400 shadow-sm animate-in zoom-in-95 duration-500">
           <svg className="w-16 h-16 mx-auto mb-4 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
          <p className="text-lg font-bold text-gray-500">No Analytics Data</p>
          <p className="text-sm font-medium mt-1">There are no grade records matching your current filter selection.</p>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm transition-all hover:shadow-md group">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-purple-50 rounded-xl text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-all">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                </div>
                <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full uppercase tracking-wider">Transmuted</span>
              </div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Overall Average</p>
              <div className="flex items-baseline gap-1 mt-1">
                <p className="text-4xl font-black text-gray-800">{data.overall_average}</p>
                <p className="text-xs text-gray-400 font-bold opacity-60">/ 100</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm transition-all hover:shadow-md group">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-50 rounded-xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                </div>
                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full uppercase tracking-wider">Students</span>
              </div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Total Graded</p>
              <p className="text-4xl font-black text-gray-800 mt-1">{data.total_students}</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm transition-all hover:shadow-md group relative overflow-hidden sm:col-span-2 lg:col-span-1">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-green-50 rounded-xl text-green-600 group-hover:bg-green-600 group-hover:text-white transition-all">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                </div>
                <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full uppercase tracking-wider">Entries</span>
              </div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Total Grade Records</p>
              <p className="text-4xl font-black text-gray-800 mt-1">{data.total_entries}</p>
              {loading && <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] animate-pulse flex items-center justify-center text-[10px] text-purple-600 font-black uppercase tracking-widest">Refreshing Data...</div>}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pie Chart: Overall Categories */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm transition-all hover:shadow-md border-t-4 border-t-emerald-500">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-800">Performance Categories</h3>
              <p className="text-[11px] text-gray-400 font-medium">Distribution of achievement levels</p>
            </div>
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600 border border-emerald-100" title="Distribution of Student General Averages">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
          </div>
          <div className="h-[350px] relative min-w-0">
            <ResponsiveContainer width="100%" height="100%" debounce={1}>
              <PieChart>
                <Pie
                  data={data.category_counts}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={110}
                  paddingAngle={5}
                  dataKey="value"
                  animationBegin={200}
                  animationDuration={1200}
                  stroke="none"
                >
                  {data.category_counts.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[index % COLORS.length]} 
                      className="hover:opacity-80 transition-opacity outline-none cursor-pointer" 
                    />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '12px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    padding: '12px'
                  }}
                  itemStyle={{ fontWeight: '700', fontSize: '13px' }}
                />
                <Legend 
                  layout="horizontal" 
                  verticalAlign="bottom" 
                  align="center"
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ paddingTop: '30px', fontSize: '11px', fontWeight: '700', color: '#64748b' }}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Center Summary */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 mt-[-20px] text-center pointer-events-none">
              <p className="text-3xl font-black text-gray-800 leading-none">{data.total_students}</p>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Students</p>
            </div>
          </div>
        </div>

        {/* Bar Chart: Level/Classroom Comparison */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm transition-all hover:shadow-md border-t-4 border-t-purple-500">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-800">
                Average by {filterLevel === 'all' ? 'Grade Level' : 'Classroom'}
              </h3>
              <p className="text-[11px] text-gray-400 font-medium">Comparative performance across groups</p>
            </div>
            <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded-lg border border-purple-100">Comparative View</span>
          </div>
          <div className="h-[350px] min-w-0">
            <ResponsiveContainer width="100%" height="100%" debounce={1}>
              <BarChart data={data.by_level} margin={{ top: 10, right: 10, left: -15, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="label" 
                  fontSize={10} 
                  fontWeight="700"
                  axisLine={false}
                  tickLine={false}
                  interval={0} 
                  angle={-35} 
                  textAnchor="end"
                  height={50}
                  tick={{ fill: '#64748b' }}
                />
                <YAxis 
                  domain={[70, 100]} 
                  axisLine={false}
                  tickLine={false}
                  fontSize={10}
                  fontWeight="600"
                  tick={{ fill: '#94a3b8' }}
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc', radius: 4 }}
                  contentStyle={{ 
                    borderRadius: '12px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    padding: '12px'
                  }}
                  itemStyle={{ fontWeight: '700', fontSize: '12px' }}
                />
                <Bar dataKey="average" fill="#8b5cf6" radius={[6, 6, 0, 0]} barSize={filterLevel === 'all' ? 45 : 30}>
                  {data.by_level.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.average >= 90 ? '#10b981' : entry.average >= 75 ? '#8b5cf6' : '#ef4444'} 
                      fillOpacity={0.9}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Horizontal Bar: Subject/Classroom Performance */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm transition-all hover:shadow-md lg:col-span-2 border-t-4 border-t-indigo-500">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-bold text-gray-800">
                {filterSubject === 'all' ? 'Top 10 Performing Subjects' : `Top 10 Classrooms in ${meta.subjects.find(s => String(s.id) === String(filterSubject))?.name || ''}`}
              </h3>
              <p className="text-[11px] text-gray-400 font-medium">Ranked by average student transmuted score</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-indigo-500" />
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Average Score</span>
              </div>
              <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg border border-indigo-100">Ranking</span>
            </div>
          </div>
          <div className="h-[450px] min-w-0">
            <ResponsiveContainer width="100%" height="100%" debounce={1}>
              <BarChart 
                data={data.by_group} 
                layout="vertical"
                margin={{ left: 40, right: 30, top: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                <XAxis type="number" domain={[0, 100]} hide />
                <YAxis 
                  type="category" 
                  dataKey="code" 
                  width={100} 
                  fontSize={10} 
                  fontWeight="800"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#475569' }}
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc', radius: 4 }}
                  formatter={(value) => [`${value}%`, 'Average Score']}
                  contentStyle={{ 
                    borderRadius: '12px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    padding: '12px'
                  }}
                  itemStyle={{ fontWeight: '700', fontSize: '12px', color: '#4f46e5' }}
                />
                <Bar dataKey="average" fill="#4f46e5" radius={[0, 6, 6, 0]} barSize={28}>
                   {data.by_group.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.average >= 90 ? '#4f46e5' : '#6366f1'} 
                      opacity={1 - (index * 0.04)} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
          </div>
        </>
      )}
    </div>
  );
};

const YearSelector = ({ academicYear, onYearChange }) => (
  <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden bg-white shadow-sm transition-all focus-within:ring-2 focus-within:ring-purple-500">
    <button 
      onClick={() => onYearChange('prev')}
      className="px-3 py-2 hover:bg-gray-50 text-gray-500 border-r border-gray-200 transition-colors"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
      </svg>
    </button>
    <div className="px-4 text-center text-sm font-semibold text-gray-700 select-none min-w-[100px]">
      {academicYear}
    </div>
    <button 
      onClick={() => onYearChange('next')}
      className="px-3 py-2 hover:bg-gray-50 text-gray-500 border-l border-gray-200 transition-colors"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </button>
  </div>
);

export default GradeDistribution;
