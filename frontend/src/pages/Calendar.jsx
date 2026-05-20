import { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import api from '../utils/api';

const Calendar = () => {
  const location = useLocation();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Parse year and month from URL if present
  const queryParams = new URLSearchParams(location.search);
  const initialYear = parseInt(queryParams.get('year')) || new Date().getFullYear();
  const initialMonth = (parseInt(queryParams.get('month')) - 1) || new Date().getMonth();

  const [currentMonth, setCurrentMonth] = useState(new Date(initialYear, initialMonth, 1));

  useEffect(() => {
    // If URL changes, update currentMonth
    const qParams = new URLSearchParams(location.search);
    const y = parseInt(qParams.get('year'));
    const m = parseInt(qParams.get('month'));
    
    if (y && m) {
      const newDate = new Date(y, m - 1, 1);
      // Only update if it's different to avoid loops
      if (newDate.getMonth() !== currentMonth.getMonth() || newDate.getFullYear() !== currentMonth.getFullYear()) {
        setCurrentMonth(newDate);
      }
    }
  }, [location.search]);

  useEffect(() => {
    fetchEvents();
  }, [currentMonth]);

  const fetchEvents = async () => {
    try {
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth() + 1;
      const response = await api.get(`/student/calendar/?year=${year}&month=${month}`);
      setEvents(response.data);
    } catch (error) {
      console.error('Error fetching calendar events:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    
    const days = [];
    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  };

  const getEventForDay = (day) => {
    if (!day) return null;
    const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.find(event => event.date === dateStr);
  };

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  const days = getDaysInMonth(currentMonth);

  return (
    <div className="overflow-y-auto h-[calc(100vh-4rem)] bg-slate-50/50 p-4 md:p-8">
      {/* Header */}
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">School Calendar</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">Events, holidays, and academic schedules</p>
        </div>
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-all shadow-sm w-fit"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Website
        </Link>
      </div>
      
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Calendar Grid */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm">
            {/* Calendar Header */}
            <div className="flex justify-between items-center mb-8 px-2">
              <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
                {monthNames[currentMonth.getMonth()]} <span className="text-violet-600">{currentMonth.getFullYear()}</span>
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={goToPreviousMonth}
                  className="p-2.5 hover:bg-slate-50 border border-slate-100 rounded-xl transition-all text-slate-600 hover:text-violet-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={goToNextMonth}
                  className="p-2.5 hover:bg-slate-50 border border-slate-100 rounded-xl transition-all text-slate-600 hover:text-violet-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2 mb-4">
              {dayNames.map((day) => (
                <div key={day} className="text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] py-2">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-2">
              {days.map((day, index) => {
                const event = getEventForDay(day);
                const isToday = day === new Date().getDate() && 
                                currentMonth.getMonth() === new Date().getMonth() && 
                                currentMonth.getFullYear() === new Date().getFullYear();
                
                return (
                  <div
                    key={index}
                    className={`min-h-[80px] md:min-h-[100px] p-2 border rounded-2xl transition-all relative group ${
                      day
                        ? 'bg-white border-slate-100 hover:border-violet-200 hover:shadow-lg hover:shadow-violet-50/50 cursor-pointer'
                        : 'bg-slate-50/50 border-transparent'
                    } ${isToday ? 'ring-2 ring-violet-600 ring-offset-2 border-violet-200' : ''}`}
                  >
                    {day && (
                      <>
                        <span className={`text-sm font-black ${isToday ? 'text-violet-600' : 'text-slate-400 group-hover:text-slate-900'}`}>
                          {day}
                        </span>
                        {event && (
                          <div className="mt-2">
                            <div className="text-[10px] font-bold bg-violet-50 text-violet-700 p-1.5 rounded-lg border border-violet-100 line-clamp-2 leading-tight">
                              {event.title}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Upcoming Events List */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm">
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-6 flex items-center gap-2">
              <span className="w-2 h-2 bg-violet-600 rounded-full animate-pulse"></span>
              Upcoming Events
            </h3>
            
            {events.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-100">
                  <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-sm font-bold text-slate-400">No events scheduled for this month</p>
              </div>
            ) : (
              <div className="space-y-4">
                {events.map((event) => (
                  <div 
                    key={event.id} 
                    className="group p-4 bg-slate-50 hover:bg-white border border-transparent hover:border-violet-100 rounded-2xl transition-all duration-300 hover:shadow-xl hover:shadow-violet-50/50"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-white rounded-xl flex flex-col items-center justify-center border border-slate-100 shadow-sm shrink-0">
                        <span className="text-[9px] font-black text-slate-400 uppercase leading-none">
                          {new Date(event.date).toLocaleString('en-US', { month: 'short' })}
                        </span>
                        <span className="text-lg font-black text-violet-600 leading-tight">
                          {new Date(event.date).getDate()}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-black text-slate-800 text-sm group-hover:text-violet-600 transition-colors truncate">
                          {event.title}
                        </h4>
                        <p className="text-xs text-slate-500 font-medium line-clamp-2 mt-1 leading-relaxed">
                          {event.description || 'No description provided'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <Link 
              to="/enroll" 
              className="mt-8 w-full py-4 rounded-2xl bg-slate-900 text-white font-black text-center text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg block"
            >
              Enroll for SY 2026-2027
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Calendar;
