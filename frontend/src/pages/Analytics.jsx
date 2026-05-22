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

const Analytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

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
      console.error('Failed to load analytics', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) return <Spinner />;

  const attendanceTrends = data?.attendance?.daily_trends || [];
  const gradeDistribution = [
    { name: 'Outstanding', value: data?.grades?.distribution?.outstanding || 0 },
    { name: 'Very Satisfactory', value: data?.grades?.distribution?.very_satisfactory || 0 },
    { name: 'Satisfactory', value: data?.grades?.distribution?.satisfactory || 0 },
    { name: 'Fairly Satisfactory', value: data?.grades?.distribution?.fairly_satisfactory || 0 },
    { name: 'Failed', value: data?.grades?.distribution?.failed || 0 },
  ];
  const subjectStats = data?.grades?.subject_stats || [];
  const userTrends = data?.dashboard?.charts?.active_users_trends || [];
  const totalGrades = gradeDistribution.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="space-y-4 pb-8 animate-fade-in max-w-full overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-2xl">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-white tracking-tighter uppercase leading-none">System Intelligence</h1>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] mt-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
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
        {/* Attendance Trends */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Attendance Dynamics</h3>
              <p className="text-sm font-black text-slate-900 uppercase tracking-tight">30-Day Presence Analytics</p>
            </div>
            <div className="px-2 py-1 bg-slate-50 border border-slate-100 rounded text-[8px] font-black text-slate-500 uppercase tracking-widest">
              Historical Data
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={attendanceTrends}>
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
                <Tooltip 
                  content={<CustomTooltip />}
                  cursor={{stroke: '#6366f1', strokeWidth: 1, strokeDasharray: '4 4'}}
                />
                <Area type="monotone" dataKey="present" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorAtt)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Grade Distribution */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="mb-6">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Grade Matrix</h3>
            <p className="text-sm font-black text-slate-900 uppercase tracking-tight">Global Performance Spread</p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={gradeDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {gradeDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />
                  ))}
                </Pie>
                <Tooltip content={<CustomPieTooltip />} />
                <Legend 
                  verticalAlign="bottom" 
                  align="center"
                  iconType="rect"
                  iconSize={6}
                  layout="vertical"
                  wrapperStyle={{ paddingTop: '20px' }}
                  formatter={(value) => {
                    const item = gradeDistribution.find(d => d.name === value);
                    const percentage = totalGrades > 0 ? ((item.value / totalGrades) * 100).toFixed(1) : 0;
                    return (
                      <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">
                        {value}: {item.value} ({percentage}%)
                      </span>
                    );
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Subject Performance */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Academic Benchmarking</h3>
              <p className="text-sm font-black text-slate-900 uppercase tracking-tight">Subject Performance Index</p>
            </div>
            <div className="flex gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-300" />
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-100" />
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={subjectStats}>
                <CartesianGrid strokeDasharray="2 2" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="subject__name" tick={{fontSize: 8, fontWeight: 900, fill: '#64748b'}} axisLine={false} tickLine={false} />
                <YAxis tick={{fontSize: 8, fontWeight: 900, fill: '#64748b'}} axisLine={false} tickLine={false} domain={[70, 100]} />
                <Tooltip content={<CustomTooltip unit="%" />} />
                <Bar dataKey="avg_grade" fill="#6366f1" radius={[2, 2, 0, 0]} barSize={24} label={renderCustomBarLabel} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Active Users Trends */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="mb-6">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Traffic Intelligence</h3>
            <p className="text-sm font-black text-slate-900 uppercase tracking-tight">24H Active Engagement</p>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={userTrends}>
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
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
      </div>
    </div>
  );
};

const StatChip = ({ label, value, color }) => {
  const colors = {
    emerald: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    purple: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    blue: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  };
  return (
    <div className={`px-3 py-1.5 rounded-lg border ${colors[color]} flex flex-col items-center min-w-[80px]`}>
      <span className="text-[8px] font-black uppercase tracking-widest leading-none mb-1 opacity-70">{label}</span>
      <span className="text-sm font-black leading-none">{value}</span>
    </div>
  );
};

const MiniCard = ({ title, value, icon, alert }) => (
  <div className={`bg-white border ${alert ? 'border-rose-200 bg-rose-50/30' : 'border-slate-200'} rounded-xl p-4 shadow-sm flex items-center gap-4`}>
    <div className={`p-2 rounded-lg ${alert ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-600'}`}>
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
      </svg>
    </div>
    <div>
      <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">{title}</h4>
      <p className={`text-xl font-black tracking-tight leading-none ${alert ? 'text-rose-600' : 'text-slate-900'}`}>{value || 0}</p>
    </div>
  </div>
);

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


export default Analytics;
