import { useState, useEffect } from 'react';
import api from '../utils/api';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell
} from 'recharts';

const COLORS = ['#10b981', '#6366f1', '#3b82f6', '#f59e0b', '#ef4444'];

const renderCustomBarLabel = ({ x, y, width, value }) => (
  <text x={x + width / 2} y={y - 6} fill="#64748b" textAnchor="middle" className="text-[8px] font-black">
    {value}%
  </text>
);

const renderHorizontalBarLabel = ({ x, y, width, height, value }) => (
  <text x={x + width + 5} y={y + height / 2} fill="#64748b" dominantBaseline="central" className="text-[8px] font-black">
    {value}%
  </text>
);

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

  const subjectsByLevel = meta.subjects.reduce((acc, s) => {
    const level = s.grade_level || 'Other';
    if (!acc[level]) acc[level] = [];
    acc[level].push(s);
    return acc;
  }, {});

  const handleLevelChange = (level) => {
    setFilterLevel(level);
    if (level === 'all') return;
    const levelSubjects = meta.subjects.filter(s => s.grade_level === level);
    const isSubjectInLevel = levelSubjects.some(s => String(s.id) === String(filterSubject));
    if (!isSubjectInLevel) setFilterSubject('all');
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
        <div className="flex flex-col items-center gap-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Compiling Analytics...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-8 animate-fade-in max-w-full overflow-hidden">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 bg-slate-900 py-8 px-6 rounded-2xl border border-slate-800 shadow-2xl">
        <div className="flex-1">
          <h1 className="text-xl md:text-3xl font-black text-slate-50 tracking-tighter uppercase leading-none">Academic Intelligence</h1>
          <p className="text-slate-200 text-[10px] font-bold uppercase tracking-[0.2em] mt-3 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
            Performance Distribution Matrix — {academicYear}
          </p>
          
          <div className="flex flex-wrap gap-3 mt-8">
            <div className="relative min-w-[140px]">
              <label className="absolute -top-2 left-2 px-1 bg-slate-900 text-[8px] font-black text-slate-500 uppercase tracking-widest z-10">Grade Level</label>
              <select 
                value={filterLevel} 
                onChange={e => handleLevelChange(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-[10px] font-black text-white uppercase tracking-tight focus:border-indigo-500 outline-none transition-all appearance-none pr-8 cursor-pointer"
              >
                <option value="all">Global (All Levels)</option>
                {meta.grade_levels.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
              <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>

            <div className="relative min-w-[140px]">
              <label className="absolute -top-2 left-2 px-1 bg-slate-900 text-[8px] font-black text-slate-500 uppercase tracking-widest z-10">Subject Focus</label>
              <select 
                value={filterSubject} 
                onChange={e => setFilterSubject(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-[10px] font-black text-white uppercase tracking-tight focus:border-indigo-500 outline-none transition-all appearance-none pr-8 cursor-pointer disabled:opacity-50"
                disabled={filterLevel === 'all'}
              >
                <option value="all">{filterLevel === 'all' ? 'Select Level First' : 'Cumulative (All Subjects)'}</option>
                {filterLevel !== 'all' && Object.keys(subjectsByLevel)
                  .filter(level => level === filterLevel)
                  .map(level => (
                    <optgroup key={level} label={level}>
                      {subjectsByLevel[level].map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </optgroup>
                  ))}
              </select>
              <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>

            <div className="relative min-w-[140px]">
              <label className="absolute -top-2 left-2 px-1 bg-slate-900 text-[8px] font-black text-slate-500 uppercase tracking-widest z-10">Timeframe</label>
              <select 
                value={filterQuarter} 
                onChange={e => setFilterQuarter(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-[10px] font-black text-white uppercase tracking-tight focus:border-indigo-500 outline-none transition-all appearance-none pr-8 cursor-pointer"
              >
                <option value="all">Annual Aggregate</option>
                <option value="1">Q1 — 1st Quarter</option>
                <option value="2">Q2 — 2nd Quarter</option>
                <option value="3">Q3 — 3rd Quarter</option>
                <option value="4">Q4 — 4th Quarter</option>
              </select>
              <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>

            <YearSelector academicYear={academicYear} onYearChange={handleYearChange} />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <StatChip label="Avg Score" value={`${data?.overall_average || 0}%`} color="indigo" />
          <StatChip label="Graded" value={data?.total_students || 0} color="emerald" />
          <StatChip label="Records" value={data?.total_entries || 0} color="blue" />
        </div>
      </div>

      {!data || data.total_students === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-24 text-center shadow-sm">
          <svg className="w-16 h-16 mx-auto mb-6 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p className="text-[12px] font-black text-slate-400 uppercase tracking-[0.3em]">No Data Mapped</p>
          <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest opacity-60">Adjust filters to synthesize academic performance data</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4">
            {/* Pie Chart: Overall Categories */}
            <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
              <div className="mb-6">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Achievement Spread</h3>
                <p className="text-sm font-black text-slate-900 uppercase tracking-tight">Performance Tier Distribution</p>
              </div>
              <div className="h-72 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart margin={{ top: -20, bottom: 0 }}>
                    <Pie
                      data={data.category_counts}
                      cx="50%"
                      cy="45%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={6}
                      dataKey="value"
                    >
                      {data.category_counts.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomPieTooltip />} />
                    <Legend 
                      verticalAlign="bottom" 
                      align="center"
                      iconType="rect"
                      iconSize={4}
                      layout="vertical"
                      wrapperStyle={{ paddingTop: '10px', bottom: 0 }}
                      formatter={(value) => {
                        const item = data.category_counts.find(d => d.name === value);
                        const total = data.category_counts.reduce((sum, d) => sum + d.value, 0);
                        const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : 0;
                        return (
                          <span className="text-[7px] font-black text-slate-400 uppercase tracking-tighter">
                            {value}: {item.value} ({percentage}%)
                          </span>
                        );
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute top-[45%] left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center pointer-events-none">
                  <p className="text-2xl font-black text-slate-900 leading-none">{data.total_students}</p>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Students</p>
                </div>
              </div>
            </div>

            {/* Bar Chart: Level/Classroom Comparison */}
            <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Cross-Group Comparison</h3>
                  <p className="text-sm font-black text-slate-900 uppercase tracking-tight">
                    Performance Index by {filterLevel === 'all' ? 'Grade Level' : 'Classroom'}
                  </p>
                </div>
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-300" />
                </div>
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.by_level} margin={{ bottom: 30 }}>
                    <CartesianGrid strokeDasharray="2 2" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="label" 
                      tick={{fontSize: 8, fontWeight: 900, fill: '#64748b'}} 
                      axisLine={false}
                      tickLine={false}
                      angle={-25}
                      textAnchor="end"
                      padding={{ left: 20, right: 20 }}
                    />
                    <YAxis 
                      domain={[70, 100]} 
                      tick={{fontSize: 8, fontWeight: 900, fill: '#64748b'}} 
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={<CustomTooltip unit="%" />} />
                    <Bar 
                      dataKey="average" 
                      fill="#6366f1" 
                      radius={[2, 2, 0, 0]} 
                      barSize={data.by_level.length === 1 ? 60 : 32} 
                      label={renderCustomBarLabel}
                    >
                      {data.by_level.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.average >= 90 ? '#10b981' : entry.average >= 75 ? '#6366f1' : '#ef4444'} 
                          fillOpacity={0.8}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Horizontal Bar: Subject/Classroom Performance */}
            <div className="lg:col-span-12 bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Competitive Ranking</h3>
                  <p className="text-sm font-black text-slate-900 uppercase tracking-tight">
                    {filterSubject === 'all' ? 'Top 10 Performing Subjects' : `Top 10 Classrooms — ${meta.subjects.find(s => String(s.id) === String(filterSubject))?.name || ''}`}
                  </p>
                </div>
                <div className="px-2 py-1 bg-slate-900 rounded text-[8px] font-black text-white uppercase tracking-[0.2em]">Efficiency Leaderboard</div>
              </div>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={data.by_group} 
                    layout="vertical"
                    margin={{ left: 40, right: 60 }}
                  >
                    <CartesianGrid strokeDasharray="2 2" horizontal={true} vertical={false} stroke="#f1f5f9" />
                    <XAxis type="number" domain={[0, 100]} hide />
                    <YAxis 
                      type="category" 
                      dataKey="code" 
                      width={80} 
                      tick={{fontSize: 8, fontWeight: 900, fill: '#475569'}} 
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={<CustomTooltip unit="%" />} />
                    <Bar dataKey="average" fill="#4f46e5" radius={[0, 2, 2, 0]} barSize={20} label={renderHorizontalBarLabel}>
                      {data.by_group.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill="#4f46e5" 
                          opacity={1 - (index * 0.05)} 
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

const StatChip = ({ label, value, color }) => {
  const colors = {
    indigo: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    blue: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  };
  return (
    <div className={`px-4 py-2 rounded-xl border ${colors[color]} flex flex-col items-center min-w-[90px]`}>
      <span className="text-[8px] font-black uppercase tracking-[0.2em] leading-none mb-1.5 opacity-70">{label}</span>
      <span className="text-sm font-black leading-none">{value}</span>
    </div>
  );
};

const CustomTooltip = ({ active, payload, label, unit = '' }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-lg shadow-2xl backdrop-blur-md bg-opacity-95">
        <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{label}</p>
        <p className="text-xs font-black text-white flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
          {payload[0].value}{unit}
          <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest ml-1">{payload[0].name}</span>
        </p>
      </div>
    );
  }
  return null;
};

const CustomPieTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-lg shadow-2xl backdrop-blur-md bg-opacity-95">
        <p className="text-xs font-black text-white flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: payload[0].payload.fill }} />
          {payload[0].value}
          <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest ml-1">{payload[0].name}</span>
        </p>
      </div>
    );
  }
  return null;
};

const YearSelector = ({ academicYear, onYearChange }) => (
  <div className="flex items-center bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
    <button 
      onClick={() => onYearChange('prev')}
      className="p-2 hover:bg-slate-700 text-slate-400 border-r border-slate-700 transition-colors"
    >
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
      </svg>
    </button>
    <div className="px-3 text-[10px] font-black text-white uppercase tracking-widest min-w-[90px] text-center">
      {academicYear}
    </div>
    <button 
      onClick={() => onYearChange('next')}
      className="p-2 hover:bg-slate-700 text-slate-400 border-l border-slate-700 transition-colors"
    >
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
      </svg>
    </button>
  </div>
);

export default GradeDistribution;
