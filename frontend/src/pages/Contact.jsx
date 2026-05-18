import { useState, useEffect } from 'react';
import api from '../utils/api';

const Contact = () => {
  const [content, setContent] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      const response = await api.get('/website-content/public/');
      const contentMap = {};
      
      // Safety check: Ensure response.data is an array before calling forEach
      const data = Array.isArray(response.data) ? response.data : 
                   (response.data && Array.isArray(response.data.results)) ? response.data.results : [];
      
      data.forEach(item => {
        contentMap[item.section] = item;
      });
      setContent(contentMap);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching website content:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative py-32 overflow-hidden bg-white">
        <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-violet-50 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/2"></div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h1 className="text-5xl md:text-7xl font-black text-slate-900 mb-8 tracking-tight">
              {content.contact_title?.content || 'Get in Touch'}
            </h1>
            <p className="text-xl text-slate-500 font-medium leading-relaxed">
              {content.contact_subtitle?.content || 'Have questions about enrollment or our programs? We are here to help and answer any questions you might have.'}
            </p>
          </div>
        </div>
      </section>

      {/* Contact Content */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
            {/* Info Cards */}
            <div className="lg:col-span-5 space-y-6">
              {[
                { 
                  title: 'Visit Us', 
                  val: content.contact_address?.content || 'Kiwalan, Philippines', 
                  icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z',
                  color: 'violet'
                },
                { 
                  title: 'Email Us', 
                  val: content.contact_email?.content || 'info@kiwalan-nhs.edu.ph', 
                  icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
                  color: 'blue'
                },
                { 
                  title: 'Call Us', 
                  val: content.contact_phone?.content || '(123) 456-7890', 
                  icon: 'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z',
                  color: 'indigo'
                },
                { 
                  title: 'Office Hours', 
                  val: content.contact_office_hours?.content || 'Mon - Fri: 7AM - 5PM', 
                  icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
                  color: 'slate'
                }
              ].map((item, idx) => (
                <div key={idx} className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex items-center space-x-6 hover:shadow-xl transition-all duration-300">
                  <div className={`w-14 h-14 bg-${item.color}-50 rounded-2xl flex items-center justify-center text-${item.color}-600 shrink-0`}>
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{item.title}</h4>
                    <p className="text-lg font-bold text-slate-800">{item.val}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Map Area */}
            <div className="lg:col-span-7">
              <div className="bg-white p-4 rounded-[3rem] border border-slate-100 shadow-sm h-full min-h-[500px] relative overflow-hidden">
                {content.contact_map_url?.content ? (
                  <iframe 
                    src={content.contact_map_url.content}
                    width="100%" 
                    height="100%" 
                    style={{ border: 0 }} 
                    allowFullScreen="" 
                    loading="lazy"
                    className="rounded-[2.5rem]"
                    title="School Map"
                  ></iframe>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-slate-300 space-y-4">
                    <svg className="w-20 h-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                    <p className="text-xl font-black italic">Interactive map not yet configured</p>
                  </div>
                )}
                
                {/* Floating Map Label */}
                <div className="absolute bottom-10 left-10 right-10 bg-slate-900/90 backdrop-blur-md p-6 rounded-3xl border border-white/10 hidden sm:block">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-violet-600 rounded-xl flex items-center justify-center text-white font-black">KN</div>
                      <div>
                        <p className="text-white font-bold">Kiwalan National High School</p>
                        <p className="text-slate-400 text-xs font-medium">Main Campus Location</p>
                      </div>
                    </div>
                    <button className="px-6 py-2 bg-white text-slate-900 rounded-xl text-sm font-black hover:bg-slate-100 transition-colors">
                      Get Directions
                    </button>
                  </div>
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
