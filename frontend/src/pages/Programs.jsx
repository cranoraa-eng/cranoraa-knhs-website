import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import Swal from 'sweetalert2';
import { LoadingSpinner } from '../components/ui';

const Programs = () => {
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

  const handleViewDetails = (program) => {
    const detailKey = `programs_${program.key}_details`;
    const details = content[detailKey]?.content || 'Details for this program are coming soon. Please check back later or contact the school office for more information.';
    Swal.fire({
      title: `<span class="text-xl font-black text-slate-900">${program.title}</span>`,
      html: `
        <div class="text-left">
          <div class="w-full h-44 rounded-xl overflow-hidden mb-5">
            <img src="${program.image}" class="w-full h-full object-cover" />
          </div>
          <p class="text-slate-600 leading-relaxed whitespace-pre-line text-sm font-medium">${details}</p>
        </div>
      `,
      showCloseButton: true,
      showConfirmButton: false,
      width: '560px',
      padding: '2rem',
      background: '#ffffff',
      customClass: {
        popup: 'rounded-2xl border border-slate-100 shadow-2xl',
      },
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <LoadingSpinner />
      </div>
    );
  }

  const programList = [
    {
      key: 'academic',
      title: content.programs_academic_title?.content || 'Academic Programs',
      content: content.programs_academic_content?.content || 'Our academic programs provide a strong foundation in core subjects including Mathematics, Science, English, Filipino, and Social Studies.',
      icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
      image: 'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    },
    {
      key: 'tech',
      title: content.programs_tech_title?.content || 'Technical-Vocational Programs',
      content: content.programs_tech_content?.content || 'We offer technical-vocational education and training (TVET) programs that equip students with practical skills in various fields.',
      icon: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
      image: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    },
    {
      key: 'sports',
      title: content.programs_sports_title?.content || 'Sports Development',
      content: content.programs_sports_content?.content || 'Our sports program focuses on developing athletic skills, teamwork, and discipline through various sporting activities.',
      icon: 'M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
      image: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    },
    {
      key: 'arts',
      title: content.programs_arts_title?.content || 'Arts and Culture',
      content: content.programs_arts_content?.content || 'Nurture your creative talents through our arts program, offering visual arts, music, dance, and theater classes.',
      icon: 'M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01',
      image: 'https://images.unsplash.com/photo-1460661419201-fd4ce18a802f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    },
  ];

  return (
    <div className="bg-white">

      {/* ── OFFICIAL GOVERNMENT BANNER with KNHS Branding ── */}
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

      {/* ── Hero ── */}
      <section className="bg-[#0f0720] py-20 md:py-28 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-violet-600/10 rounded-full blur-3xl translate-x-1/3 -translate-y-1/3" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-3xl -translate-x-1/3 translate-y-1/3" />
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xs font-bold text-violet-400 uppercase tracking-widest mb-4">Curriculum</p>
          <h1 className="text-4xl md:text-5xl font-black text-white leading-tight mb-5">
            {content.programs_title?.content || 'Our Programs'}
          </h1>
          <p className="text-slate-400 leading-relaxed text-lg max-w-2xl mx-auto">
            {content.programs_subtitle?.content || 'Discover the diverse educational opportunities we offer, designed to prepare students for a bright future.'}
          </p>
        </div>
      </section>

      {/* ── Programs Grid ── */}
      <section className="py-20 md:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {programList.map((program, i) => (
              <div key={i} className="group bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-xl hover:border-violet-100 transition-all duration-300 flex flex-col">
                {/* Image */}
                <div className="relative h-56 overflow-hidden">
                  <img src={program.image} alt={program.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-slate-900/20 to-transparent" />
                  {/* Number badge */}
                  <div className="absolute top-4 left-4 w-8 h-8 rounded-xl bg-white/10 border border-white/20 backdrop-blur-sm flex items-center justify-center">
                    <span className="text-xs font-black text-white">0{i + 1}</span>
                  </div>
                  {/* Icon */}
                  <div className="absolute bottom-4 left-4 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center shadow-lg">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={program.icon} />
                      </svg>
                    </div>
                    <h3 className="text-base font-black text-white drop-shadow">{program.title}</h3>
                  </div>
                </div>
                {/* Content */}
                <div className="p-6 flex-1 flex flex-col">
                  <p className="text-sm text-slate-500 leading-relaxed flex-1">{program.content}</p>
                  <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-violet-600 uppercase tracking-widest">DepEd Curriculum</span>
                    <button
                      onClick={() => handleViewDetails(program)}
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-700 hover:text-violet-600 transition-colors group/btn"
                    >
                      View Details
                      <svg className="w-4 h-4 group-hover/btn:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

      {/* ── CTA ── */}
      <section className="py-20 md:py-28 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-[#0f0720] rounded-3xl px-8 py-14 md:px-16 md:py-20 relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/20 rounded-full translate-x-1/3 -translate-y-1/3 blur-3xl" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-600/10 rounded-full -translate-x-1/3 translate-y-1/3 blur-3xl" />
              <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
            </div>
            <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
              <div>
                <p className="text-xs font-bold text-violet-400 uppercase tracking-widest mb-3">Get Started</p>
                <h2 className="text-3xl md:text-4xl font-black text-white mb-4 leading-tight">Ready to start your journey?</h2>
                <p className="text-slate-400 leading-relaxed mb-6">Our comprehensive curriculum is designed to challenge and inspire students at every level.</p>
                <div className="flex flex-wrap gap-2">
                  {['Science & Tech', 'Liberal Arts', 'Engineering', 'Vocational'].map(tag => (
                    <span key={tag} className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white text-xs font-semibold">{tag}</span>
                  ))}
                </div>
              </div>
              <div className="lg:text-right">
                <Link to="/enroll" className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-violet-600 text-white font-bold text-sm hover:bg-violet-500 transition-colors shadow-lg shadow-violet-900/40">
                  Apply for Admission
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4 4H3" /></svg>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};

export default Programs;
