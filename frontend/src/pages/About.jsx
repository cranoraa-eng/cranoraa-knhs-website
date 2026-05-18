import { useState, useEffect } from 'react';
import api from '../utils/api';

const About = () => {
  const [content, setContent] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      const response = await api.get('/website-content/public/');
      const contentMap = {};
      response.data.forEach(item => {
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
      <section className="relative py-32 overflow-hidden bg-slate-900">
        <div className="absolute inset-0 opacity-30">
          <img 
            src="https://images.unsplash.com/photo-1577896851231-70ef18881754?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80"
            alt="School Campus"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/80 to-transparent"></div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h1 className="text-5xl md:text-7xl font-black mb-8 text-white leading-tight animate-fadeIn">
              {content.about_title?.content || 'About Our School'}
            </h1>
            <p className="text-xl text-slate-300 font-medium leading-relaxed animate-fadeIn delay-100">
              {content.about_subtitle?.content || 'Learn about our history, mission, and the values that drive our commitment to excellence in education.'}
            </p>
          </div>
        </div>
      </section>

      {/* Mission & Vision Section */}
      <section className="py-32 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24">
            <div className="space-y-12">
              <div className="group p-10 rounded-[2.5rem] bg-violet-50 border border-violet-100 hover:shadow-2xl transition-all duration-300">
                <div className="w-16 h-16 bg-violet-600 rounded-2xl flex items-center justify-center mb-8 shadow-lg shadow-violet-200">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h2 className="text-3xl font-black text-slate-900 mb-6">{content.about_mission_title?.content || 'Our Mission'}</h2>
                <p className="text-lg text-slate-600 font-medium leading-relaxed whitespace-pre-line">
                  {content.about_mission_content?.content || 'To provide quality education that develops students academic excellence, moral character, and practical skills.'}
                </p>
              </div>

              <div className="group p-10 rounded-[2.5rem] bg-indigo-50 border border-indigo-100 hover:shadow-2xl transition-all duration-300">
                <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mb-8 shadow-lg shadow-indigo-200">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h2 className="text-3xl font-black text-slate-900 mb-6">{content.about_vision_title?.content || 'Our Vision'}</h2>
                <p className="text-lg text-slate-600 font-medium leading-relaxed whitespace-pre-line">
                  {content.about_vision_content?.content || 'To be a leading educational institution recognized for academic excellence and innovative teaching methods.'}
                </p>
              </div>
            </div>

            <div className="relative">
              <div className="sticky top-32 space-y-8">
                <div className="aspect-[4/5] rounded-[3rem] overflow-hidden shadow-2xl">
                  <img 
                    src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80" 
                    className="w-full h-full object-cover" 
                    alt="Students"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-8 rounded-3xl bg-slate-900 text-white text-center">
                    <p className="text-4xl font-black mb-1">20+</p>
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Years Excellence</p>
                  </div>
                  <div className="p-8 rounded-3xl bg-violet-600 text-white text-center">
                    <p className="text-4xl font-black mb-1">5k+</p>
                    <p className="text-xs font-bold uppercase tracking-widest text-violet-200">Alumni</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* History Section */}
      <section className="py-32 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-xs font-black text-violet-600 uppercase tracking-[0.3em] mb-4">Our Legacy</h2>
              <h3 className="text-4xl md:text-5xl font-black text-slate-900">{content.about_history_title?.content || 'Our History'}</h3>
            </div>
            
            <div className="relative p-12 md:p-16 rounded-[3rem] bg-white border border-slate-100 shadow-xl overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-violet-50 rounded-full -translate-y-1/2 translate-x-1/2"></div>
              <div className="relative z-10">
                <p className="text-xl text-slate-600 font-medium leading-relaxed first-letter:text-6xl first-letter:font-black first-letter:text-violet-600 first-letter:mr-4 first-letter:float-left whitespace-pre-line">
                  {content.about_history_content?.content || 'Kiwalan National High School was established with the vision of providing accessible and quality education to the youth of Kiwalan and its neighboring communities. Over the years, we have grown from a small learning institution to a comprehensive high school serving hundreds of students.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
