import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import api from '../utils/api';

const Home = () => {
  const [content, setContent] = useState({});
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchContent(), fetchAnnouncements()]);
      setLoading(false);
    };
    loadData();
  }, []);

  const fetchContent = async () => {
    try {
      const response = await api.get('/website-content/public/');
      const contentMap = {};
      const data = Array.isArray(response.data) ? response.data : 
                   (response.data && Array.isArray(response.data.results)) ? response.data.results : [];
      
      data.forEach(item => {
        contentMap[item.section] = item;
      });
      setContent(contentMap);
    } catch (error) {
      console.error('Error fetching website content:', error);
    }
  };

  const fetchAnnouncements = async () => {
    try {
      const response = await api.get('/announcements/public/');
      setAnnouncements(response.data);
    } catch (error) {
      console.error('Error fetching announcements:', error);
    }
  };

  const generalAnnouncements = announcements
    .filter(a => a.category !== 'events')
    .slice(0, 3);
  
  const upcomingEvents = announcements
    .filter(a => a.category === 'events')
    .slice(0, 4);

  const getCategoryColor = (category) => {
    const colors = {
      'academic': 'bg-purple-50 text-purple-600 border-purple-100',
      'events': 'bg-emerald-50 text-emerald-600 border-emerald-100',
      'emergency': 'bg-rose-50 text-rose-600 border-rose-100',
      'holiday': 'bg-blue-50 text-blue-600 border-blue-100',
    };
    return colors[category] || 'bg-slate-50 text-slate-600 border-slate-100';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getFirstImage = (announcement) => {
    const attachUrl = (url) => {
      if (!url) return null;
      if (url.startsWith('http')) return url;
      // If it's a relative path, prepend the API base URL (removing /api suffix)
      const baseUrl = api.defaults.baseURL.replace('/api', '');
      return `${baseUrl}${url}`;
    };

    // Check main attachment field first
    if (announcement.attachment_url) {
      if (/\.(jpg|jpeg|png|gif|webp)$/i.test(announcement.attachment_url)) {
        return attachUrl(announcement.attachment_url);
      }
    }
    // Check multiple attachments array
    const imageAttachment = announcement.attachments?.find(att => att.is_image);
    return attachUrl(imageAttachment?.url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center pt-20 overflow-hidden">
        {/* Abstract Background Shapes */}
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-[800px] h-[800px] bg-violet-100/50 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-[600px] h-[600px] bg-indigo-100/50 rounded-full blur-3xl"></div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8 animate-fadeIn">
              <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-violet-50 border border-violet-100">
                <span className="flex h-2 w-2 rounded-full bg-violet-600 animate-pulse"></span>
                <span className="text-xs font-black text-violet-700 uppercase tracking-widest">Enrollment is now open</span>
              </div>
              
              <h1 className="text-6xl md:text-7xl font-black text-slate-900 leading-[1.1]">
                {content.home_hero_title?.content || 'Kiwalan National High School'}
              </h1>
              
              <p className="text-xl text-slate-600 font-medium leading-relaxed max-w-xl">
                {content.home_hero_subtitle?.content || 'Empowering Minds, Shaping Futures through excellence in education and character development.'}
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to="/enroll"
                  className="px-10 py-4 rounded-2xl bg-violet-600 text-white font-bold text-lg hover:bg-violet-700 transition-all shadow-xl shadow-violet-200 hover:-translate-y-1 active:scale-95 text-center"
                >
                  Start Application
                </Link>
                <Link
                  to="/login"
                  className="px-10 py-4 rounded-2xl bg-white border-2 border-slate-100 text-slate-700 font-bold text-lg hover:bg-slate-50 transition-all hover:-translate-y-1 active:scale-95 text-center"
                >
                  Portal Login
                </Link>
              </div>

              <div className="flex items-center space-x-4 pt-4">
                <div className="flex -space-x-3">
                  {[1,2,3,4].map(i => (
                    <img 
                      key={i}
                      src={`https://i.pravatar.cc/100?img=${i+10}`} 
                      className="w-10 h-10 rounded-full border-2 border-white object-cover" 
                      alt="Student"
                    />
                  ))}
                </div>
                <p className="text-sm font-bold text-slate-500">
                  Joined by <span className="text-violet-600">1,200+</span> ambitious students
                </p>
              </div>
            </div>

            <div className="relative animate-fadeIn delay-200 hidden lg:block">
              <div className="relative rounded-[3rem] overflow-hidden shadow-2xl rotate-3 hover:rotate-0 transition-transform duration-500 border-8 border-white">
                <img 
                  src="https://images.unsplash.com/photo-1580582932707-520aed937b7b?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80"
                  alt="School Campus"
                  className="w-full aspect-[4/5] object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-violet-900/40 to-transparent"></div>
              </div>
              
              {/* Floating Stat Card */}
              <div className="absolute -bottom-8 -left-8 bg-white p-6 rounded-3xl shadow-2xl border border-slate-50 animate-bounce-slow">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-2xl font-black text-slate-900">98%</p>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Success Rate</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-32 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-xs font-black text-violet-600 uppercase tracking-[0.3em] mb-4">Core Strengths</h2>
            <h3 className="text-4xl md:text-5xl font-black text-slate-900 mb-6">Why Choose Kiwalan NHS?</h3>
            <p className="text-lg text-slate-500 font-medium">We provide a holistic learning environment that combines academic rigor with character building.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              { 
                title: content.home_feature_1_title?.content || 'Quality Education', 
                desc: content.home_feature_1_content?.content || 'Comprehensive curriculum designed to prepare students for success in higher education and beyond.',
                icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
                color: 'violet'
              },
              { 
                title: content.home_feature_2_title?.content || 'Dedicated Faculty', 
                desc: content.home_feature_2_content?.content || 'Experienced and passionate teachers committed to student development and academic excellence.',
                icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
                color: 'blue'
              },
              { 
                title: content.home_feature_3_title?.content || 'Modern Facilities', 
                desc: content.home_feature_3_content?.content || 'State-of-the-art classrooms, laboratories, and facilities to support holistic learning experiences.',
                icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
                color: 'indigo'
              }
            ].map((feature, idx) => (
              <div key={idx} className="group p-10 rounded-[2.5rem] bg-white border border-slate-100 shadow-sm hover:shadow-2xl hover:border-violet-100 hover:-translate-y-2 transition-all duration-300">
                <div className={`w-16 h-16 mb-8 rounded-2xl bg-${feature.color}-50 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <svg className={`w-8 h-8 text-${feature.color}-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={feature.icon} />
                  </svg>
                </div>
                <h4 className="text-2xl font-black text-slate-800 mb-4">{feature.title}</h4>
                <p className="text-slate-500 font-medium leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Banner */}
      <section className="py-20 bg-slate-900 overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-full opacity-10">
          <div className="absolute top-0 left-0 w-64 h-64 bg-violet-500 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-500 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
            {[
              { label: 'Students', val: '1,200+' },
              { label: 'Graduates', val: '5,000+' },
              { label: 'Teachers', val: '80+' },
              { label: 'Awards', val: '150+' },
            ].map((stat, idx) => (
              <div key={idx} className="space-y-2">
                <div className="text-5xl font-black text-white">{stat.val}</div>
                <div className="text-xs font-black text-violet-400 uppercase tracking-[0.2em]">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Announcements & Events Section */}
      <section className="py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row justify-between items-end mb-16 gap-8">
            <div className="max-w-2xl">
              <h2 className="text-xs font-black text-violet-600 uppercase tracking-[0.3em] mb-4">Stay Updated</h2>
              <h3 className="text-4xl md:text-5xl font-black text-slate-900 mb-6">Announcements & School Calendar</h3>
              <p className="text-lg text-slate-500 font-medium leading-relaxed">
                Stay informed with the latest updates and upcoming events. 
                For the full schedule, visit our <Link to="/calendar" className="text-violet-600 hover:underline font-bold">Event Calendar</Link>.
              </p>
            </div>
            <div className="flex gap-4">
              <Link 
                to="/calendar" 
                className="px-6 py-3 rounded-xl bg-violet-50 text-violet-600 font-bold hover:bg-violet-100 transition-all flex items-center border border-violet-100"
              >
                Full Calendar
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Main Announcements Column */}
            <div className="lg:col-span-2 space-y-8">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-xl font-black text-slate-900">Latest Announcements</h4>
                <Link to="/login" className="text-sm font-bold text-violet-600 hover:text-violet-700">View All</Link>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {generalAnnouncements.length > 0 ? (
                  generalAnnouncements.map((announcement) => {
                    const imageUrl = getFirstImage(announcement);
                    return (
                      <div key={announcement.id} className="group p-8 rounded-[2.5rem] bg-slate-50 hover:bg-white border border-transparent hover:border-violet-100 hover:shadow-2xl transition-all duration-300 flex flex-col h-full">
                        {imageUrl && (
                          <div className="relative h-48 mb-6 rounded-3xl overflow-hidden border border-slate-100">
                            <img 
                              src={imageUrl} 
                              alt={announcement.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/20 to-transparent"></div>
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between mb-6">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getCategoryColor(announcement.category)}`}>
                            {announcement.category}
                          </span>
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                            {formatDate(announcement.created_at)}
                          </span>
                        </div>
                        
                        <h5 className="text-lg font-black text-slate-900 mb-4 group-hover:text-violet-600 transition-colors line-clamp-2">
                          {announcement.title}
                        </h5>
                        
                        <p className="text-slate-500 text-sm font-medium leading-relaxed mb-6 line-clamp-3 flex-grow">
                          {announcement.content}
                        </p>
                        
                        <Link 
                          to="/login" 
                          className="inline-flex items-center text-xs font-black text-violet-600 group-hover:translate-x-1 transition-transform"
                        >
                          Read More
                          <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4 4H3" /></svg>
                        </Link>
                      </div>
                    );
                  })
                ) : (
                  [1, 2].map((i) => (
                    <div key={i} className="p-8 rounded-[2.5rem] bg-slate-50 border border-slate-100 animate-pulse h-64"></div>
                  ))
                )}
              </div>
            </div>

            {/* Upcoming Events Column */}
            <div className="space-y-8">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-xl font-black text-slate-900">Upcoming Events</h4>
                <Link to="/calendar" className="text-sm font-bold text-violet-600 hover:text-violet-700">Calendar</Link>
              </div>

              <div className="space-y-4">
                {upcomingEvents.length > 0 ? (
                  upcomingEvents.map((event) => {
                    const imageUrl = getFirstImage(event);
                    return (
                      <div key={event.id} className="group p-6 rounded-3xl bg-white border border-slate-100 hover:border-violet-100 hover:shadow-xl transition-all duration-300">
                        <div className="flex items-start space-x-4">
                          <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-violet-50 flex flex-col items-center justify-center border border-violet-100">
                            <span className="text-[10px] font-black text-violet-400 uppercase leading-none">
                              {new Date(event.created_at).toLocaleString('en-US', { month: 'short' })}
                            </span>
                            <span className="text-lg font-black text-violet-700 leading-tight">
                              {new Date(event.created_at).getDate()}
                            </span>
                          </div>
                          <div className="flex-grow min-w-0">
                            <h6 className="text-sm font-black text-slate-900 group-hover:text-violet-600 transition-colors truncate mb-1">
                              {event.title}
                            </h6>
                            <p className="text-xs text-slate-500 font-medium line-clamp-2">
                              {event.content}
                            </p>
                            {imageUrl && (
                              <div className="mt-3 h-20 rounded-xl overflow-hidden border border-slate-50">
                                <img src={imageUrl} alt={event.title} className="w-full h-full object-cover" />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-8 rounded-3xl bg-slate-50 border border-slate-100 text-center">
                    <p className="text-sm font-bold text-slate-400">No upcoming events found</p>
                    <Link to="/calendar" className="text-xs font-black text-violet-600 mt-2 inline-block">Check Calendar</Link>
                  </div>
                )}
                
                <Link 
                  to="/login" 
                  className="w-full py-4 rounded-2xl bg-slate-900 text-white font-black text-center text-sm hover:bg-slate-800 transition-all shadow-xl shadow-slate-100 block"
                >
                  Portal Dashboard
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto rounded-[3rem] bg-gradient-to-br from-violet-600 to-indigo-700 p-12 md:p-20 relative overflow-hidden shadow-2xl shadow-violet-200">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-400/20 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl"></div>
          
          <div className="relative z-10 text-center max-w-3xl mx-auto space-y-8">
            <h2 className="text-4xl md:text-5xl font-black text-white leading-tight">Ready to Shape Your Future?</h2>
            <p className="text-xl text-violet-100 font-medium">Join a community dedicated to academic excellence and personal growth. Your journey starts here.</p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
              <Link
                to="/enroll"
                className="px-10 py-4 rounded-2xl bg-white text-violet-700 font-black text-lg hover:bg-slate-50 transition-all shadow-xl active:scale-95"
              >
                Enroll Now
              </Link>
              <Link
                to="/contact"
                className="px-10 py-4 rounded-2xl bg-violet-500 text-white font-black text-lg border border-violet-400 hover:bg-violet-400 transition-all active:scale-95"
              >
                Contact Support
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
