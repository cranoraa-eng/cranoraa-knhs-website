import { Link } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';
import api from '../utils/api';
import { LoadingSpinner } from '../components/ui';

// ── Mini Calendar (unchanged logic) ──────────────────────────────────────────
const MiniCalendar = ({ events, onSelectDay }) => {
  const [currentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);
  const daysInMonth = useMemo(() => {
    const year = currentDate.getFullYear(), month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const lastDate = new Date(year, month + 1, 0).getDate();
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= lastDate; i++) days.push(i);
    return days;
  }, [currentDate]);
  const eventDays = useMemo(() => {
    const map = {};
    events.forEach(e => {
      const start = new Date(e.event_date || e.created_at);
      const end = e.end_date ? new Date(e.end_date) : start;
      let curr = new Date(start); curr.setHours(0,0,0,0);
      const last = new Date(end); last.setHours(0,0,0,0);
      while (curr <= last) {
        if (curr.getMonth() === currentDate.getMonth() && curr.getFullYear() === currentDate.getFullYear())
          map[curr.getDate()] = (map[curr.getDate()] || 0) + 1;
        curr.setDate(curr.getDate() + 1);
      }
    });
    return map;
  }, [events, currentDate]);
  const monthName = currentDate.toLocaleString('en-US', { month: 'long' });
  const handleDayClick = (day) => { if (!day) return; setSelectedDay(day); if (onSelectDay) onSelectDay(day); };
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-bold text-slate-900">{monthName} {currentDate.getFullYear()}</p>
        <Link to="/calendar" className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors">View full →</Link>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-1">
        {['S','M','T','W','T','F','S'].map((d,i) => <div key={i} className="text-[10px] font-bold text-slate-400 text-center py-1">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {daysInMonth.map((day, i) => {
          const hasEvent = day && eventDays[day];
          const isToday = day === currentDate.getDate();
          const isSelected = day === selectedDay;
          return (
            <div key={i} onClick={() => handleDayClick(day)}
              className={`aspect-square flex flex-col items-center justify-center text-[11px] font-semibold rounded-lg cursor-pointer transition-all relative
                ${!day ? 'invisible' : ''}
                ${isSelected ? 'bg-blue-600 text-white' : hasEvent ? 'bg-blue-50 text-blue-700 hover:bg-blue-100' : 'text-slate-600 hover:bg-slate-50'}
                ${isToday && !isSelected ? 'ring-1 ring-blue-400' : ''}`}>
              {day}
              {hasEvent && !isSelected && <span className="absolute bottom-0.5 w-1 h-1 bg-blue-500 rounded-full" />}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ── Helpers (unchanged) ───────────────────────────────────────────────────────
const attachUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  // Derive media root safely — strip /api suffix from baseURL
  const base = (() => {
    try {
      const u = new URL(api.defaults.baseURL);
      u.pathname = u.pathname.replace(/\/api\/?$/, '') || '/';
      return u.toString().replace(/\/$/, '');
    } catch {
      return api.defaults.baseURL.replace(/\/api\/?$/, '');
    }
  })();
  return `${base}${url}`;
};
const getFirstImage = (a) => { if (a.attachment_url && /\.(jpg|jpeg|png|gif|webp)$/i.test(a.attachment_url)) return attachUrl(a.attachment_url); const img = a.attachments?.find(att => att.is_image); return attachUrl(img?.url); };
const getPDFs = (a) => { const pdfs = []; if (a.attachment_url?.toLowerCase().endsWith('.pdf')) pdfs.push({ name: 'Attachment.pdf', url: attachUrl(a.attachment_url) }); a.attachments?.forEach(att => { if (att.url?.toLowerCase().endsWith('.pdf')) pdfs.push({ name: att.filename || 'Document.pdf', url: attachUrl(att.url) }); }); return pdfs; };
const formatDate = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
const CATEGORY_STYLES = { academic: 'bg-blue-50 text-blue-700 border-blue-100', events: 'bg-emerald-50 text-emerald-700 border-emerald-100', emergency: 'bg-red-50 text-red-700 border-red-100', holiday: 'bg-blue-50 text-blue-700 border-blue-100' };

// ── Portal Mockup (hero visual) ───────────────────────────────────────────────
const PortalMockup = () => (
  <div className="relative w-full max-w-lg mx-auto lg:mx-0">
    {/* Glow behind */}
    <div className="absolute inset-0 bg-blue-400/20 rounded-3xl blur-3xl scale-110 pointer-events-none" />
    {/* Browser chrome */}
    <div className="relative rounded-2xl overflow-hidden border border-white/20 shadow-2xl shadow-blue-900/30 bg-[#1A0B2E]">
      {/* Title bar */}
      <div className="flex items-center gap-1.5 px-4 py-3 bg-[#140824] border-b border-white/5">
        <span className="w-2.5 h-2.5 rounded-full bg-red-400/70" />
        <span className="w-2.5 h-2.5 rounded-full bg-amber-400/70" />
        <span className="w-2.5 h-2.5 rounded-full bg-green-400/70" />
        <div className="flex-1 mx-3 h-5 rounded-md bg-white/5 flex items-center px-2">
          <span className="text-[9px] text-white/30 font-mono">portal.kiwalan-nhs.edu.ph</span>
        </div>
      </div>
      {/* Dashboard preview */}
      <div className="flex h-56">
        {/* Sidebar */}
        <div className="w-14 bg-[#140824] border-r border-white/5 flex flex-col items-center py-3 gap-3">
          <div className="w-7 h-7 rounded-lg bg-blue-600/80 flex items-center justify-center">
            <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
          </div>
          {[
            'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9',
            'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z',
            'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
          ].map((icon, i) => (
            <div key={i} className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} /></svg>
            </div>
          ))}
        </div>
        {/* Main content */}
        <div className="flex-1 p-3 space-y-2.5 overflow-hidden">
          <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Dashboard</p>
          {/* Stat cards */}
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { label: 'Attendance', val: '96%', color: 'bg-emerald-500/20 text-emerald-400' },
              { label: 'Avg Grade', val: '88.4', color: 'bg-blue-500/20 text-blue-400' },
              { label: 'Subjects', val: '8', color: 'bg-blue-500/20 text-blue-400' },
            ].map((s, i) => (
              <div key={i} className="rounded-lg bg-white/5 border border-white/5 p-2">
                <p className={`text-sm font-black ${s.color.split(' ')[1]}`}>{s.val}</p>
                <p className="text-[8px] text-white/30 font-medium mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
          {/* Announcement preview */}
          <div className="rounded-lg bg-white/5 border border-white/5 p-2">
            <p className="text-[8px] font-bold text-white/40 uppercase tracking-widest mb-1.5">Latest Announcement</p>
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1 flex-shrink-0" />
              <div>
                <p className="text-[9px] font-semibold text-white/70 leading-tight">Enrollment for SY 2026–2027 is now open</p>
                <p className="text-[8px] text-white/30 mt-0.5">2 hours ago</p>
              </div>
            </div>
          </div>
          {/* Grade bar */}
          <div className="rounded-lg bg-white/5 border border-white/5 p-2">
            <p className="text-[8px] font-bold text-white/40 uppercase tracking-widest mb-1.5">Grade Summary</p>
            <div className="space-y-1">
              {[['Math', 92, 'bg-blue-500'], ['Science', 87, 'bg-blue-500'], ['English', 90, 'bg-emerald-500']].map(([sub, pct, color]) => (
                <div key={sub} className="flex items-center gap-2">
                  <p className="text-[8px] text-white/40 w-10 flex-shrink-0">{sub}</p>
                  <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                    <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-[8px] text-white/40 w-5 text-right">{pct}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
    {/* Floating badge */}
    <div className="absolute -bottom-4 -left-4 bg-white rounded-2xl shadow-xl border border-slate-100 px-4 py-3 flex items-center gap-3">
      <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
        <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
      </div>
      <div>
        <p className="text-xs font-black text-slate-900 leading-none">98% Pass Rate</p>
        <p className="text-[10px] text-slate-400 mt-0.5">SY 2026–2027</p>
      </div>
    </div>
    {/* Floating badge 2 */}
    <div className="absolute -top-4 -right-4 bg-white rounded-2xl shadow-xl border border-slate-100 px-4 py-3 flex items-center gap-3">
      <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
      </div>
      <div>
        <p className="text-xs font-black text-slate-900 leading-none">1,200+ Students</p>
        <p className="text-[10px] text-slate-400 mt-0.5">Enrolled this year</p>
      </div>
    </div>
  </div>
);

// ── Home ──────────────────────────────────────────────────────────────────────
const Home = () => {
  const [content, setContent] = useState({});
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [zoomedImage, setZoomedImage] = useState(null);
  const [selectedDateEvents, setSelectedDateEvents] = useState([]);
  const [selectedDayLabel, setSelectedDayLabel] = useState(null);

  useEffect(() => {
    Promise.all([
      api.get('/website-content/public/').then(r => {
        const map = {};
        const data = Array.isArray(r.data) ? r.data : (r.data?.results ?? []);
        data.forEach(item => { map[item.section] = item; });
        setContent(map);
      }).catch(() => {}),
      api.get('/announcements/public/').then(r => setAnnouncements(r.data)).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  const handleSelectDay = (day) => {
    const today = new Date();
    const target = new Date(today.getFullYear(), today.getMonth(), day);
    target.setHours(0,0,0,0);
    const dayEvents = announcements.filter(a => {
      const start = new Date(a.event_date || a.created_at); start.setHours(0,0,0,0);
      const end = a.end_date ? new Date(a.end_date) : start; end.setHours(0,0,0,0);
      return target >= start && target <= end;
    });
    setSelectedDateEvents(dayEvents);
    setSelectedDayLabel(day);
  };

  const generalAnnouncements = announcements.filter(a => a.category !== 'events').slice(0, 3);
  const upcomingEvents = announcements
    .filter(a => a.category === 'events' && (a.event_date || a.created_at))
    .sort((a, b) => new Date(a.event_date || a.created_at) - new Date(b.event_date || b.created_at))
    .filter(a => { const end = a.end_date ? new Date(a.end_date) : new Date(a.event_date || a.created_at); const today = new Date(); today.setHours(0,0,0,0); return end >= today; })
    .slice(0, 4);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="bg-white">

      {/* ── OFFICIAL GOVERNMENT BANNER ── */}
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 border-b-2 border-yellow-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
          <div className="flex items-center justify-center md:justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              {/* Official DepEd Seal */}
              <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center shrink-0 border-2 border-yellow-400 shadow-lg">
                <svg className="w-6 h-6 text-blue-900" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
              </div>
              <div className="text-left">
                <p className="text-xs md:text-sm font-black text-white uppercase tracking-wide leading-tight">
                  Department of Education
                </p>
                <p className="text-[9px] md:text-[10px] text-blue-200 font-medium uppercase tracking-wider">
                  Republic of the Philippines
                </p>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-md bg-yellow-400/20 border border-yellow-400/30">
              <span className="text-[10px] font-black text-yellow-400 uppercase tracking-widest">Official Website</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── HERO ── */}
      <section className="relative overflow-hidden bg-[#0f0720] min-h-[92vh] flex items-center">
        {/* Background texture */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[900px] bg-blue-600/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-3xl translate-x-1/3 translate-y-1/3" />
          {/* Grid lines */}
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

            {/* Left — text */}
            <div className="space-y-7">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                <span className="text-xs font-bold text-blue-300 uppercase tracking-widest">Enrollment Open — SY 2026–2027</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-[1.08] tracking-tight">
                {content.home_hero_title?.content || (<>Kiwalan<br />National High<br />School</>)}
              </h1>

              <p className="text-lg text-slate-400 leading-relaxed max-w-lg">
                {content.home_hero_subtitle?.content || 'Empowering minds and shaping futures through excellence in education and character development.'}
              </p>

              <div className="flex flex-wrap gap-3 pt-1">
                <Link to="/enroll" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-500 transition-colors shadow-lg shadow-blue-900/40">
                  Apply for Enrollment
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4 4H3" /></svg>
                </Link>
                <Link to="/login" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-white/10 text-white text-sm font-bold hover:bg-white/5 transition-colors">
                  Portal Login
                </Link>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-4 gap-4 pt-4 border-t border-white/10">
                {[
                  { val: '1,200+', label: 'Students' },
                  { val: '80+', label: 'Faculty' },
                  { val: '5,000+', label: 'Graduates' },
                  { val: '20+', label: 'Years' },
                ].map((s, i) => (
                  <div key={i}>
                    <p className="text-xl font-black text-white">{s.val}</p>
                    <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — portal mockup */}
            <div className="hidden lg:flex justify-end">
              <PortalMockup />
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="py-20 md:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-3">Core Strengths</p>
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-5 leading-tight">Why Choose<br />Kiwalan NHS?</h2>
              <p className="text-slate-500 leading-relaxed mb-8">A holistic learning environment that combines academic rigor with character building and practical skills for every student.</p>
              <Link to="/about" className="inline-flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors">
                Learn more about us
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4 4H3" /></svg>
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { title: content.home_feature_1_title?.content || 'Quality Education', desc: content.home_feature_1_content?.content || 'Comprehensive curriculum designed to prepare students for success in higher education and beyond.', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253', accent: 'bg-blue-50 text-blue-600' },
                { title: content.home_feature_2_title?.content || 'Dedicated Faculty', desc: content.home_feature_2_content?.content || 'Experienced and passionate teachers committed to student development and academic excellence.', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z', accent: 'bg-blue-50 text-blue-600' },
                { title: content.home_feature_3_title?.content || 'Modern Facilities', desc: content.home_feature_3_content?.content || 'State-of-the-art classrooms, laboratories, and facilities to support holistic learning.', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4', accent: 'bg-emerald-50 text-emerald-600' },
                { title: 'Digital Portal', desc: 'Full-featured student portal with grades, attendance, messaging, and real-time notifications.', icon: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z', accent: 'bg-amber-50 text-amber-600' },
              ].map((f, i) => (
                <div key={i} className="bg-slate-50 rounded-2xl border border-slate-100 p-6 hover:shadow-md hover:border-blue-100 transition-all group">
                  <div className={`w-9 h-9 rounded-xl ${f.accent} flex items-center justify-center mb-4`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={f.icon} /></svg>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 mb-1.5">{f.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS BAND ── */}
      <section className="bg-blue-600 py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { val: '1,200+', label: 'Enrolled Students' },
              { val: '5,000+', label: 'Total Graduates' },
              { val: '80+', label: 'Faculty Members' },
              { val: '150+', label: 'Awards & Honors' },
            ].map((s, i) => (
              <div key={i}>
                <p className="text-3xl md:text-4xl font-black text-white">{s.val}</p>
                <p className="text-xs font-bold text-blue-200 uppercase tracking-widest mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ANNOUNCEMENTS & EVENTS ── */}
      <section className="py-20 md:py-28 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-2">Stay Updated</p>
              <h2 className="text-3xl md:text-4xl font-black text-slate-900">Announcements & Events</h2>
            </div>
            <Link to="/calendar" className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors flex-shrink-0">
              Full Calendar <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4 4H3" /></svg>
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Announcements */}
            <div className="lg:col-span-2 space-y-4">
              {generalAnnouncements.length > 0 ? generalAnnouncements.map(a => {
                const imageUrl = getFirstImage(a);
                const pdfs = getPDFs(a);
                const catStyle = CATEGORY_STYLES[a.category] || 'bg-slate-50 text-slate-600 border-slate-100';
                return (
                  <div key={a.id} className="group bg-white rounded-2xl border border-slate-100 hover:border-blue-200 hover:shadow-md transition-all p-5 flex gap-4">
                    {imageUrl && (
                      <button onClick={() => setZoomedImage(imageUrl)} className="flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border border-slate-100">
                        <img src={imageUrl} alt={a.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      </button>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${catStyle}`}>{a.category}</span>
                        <span className="text-[11px] text-slate-400">{a.event_date ? new Date(a.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : formatDate(a.created_at)}</span>
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 mb-1 line-clamp-1 group-hover:text-blue-700 transition-colors">{a.title}</h3>
                      <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{a.content}</p>
                      {pdfs.length > 0 && (
                        <div className="flex gap-2 mt-2">
                          {pdfs.map((pdf, i) => (
                            <a key={i} href={pdf.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-red-50 text-red-600 text-[10px] font-bold hover:bg-red-100 transition-colors">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                              PDF
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              }) : (
                <div className="rounded-2xl border border-slate-100 bg-white p-10 text-center">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                    <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>
                  </div>
                  <p className="text-sm font-semibold text-slate-400">No announcements at this time</p>
                </div>
              )}
              <div className="pt-1">
                <Link to="/login" className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors">View all announcements in the portal →</Link>
              </div>
            </div>

            {/* Events sidebar */}
            <div className="space-y-5">
              <MiniCalendar events={announcements.filter(a => a.category === 'events')} onSelectDay={handleSelectDay} />
              <div>
                <p className="text-sm font-bold text-slate-900 mb-3">
                  {selectedDayLabel ? `Events — ${new Date().toLocaleString('en-US', { month: 'short' })} ${selectedDayLabel}` : 'Upcoming Events'}
                </p>
                <div className="space-y-2">
                  {(selectedDayLabel ? selectedDateEvents : upcomingEvents).length > 0
                    ? (selectedDayLabel ? selectedDateEvents : upcomingEvents).map(ev => {
                        const d = new Date(ev.event_date || ev.created_at);
                        return (
                          <Link key={ev.id} to={`/calendar?year=${d.getFullYear()}&month=${d.getMonth() + 1}`}
                            className="flex items-start gap-3 p-3 rounded-xl border border-slate-100 bg-white hover:border-blue-200 hover:shadow-sm transition-all group">
                            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 flex flex-col items-center justify-center">
                              <span className="text-[9px] font-bold text-blue-500 uppercase leading-none">{d.toLocaleString('en-US', { month: 'short' })}</span>
                              <span className="text-sm font-black text-blue-700 leading-tight">{d.getDate()}</span>
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-900 group-hover:text-blue-700 transition-colors line-clamp-1">{ev.title}</p>
                              <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{ev.content}</p>
                            </div>
                          </Link>
                        );
                      })
                    : <div className="p-5 rounded-xl border border-slate-100 bg-white text-center"><p className="text-xs text-slate-400 font-medium">No upcoming events</p></div>
                  }
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PORTAL FEATURES SHOWCASE ── */}
      <section className="py-20 md:py-28 bg-[#0f0720] relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-3xl translate-x-1/3 -translate-y-1/3" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-3">Digital Platform</p>
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4">Everything in one portal</h2>
            <p className="text-slate-400 max-w-xl mx-auto">Students, teachers, and administrators all have dedicated dashboards with the tools they need.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { role: 'Students', color: 'border-blue-500/30 bg-blue-500/5', badge: 'bg-blue-500/20 text-blue-300', features: ['View grades & report cards', 'Track attendance records', 'Access learning materials', 'Receive announcements', 'Message teachers & peers'] },
              { role: 'Teachers', color: 'border-blue-500/30 bg-blue-500/5', badge: 'bg-blue-500/20 text-blue-300', features: ['Input & manage grades', 'Record attendance', 'Upload learning materials', 'Post announcements', 'Communicate with students'] },
              { role: 'Administrators', color: 'border-emerald-500/30 bg-emerald-500/5', badge: 'bg-emerald-500/20 text-emerald-300', features: ['Manage all users & classes', 'View analytics & reports', 'Control enrollment', 'System settings & audit logs', 'Backup & maintenance tools'] },
            ].map((r, i) => (
              <div key={i} className={`rounded-2xl border ${r.color} p-6`}>
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-4 ${r.badge}`}>{r.role}</span>
                <ul className="space-y-2.5">
                  {r.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-2.5 text-sm text-slate-400">
                      <svg className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link to="/login" className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-500 transition-colors shadow-lg shadow-blue-900/40">
              Access the Portal
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4 4H3" /></svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ── LOCATION ── */}
      <section className="py-20 md:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">

            {/* Info side */}
            <div>
              <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-3">Find Us</p>
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-5 leading-tight">
                Visit Kiwalan<br />National High School
              </h2>
              <p className="text-slate-500 leading-relaxed mb-8">
                We welcome prospective students and parents to visit our campus. Our registrar's office is open on school days for enrollment inquiries.
              </p>

              <div className="space-y-4">
                {[
                  {
                    icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z',
                    label: 'Address',
                    value: 'Kiwalan, Iligan City, Lanao del Norte, Philippines',
                  },
                  {
                    icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
                    label: 'Office Hours',
                    value: 'Monday – Friday, 7:00 AM – 5:00 PM',
                  },
                  {
                    icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
                    label: 'Email',
                    value: 'info@kiwalan-nhs.edu.ph',
                  },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                      </svg>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{item.label}</p>
                      <p className="text-sm font-semibold text-slate-800">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              <a
                href="https://maps.google.com/?q=Kiwalan+National+High+School+Iligan+City"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 mt-8 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-500 transition-colors shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Open in Google Maps
              </a>
            </div>

            {/* Map side */}
            <div className="rounded-2xl overflow-hidden border border-slate-100 shadow-sm h-[380px] bg-slate-50">
              <iframe
                title="Kiwalan National High School Location"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3948.2297046439908!2d124.27159847501021!3d8.27992249175451!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x325576cc580e692d%3A0x1ee65da2c86ad0a6!2sKiwalan%20National%20High%20School!5e0!3m2!1sen!2sph!4v1779569511724!5m2!1sen!2sph"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 md:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-slate-900 px-8 py-14 md:px-16 md:py-20 relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 rounded-full translate-x-1/3 -translate-y-1/3 blur-3xl" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-600/10 rounded-full -translate-x-1/3 translate-y-1/3 blur-3xl" />
            </div>
            <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-black text-white mb-4 leading-tight">Ready to Shape Your Future?</h2>
                <p className="text-slate-400 leading-relaxed">Join a community dedicated to academic excellence and personal growth. Your journey starts here at Kiwalan NHS.</p>
              </div>
              <div className="flex flex-wrap gap-3 lg:justify-end">
                <Link to="/enroll" className="px-8 py-3.5 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-500 transition-colors shadow-lg shadow-blue-900/40">
                  Enroll Now
                </Link>
                <Link to="/contact" className="px-8 py-3.5 rounded-xl border border-white/10 text-white text-sm font-bold hover:bg-white/5 transition-colors">
                  Contact Us
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Image zoom modal */}
      {zoomedImage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm" onClick={() => setZoomedImage(null)}>
          <button className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors" onClick={() => setZoomedImage(null)}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
          <img src={zoomedImage} alt="Zoomed" className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl" onClick={e => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
};

export default Home;

