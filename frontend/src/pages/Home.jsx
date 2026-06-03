import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import api from '../utils/api';
import { LoadingSpinner } from '../components/ui';

const Home = () => {
  const [content, setContent] = useState({});
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/website-content/public/').then(r => {
        const map = {};
        const data = Array.isArray(r.data) ? r.data : (r.data?.results ?? []);
        data.forEach(item => { map[item.section] = item; });
        setContent(map);
      }).catch(() => {}),
      api.get('/announcements/public/').then(r => setAnnouncements(r.data.slice(0, 3))).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

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
              <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center shrink-0 border-2 border-yellow-400 shadow-lg">
                <svg className="w-6 h-6 text-blue-900" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
              </div>
              <div className="text-left">
                <p className="text-xs md:text-sm font-black text-white uppercase tracking-wide leading-tight">
                  Kiwalan National High School
                </p>
                <p className="text-[9px] md:text-[10px] text-blue-200 font-medium uppercase tracking-wider">
                  Department of Education • Republic of the Philippines
                </p>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-md bg-yellow-400/20 border border-yellow-400/30">
              <span className="text-[10px] font-black text-yellow-400 uppercase tracking-widest">Official Website</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── HERO SECTION - Clean & Professional ── */}
      <section className="relative bg-gradient-to-br from-violet-50 via-white to-violet-50/30 py-20 md:py-28 overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-violet-100/40 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-violet-100/30 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            {/* Left - Content */}
            <div className="text-center lg:text-left">
              {/* Enrollment Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border-2 border-violet-200 shadow-sm mb-6">
                <span className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
                <span className="text-xs font-bold text-violet-700 uppercase tracking-wider">Enrollment Open • SY 2026-2027</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 leading-tight mb-6">
                {content.home_hero_title?.content || 'Kiwalan National High School'}
              </h1>

              <p className="text-lg text-slate-600 leading-relaxed mb-8 max-w-xl mx-auto lg:mx-0">
                {content.home_hero_subtitle?.content || 'Empowering minds and shaping futures through excellence in education and character development.'}
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-10">
                <Link to="/enroll" className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-violet-600 text-white font-bold hover:bg-violet-700 transition-all shadow-lg shadow-violet-600/30 hover:shadow-xl hover:shadow-violet-600/40">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  Apply for Enrollment
                </Link>
                <Link to="/login" className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl border-2 border-violet-600 text-violet-700 font-bold hover:bg-violet-50 transition-all">
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
                  <div key={i} className="text-center">
                    <p className="text-2xl md:text-3xl font-black text-violet-600">{stat.val}</p>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right - School Image/Badge */}
            <div className="hidden lg:flex justify-center">
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
                      <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                        <div className={`w-10 h-10 rounded-lg ${badge.color} flex items-center justify-center flex-shrink-0`}>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={badge.icon} /></svg>
                        </div>
                        <span className="text-sm font-bold text-slate-700">{badge.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Floating Stats */}
                <div className="absolute -top-6 -right-6 bg-white rounded-2xl shadow-xl border border-slate-100 px-5 py-3">
                  <p className="text-2xl font-black text-violet-600">98%</p>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Pass Rate</p>
                </div>
                <div className="absolute -bottom-6 -left-6 bg-white rounded-2xl shadow-xl border border-slate-100 px-5 py-3">
                  <p className="text-2xl font-black text-emerald-600">A+</p>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Rating</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="py-20 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-xs font-bold text-violet-600 uppercase tracking-widest mb-3">Why Choose KNHS</p>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">Excellence in Education</h2>
            <p className="text-slate-600 max-w-2xl mx-auto">A holistic learning environment that combines academic rigor with character building</p>
          </div>

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
                color: 'bg-blue-50 text-blue-600'
              },
            ].map((feature, i) => (
              <div key={i} className="bg-slate-50 rounded-2xl border-2 border-slate-100 p-6 hover:border-violet-200 hover:shadow-lg transition-all group">
                <div className={`w-12 h-12 rounded-xl ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={feature.icon} /></svg>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{feature.desc}</p>
              </div>
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

      {/* ── ANNOUNCEMENTS ── */}
      <section className="py-20 md:py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-xs font-bold text-violet-600 uppercase tracking-widest mb-2">Latest Updates</p>
              <h2 className="text-3xl md:text-4xl font-black text-slate-900">Announcements</h2>
            </div>
            <Link to="/login" className="text-sm font-bold text-violet-600 hover:text-violet-700 transition-colors">
              View all →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {announcements.length > 0 ? announcements.map(a => (
              <div key={a.id} className="bg-white rounded-2xl border-2 border-slate-100 hover:border-violet-200 hover:shadow-lg transition-all p-6 group">
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-2 py-1 rounded-lg bg-violet-50 text-violet-700 text-[10px] font-bold uppercase tracking-wider">
                    {a.category}
                  </span>
                  <span className="text-xs text-slate-400">
                    {new Date(a.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2 line-clamp-2 group-hover:text-violet-600 transition-colors">
                  {a.title}
                </h3>
                <p className="text-sm text-slate-600 line-clamp-3">{a.content}</p>
              </div>
            )) : (
              <div className="col-span-3 text-center py-12 bg-white rounded-2xl border-2 border-slate-100">
                <svg className="w-12 h-12 text-slate-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>
                <p className="text-slate-400 font-semibold">No announcements at this time</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── CTA SECTION ── */}
      <section className="py-20 md:py-24 bg-gradient-to-br from-violet-600 to-violet-700 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl" />
        </div>
        
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-5xl font-black text-white mb-6">Ready to Join KNHS?</h2>
          <p className="text-lg md:text-xl text-violet-100 mb-10 max-w-2xl mx-auto">
            Start your journey towards excellence. Enrollment for SY 2026-2027 is now open.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/enroll" className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-white text-violet-700 font-bold hover:bg-violet-50 transition-all shadow-2xl">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              Apply Now
            </Link>
            <Link to="/contact" className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl border-2 border-white text-white font-bold hover:bg-white/10 transition-all">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              Contact Us
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
};

export default Home;
