import { Link } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';
import api from '../utils/api';

// ── Mini Calendar ─────────────────────────────────────────────────────────────
const MiniCalendar = ({ events, onSelectDay }) => {
  const [currentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);

  const daysInMonth = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
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
        if (curr.getMonth() === currentDate.getMonth() && curr.getFullYear() === currentDate.getFullYear()) {
          map[curr.getDate()] = (map[curr.getDate()] || 0) + 1;
        }
        curr.setDate(curr.getDate() + 1);
      }
    });
    return map;
  }, [events, currentDate]);

  const monthName = currentDate.toLocaleString('en-US', { month: 'long' });

  const handleDayClick = (day) => {
    if (!day) return;
    setSelectedDay(day);
    if (onSelectDay) onSelectDay(day);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-bold text-slate-900">{monthName} {currentDate.getFullYear()}</p>
        <Link to="/calendar" className="text-xs font-semibold text-violet-600 hover:text-violet-700 transition-colors">View full →</Link>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-1">
        {['S','M','T','W','T','F','S'].map((d, i) => (
          <div key={i} className="text-[10px] font-bold text-slate-400 text-center py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {daysInMonth.map((day, i) => {
          const hasEvent = day && eventDays[day];
          const isToday = day === currentDate.getDate();
          const isSelected = day === selectedDay;
          return (
            <div
              key={i}
              onClick={() => handleDayClick(day)}
              className={`aspect-square flex flex-col items-center justify-center text-[11px] font-semibold rounded-lg cursor-pointer transition-all relative
                ${!day ? 'invisible' : ''}
                ${isSelected ? 'bg-violet-600 text-white' : hasEvent ? 'bg-violet-50 text-violet-700 hover:bg-violet-100' : 'text-slate-600 hover:bg-slate-50'}
                ${isToday && !isSelected ? 'ring-1 ring-violet-400' : ''}
              `}
            >
              {day}
              {hasEvent && !isSelected && (
                <span className="absolute bottom-0.5 w-1 h-1 bg-violet-500 rounded-full" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const attachUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${api.defaults.baseURL.replace('/api', '')}${url}`;
};

const getFirstImage = (a) => {
  if (a.attachment_url && /\.(jpg|jpeg|png|gif|webp)$/i.test(a.attachment_url)) return attachUrl(a.attachment_url);
  const img = a.attachments?.find(att => att.is_image);
  return attachUrl(img?.url);
};

const getPDFs = (a) => {
  const pdfs = [];
  if (a.attachment_url?.toLowerCase().endsWith('.pdf')) pdfs.push({ name: 'Attachment.pdf', url: attachUrl(a.attachment_url) });
  a.attachments?.forEach(att => {
    if (att.url?.toLowerCase().endsWith('.pdf')) pdfs.push({ name: att.filename || 'Document.pdf', url: attachUrl(att.url) });
  });
  return pdfs;
};

const formatDate = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

const CATEGORY_STYLES = {
  academic: 'bg-violet-50 text-violet-700 border-violet-100',
  events:   'bg-emerald-50 text-emerald-700 border-emerald-100',
  emergency:'bg-red-50 text-red-700 border-red-100',
  holiday:  'bg-blue-50 text-blue-700 border-blue-100',
};

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
    .filter(a => {
      const end = a.end_date ? new Date(a.end_date) : new Date(a.event_date || a.created_at);
      const today = new Date(); today.setHours(0,0,0,0);
      return end >= today;
    })
    .slice(0, 4);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-8 h-8 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-white">

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-white pt-16 pb-20 md:pt-24 md:pb-32">
        {/* Subtle background accent */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-violet-50 rounded-full opacity-60 blur-3xl translate-x-1/3 -translate-y-1/3" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-50 border border-violet-100 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-600 animate-pulse" />
              <span className="text-xs font-bold text-violet-700 uppercase tracking-widest">Enrollment Open — SY 2026–2027</span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-slate-900 leading-[1.1] tracking-tight mb-6">
              {content.home_hero_title?.content || 'Kiwalan National High School'}
            </h1>

            <p className="text-lg md:text-xl text-slate-500 leading-relaxed mb-8 max-w-2xl">
              {content.home_hero_subtitle?.content || 'Empowering minds and shaping futures through excellence in education and character development.'}
            </p>

            <div className="flex flex-wrap gap-3">
              <Link to="/enroll" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-violet-600 text-white text-sm font-bold hover:bg-violet-700 transition-colors shadow-sm">
                Apply for Enrollment
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4 4H3" /></svg>
              </Link>
              <Link to="/login" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-slate-200 text-slate-700 text-sm font-bold hover:bg-slate-50 transition-colors">
                Portal Login
              </Link>
            </div>

            {/* Stats row */}
            <div className="flex flex-wrap gap-8 mt-12 pt-8 border-t border-slate-100">
              {[
                { val: '1,200+', label: 'Students' },
                { val: '80+', label: 'Faculty' },
                { val: '5,000+', label: 'Graduates' },
                { val: '20+', label: 'Years' },
              ].map((s, i) => (
                <div key={i}>
                  <p className="text-2xl font-black text-slate-900">{s.val}</p>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Why Choose Us ── */}
      <section className="py-20 md:py-28 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-12">
            <p className="text-xs font-bold text-violet-600 uppercase tracking-widest mb-3">Core Strengths</p>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">Why Choose Kiwalan NHS?</h2>
            <p className="text-slate-500 leading-relaxed">A holistic learning environment that combines academic rigor with character building and practical skills.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                title: content.home_feature_1_title?.content || 'Quality Education',
                desc: content.home_feature_1_content?.content || 'Comprehensive curriculum designed to prepare students for success in higher education and beyond.',
                icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
              },
              {
                title: content.home_feature_2_title?.content || 'Dedicated Faculty',
                desc: content.home_feature_2_content?.content || 'Experienced and passionate teachers committed to student development and academic excellence.',
                icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
              },
              {
                title: content.home_feature_3_title?.content || 'Modern Facilities',
                desc: content.home_feature_3_content?.content || 'State-of-the-art classrooms, laboratories, and facilities to support holistic learning experiences.',
                icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
              },
            ].map((f, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-100 p-8 hover:shadow-md transition-shadow">
                <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center mb-5">
                  <svg className="w-5 h-5 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={f.icon} />
                  </svg>
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2">{f.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Announcements & Events ── */}
      <section className="py-20 md:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <p className="text-xs font-bold text-violet-600 uppercase tracking-widest mb-2">Stay Updated</p>
              <h2 className="text-3xl md:text-4xl font-black text-slate-900">Announcements & Events</h2>
            </div>
            <Link to="/calendar" className="inline-flex items-center gap-1.5 text-sm font-semibold text-violet-600 hover:text-violet-700 transition-colors flex-shrink-0">
              Full Calendar
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4 4H3" /></svg>
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
                  <div key={a.id} className="group bg-white rounded-2xl border border-slate-100 hover:border-violet-100 hover:shadow-md transition-all p-6 flex gap-5">
                    {imageUrl && (
                      <button
                        onClick={() => setZoomedImage(imageUrl)}
                        className="flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border border-slate-100"
                      >
                        <img src={imageUrl} alt={a.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      </button>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${catStyle}`}>{a.category}</span>
                        <span className="text-[11px] text-slate-400">
                          {a.event_date
                            ? new Date(a.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                            : formatDate(a.created_at)}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 mb-1 line-clamp-1 group-hover:text-violet-700 transition-colors">{a.title}</h3>
                      <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{a.content}</p>
                      {pdfs.length > 0 && (
                        <div className="flex gap-2 mt-2">
                          {pdfs.map((pdf, i) => (
                            <a key={i} href={pdf.url} target="_blank" rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-red-50 text-red-600 text-[10px] font-bold hover:bg-red-100 transition-colors">
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
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-10 text-center">
                  <p className="text-sm text-slate-400 font-medium">No announcements at this time.</p>
                </div>
              )}

              <div className="pt-2">
                <Link to="/login" className="text-sm font-semibold text-violet-600 hover:text-violet-700 transition-colors">
                  View all announcements in the portal →
                </Link>
              </div>
            </div>

            {/* Events sidebar */}
            <div className="space-y-5">
              <MiniCalendar
                events={announcements.filter(a => a.category === 'events')}
                onSelectDay={handleSelectDay}
              />

              <div>
                <p className="text-sm font-bold text-slate-900 mb-3">
                  {selectedDayLabel
                    ? `Events — ${new Date().toLocaleString('en-US', { month: 'short' })} ${selectedDayLabel}`
                    : 'Upcoming Events'}
                </p>
                <div className="space-y-2">
                  {(selectedDayLabel ? selectedDateEvents : upcomingEvents).length > 0
                    ? (selectedDayLabel ? selectedDateEvents : upcomingEvents).map(ev => {
                        const d = new Date(ev.event_date || ev.created_at);
                        return (
                          <Link
                            key={ev.id}
                            to={`/calendar?year=${d.getFullYear()}&month=${d.getMonth() + 1}`}
                            className="flex items-start gap-3 p-3 rounded-xl border border-slate-100 hover:border-violet-100 hover:bg-violet-50/50 transition-all group"
                          >
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
                    : (
                      <div className="p-5 rounded-xl border border-slate-100 bg-slate-50 text-center">
                        <p className="text-xs text-slate-400 font-medium">No upcoming events</p>
                      </div>
                    )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 md:py-28 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-violet-600 rounded-3xl px-8 py-14 md:px-16 md:py-20 text-center relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full translate-x-1/3 -translate-y-1/3 blur-2xl" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/20 rounded-full -translate-x-1/3 translate-y-1/3 blur-2xl" />
            </div>
            <div className="relative max-w-2xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-black text-white mb-4">Ready to Shape Your Future?</h2>
              <p className="text-violet-100 mb-8 leading-relaxed">Join a community dedicated to academic excellence and personal growth. Your journey starts here.</p>
              <div className="flex flex-wrap justify-center gap-3">
                <Link to="/enroll" className="px-8 py-3 rounded-xl bg-white text-violet-700 text-sm font-bold hover:bg-slate-50 transition-colors shadow-sm">
                  Enroll Now
                </Link>
                <Link to="/contact" className="px-8 py-3 rounded-xl border border-white/30 text-white text-sm font-bold hover:bg-white/10 transition-colors">
                  Contact Us
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Image zoom modal */}
      {zoomedImage && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm"
          onClick={() => setZoomedImage(null)}
        >
          <button
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
            onClick={() => setZoomedImage(null)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <img
            src={zoomedImage}
            alt="Zoomed"
            className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};

export default Home;
