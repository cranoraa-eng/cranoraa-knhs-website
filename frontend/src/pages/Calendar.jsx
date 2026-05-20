import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
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
    <div className="overflow-y-auto h-[calc(100vh-4rem)] p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Calendar</h1>
      
      <div className="bg-white border border-gray-300 rounded-lg p-6 shadow-sm">
        {/* Calendar Header */}
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={goToPreviousMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 className="text-xl font-bold text-gray-800">
            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </h2>
          <button
            onClick={goToNextMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2 mb-4">
          {dayNames.map((day) => (
            <div key={day} className="text-center text-sm font-semibold text-gray-600 py-2">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {days.map((day, index) => {
            const event = getEventForDay(day);
            return (
              <div
                key={index}
                className={`min-h-24 p-2 border rounded-lg ${
                  day
                    ? 'hover:bg-gray-50 cursor-pointer'
                    : 'bg-gray-100'
                }`}
              >
                {day && (
                  <>
                    <span className="text-sm font-medium text-gray-800">{day}</span>
                    {event && (
                      <div className="mt-1">
                        <div className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded truncate">
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

        {/* Upcoming Events */}
        <div className="mt-8">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Upcoming Events</h3>
          {events.length === 0 ? (
            <p className="text-gray-500">No upcoming events this month.</p>
          ) : (
            <div className="space-y-3">
              {events.map((event) => (
                <div key={event.id} className="flex items-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
                    <span className="text-sm font-bold text-purple-700">
                      {new Date(event.date).getDate()}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800">{event.title}</h4>
                    <p className="text-sm text-gray-600">{event.description || 'No description'}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Calendar;
