import { useState, useEffect } from 'react';
import api from '../utils/api';

const Programs = () => {
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

  const programList = [
    {
      title: content.programs_academic_title?.content || 'Academic Programs',
      content: content.programs_academic_content?.content || 'Our academic programs provide a strong foundation in core subjects including Mathematics, Science, English, Filipino, and Social Studies.',
      icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
      color: 'violet',
      image: content.programs_academic_img?.image || 'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'
    },
    {
      title: content.programs_tech_title?.content || 'Technical-Vocational Programs',
      content: content.programs_tech_content?.content || 'We offer technical-vocational education and training (TVET) programs that equip students with practical skills in various fields.',
      icon: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
      color: 'blue',
      image: content.programs_tech_img?.image || 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'
    },
    {
      title: content.programs_sports_title?.content || 'Sports Development',
      content: content.programs_sports_content?.content || 'Our sports program focuses on developing athletic skills, teamwork, and discipline through various sporting activities.',
      icon: 'M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
      color: 'indigo',
      image: content.programs_sports_img?.image || 'https://images.unsplash.com/photo-1546519638-68e109498ffc?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'
    },
    {
      title: content.programs_arts_title?.content || 'Arts and Culture',
      content: content.programs_arts_content?.content || 'Nurture your creative talents through our arts program, offering visual arts, music, dance, and theater classes.',
      icon: 'M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01',
      color: 'pink',
      image: content.programs_arts_img?.image || 'https://images.unsplash.com/photo-1460661419201-fd4ce18a802f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative py-32 overflow-hidden bg-white">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-violet-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-50 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl md:text-7xl font-black text-slate-900 mb-8 tracking-tight">
            {content.programs_title?.content || 'Our Programs'}
          </h1>
          <p className="text-xl text-slate-500 font-medium max-w-3xl mx-auto leading-relaxed">
            {content.programs_subtitle?.content || 'Discover the diverse educational opportunities we offer at Kiwalan National High School, designed to prepare students for a bright future.'}
          </p>
        </div>
      </section>


      {/* Programs Grid */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {programList.map((program, idx) => (
              <div key={idx} className="group bg-white rounded-[3rem] overflow-hidden border border-slate-100 shadow-sm hover:shadow-2xl transition-all duration-500 flex flex-col">
                <div className="relative h-80 overflow-hidden">
                  <img 
                    src={program.image} 
                    alt={program.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent"></div>
                  <div className="absolute bottom-8 left-8">
                    <div className={`w-14 h-14 bg-${program.color}-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-black/20 mb-4`}>
                      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={program.icon} />
                      </svg>
                    </div>
                    <h3 className="text-3xl font-black text-white">{program.title}</h3>
                  </div>
                </div>
                
                <div className="p-10 flex-grow flex flex-col justify-between">
                  <p className="text-lg text-slate-600 font-medium leading-relaxed mb-8">
                    {program.content}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-black uppercase tracking-widest text-${program.color}-600`}>
                      Core Curriculum
                    </span>
                    <button className="flex items-center space-x-2 text-slate-900 font-bold hover:text-violet-600 transition-colors">
                      <span>View Details</span>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4 4H3" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Curriculum Highlight */}
      <section className="py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-slate-900 rounded-[3rem] p-12 md:p-20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl translate-x-1/3 -translate-y-1/3"></div>
            
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div className="space-y-8">
                <h2 className="text-4xl md:text-5xl font-black text-white leading-tight">Ready to start your journey?</h2>
                <p className="text-xl text-slate-400 font-medium">Our comprehensive curriculum is designed to challenge and inspire students at every level.</p>
                <div className="flex flex-wrap gap-4">
                  <div className="px-6 py-3 rounded-full bg-white/5 border border-white/10 text-white text-sm font-bold">Science & Tech</div>
                  <div className="px-6 py-3 rounded-full bg-white/5 border border-white/10 text-white text-sm font-bold">Liberal Arts</div>
                  <div className="px-6 py-3 rounded-full bg-white/5 border border-white/10 text-white text-sm font-bold">Engineering</div>
                </div>
              </div>
              <div className="text-center lg:text-right">
                <a 
                  href="/enroll" 
                  className="inline-block px-12 py-5 rounded-2xl bg-white text-slate-900 font-black text-xl hover:bg-slate-100 transition-all shadow-xl active:scale-95"
                >
                  Apply for Admission
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Programs;
