import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { LoadingSpinner } from '../components/ui';

const HomeDepEd = () => {
  const [content, setContent] = useState({});
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    Promise.all([
      api.get('/website-content/public/').then(r => {
        const map = {};
        const data = Array.isArray(r.data) ? r.data : (r.data?.results ?? []);
        data.forEach(item => { map[item.section] = item; });
        setContent(map);
      }).catch(() => {}),
      api.get('/announcements/public/').then(r => setAnnouncements(r.data.slice(0, 5))).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  // Auto-advance slider
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % 3);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const slides = [
    { title: 'MABUHAY!', subtitle: 'Welcome to Kiwalan NHS', tagline: 'NURTURING LEARNERS FOR THE FUTURE', image: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1200' },
    { title: 'EXCELLENCE', subtitle: 'Quality Education for All', tagline: 'BUILDING TOMORROW\'S LEADERS TODAY', image: 'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=1200' },
    { title: 'ENROLL NOW', subtitle: 'SY 2026-2027', tagline: 'BE PART OF OUR COMMUNITY', image: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=1200' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="bg-white">
      {/* ═══════════════════════════════════════════════════════════ */}
      {/* HERO SLIDER */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <section className="relative h-[60vh] bg-gray-900 overflow-hidden">
        {slides.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ${index === currentSlide ? 'opacity-100' : 'opacity-0'}`}
            style={{ backgroundImage: `url(${slide.image})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-purple-900/90 via-purple-800/70 to-transparent" />
          </div>
        ))}

        {/* Slider Content */}
        <div className="relative h-full max-w-7xl mx-auto px-4 flex items-center">
          <div className="max-w-xl bg-purple-800/80 backdrop-blur-sm p-8 rounded-lg">
            <h2 className="text-5xl font-black text-white mb-2">{slides[currentSlide].title}</h2>
            <p className="text-3xl font-light text-purple-100 italic mb-2">{slides[currentSlide].subtitle}</p>
            <p className="text-sm font-bold text-purple-200 uppercase tracking-widest mb-6">{slides[currentSlide].tagline}</p>
            <button className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg shadow-lg transition-colors">
              READ MORE
            </button>
          </div>
        </div>

        {/* Navigation Arrows */}
        <button onClick={() => setCurrentSlide((currentSlide - 1 + slides.length) % slides.length)} className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 p-3 rounded-full backdrop-blur-sm transition-colors">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <button onClick={() => setCurrentSlide((currentSlide + 1) % slides.length)} className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 p-3 rounded-full backdrop-blur-sm transition-colors">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </button>

        {/* Slider Dots */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {slides.map((_, index) => (
            <button key={index} onClick={() => setCurrentSlide(index)} className={`w-2 h-2 rounded-full transition-all ${index === currentSlide ? 'bg-white w-8' : 'bg-white/50'}`} />
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* QUICK LINKS */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <section className="bg-purple-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { title: "LEARNER INFORMATION SYSTEM", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z", link: "/login" },
              { title: "TEACHER'S PORTAL", icon: "M12 14l9-5-9-5-9 5 9 5zm0 7l-9-5 9-5 9 5-9 5z", link: "/login" },
              { title: "SCHOOL CALENDAR", icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z", link: "/calendar" },
              { title: "DEPED COMMONS", icon: "M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z", link: "https://commons.deped.gov.ph" },
            ].map((item, i) => (
              <Link key={i} to={item.link} className="bg-white border-2 border-purple-200 rounded-lg p-6 hover:bg-purple-100 hover:border-purple-400 transition-all group text-center">
                <svg className="w-12 h-12 mx-auto mb-3 text-purple-600 group-hover:text-purple-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                </svg>
                <p className="text-sm font-bold text-purple-800 uppercase">{item.title}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* MAIN CONTENT - 3 COLUMN GRID */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* LEFT COLUMN: NEWS UPDATES */}
            <div>
              <div className="bg-purple-600 text-white px-4 py-2 font-bold uppercase text-sm">NEWS UPDATES</div>
              <div className="bg-white border border-purple-200 p-4 space-y-4">
                {announcements.filter(a => a.category !== 'events').slice(0, 3).map(a => (
                  <div key={a.id} className="border-b border-gray-200 pb-3 last:border-0">
                    <h3 className="font-bold text-sm text-purple-800 uppercase mb-1">{a.title}</h3>
                    <p className="text-xs text-gray-600 mb-1">{a.content.slice(0, 100)}...</p>
                    <p className="text-[10px] text-gray-400">{new Date(a.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* MIDDLE COLUMN: UPCOMING EVENTS & FEATURED PROGRAMS */}
            <div>
              <div className="bg-purple-600 text-white px-4 py-2 font-bold uppercase text-sm">UPCOMING EVENTS</div>
              <div className="bg-white border border-purple-200 p-4 space-y-3">
                {announcements.filter(a => a.category === 'events').slice(0, 3).map(ev => {
                  const d = new Date(ev.event_date || ev.created_at);
                  return (
                    <div key={ev.id} className="flex items-start gap-3">
                      <div className="bg-purple-600 text-white text-center p-2 rounded flex-shrink-0">
                        <p className="text-xs font-bold">{d.getDate()}</p>
                        <p className="text-[10px] uppercase">{d.toLocaleDateString('en-US', { month: 'short' })}</p>
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-purple-800">{ev.title}</h4>
                        <p className="text-xs text-gray-600">{ev.content.slice(0, 60)}...</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="bg-purple-600 text-white px-4 py-2 font-bold uppercase text-sm mt-6">FEATURED PROGRAMS</div>
              <div className="bg-white border border-purple-200 p-4">
                <div className="grid grid-cols-2 gap-3">
                  {['STEM', 'ABM', 'HUMSS', 'TVL'].map((prog, i) => (
                    <div key={i} className="bg-purple-50 p-3 text-center rounded">
                      <div className="w-full h-20 bg-purple-200 rounded mb-2" />
                      <p className="text-xs font-bold text-purple-800">{prog}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: SOCIAL MEDIA / ANNOUNCEMENTS */}
            <div>
              <div className="bg-purple-600 text-white px-4 py-2 font-bold uppercase text-sm">SOCIAL MEDIA</div>
              <div className="bg-white border border-purple-200 p-4 space-y-4">
                {announcements.slice(0, 5).map((a, i) => (
                  <div key={i} className="flex items-start gap-2 pb-3 border-b border-gray-200 last:border-0">
                    <div className="w-8 h-8 rounded-full bg-purple-200 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-purple-700">K</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-xs text-purple-800">Kiwalan NHS</p>
                      <p className="text-[11px] text-gray-600 leading-tight">{a.title}</p>
                      <p className="text-[9px] text-gray-400 mt-1">{new Date(a.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomeDepEd;
