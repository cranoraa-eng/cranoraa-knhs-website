import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Shield, FileText, HardDrive, Globe, MessageSquare, HeartPulse,
  Users, BookOpen, Megaphone, Clock, TrendingUp, Activity,
  ArrowRight, RefreshCw, Database, AlertTriangle, CheckCircle2,
  BarChart3, Eye
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from 'recharts';
import api from '../utils/api';
import { useParallelFetch } from '../hooks/useFetch';
import { useAuth } from '../context/AuthContext';
import PortalHubShell from '../components/PortalHubShell';
import { LoadingSpinner } from '../components/ui';
import AuditLogs from './AuditLogs';
import Backups from './Backups';
import WebsiteContentManagement from './WebsiteContentManagement';
import Moderation from './Moderation';
import SystemHealth from './SystemHealth';

/* ─── Dashboard Overview ──────────────────────────────────────────────────── */
function DashboardOverview() {
  const { user } = useAuth();
  const { data, loading, refetch } = useParallelFetch({
    stats: '/admin/stats/',
    metrics: '/admin/system-metrics/',
    feed: '/admin/maintenance-feed/',
  });
  const [auditStats, setAuditStats] = useState({ count: 0, size_mb: 0, max_mb: 50 });
  const [refreshing, setRefreshing] = useState(false);

  const stats = data.stats || null;
  const metrics = data.metrics || null;
  const feed = data.feed || [];

  const fetchAuditStats = useCallback(async () => {
    try {
      const res = await api.get('/admin/audit-logs/stats/');
      setAuditStats(res.data);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { fetchAuditStats(); }, [fetchAuditStats]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try { await refetch(); await fetchAuditStats(); } catch { /* ignore */ }
    finally { setRefreshing(false); }
  };

  const totalUsers = (stats?.total_students || 0) + (stats?.total_teachers || 0);
  const storagePercent = metrics?.storageUsed || 0;

  const statCards = [
    { icon: Users, label: 'Total Users', value: totalUsers, color: 'text-violet-600 bg-violet-50 ring-violet-100' },
    { icon: BookOpen, label: 'Classrooms', value: stats?.total_classes || 0, color: 'text-blue-600 bg-blue-50 ring-blue-100' },
    { icon: Megaphone, label: 'Announcements', value: stats?.total_announcements || 0, color: 'text-amber-600 bg-amber-50 ring-amber-100' },
    { icon: HeartPulse, label: 'Attendance', value: `${stats?.today_rate || 0}%`, color: 'text-emerald-600 bg-emerald-50 ring-emerald-100' },
    { icon: FileText, label: 'Audit Logs', value: auditStats.count || 0, color: 'text-indigo-600 bg-indigo-50 ring-indigo-100' },
    { icon: Database, label: 'Storage', value: `${storagePercent}%`, color: storagePercent > 80 ? 'text-red-600 bg-red-50 ring-red-100' : 'text-sky-600 bg-sky-50 ring-sky-100' },
  ];

  const quickActions = [
    { icon: FileText, label: 'Audit Logs', desc: 'View system activity', tab: 'audit-logs', color: 'bg-violet-100 text-violet-600' },
    { icon: HardDrive, label: 'Backups', desc: 'Manage snapshots', tab: 'backups', color: 'bg-emerald-100 text-emerald-600' },
    { icon: Globe, label: 'Website', desc: 'Edit site content', tab: 'website-editor', color: 'bg-blue-100 text-blue-600' },
    { icon: MessageSquare, label: 'Moderation', desc: 'Review reports', tab: 'moderation', color: 'bg-amber-100 text-amber-600' },
    { icon: HeartPulse, label: 'System Health', desc: 'Monitor performance', tab: 'system-health', color: 'bg-red-100 text-red-600' },
  ];

  const feedStatusIcon = (status) => {
    if (status === 'success') return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
    if (status === 'warning') return <AlertTriangle className="w-4 h-4 text-amber-500" />;
    return <AlertTriangle className="w-4 h-4 text-red-500" />;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
        <LoadingSpinner />
        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-black text-violet-600 uppercase tracking-[0.2em] mb-1">Admin Dashboard</p>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            Welcome back, {user?.first_name || 'Admin'}
          </h1>
          <p className="text-sm text-slate-500 mt-1 font-semibold">
            System overview and quick actions
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {statCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md hover:border-slate-300 transition-all"
          >
            <div className={`w-9 h-9 rounded-lg ${card.color} flex items-center justify-center ring-1 mb-3`}>
              <card.icon className="w-4.5 h-4.5" />
            </div>
            <p className="text-xl font-extrabold text-slate-900 tracking-tight">{card.value}</p>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">{card.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions + Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Quick Actions */}
        <div className="lg:col-span-1 bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3.5 border-b border-slate-200 bg-slate-50">
            <h3 className="text-sm font-extrabold text-slate-900">Quick Actions</h3>
            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Navigate to admin tools</p>
          </div>
          <div className="p-3 space-y-1.5">
            {quickActions.map(action => (
              <button
                key={action.tab}
                onClick={() => {
                  const url = new URL(window.location);
                  url.searchParams.set('tab', action.tab);
                  window.location.href = url.toString();
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-50 transition-all group text-left"
              >
                <div className={`w-9 h-9 rounded-lg ${action.color} flex items-center justify-center flex-shrink-0`}>
                  <action.icon className="w-4.5 h-4.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-800 group-hover:text-violet-700 transition-colors">{action.label}</p>
                  <p className="text-[10px] text-slate-400 font-medium">{action.desc}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-violet-500 transition-colors" />
              </button>
            ))}
          </div>
        </div>

        {/* Activity Feed */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">Recent Activity</h3>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Latest system events</p>
            </div>
            <Activity className="w-4 h-4 text-slate-400" />
          </div>
          <div className="max-h-[320px] overflow-y-auto">
            {feed.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
                  <Activity className="w-7 h-7 text-slate-300" />
                </div>
                <p className="text-sm font-bold text-slate-600 mb-1">No recent activity</p>
                <p className="text-xs text-slate-400">System events will appear here</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {feed.slice(0, 10).map((item, i) => (
                  <div key={item.id || i} className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors">
                    <div className="mt-0.5 flex-shrink-0">{feedStatusIcon(item.status)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-800 truncate">{item.action}</p>
                      <p className="text-xs text-slate-500 truncate">{item.details}</p>
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium flex-shrink-0">{item.time}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* System Status Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-6 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-xs font-bold text-slate-600">Database: Connected</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-xs font-bold text-slate-600">API: Online</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${storagePercent > 80 ? 'bg-red-500' : 'bg-emerald-500'}`} />
              <span className="text-xs font-bold text-slate-600">Storage: {storagePercent}%</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-xs font-bold text-slate-600">Sessions: {metrics?.activeSessions || 0}</span>
            </div>
          </div>
          <p className="text-[10px] text-slate-400 font-semibold">
            <Clock className="w-3 h-3 inline mr-1" />
            Auto-refresh every 30s
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─── Tab Configuration ───────────────────────────────────────────────────── */
const tabs = [
  { id: 'audit-logs', label: 'Audit Logs', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', component: AuditLogs, roles: ['admin'] },
  { id: 'backups', label: 'Backups', icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12', component: Backups, roles: ['admin'] },
  { id: 'website-editor', label: 'Website Editor', icon: 'M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9', component: WebsiteContentManagement, roles: ['admin'] },
  { id: 'moderation', label: 'Moderation', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', component: Moderation, roles: ['admin'] },
  { id: 'system-health', label: 'System Health', icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z', component: SystemHealth, roles: ['admin'] },
];

const SystemAdminHub = () => (
  <PortalHubShell
    title="System Admin Hub"
    description="Audit, recovery, website operations, moderation, and system monitoring."
    tabs={[{ id: 'overview', label: 'Overview', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z', component: DashboardOverview, roles: ['admin'] }, ...tabs]}
    showHeader={false}
  />
);

export default SystemAdminHub;
