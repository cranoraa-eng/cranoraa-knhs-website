import { useState, useEffect } from 'react';
import api from '../utils/api';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  PieChart, Pie, Cell, BarChart, Bar, Legend 
} from 'recharts';
import { Spinner } from '../components/Spinner';

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

  return (
    <div className="space-y-8 pb-12 animate-fade-in">
      <div>
        <h1 className="text-2xl font-black text-slate-800 tracking-tight uppercase">System Analytics</h1>
        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Deep dive into portal performance and metrics</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Attendance Trends */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Attendance Trends (Last 30 Days)</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={attendanceTrends}>
                <defs>
                  <linearGradient id="colorAtt" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{fontSize: 10, fontWeight: 700}} axisLine={false} tickLine={false} tickFormatter={(str) => str ? new Date(str).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''} />
                <YAxis tick={{fontSize: 10, fontWeight: 700}} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                <Area type="monotone" dataKey="present" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorAtt)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Grade Distribution */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Global Grade Distribution</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={gradeDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {gradeDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Subject Performance */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Subject Performance Averages</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={subjectStats}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="subject__name" tick={{fontSize: 10, fontWeight: 700}} axisLine={false} tickLine={false} />
                <YAxis tick={{fontSize: 10, fontWeight: 700}} axisLine={false} tickLine={false} domain={[70, 100]} />
                <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                <Bar dataKey="avg_grade" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Active Users Trends */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Active Users (Last 24 Hours)</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={userTrends}>
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="time" tick={{fontSize: 10, fontWeight: 700}} axisLine={false} tickLine={false} />
                <YAxis tick={{fontSize: 10, fontWeight: 700}} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                <Area type="monotone" dataKey="users" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorUsers)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
