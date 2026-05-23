import { useState, useEffect } from 'react';
import api from '../utils/api';

const About = () => {
  const [content, setContent] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/website-content/public/').then(r => {
      const map = {};
      const data = Array.isArray(r.data) ? r.data : (r.data?.results ?? []);
      data.forEach(item => { map[item.section] = item; });
      setContent(map);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

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
      <section className="bg-[#0f0720] py-20 md:py-28 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 opacity-10">
            <img src="https://images.unsplash.com/photo-1577896851231-70ef18881754?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80" alt="" className="w-full h-full object-cover" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-[#0f0720] via-[#0f0720]/90 to-[#0f0720]/60" />
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-3xl translate-x-1/3 -translate-y-1/3" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-xs font-bold text-violet-400 uppercase tracking-widest mb-4">Our School</p>
            <h1 className="text-4xl md:text-5xl font-black text-white leading-tight mb-5">
              {content.about_title?.content || 'About Our School'}
            </h1>
            <p className="text-slate-400 leading-relaxed text-lg">
              {content.about_subtitle?.content || 'Learn about our history, mission, and the values that drive our commitment to excellence in education.'}
            </p>
          </div>
        </div>
      </section>

      {/* ── Mission & Vision ── */}
      <section className="py-20 md:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
            {/* Mission */}
            <div className="rounded-2xl border border-violet-100 bg-violet-50 p-8 md:p-10">
              <div className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center mb-6">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h2 className="text-xl font-black text-slate-900 mb-4">
                {content.about_mission_title?.content || 'Our Mission'}
              </h2>
              <p className="text-slate-600 leading-relaxed whitespace-pre-line">
                {content.about_mission_content?.content || 'To provide quality education that develops students\' academic excellence, moral character, and practical skills.'}
              </p>
            </div>

            {/* Vision */}
            <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-8 md:p-10">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center mb-6">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h2 className="text-xl font-black text-slate-900 mb-4">
                {content.about_vision_title?.content || 'Our Vision'}
              </h2>
              <p className="text-slate-600 leading-relaxed whitespace-pre-line">
                {content.about_vision_content?.content || 'To be a leading educational institution recognized for academic excellence and innovative teaching methods.'}
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { val: '20+', label: 'Years of Excellence' },
              { val: '1,200+', label: 'Current Students' },
              { val: '5,000+', label: 'Alumni' },
              { val: '80+', label: 'Faculty Members' },
            ].map((s, i) => (
              <div key={i} className="rounded-2xl border border-slate-100 bg-slate-50 p-6 text-center">
                <p className="text-3xl font-black text-violet-600 mb-1">{s.val}</p>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── History ── */}
      <section className="py-20 md:py-28 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-10">
              <p className="text-xs font-bold text-violet-600 uppercase tracking-widest mb-3">Our Legacy</p>
              <h2 className="text-3xl md:text-4xl font-black text-slate-900">
                {content.about_history_title?.content || 'Our History'}
              </h2>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 p-8 md:p-12">
              <p className="text-slate-600 leading-relaxed whitespace-pre-line text-base first-letter:text-5xl first-letter:font-black first-letter:text-violet-600 first-letter:mr-3 first-letter:float-left first-letter:leading-none">
                {content.about_history_content?.content || 'Kiwalan National High School was established with the vision of providing accessible and quality education to the youth of Kiwalan and its neighboring communities. Over the years, we have grown from a small learning institution to a comprehensive high school serving hundreds of students.'}
              </p>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};

export default About;
