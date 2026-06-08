import { Link } from 'react-router-dom';

const SeniorHigh = () => {
  const strands = [
    {
      code: 'STEM',
      name: 'Science, Technology, Engineering and Mathematics',
      desc: 'For students interested in engineering, medicine, IT, and science-related careers',
      subjects: ['Pre-Calculus', 'Basic Calculus', 'General Biology', 'General Chemistry', 'General Physics'],
      careers: ['Engineer', 'Doctor', 'Scientist', 'Architect', 'IT Professional'],
      color: 'from-blue-600 to-violet-800'
    },
    {
      code: 'ABM',
      name: 'Accountancy, Business and Management',
      desc: 'For students planning careers in business, accounting, and management',
      subjects: ['Business Math', 'Business Finance', 'Organization & Management', 'Fundamentals of ABM'],
      careers: ['Accountant', 'Entrepreneur', 'Business Manager', 'Marketing Specialist'],
      color: 'from-green-600 to-emerald-600'
    },
    {
      code: 'HUMSS',
      name: 'Humanities and Social Sciences',
      desc: 'For students interested in social sciences, education, and communication',
      subjects: ['Philippine Politics', 'World Religions', 'Creative Writing', 'Disciplines of Social Sciences'],
      careers: ['Teacher', 'Lawyer', 'Journalist', 'Social Worker', 'Psychologist'],
      color: 'from-orange-600 to-red-600'
    },
    {
      code: 'GAS',
      name: 'General Academic Strand',
      desc: 'For students who are still exploring their interests and career options',
      subjects: ['Humanities', 'Social Sciences', 'Applied Economics', 'Organization & Management'],
      careers: ['Flexible career paths', 'Multiple college majors'],
      color: 'from-violet-900 to-pink-600'
    },
    {
      code: 'TVL',
      name: 'Technical-Vocational-Livelihood',
      desc: 'For students seeking technical skills and immediate employment',
      subjects: ['ICT', 'Home Economics', 'Industrial Arts', 'Agri-Fishery Arts'],
      careers: ['Technician', 'Chef', 'Carpenter', 'IT Support', 'Farmer'],
      color: 'from-yellow-600 to-orange-600'
    }
  ];

  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="bg-violet-950 py-16 md:py-20 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-5">
          <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
              <p className="text-xs font-bold text-violet-200 uppercase tracking-widest mb-4">Grades 11-12</p>
              <h1 className="text-4xl md:text-5xl font-black text-white leading-tight mb-5 uppercase">
                Senior High School
              </h1>
              <p className="text-violet-100 leading-relaxed text-lg">
                Choose your track and prepare for college, employment, or entrepreneurship
              </p>
            </div>
        </div>
      </section>

      {/* Overview */}
      <section className="py-16 md:py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl border-2 border-violet-200 p-8 md:p-12 shadow-lg mb-12">
            <h2 className="text-2xl font-black text-slate-900 mb-4 uppercase">About Senior High School</h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              Senior High School (SHS) is the final two years of the K-12 program. Students choose a track based on their interests, strengths, and career goals. All SHS students take core subjects plus specialized subjects in their chosen track.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Duration', value: '2 Years' },
                { label: 'Grade Levels', value: '11 - 12' },
                { label: 'Tracks', value: '4 Academic' },
                { label: 'Strands', value: '5 Options' }
              ].map((info, i) => (
                <div key={i} className="text-center p-4 bg-slate-50 rounded-xl border border-violet-200">
                  <p className="text-2xl font-black text-violet-800 mb-1">{info.value}</p>
                  <p className="text-xs text-gray-600 uppercase font-bold">{info.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Strands */}
          <div className="text-center mb-10">
            <h2 className="text-3xl font-black text-slate-900 mb-3 uppercase">Choose Your Strand</h2>
            <p className="text-gray-600">Select a path that aligns with your goals</p>
          </div>

          <div className="space-y-6">
            {strands.map((strand, i) => (
              <div key={i} className="bg-white rounded-2xl border-2 border-violet-200 overflow-hidden hover:shadow-xl transition-all">
                <div className={`h-2 bg-gradient-to-r ${strand.color}`} />
                <div className="p-6">
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="px-4 py-2 bg-violet-900 text-white rounded-lg font-black text-lg">{strand.code}</span>
                        <h3 className="text-xl font-black text-slate-900 uppercase">{strand.name}</h3>
                      </div>
                      <p className="text-gray-700 mb-4">{strand.desc}</p>
                      <div className="mb-4">
                        <p className="text-xs font-bold text-violet-800 uppercase mb-2">Specialized Subjects:</p>
                        <div className="flex flex-wrap gap-2">
                          {strand.subjects.map((sub, j) => (
                            <span key={j} className="px-3 py-1 bg-slate-50 text-violet-900 rounded-full text-xs font-bold border border-violet-200">
                              {sub}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-violet-800 uppercase mb-2">Career Paths:</p>
                        <p className="text-sm text-gray-600">{strand.careers.join(', ')}</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Link to="/enroll" className="px-6 py-3 bg-violet-900 text-white rounded-xl font-bold text-sm hover:bg-violet-950 transition-colors uppercase">
                        Enroll Now
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Core Subjects */}
      <section className="py-16 md:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-slate-900 mb-3 uppercase">Core Subjects</h2>
            <p className="text-gray-600">Required for all SHS students regardless of strand</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { subject: 'Oral Communication', area: 'Languages' },
              { subject: 'Reading & Writing', area: 'Languages' },
              { subject: 'Komunikasyon at Pananaliksik', area: 'Languages' },
              { subject: 'General Mathematics', area: 'Math' },
              { subject: 'Statistics & Probability', area: 'Math' },
              { subject: 'Earth & Life Science', area: 'Science' },
              { subject: 'Physical Science', area: 'Science' },
              { subject: 'Personal Development', area: 'Core' },
              { subject: 'Physical Education & Health', area: 'MAPEH' }
            ].map((sub, i) => (
              <div key={i} className="bg-slate-50 rounded-xl border-2 border-violet-200 p-4 hover:bg-white transition-all">
                <p className="text-sm font-black text-slate-900">{sub.subject}</p>
                <p className="text-xs text-violet-800 mt-1">{sub.area}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default SeniorHigh;
