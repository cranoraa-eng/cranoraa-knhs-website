import { LoadingSpinner } from '../components/ui';

const Faculty = () => {
  return (
    <div className="bg-white">
      {/* Hero Banner */}
      <section className="bg-violet-950 py-16 md:py-20 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-5">
          <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
              <p className="text-xs font-bold text-violet-200 uppercase tracking-widest mb-4">Our Team</p>
              <h1 className="text-4xl md:text-5xl font-black text-white leading-tight mb-5 uppercase">
                Faculty & Staff
              </h1>
              <p className="text-violet-100 leading-relaxed text-lg">
                Meet the dedicated educators and professionals who make Kiwalan NHS a center of excellence
              </p>
            </div>
        </div>
      </section>

      {/* Administration */}
      <section className="py-16 md:py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-slate-900 mb-3 uppercase">School Administration</h2>
            <p className="text-gray-600">Leadership team guiding our institution</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { name: 'Dr. Maria Santos', position: 'School Principal', dept: 'Administration' },
              { name: 'Prof. Juan Dela Cruz', position: 'Assistant Principal', dept: 'Academic Affairs' },
              { name: 'Ms. Ana Reyes', position: 'Assistant Principal', dept: 'Student Affairs' }
            ].map((admin, i) => (
              <div key={i} className="bg-white rounded-2xl border-2 border-violet-200 p-6 text-center hover:shadow-lg transition-all">
                <div className="w-24 h-24 rounded-full bg-violet-100 mx-auto mb-4 flex items-center justify-center border-4 border-violet-200">
                  <span className="text-3xl font-black text-violet-800">{admin.name.charAt(0)}</span>
                </div>
                <h3 className="text-lg font-black text-slate-900 uppercase">{admin.name}</h3>
                <p className="text-sm font-bold text-violet-800 mb-1">{admin.position}</p>
                <p className="text-xs text-gray-600">{admin.dept}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Departments */}
      <section className="py-16 md:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-slate-900 mb-3 uppercase">Academic Departments</h2>
            <p className="text-gray-600">Organized by subject area and expertise</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { dept: 'Mathematics', count: 12, icon: 'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z' },
              { dept: 'Science', count: 15, icon: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z' },
              { dept: 'English', count: 10, icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
              { dept: 'Filipino', count: 8, icon: 'M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129' },
              { dept: 'Social Studies', count: 9, icon: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
              { dept: 'MAPEH', count: 11, icon: 'M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3' },
              { dept: 'TLE / TVL', count: 13, icon: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
              { dept: 'Values Education', count: 6, icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z' },
              { dept: 'Araling Panlipunan', count: 7, icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' }
            ].map((dept, i) => (
              <div key={i} className="bg-slate-50 rounded-2xl border-2 border-violet-200 p-6 hover:shadow-lg transition-all group">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-violet-900 flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={dept.icon} />
                    </svg>
                  </div>
                  <span className="px-3 py-1 bg-violet-200 text-slate-900 rounded-full text-xs font-black">{dept.count} Faculty</span>
                </div>
                <h3 className="text-lg font-black text-slate-900 uppercase">{dept.dept}</h3>
                <p className="text-sm text-gray-600 mt-2">Department Head & Teaching Staff</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Support Staff */}
      <section className="py-16 md:py-20 bg-violet-950 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black mb-3 uppercase">Support Services</h2>
            <p className="text-violet-100">The dedicated team behind our operations</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { title: 'Guidance', count: 3 },
              { title: 'Library', count: 4 },
              { title: 'ICT', count: 2 },
              { title: 'Admin Staff', count: 8 }
            ].map((staff, i) => (
              <div key={i} className="bg-white/10 border-2 border-white/20 rounded-2xl p-6 text-center backdrop-blur-sm hover:bg-white/20 transition-all">
                <div className="text-4xl font-black mb-2">{staff.count}</div>
                <div className="text-sm font-bold uppercase">{staff.title}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Faculty;
