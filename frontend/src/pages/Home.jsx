import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';
import api from '../utils/api';

const MiniCalendar = ({ events, onSelectDay }) => {
  const [currentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);

  const daysInMonth = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const lastDate = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= lastDate; i++) days.push(i);
    return days;
  }, [currentDate]);

  const eventDays = useMemo(() => {
    const map = {};
    events.forEach(e => {
      const start = new Date(e.event_date || e.created_at);
      const end = e.end_date ? new Date(e.end_date) : start;
      
      let curr = new Date(start);
      curr.setHours(0,0,0,0);
      const last = new Date(end);
      last.setHours(0,0,0,0);
      
      while (curr <= last) {
        if (curr.getMonth() === currentDate.getMonth() && curr.getFullYear() === currentDate.getFullYear()) {
          map[curr.getDate()] = (map[curr.getDate()] || 0) + 1;
        }
        curr.setDate(curr.getDate() + 1);
      }
    });
    return map;
  }, [events, currentDate]);

  const monthName = currentDate.toLocaleString('en-US', { month: 'long' });

  const handleDayClick = (day) => {
    if (!day) return;
    setSelectedDay(day);
    if (onSelectDay) onSelectDay(day);
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">{monthName} {currentDate.getFullYear()}</h4>
        <Link to="/calendar" className="text-[10px] font-bold text-violet-600 hover:underline">View Full</Link>
      </div>
      
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (
          <div key={d} className="text-[10px] font-black text-slate-300 text-center py-1">{d}</div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-1 text-center">
        {daysInMonth.map((day, i) => {
          const hasEvent = day && eventDays[day];
          const isToday = day === currentDate.getDate();
          const isSelected = day === selectedDay;
          
          return (
            <div 
              key={i} 
              onClick={() => handleDayClick(day)}
              className={`
                aspect-square flex flex-col items-center justify-center text-[11px] font-bold rounded-lg cursor-pointer transition-all relative
                ${!day ? 'invisible' : ''}
                ${isSelected ? 'bg-slate-900 text-white shadow-xl scale-110' : hasEvent ? 'bg-violet-50 text-violet-700 border border-violet-100 hover:bg-violet-100' : 'text-slate-600 hover:bg-slate-50'}
                ${isToday && !isSelected ? 'text-violet-600' : ''}
              `}
            >
              {day}
              {hasEvent && !isSelected && (
                <span className="absolute bottom-1 w-1 h-1 bg-violet-600 rounded-full"></span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const Home = () => {
  const [content, setContent] = useState({});
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [zoomedImage, setZoomedImage] = useState(null);
  const [selectedDateEvents, setSelectedDateEvents] = useState([]);
  const [selectedDayLabel, setSelectedDayLabel] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchContent(), fetchAnnouncements()]);
      setLoading(false);
    };
    loadData();
  }, []);

  const handleSelectDay = (day) => {
    const today = new Date();
    const targetDate = new Date(today.getFullYear(), today.getMonth(), day);
    targetDate.setHours(0,0,0,0);

    const dayEvents = announcements.filter(a => {
      const start = new Date(a.event_date || a.created_at);
      start.setHours(0,0,0,0);
      const end = a.end_date ? new Date(a.end_date) : start;
      end.setHours(0,0,0,0);
      return targetDate >= start && targetDate <= end;
    });
    setSelectedDateEvents(dayEvents);
    setSelectedDayLabel(day);
  };

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
    .slice(0, 2);
  
  const upcomingEvents = announcements
    .filter(a => a.category === 'events' && (a.event_date || a.created_at))
    .sort((a, b) => {
      const dateA = new Date(a.event_date || a.created_at);
      const dateB = new Date(b.event_date || b.created_at);
      return dateA - dateB;
    })
    .filter(a => {
      const start = new Date(a.event_date || a.created_at);
      const end = a.end_date ? new Date(a.end_date) : start;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return end >= today;
    })
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

  const attachUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    const baseUrl = api.defaults.baseURL.replace('/api', '');
    return `${baseUrl}${url}`;
  };

  const getFirstImage = (announcement) => {
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

  const getPDFs = (announcement) => {
    const pdfs = [];
    if (announcement.attachment_url?.toLowerCase().endsWith('.pdf')) {
      pdfs.push({
        name: 'Attachment.pdf',
        url: attachUrl(announcement.attachment_url)
      });
    }
    if (announcement.attachments) {
      announcement.attachments.forEach(att => {
        if (att.url?.toLowerCase().endsWith('.pdf')) {
          pdfs.push({
            name: att.filename || 'Document.pdf',
            url: attachUrl(att.url)
          });
        }
      });
    }
    return pdfs;
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
      <section className="relative min-h-[70vh] md:min-h-[90vh] flex items-center pt-12 md:pt-20 overflow-hidden">
        {/* Abstract Background Shapes */}
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-[400px] md:w-[800px] h-[400px] md:h-[800px] bg-violet-100/50 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-[300px] md:w-[600px] h-[300px] md:h-[600px] bg-indigo-100/50 rounded-full blur-3xl"></div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-16 items-center">
            <div className="space-y-4 md:space-y-8 animate-fadeIn text-center lg:text-left">
              <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-violet-50 border border-violet-100 mx-auto lg:mx-0">
                <span className="flex h-1.5 w-1.5 rounded-full bg-violet-600 animate-pulse"></span>
                <span className="text-[9px] md:text-xs font-black text-violet-700 uppercase tracking-widest">Enrollment is now open</span>
              </div>
              
              <h1 className="text-4xl md:text-7xl font-black text-slate-900 leading-[1.1] tracking-tight">
                {content.home_hero_title?.content || 'Kiwalan National High School'}
              </h1>
              
              <p className="text-base md:text-xl text-slate-600 font-medium leading-relaxed max-w-xl mx-auto lg:mx-0">
                {content.home_hero_subtitle?.content || 'Empowering Minds, Shaping Futures through excellence in education and character development.'}
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                <Link
                  to="/enroll"
                  className="px-8 py-3.5 rounded-xl md:rounded-2xl bg-violet-600 text-white font-bold text-base md:text-lg hover:bg-violet-700 transition-all shadow-xl shadow-violet-200 hover:-translate-y-1 active:scale-95 text-center"
                >
                  Start Application
                </Link>
                <Link
                  to="/login"
                  className="px-8 py-3.5 rounded-xl md:rounded-2xl bg-white border-2 border-slate-100 text-slate-700 font-bold text-base md:text-lg hover:bg-slate-50 transition-all hover:-translate-y-1 active:scale-95 text-center"
                >
                  Portal Login
                </Link>
              </div>

              <div className="flex items-center justify-center lg:justify-start space-x-3 pt-2">
                <div className="flex -space-x-2">
                  {[1,2,3,4].map(i => (
                    <img 
                      key={i}
                      src={`https://i.pravatar.cc/100?img=${i+10}`} 
                      className="w-8 h-8 rounded-full border-2 border-white object-cover shadow-sm" 
                      alt="Student"
                    />
                  ))}
                </div>
                <p className="text-[11px] md:text-sm font-bold text-slate-500">
                  Joined by <span className="text-violet-600">1,200+</span> students
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
      <section className="py-16 md:py-32 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12 md:mb-20">
            <h2 className="text-[10px] md:text-xs font-black text-violet-600 uppercase tracking-[0.3em] mb-3">Core Strengths</h2>
            <h3 className="text-3xl md:text-5xl font-black text-slate-900 mb-4 md:mb-6">Why Choose Kiwalan NHS?</h3>
            <p className="text-base md:text-lg text-slate-500 font-medium leading-relaxed">We provide a holistic learning environment that combines academic rigor with character building.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-10">
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
              <div key={idx} className="group p-8 md:p-10 rounded-3xl md:rounded-[2.5rem] bg-white border border-slate-100 shadow-sm hover:shadow-2xl hover:border-violet-100 transition-all duration-300">
                <div className={`w-12 h-12 md:w-16 md:h-16 mb-6 md:mb-8 rounded-xl md:rounded-2xl bg-${feature.color}-50 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <svg className={`w-6 h-6 md:w-8 md:h-8 text-${feature.color}-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={feature.icon} />
                  </svg>
                </div>
                <h4 className="text-xl md:text-2xl font-black text-slate-800 mb-3 md:mb-4">{feature.title}</h4>
                <p className="text-sm md:text-base text-slate-500 font-medium leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Banner */}
      <section className="py-12 md:py-20 bg-slate-900 overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-full opacity-10">
          <div className="absolute top-0 left-0 w-32 md:w-64 h-32 md:h-64 bg-violet-500 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-48 md:w-96 h-48 md:h-96 bg-indigo-500 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 text-center">
            {[
              { label: 'Students', val: '1,200+' },
              { label: 'Graduates', val: '5,000+' },
              { label: 'Teachers', val: '80+' },
              { label: 'Awards', val: '150+' },
            ].map((stat, idx) => (
              <div key={idx} className="space-y-1 md:space-y-2">
                <div className="text-3xl md:text-5xl font-black text-white">{stat.val}</div>
                <div className="text-[9px] md:text-xs font-black text-violet-400 uppercase tracking-[0.2em]">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Announcements & Events Section */}
      <section className="py-16 md:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row justify-between items-center lg:items-end mb-12 md:mb-16 gap-6 md:gap-8 text-center lg:text-left">
            <div className="max-w-2xl">
              <h2 className="text-[10px] md:text-xs font-black text-violet-600 uppercase tracking-[0.3em] mb-3">Stay Updated</h2>
              <h3 className="text-3xl md:text-5xl font-black text-slate-900 mb-4 md:mb-6">Announcements & School Calendar</h3>
              <p className="text-base md:text-lg text-slate-500 font-medium leading-relaxed">
                Stay informed with the latest updates and upcoming events. 
                For the full schedule, visit our <Link to="/calendar" className="text-violet-600 hover:underline font-bold">Event Calendar</Link>.
              </p>
            </div>
            <div className="flex gap-4">
              <Link 
                to="/calendar" 
                className="px-5 py-2.5 md:px-6 md:py-3 rounded-xl bg-violet-50 text-violet-600 font-bold text-sm md:text-base hover:bg-violet-100 transition-all flex items-center border border-violet-100"
              >
                Full Calendar
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-12">
            {/* Main Announcements Column */}
            <div className="lg:col-span-2 space-y-6 md:space-y-8">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-lg md:text-xl font-black text-slate-900">Latest Announcements</h4>
                <Link to="/login" className="text-xs md:text-sm font-bold text-violet-600 hover:text-violet-700">View All</Link>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
                {generalAnnouncements.length > 0 ? (
                  generalAnnouncements.map((announcement) => {
                    const imageUrl = getFirstImage(announcement);
                    const pdfs = getPDFs(announcement);
                    return (
                      <div key={announcement.id} className="group p-6 md:p-8 rounded-3xl md:rounded-[2.5rem] bg-slate-50 hover:bg-white border border-transparent hover:border-violet-100 hover:shadow-2xl transition-all duration-300 flex flex-col h-full">
                        {imageUrl && (
                          <div className="relative h-40 md:h-48 mb-5 md:mb-6 rounded-2xl md:rounded-3xl overflow-hidden border border-slate-100">
                            <img 
                              src={imageUrl} 
                              alt={announcement.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/20 to-transparent"></div>
                            
                            <button 
                              onClick={() => setZoomedImage(imageUrl)}
                              className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                            >
                              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/90 flex items-center justify-center text-slate-900 shadow-xl">
                                <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                              </div>
                            </button>
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between mb-4 md:mb-6">
                          <span className={`px-2.5 py-0.5 md:px-3 md:py-1 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest border ${getCategoryColor(announcement.category)}`}>
                            {announcement.category}
                          </span>
                          <span className="text-[10px] md:text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                            {formatDate(announcement.created_at)}
                          </span>
                        </div>
                        
                        <h5 className="text-base md:text-lg font-black text-slate-900 mb-3 md:mb-4 group-hover:text-violet-600 transition-colors line-clamp-2">
                          {announcement.title}
                        </h5>
                        
                        <p className="text-slate-500 text-xs md:text-sm font-medium leading-relaxed mb-5 md:mb-6 line-clamp-3 flex-grow">
                          {announcement.content}
                        </p>
                        
                        <div className="flex flex-wrap gap-2 md:gap-3 items-center mt-auto pt-5 md:pt-6 border-t border-slate-100">
                          <Link 
                            to={`/calendar?year=${new Date(announcement.created_at).getFullYear()}&month=${new Date(announcement.created_at).getMonth() + 1}`} 
                            className="inline-flex items-center text-[11px] md:text-xs font-black text-violet-600 group-hover:translate-x-1 transition-transform"
                          >
                            Read More
                            <svg className="w-3.5 h-3.5 md:w-4 md:h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4 4H3" /></svg>
                          </Link>

                          {pdfs.map((pdf, idx) => (
                            <a 
                              key={idx}
                              href={pdf.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center px-2 py-1 md:px-3 md:py-1.5 rounded-lg bg-red-50 text-red-600 text-[9px] md:text-[10px] font-black uppercase tracking-wider hover:bg-red-100 transition-colors"
                            >
                              <svg className="w-3 h-3 md:w-3.5 md:h-3.5 mr-1 md:mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              PDF
                            </a>
                          ))}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  [1, 2].map((i) => (
                    <div key={i} className="p-8 rounded-3xl md:rounded-[2.5rem] bg-slate-50 border border-slate-100 animate-pulse h-64"></div>
                  ))
                )}
              </div>
            </div>

            {/* Upcoming Events Column */}
            <div className="space-y-6 md:space-y-8">
              <div className="flex items-center justify-between mb-2 md:mb-4">
                <h4 className="text-lg md:text-xl font-black text-slate-900">Events Calendar</h4>
              </div>

              {/* Mini Calendar Component */}
              <MiniCalendar 
                events={announcements.filter(a => a.category === 'events')} 
                onSelectDay={handleSelectDay}
              />

              <div className="flex items-center justify-between mb-2 md:mb-4">
                <h4 className="text-lg md:text-xl font-black text-slate-900">
                  {selectedDayLabel ? `Events on ${new Date().toLocaleString('en-US', { month: 'short' })} ${selectedDayLabel}` : 'Upcoming Events'}
                </h4>
                <Link to="/calendar" className="text-xs md:text-sm font-bold text-violet-600 hover:text-violet-700">All</Link>
              </div>

              <div className="space-y-4">
                {(selectedDayLabel ? selectedDateEvents : upcomingEvents).length > 0 ? (
                  (selectedDayLabel ? selectedDateEvents : upcomingEvents).map((event) => {
                    const eventDate = new Date(event.event_date || event.created_at);
                    
                    return (
                      <Link 
                        to={`/calendar?year=${eventDate.getFullYear()}&month=${eventDate.getMonth() + 1}`}
                        key={event.id} 
                        className="group p-4 md:p-6 rounded-2xl md:rounded-3xl bg-white border border-slate-100 hover:border-violet-100 hover:shadow-xl transition-all duration-300 block"
                      >
                        <div className="flex items-start space-x-3 md:space-x-4">
                          <div className="flex-shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-violet-50 flex flex-col items-center justify-center border border-violet-100">
                            <span className="text-[8px] md:text-[10px] font-black text-violet-400 uppercase leading-none">
                              {eventDate.toLocaleString('en-US', { month: 'short' })}
                            </span>
                            <span className="text-base md:text-lg font-black text-violet-700 leading-tight">
                              {eventDate.getDate()}
                            </span>
                          </div>
                          <div className="flex-grow min-w-0">
                            <h6 className="text-[13px] md:text-sm font-black text-slate-900 group-hover:text-violet-600 transition-colors truncate mb-0.5">
                              {event.title}
                            </h6>
                            <div className="flex items-center gap-1.5 mb-1">
                              <svg className="w-2.5 h-2.5 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span className="text-[9px] font-black text-violet-600 uppercase">
                                {new Date(event.event_date || event.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-[11px] md:text-xs text-slate-500 font-medium line-clamp-2 leading-relaxed">
                              {event.content}
                            </p>
                          </div>
                        </div>
                      </Link>
                    );
                  })
                ) : (
                  <div className="p-6 md:p-8 rounded-2xl md:rounded-3xl bg-slate-50 border border-slate-100 text-center">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-xl md:rounded-2xl flex items-center justify-center mx-auto mb-3 md:mb-4 shadow-sm">
                      <svg className="w-5 h-5 md:w-6 md:h-6 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <p className="text-[13px] md:text-sm font-bold text-slate-400">No events scheduled</p>
                    <p className="text-[9px] md:text-[10px] text-slate-400 mt-1 uppercase tracking-widest font-black">Check back later</p>
                  </div>
                )}
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

      {/* Image Zoom Modal */}
      {zoomedImage && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-sm animate-fadeIn"
          onClick={() => setZoomedImage(null)}
        >
          <button 
            className="absolute top-6 right-6 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
            onClick={() => setZoomedImage(null)}
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <img 
            src={zoomedImage} 
            alt="Zoomed" 
            className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl animate-scaleIn"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};

export default Home;
