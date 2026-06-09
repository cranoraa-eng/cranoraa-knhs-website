import { Link } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';
import api from '../utils/api';
import { LoadingSpinner } from '../components/ui';
import { motion } from 'framer-motion';

// ── Mini Calendar Component ──────────────────────────────────────────
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
        <Link to="/calendar" className="text-xs font-semibold text-violet-600 hover:text-violet-700 transition-colors">View full →</Link>
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
                ${isSelected ? 'bg-violet-600 text-white' : hasEvent ? 'bg-violet-50 text-violet-700 hover:bg-violet-100' : 'text-slate-600 hover:bg-slate-50'}
                ${isToday && !isSelected ? 'ring-1 ring-violet-400' : ''}`}>
              {day}
              {hasEvent && !isSelected && <span className="absolute bottom-0.5 w-1 h-1 bg-violet-500 rounded-full" />}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ── Helper Functions ───────────────────────────────────────────────────────
const attachUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
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
const CATEGORY_STYLES = { academic: 'bg-violet-50 text-violet-700 border-violet-100', events: 'bg-emerald-50 text-emerald-700 border-emerald-100', emergency: 'bg-red-50 text-red-700 border-red-100', holiday: 'bg-violet-50 text-violet-700 border-violet-100' };

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

      {/* ── HERO SECTION - Clean & Professional ── */}
      <section className="relative bg-gradient-to-br from-violet-50 via-white to-violet-50/30 py-20 md:py-28 overflow-hidden">
        {/* Decorative elements */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="absolute top-0 right-0 w-96 h-96 bg-violet-100/40 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" 
        />
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
          className="absolute bottom-0 left-0 w-64 h-64 bg-violet-100/30 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" 
        />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            {/* Left - Content */}
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center lg:text-left"
            >
              {/* Enrollment Badge */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border-2 border-violet-200 shadow-sm mb-6"
              >
                <span className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
                <span className="text-xs font-bold text-violet-700 uppercase tracking-wider">Enrollment Open • SY 2026-2027</span>
              </motion.div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 leading-tight mb-6">
                {content.home_hero_title?.content || 'Kiwalan National High School'}
              </h1>

              <p className="text-lg text-slate-600 leading-relaxed mb-8 max-w-xl mx-auto lg:mx-0">
                {content.home_hero_subtitle?.content || 'Empowering minds and shaping futures through excellence in education and character development.'}
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-10">
                <Link to="/enroll" className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-violet-600 text-white font-bold hover:bg-violet-700 transition-all shadow-lg shadow-violet-600/30 hover:shadow-xl hover:shadow-violet-600/40 hover:scale-105 active:scale-95">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  Apply for Enrollment
                </Link>
                <Link to="/login" className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl border-2 border-violet-600 text-violet-700 font-bold hover:bg-violet-50 transition-all hover:scale-105 active:scale-95">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" /></svg>
                  Student Portal
                </Link>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-4 gap-6 pt-6 border-t-2 border-violet-100">
                {[
                  { val: '1,200+', label: 'Students' },
                  { val: '80+', label: 'Faculty' },
                  { val: '5,000+', label: 'Graduates' },
                  { val: '20+', label: 'Years' },
                ].map((stat, i) => (
                  <motion.div 
                    key={i} 
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4 + (i * 0.1) }}
                    className="text-center"
                  >
                    <p className="text-2xl md:text-3xl font-black text-violet-600">{stat.val}</p>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">{stat.label}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Right - School Image/Badge */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, x: 30 }}
              whileInView={{ opacity: 1, scale: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, type: "spring" }}
              className="hidden lg:flex justify-center"
            >
              <div className="relative">
                {/* Main Card */}
                <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border-4 border-violet-100 p-8 overflow-hidden">
                  {/* School Logo/Seal */}
                  <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-gradient-to-br from-violet-600 to-violet-700 flex items-center justify-center shadow-xl">
                    <svg className="w-16 h-16 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                    </svg>
                  </div>
                  
                  <h3 className="text-2xl font-black text-center text-slate-900 mb-2">KNHS</h3>
                  <p className="text-sm text-center text-slate-600 font-semibold mb-8">Est. 2000 • Kiwalan, Philippines</p>

                  {/* Achievement Badges */}
                  <div className="space-y-3">
                    {[
                      { label: 'Accredited', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', color: 'text-emerald-600 bg-emerald-50' },
                      { label: 'DepEd Recognized', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253', color: 'text-violet-600 bg-violet-50' },
                      { label: 'Excellence Award', icon: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z', color: 'text-amber-600 bg-amber-50' },
                    ].map((badge, i) => (
                      <motion.div 
                        key={i} 
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.6 + (i * 0.1) }}
                        className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100"
                      >
                        <div className={`w-10 h-10 rounded-lg ${badge.color} flex items-center justify-center flex-shrink-0`}>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={badge.icon} /></svg>
                        </div>
                        <span className="text-sm font-bold text-slate-700">{badge.label}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Floating Stats */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 1, duration: 0.5 }}
                  className="absolute -top-6 -right-6 bg-white rounded-2xl shadow-xl border border-slate-100 px-5 py-3"
                >
                  <p className="text-2xl font-black text-violet-600">98%</p>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Pass Rate</p>
                </motion.div>
                <motion.div 
                  initial={{ opacity: 0, y: -20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 1.2, duration: 0.5 }}
                  className="absolute -bottom-6 -left-6 bg-white rounded-2xl shadow-xl border border-slate-100 px-5 py-3"
                >
                  <p className="text-2xl font-black text-emerald-600">A+</p>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Rating</p>
                </motion.div>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="py-20 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <p className="text-xs font-bold text-violet-600 uppercase tracking-widest mb-3">Why Choose KNHS</p>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">Excellence in Education</h2>
            <p className="text-slate-600 max-w-2xl mx-auto">A holistic learning environment that combines academic rigor with character building</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { 
                title: 'Quality Education', 
                desc: 'Comprehensive curriculum designed to prepare students for success', 
                icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
                color: 'bg-violet-50 text-violet-600'
              },
              { 
                title: 'Expert Faculty', 
                desc: 'Experienced and passionate teachers committed to student development', 
                icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
                color: 'bg-emerald-50 text-emerald-600'
              },
              { 
                title: 'Modern Facilities', 
                desc: 'State-of-the-art classrooms and laboratories for holistic learning', 
                icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
                color: 'bg-amber-50 text-amber-600'
              },
              { 
                title: 'Digital Portal', 
                desc: 'Full-featured student portal with grades, attendance, and messaging', 
                icon: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
                color: 'bg-violet-50 text-violet-600'
              },
            ].map((feature, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-slate-50 rounded-2xl border-2 border-slate-100 p-6 hover:border-violet-200 hover:shadow-lg transition-all group"
              >
                <div className={`w-12 h-12 rounded-xl ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={feature.icon} /></svg>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link to="/about" className="inline-flex items-center gap-2 text-violet-600 font-bold hover:text-violet-700 transition-colors">
              Learn more about our school
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ── ANNOUNCEMENTS & EVENTS ── */}
      <section className="py-20 md:py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex items-end justify-between mb-10"
          >
            <div>
              <p className="text-xs font-bold text-violet-600 uppercase tracking-widest mb-2">Stay Updated</p>
              <h2 className="text-3xl md:text-4xl font-black text-slate-900">Announcements & Events</h2>
            </div>
            <Link to="/calendar" className="text-sm font-bold text-violet-600 hover:text-violet-700 transition-colors">
              Full Calendar →
            </Link>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Announcements */}
            <div className="lg:col-span-2 space-y-4">
              {generalAnnouncements.length > 0 ? generalAnnouncements.map((a, i) => {
                const imageUrl = getFirstImage(a);
                const pdfs = getPDFs(a);
                const catStyle = CATEGORY_STYLES[a.category] || 'bg-slate-50 text-slate-600 border-slate-100';
                return (
                  <motion.div 
                    key={a.id} 
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="group bg-white rounded-2xl border border-slate-100 hover:border-violet-200 hover:shadow-md transition-all p-5 flex gap-4"
                  >
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
                      <h3 className="text-sm font-bold text-slate-900 mb-1 line-clamp-1 group-hover:text-violet-700 transition-colors">{a.title}</h3>
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
                  </motion.div>
                );
              }) : (
                <div className="col-span-3 text-center py-12 bg-white rounded-2xl border-2 border-slate-100">
                  <svg className="w-12 h-12 text-slate-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>
                  <p className="text-slate-400 font-semibold">No announcements at this time</p>
                </div>
              )}
              <div className="pt-1">
                <Link to="/login" className="text-sm font-semibold text-violet-600 hover:text-violet-700 transition-colors">View all announcements in the portal →</Link>
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
                            className="flex items-start gap-3 p-3 rounded-xl border border-slate-100 bg-white hover:border-violet-200 hover:shadow-sm transition-all group">
                            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-violet-50 border border-violet-100 flex flex-col items-center justify-center">
                              <span className="text-[9px] font-bold text-violet-500 uppercase leading-none">{d.toLocaleString('en-US', { month: 'short' })}</span>
                              <span className="text-sm font-black text-violet-700 leading-tight">{d.getDate()}</span>
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-900 group-hover:text-violet-700 transition-colors line-clamp-1">{ev.title}</p>
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
      <section className="py-20 md:py-24 bg-[#0f0720] relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 1.5 }}
            className="absolute top-0 right-0 w-[600px] h-[600px] bg-violet-600/10 rounded-full blur-3xl translate-x-1/3 -translate-y-1/3" 
          />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <p className="text-xs font-bold text-violet-400 uppercase tracking-widest mb-3">Digital Platform</p>
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4">Everything in one portal</h2>
            <p className="text-slate-400 max-w-xl mx-auto">Students, teachers, and administrators all have dedicated dashboards with the tools they need.</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { role: 'Students', color: 'border-violet-500/30 bg-violet-500/5', badge: 'bg-violet-500/20 text-violet-300', features: ['View grades & report cards', 'Track attendance records', 'Access learning materials', 'Receive announcements', 'Message teachers & peers'] },
              { role: 'Teachers', color: 'border-violet-500/30 bg-violet-500/5', badge: 'bg-violet-500/20 text-violet-300', features: ['Input & manage grades', 'Record attendance', 'Upload learning materials', 'Post announcements', 'Communicate with students'] },
              { role: 'Administrators', color: 'border-emerald-500/30 bg-emerald-500/5', badge: 'bg-emerald-500/20 text-emerald-300', features: ['Manage all users & classes', 'View analytics & reports', 'Control enrollment', 'System settings & audit logs', 'Backup & maintenance tools'] },
            ].map((r, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`rounded-2xl border ${r.color} p-6`}
              >
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-4 ${r.badge}`}>{r.role}</span>
                <ul className="space-y-2.5">
                  {r.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-2.5 text-sm text-slate-400">
                      <svg className="w-3.5 h-3.5 text-violet-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                      {f}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link to="/login" className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-violet-600 text-white text-sm font-bold hover:bg-violet-500 transition-colors shadow-lg shadow-violet-900/40">
              Access the Portal
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4 4H3" /></svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ── LOCATION ── */}
      <section className="py-20 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">

            {/* Info side */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <p className="text-xs font-bold text-violet-600 uppercase tracking-widest mb-3">Find Us</p>
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
                    icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
                    label: 'Email Support',
                    value: 'info@kiwalan-nhs.edu.ph',
                  },
                  {
                    icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
                    label: 'Office Hours',
                    value: 'Monday – Friday, 7:00 AM – 5:00 PM',
                  },
                ].map((item, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} /></svg>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.label}</p>
                      <p className="text-sm font-bold text-slate-700 mt-0.5">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              <motion.a
                href="https://maps.google.com/?q=Kiwalan+National+High+School+Iligan+City"
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
                className="inline-flex items-center gap-2 mt-8 px-6 py-3 rounded-xl bg-violet-600 text-white text-sm font-bold hover:bg-violet-700 transition-all shadow-md hover:shadow-lg active:scale-95"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                Open in Google Maps
              </motion.a>
            </motion.div>

            {/* Map side */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative aspect-video lg:aspect-square bg-slate-100 rounded-3xl overflow-hidden border-8 border-slate-50 shadow-inner group"
            >
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
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── CTA SECTION ── */}
      <section className="py-20 md:py-24 bg-gradient-to-br from-violet-600 to-violet-700 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <motion.div 
            animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl" 
          />
          <motion.div 
            animate={{ scale: [1, 1.3, 1], opacity: [0.1, 0.15, 0.1] }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl" 
          />
        </div>
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center"
        >
          <h2 className="text-3xl md:text-5xl font-black text-white mb-6">Ready to Join KNHS?</h2>
          <p className="text-lg md:text-xl text-violet-100 mb-10 max-w-2xl mx-auto">
            Start your journey towards excellence. Enrollment for SY 2026-2027 is now open.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/enroll" className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-white text-violet-700 font-bold hover:bg-violet-50 transition-all shadow-2xl hover:scale-105 active:scale-95">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              Apply Now
            </Link>
            <Link to="/contact" className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl border-2 border-white text-white font-bold hover:bg-white/10 transition-all hover:scale-105 active:scale-95">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              Contact Us
            </Link>
          </div>
        </motion.div>
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
