import { useState, useEffect } from 'react';
import api from '../utils/api';

const Contact = () => {
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

  const infoItems = [
    {
      label: 'Address',
      value: content.contact_address?.content || 'Kiwalan, Philippines',
      icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z',
    },
    {
      label: 'Email',
      value: content.contact_email?.content || 'info@kiwalan-nhs.edu.ph',
      icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
    },
    {
      label: 'Phone',
      value: content.contact_phone?.content || '(123) 456-7890',
      icon: 'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z',
    },
    {
      label: 'Office Hours',
      value: content.contact_office_hours?.content || 'Mon – Fri: 7:00 AM – 5:00 PM',
      icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
    },
  ];

  return (
    <div className="bg-white">

      {/* ── Hero ── */}
      <section className="py-20 md:py-28 bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-xs font-bold text-violet-600 uppercase tracking-widest mb-4">Contact Us</p>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 leading-tight mb-5">
              {content.contact_title?.content || 'Get in Touch'}
            </h1>
            <p className="text-slate-500 leading-relaxed text-lg">
              {content.contact_subtitle?.content || 'Have questions about enrollment or our programs? We are here to help.'}
            </p>
          </div>
        </div>
      </section>

      {/* ── Info + Map ── */}
      <section className="py-20 md:py-28 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

            {/* Info cards */}
            <div className="lg:col-span-2 space-y-4">
              {infoItems.map((item, i) => (
                <div key={i} className="bg-white rounded-2xl border border-slate-100 p-6 flex items-start gap-4 hover:shadow-sm transition-shadow">
                  <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{item.label}</p>
                    <p className="text-sm font-semibold text-slate-800">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Map */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden h-full min-h-[400px] relative">
                {content.contact_map_url?.content ? (
                  <iframe
                    src={content.contact_map_url.content}
                    width="100%"
                    height="100%"
                    style={{ border: 0, minHeight: '400px' }}
                    allowFullScreen=""
                    loading="lazy"
                    title="School Location"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-slate-300 gap-3">
                    <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                    <p className="text-sm font-medium text-slate-400">Map not yet configured</p>
                  </div>
                )}

                {/* Floating label */}
                <div className="absolute bottom-4 left-4 right-4 bg-slate-900/90 backdrop-blur-sm rounded-xl p-4 hidden sm:flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center text-white text-xs font-black flex-shrink-0">KN</div>
                    <div>
                      <p className="text-white text-sm font-bold leading-none">Kiwalan National High School</p>
                      <p className="text-slate-400 text-xs mt-0.5">Main Campus</p>
                    </div>
                  </div>
                  <button className="px-4 py-1.5 bg-white text-slate-900 rounded-lg text-xs font-bold hover:bg-slate-100 transition-colors flex-shrink-0">
                    Directions
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};

export default Contact;
