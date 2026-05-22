import { useState, useEffect } from 'react';
import api from '../utils/api';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  PieChart, Pie, Cell, BarChart, Bar, Legend 
} from 'recharts';
import { Spinner } from '../components/Spinner';

const COLORS = ['#8b5cf6', '#10b981', '#3b82f6', '#f59e0b', '#ef4444'];

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

const Analytics = () => {
  const [activeTab, setActiveTab] = useState('system');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Grade specific filters
  const [gradeData, setGradeData] = useState(null);
  const [gradeLoading, setGradeLoading] = useState(false);
  const [academicYear, setAcademicYear] = useState(localStorage.getItem('knhs_academic_year') || '2025-2026');
  const [filterLevel, setFilterLevel] = useState('all');
  const [filterSubject, setFilterSubject] = useState('all');
  const [filterQuarter, setFilterQuarter] = useState('all');

  // Attendance specific data
  const [attendanceAnalytics, setAttendanceAnalytics] = useState(null);
  const [attendanceLoading, setAttendanceLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'system') fetchAnalytics();
    if (activeTab === 'grades') fetchGradeStats();
    if (activeTab === 'attendance') fetchAttendanceAnalytics();
  }, [activeTab, academicYear, filterLevel, filterSubject, filterQuarter]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const [dashboardRes, attendanceRes, gradeRes] = await Promise.all([
        api.get('/admin/stats/'),
        api.get('/attendance/summary/'),
        api.get('/grades/summary/')
      ]);
      
      setData({
        dashboard: dashboardRes.data,
        attendance: attendanceRes.data,
        grades: gradeRes.data
      });
    } catch (error) {
      console.error('Failed to load system analytics', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchGradeStats = async () => {
    setGradeLoading(true);
    try {
      const res = await api.get(`/admin/grade-distribution/?academic_year=${academicYear}&grade_level=${filterLevel}&subject_id=${filterSubject}&quarter=${filterQuarter}`);
      setGradeData(res.data);
    } catch (err) {
      console.error('Failed to fetch distribution stats', err);
    } finally {
      setGradeLoading(false);
    }
  };

  const fetchAttendanceAnalytics = async () => {
    setAttendanceLoading(true);
    try {
      const res = await api.get('/attendance/summary/');
      setAttendanceAnalytics(res.data);
    } catch (err) {
      console.error('Failed to fetch attendance analytics', err);
    } finally {
      setAttendanceLoading(false);
    }
  };

  const handleLevelChange = (level) => {
    setFilterLevel(level);
    if (level === 'all') return;
    const meta = gradeData?.meta || { subjects: [] };
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

  const tabs = [
    { id: 'system', label: 'System Overview', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
    { id: 'grades', label: 'Academic Performance', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
    { id: 'attendance', label: 'Attendance Dynamics', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
  ];

  return (
    <div className="space-y-4 pb-8 animate-fade-in max-w-full overflow-hidden">
      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 bg-slate-100/50 p-1 rounded-xl border border-slate-200 w-fit">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
              activeTab === tab.id 
                ? 'bg-slate-900 text-white shadow-lg' 
                : 'text-slate-500 hover:bg-slate-200'
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={tab.icon} />
            </svg>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'system' && (
        <div className="space-y-4 animate-fade-in">
          {!data && loading ? <Spinner /> : (
            <>
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-slate-900 p-8 rounded-2xl border border-slate-800 shadow-2xl">
                <div>
                  <h1 className="text-xl md:text-3xl font-black text-slate-50 tracking-tighter uppercase leading-none">System Intelligence</h1>
                  <p className="text-slate-300 text-[10px] font-bold uppercase tracking-[0.2em] mt-3 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                    Live Portal Performance Metrics
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <StatChip label="Users" value={data?.dashboard?.active_users || 0} color="emerald" />
                  <StatChip label="Avg Grade" value={`${data?.dashboard?.average_grade?.toFixed(1) || 0}%`} color="purple" />
                  <StatChip label="Attendance" value={`${data?.dashboard?.today_rate || 0}%`} color="blue" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                <MiniCard title="Total Students" value={data?.dashboard?.total_students} icon="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                <MiniCard title="Total Faculty" value={data?.dashboard?.total_teachers} icon="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                <MiniCard title="Active Classes" value={data?.dashboard?.total_classes} icon="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                <MiniCard title="Pending Tasks" value={data?.dashboard?.pending_approvals} icon="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" alert={data?.dashboard?.pending_approvals > 0} />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                <AttendanceSection data={data?.attendance?.daily_trends} />
                <GradeMatrixSection gradeDistribution={[
                  { name: 'Outstanding', value: data?.grades?.distribution?.outstanding || 0 },
                  { name: 'Very Satisfactory', value: data?.grades?.distribution?.very_satisfactory || 0 },
                  { name: 'Satisfactory', value: data?.grades?.distribution?.satisfactory || 0 },
                  { name: 'Fairly Satisfactory', value: data?.grades?.distribution?.fairly_satisfactory || 0 },
                  { name: 'Failed', value: data?.grades?.distribution?.failed || 0 },
                ]} />
                <SubjectPerformanceSection data={data?.grades?.subject_stats} />
                <TrafficIntelligenceSection data={data?.dashboard?.charts?.active_users_trends} />
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === 'grades' && (
        <div className="space-y-4 animate-fade-in">
          {gradeLoading && !gradeData ? <Spinner /> : (
            <>
              <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 bg-slate-900 py-8 px-6 rounded-2xl border border-slate-800 shadow-2xl">
                <div className="flex-1">
                  <h1 className="text-xl md:text-3xl font-black text-slate-50 tracking-tighter uppercase leading-none">Academic Intelligence</h1>
                  <p className="text-slate-200 text-[10px] font-bold uppercase tracking-[0.2em] mt-3 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
                    Performance Distribution Matrix — {academicYear}
                  </p>
                  
                  <div className="flex flex-wrap gap-3 mt-8">
                    <FilterSelect 
                      label="Grade Level" 
                      value={filterLevel} 
                      onChange={e => handleLevelChange(e.target.value)}
                      options={[{ value: 'all', label: 'Global (All Levels)' }, ...(gradeData?.meta?.grade_levels || []).map(l => ({ value: l, label: l }))]}
                    />
                    <SubjectFilterSelect 
                      value={filterSubject} 
                      onChange={e => setFilterSubject(e.target.value)}
                      filterLevel={filterLevel}
                      gradeData={gradeData}
                    />
                    <FilterSelect 
                      label="Timeframe" 
                      value={filterQuarter} 
                      onChange={e => setFilterQuarter(e.target.value)}
                      options={[
                        { value: 'all', label: 'Annual Aggregate' },
                        { value: '1', label: 'Q1 — 1st Quarter' },
                        { value: '2', label: 'Q2 — 2nd Quarter' },
                        { value: '3', label: 'Q3 — 3rd Quarter' },
                        { value: '4', label: 'Q4 — 4th Quarter' }
                      ]}
                    />
                    <YearSelector academicYear={academicYear} onYearChange={handleYearChange} />
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <StatChip label="Avg Score" value={`${gradeData?.overall_average || 0}%`} color="indigo" />
                  <StatChip label="Graded" value={gradeData?.total_students || 0} color="emerald" />
                  <StatChip label="Records" value={gradeData?.total_entries || 0} color="blue" />
                </div>
              </div>

              {!gradeData || gradeData.total_students === 0 ? (
                <EmptyState message="No Data Mapped" submessage="Adjust filters to synthesize academic performance data" />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4">
                  <GradeDistributionPieSection data={gradeData.category_counts} totalStudents={gradeData.total_students} />
                  <GradeDistributionBarSection data={gradeData.by_level} filterLevel={filterLevel} />
                  <GradeRankingSection data={gradeData.by_group} filterSubject={filterSubject} meta={gradeData.meta} />
                </div>
              )}
            </>
          )}
        </div>
      )}

      {activeTab === 'attendance' && (
        <div className="space-y-4 animate-fade-in">
          {attendanceLoading && !attendanceAnalytics ? <Spinner /> : (
            <>
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-slate-900 p-8 rounded-2xl border border-slate-800 shadow-2xl">
                <div>
                  <h1 className="text-xl md:text-3xl font-black text-slate-50 tracking-tighter uppercase leading-none">Attendance Dynamics</h1>
                  <p className="text-slate-300 text-[10px] font-bold uppercase tracking-[0.2em] mt-3 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                    Student Presence & Engagement Analytics
                  </p>
                </div>
              </div>

              {!attendanceAnalytics ? (
                <EmptyState message="Failed to load attendance engine" />
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                  <AttendanceTrendsSection data={attendanceAnalytics.daily_trends} />
                  <AttendanceRankingsSection rankings={attendanceAnalytics.section_rankings} />
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

// --- Sub-components to keep Analytics.jsx clean ---

const AttendanceSection = ({ data }) => (
  <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
    <div className="flex items-center justify-between mb-6">
      <div>
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Attendance Dynamics</h3>
        <p className="text-sm font-black text-slate-900 uppercase tracking-tight">30-Day Presence Analytics</p>
      </div>
      <div className="px-2 py-1 bg-slate-50 border border-slate-100 rounded text-[8px] font-black text-slate-500 uppercase tracking-widest">Historical Data</div>
    </div>
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorAtt" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="2 2" vertical={false} stroke="#f1f5f9" />
          <XAxis 
            dataKey="date" 
            tick={{fontSize: 8, fontWeight: 900, fill: '#64748b'}} 
            axisLine={false} 
            tickLine={false} 
            tickFormatter={(str) => str ? new Date(str).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''} 
          />
          <YAxis tick={{fontSize: 8, fontWeight: 900, fill: '#64748b'}} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip />} cursor={{stroke: '#6366f1', strokeWidth: 1, strokeDasharray: '4 4'}} />
          <Area type="monotone" dataKey="present" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorAtt)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  </div>
);

const GradeMatrixSection = ({ gradeDistribution }) => {
  const total = gradeDistribution.reduce((sum, d) => sum + d.value, 0);
  return (
    <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
      <div className="mb-4">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Grade Matrix</h3>
        <p className="text-sm font-black text-slate-900 uppercase tracking-tight">Global Performance Spread</p>
      </div>
      <div className="h-64 flex items-center justify-between gap-2">
        <div className="w-1/2 h-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart margin={{ top: 0, bottom: 0, left: 0, right: 0 }}>
              <Pie
                data={gradeDistribution}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={75}
                paddingAngle={8}
                dataKey="value"
              >
                {gradeDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />
                ))}
              </Pie>
              <Tooltip content={<CustomPieTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="w-1/2 overflow-y-auto max-h-full pr-2">
          <div className="space-y-2.5">
            {gradeDistribution.map((item, index) => {
              const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : 0;
              return (
                <div key={item.name} className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full mt-1 shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <div className="flex flex-col min-w-0">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-tight truncate">{item.name}</span>
                    <span className="text-[10px] font-bold text-slate-700">{item.value} <span className="text-slate-400 font-medium ml-1">({percentage}%)</span></span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

const SubjectPerformanceSection = ({ data }) => (
  <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
    <div className="flex items-center justify-between mb-6">
      <div>
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Academic Benchmarking</h3>
        <p className="text-sm font-black text-slate-900 uppercase tracking-tight">Subject Performance Index</p>
      </div>
      <div className="flex gap-1">
        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" /><div className="w-1.5 h-1.5 rounded-full bg-indigo-300" /><div className="w-1.5 h-1.5 rounded-full bg-indigo-100" />
      </div>
    </div>
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="2 2" vertical={false} stroke="#f1f5f9" />
          <XAxis dataKey="subject__name" tick={{fontSize: 8, fontWeight: 900, fill: '#64748b'}} axisLine={false} tickLine={false} />
          <YAxis tick={{fontSize: 8, fontWeight: 900, fill: '#64748b'}} axisLine={false} tickLine={false} domain={[70, 100]} />
          <Tooltip content={<CustomTooltip unit="%" />} />
          <Bar dataKey="avg_grade" fill="#6366f1" radius={[2, 2, 0, 0]} barSize={24} label={renderCustomBarLabel} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  </div>
);

const TrafficIntelligenceSection = ({ data }) => (
  <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
    <div className="mb-6">
      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Traffic Intelligence</h3>
      <p className="text-sm font-black text-slate-900 uppercase tracking-tight">24H Active Engagement</p>
    </div>
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 30, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="2 2" vertical={false} stroke="#f1f5f9" />
          <XAxis dataKey="time" tick={{fontSize: 8, fontWeight: 900, fill: '#64748b'}} axisLine={false} tickLine={false} />
          <YAxis tick={{fontSize: 8, fontWeight: 900, fill: '#64748b'}} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <Area type="stepAfter" dataKey="users" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorUsers)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  </div>
);

const GradeDistributionPieSection = ({ data, totalStudents }) => (
  <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
    <div className="mb-6">
      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Achievement Spread</h3>
      <p className="text-sm font-black text-slate-900 uppercase tracking-tight">Performance Tier Distribution</p>
    </div>
    <div className="h-72 relative">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart margin={{ top: -20, bottom: 0 }}>
          <Pie data={data} cx="50%" cy="45%" innerRadius={60} outerRadius={80} paddingAngle={6} dataKey="value">
            {data.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />)}
          </Pie>
          <Tooltip content={<CustomPieTooltip />} />
          <Legend verticalAlign="bottom" align="center" iconType="rect" iconSize={4} layout="vertical" wrapperStyle={{ paddingTop: '10px', bottom: 0 }}
            formatter={(value) => {
              const item = data.find(d => d.name === value);
              const total = data.reduce((sum, d) => sum + d.value, 0);
              const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : 0;
              return <span className="text-[7px] font-black text-slate-400 uppercase tracking-tighter">{value}: {item.value} ({percentage}%)</span>;
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute top-[45%] left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center pointer-events-none">
        <p className="text-2xl font-black text-slate-900 leading-none">{totalStudents}</p>
        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Students</p>
      </div>
    </div>
  </div>
);

const GradeDistributionBarSection = ({ data, filterLevel }) => (
  <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
    <div className="flex items-center justify-between mb-6">
      <div>
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Cross-Group Comparison</h3>
        <p className="text-sm font-black text-slate-900 uppercase tracking-tight">Performance Index by {filterLevel === 'all' ? 'Grade Level' : 'Classroom'}</p>
      </div>
      <div className="flex gap-1"><div className="w-1.5 h-1.5 rounded-full bg-indigo-500" /><div className="w-1.5 h-1.5 rounded-full bg-indigo-300" /></div>
    </div>
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ bottom: 30 }}>
          <CartesianGrid strokeDasharray="2 2" vertical={false} stroke="#f1f5f9" />
          <XAxis dataKey="label" tick={{fontSize: 8, fontWeight: 900, fill: '#64748b'}} axisLine={false} tickLine={false} angle={-25} textAnchor="end" padding={{ left: 20, right: 20 }} />
          <YAxis domain={[70, 100]} tick={{fontSize: 8, fontWeight: 900, fill: '#64748b'}} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip unit="%" />} />
          <Bar dataKey="average" fill="#6366f1" radius={[2, 2, 0, 0]} barSize={data.length === 1 ? 60 : 32} label={renderCustomBarLabel}>
            {data.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.average >= 90 ? '#10b981' : entry.average >= 75 ? '#6366f1' : '#ef4444'} fillOpacity={0.8} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  </div>
);

const GradeRankingSection = ({ data, filterSubject, meta }) => (
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
        <BarChart data={data} layout="vertical" margin={{ left: 40, right: 60 }}>
          <CartesianGrid strokeDasharray="2 2" horizontal={true} vertical={false} stroke="#f1f5f9" />
          <XAxis type="number" domain={[0, 100]} hide />
          <YAxis type="category" dataKey="code" width={80} tick={{fontSize: 8, fontWeight: 900, fill: '#475569'}} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip unit="%" />} />
          <Bar dataKey="average" fill="#4f46e5" radius={[0, 2, 2, 0]} barSize={20} label={renderHorizontalBarLabel}>
            {data.map((entry, index) => <Cell key={`cell-${index}`} fill="#4f46e5" opacity={1 - (index * 0.05)} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  </div>
);

const AttendanceTrendsSection = ({ data }) => (
  <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
    <div className="flex items-center justify-between mb-6">
      <div>
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Presence Trends</h3>
        <p className="text-sm font-black text-slate-900 uppercase tracking-tight">30-Day Activity Monitor</p>
      </div>
      <div className="flex gap-1.5"><div className="px-2 py-0.5 bg-emerald-50 border border-emerald-100 rounded text-[7px] font-black text-emerald-600 uppercase tracking-widest">Live</div></div>
    </div>
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient>
            <linearGradient id="colorLate" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f59e0b" stopOpacity={0.1}/><stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/></linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="2 2" vertical={false} stroke="#f1f5f9" />
          <XAxis dataKey="date" tick={{fontSize: 8, fontWeight: 900, fill: '#64748b'}} axisLine={false} tickLine={false} tickFormatter={(str) => new Date(str).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} />
          <YAxis tick={{fontSize: 8, fontWeight: 900, fill: '#64748b'}} axisLine={false} tickLine={false} />
          <Tooltip content={<AttendanceTooltip />} cursor={{stroke: '#cbd5e1', strokeWidth: 1}} />
          <Area type="monotone" dataKey="present" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorPresent)" name="Present" />
          <Area type="monotone" dataKey="late" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#colorLate)" name="Late" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  </div>
);

const AttendanceRankingsSection = ({ rankings }) => (
  <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-4 shadow-sm overflow-hidden flex flex-col">
    <div className="mb-6">
      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Rankings</h3>
      <p className="text-sm font-black text-slate-900 uppercase tracking-tight">Section Performance Index</p>
    </div>
    <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin scrollbar-thumb-slate-200">
      {rankings?.map((rank, idx) => (
        <div key={rank.id} className="group flex items-center justify-between p-2.5 bg-slate-50/50 rounded-lg border border-slate-100 hover:border-indigo-200 hover:bg-white transition-all">
          <div className="flex items-center gap-3">
            <span className={`w-5 h-5 flex items-center justify-center rounded-md font-black text-[9px] ${idx === 0 ? 'bg-amber-100 text-amber-600 shadow-sm' : idx === 1 ? 'bg-slate-200 text-slate-600' : idx === 2 ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-400'}`}>{idx + 1}</span>
            <div className="flex flex-col"><span className="text-[10px] font-black text-slate-700 uppercase tracking-tight leading-none mb-1">{rank.name}</span><span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none">{rank.total_records} records</span></div>
          </div>
          <div className="text-right">
            <div className={`text-xs font-black leading-none mb-1 ${rank.rate >= 90 ? 'text-emerald-600' : rank.rate >= 75 ? 'text-blue-600' : 'text-rose-600'}`}>{rank.rate}%</div>
            <div className="w-12 h-1 bg-slate-200 rounded-full overflow-hidden"><div className={`h-full rounded-full ${rank.rate >= 90 ? 'bg-emerald-500' : rank.rate >= 75 ? 'bg-blue-500' : 'bg-rose-500'}`} style={{ width: `${rank.rate}%` }} /></div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const FilterSelect = ({ label, value, onChange, options }) => (
  <div className="relative min-w-[140px]">
    <label className="absolute -top-2 left-2 px-1 bg-slate-900 text-[8px] font-black text-slate-500 uppercase tracking-widest z-10">{label}</label>
    <select value={value} onChange={onChange} className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-[10px] font-black text-white uppercase tracking-tight focus:border-indigo-500 outline-none transition-all appearance-none pr-8 cursor-pointer">
      {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
    </select>
    <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg></div>
  </div>
);

const SubjectFilterSelect = ({ value, onChange, filterLevel, gradeData }) => {
  const meta = gradeData?.meta || { subjects: [] };
  const subjectsByLevel = meta.subjects.reduce((acc, s) => {
    const level = s.grade_level || 'Other';
    if (!acc[level]) acc[level] = [];
    acc[level].push(s);
    return acc;
  }, {});

  return (
    <div className="relative min-w-[140px]">
      <label className="absolute -top-2 left-2 px-1 bg-slate-900 text-[8px] font-black text-slate-500 uppercase tracking-widest z-10">Subject Focus</label>
      <select value={value} onChange={onChange} className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-[10px] font-black text-white uppercase tracking-tight focus:border-indigo-500 outline-none transition-all appearance-none pr-8 cursor-pointer disabled:opacity-50" disabled={filterLevel === 'all'}>
        <option value="all">{filterLevel === 'all' ? 'Select Level First' : 'Cumulative (All Subjects)'}</option>
        {filterLevel !== 'all' && Object.keys(subjectsByLevel).filter(level => level === filterLevel).map(level => (
          <optgroup key={level} label={level}>{subjectsByLevel[level].map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</optgroup>
        ))}
      </select>
      <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg></div>
    </div>
  );
};

const StatChip = ({ label, value, color }) => {
  const colors = {
    emerald: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    purple: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    blue: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    indigo: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
  };
  return (
    <div className={`px-3 py-1.5 rounded-lg border ${colors[color]} flex flex-col items-center min-w-[80px]`}>
      <span className="text-[8px] font-black uppercase tracking-widest leading-none mb-1 opacity-70">{label}</span>
      <span className="text-sm font-black leading-none">{value}</span>
    </div>
  );
};

const MiniCard = ({ title, value, icon, alert }) => (
  <div className={`bg-white border ${alert ? 'border-rose-200 bg-rose-50/30' : 'border-slate-200'} rounded-xl p-5 shadow-sm flex items-center gap-5 min-h-[90px]`}>
    <div className={`p-3 rounded-lg ${alert ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-600'} flex items-center justify-center`}><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={icon} /></svg></div>
    <div className="flex flex-col justify-center"><h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2">{title}</h4><p className={`text-2xl font-black tracking-tight leading-none ${alert ? 'text-rose-600' : 'text-slate-900'}`}>{value || 0}</p></div>
  </div>
);

const CustomTooltip = ({ active, payload, label, unit = '' }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-lg shadow-2xl backdrop-blur-md bg-opacity-95">
        <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{label}</p>
        <p className="text-xs font-black text-white flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />{payload[0].value}{unit}<span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest ml-1">{payload[0].name}</span></p>
      </div>
    );
  }
  return null;
};

const CustomPieTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-lg shadow-2xl backdrop-blur-md bg-opacity-95">
        <p className="text-xs font-black text-white flex items-center gap-2"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: payload[0].payload.fill }} />{payload[0].value}<span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest ml-1">{payload[0].name}</span></p>
      </div>
    );
  }
  return null;
};

const AttendanceTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 border border-slate-800 p-2 rounded-lg shadow-2xl backdrop-blur-md bg-opacity-95">
        <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1.5">{label}</p>
        <div className="space-y-1">{payload.map((entry, index) => (<div key={index} className="flex items-center justify-between gap-4"><div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.color }} /><span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">{entry.name}</span></div><span className="text-[10px] font-black text-white">{entry.value}</span></div>))}</div>
      </div>
    );
  }
  return null;
};

const EmptyState = ({ message, submessage }) => (
  <div className="bg-white border border-slate-200 rounded-2xl p-24 text-center shadow-sm">
    <svg className="w-16 h-16 mx-auto mb-6 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
    <p className="text-[12px] font-black text-slate-400 uppercase tracking-[0.3em]">{message}</p>
    {submessage && <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest opacity-60">{submessage}</p>}
  </div>
);

const YearSelector = ({ academicYear, onYearChange }) => (
  <div className="flex items-center bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
    <button onClick={() => onYearChange('prev')} className="p-2 hover:bg-slate-700 text-slate-400 border-r border-slate-700 transition-colors"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg></button>
    <div className="px-3 text-[10px] font-black text-white uppercase tracking-widest min-w-[90px] text-center">{academicYear}</div>
    <button onClick={() => onYearChange('next')} className="p-2 hover:bg-slate-700 text-slate-400 border-l border-slate-700 transition-colors"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg></button>
  </div>
);

export default Analytics;
