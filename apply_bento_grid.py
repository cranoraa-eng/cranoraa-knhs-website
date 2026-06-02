#!/usr/bin/env python3
"""
Script to apply TRUE Bento Grid to Dashboard.jsx
This does a clean surgical replacement of the TeacherView return statement.
"""

import re

def apply_bento_grid():
    dashboard_path = r"frontend\src\pages\Dashboard.jsx"
    
    # Read the file
    with open(dashboard_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Performance metrics to add
    performance_metrics = '''  // Performance metrics
  const attendanceRate = classrooms.length > 0 
    ? Math.round((classrooms.filter(c => todayAttendance[c.id]).length / classrooms.length) * 100)
    : 0;
  const gradeProgress = data?.grade_completion || 0;
  const announcements = data?.announcements_sent || 0;

'''
    
    # Find and replace the return statement
    # Pattern: from "return (" to the closing of TeacherView component
    pattern = r'(const unmarkedCount = classrooms\.filter\(c => !todayAttendance\[c\.id\]\)\.length;)\s*\n\s*return \('
    
    # Check if performance metrics already exist
    if 'attendanceRate' not in content:
        # Add performance metrics
        content = re.sub(
            pattern,
            r'\1\n\n' + performance_metrics + '  return (',
            content
        )
    
    # Now replace from "return (" to the end of TeacherView
    # Find the TeacherView function
    teacher_view_start = content.find('const TeacherView = () => {')
    if teacher_view_start == -1:
        print("ERROR: Could not find TeacherView component")
        return False
    
    # Find the return statement within TeacherView
    return_start = content.find('return (', teacher_view_start)
    if return_start == -1:
        print("ERROR: Could not find return statement in TeacherView")
        return False
    
    # Find the closing }; of TeacherView
    # We need to find the matching closing brace
    brace_count = 1
    i = content.find('{', teacher_view_start) + 1
    
    while i < len(content) and brace_count > 0:
        if content[i] == '{':
            brace_count += 1
        elif content[i] == '}':
            brace_count -= 1
        i += 1
    
    if brace_count != 0:
        print("ERROR: Could not find matching closing brace for TeacherView")
        return False
    
    # The closing }; should be at i-1 and i
    teacher_view_end = i
    
    # Find where the return statement ends (should be 2 characters before };)
    return_end = teacher_view_end - 2
    
    # Extract everything before and after
    before_return = content[:return_start]
    after_teacher_view = content[teacher_view_end:]
    
    # The new Bento Grid return statement
    new_return = '''return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 md:px-8 md:py-8">
      <div className="mx-auto max-w-[1800px]">
        {/* TRUE BENTO GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-6 lg:grid-cols-12 gap-4 lg:gap-6 auto-rows-auto">
          
          {/* ROW 1: Welcome + KPIs (8) | Schedule (4) */}
          <Card className="sm:col-span-6 lg:col-span-8 border-slate-200 shadow-sm hover:shadow-md transition-shadow rounded-2xl">
            <CardBody className="p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
                      {user?.profile_picture ? (
                        <img src={user.profile_picture} alt="" className="w-full h-full object-cover rounded-2xl" />
                      ) : (
                        [user?.first_name, user?.last_name].filter(Boolean).map(n => n[0].toUpperCase()).join('') || '?'
                      )}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white" />
                  </div>
                  <div>
                    <h1 className="text-lg font-bold text-slate-900">
                      Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {user?.first_name}
                    </h1>
                    <p className="text-sm text-slate-500 font-medium">{todayStr}</p>
                  </div>
                </div>
                
                <div className="flex gap-2 flex-wrap">
                  <div className="px-3 py-2 rounded-xl bg-violet-50 border border-violet-100">
                    <p className="text-xs font-semibold text-violet-600 uppercase tracking-wide">Classes</p>
                    <p className="text-xl font-bold text-violet-700">{data?.total_classes || 0}</p>
                  </div>
                  <div className="px-3 py-2 rounded-xl bg-blue-50 border border-blue-100">
                    <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Students</p>
                    <p className="text-xl font-bold text-blue-700">{data?.total_students || 0}</p>
                  </div>
                  {unmarkedCount > 0 && (
                    <div className="px-3 py-2 rounded-xl bg-amber-50 border border-amber-100">
                      <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide">Pending</p>
                      <p className="text-xl font-bold text-amber-700">{unmarkedCount}</p>
                    </div>
                  )}
                  {(data?.pending_grades || 0) > 0 && (
                    <div className="px-3 py-2 rounded-xl bg-rose-50 border border-rose-100">
                      <p className="text-xs font-semibold text-rose-600 uppercase tracking-wide">Grades</p>
                      <p className="text-xl font-bold text-rose-700">{data.pending_grades}</p>
                    </div>
                  )}
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className="sm:col-span-6 lg:col-span-4 border-slate-200 shadow-sm hover:shadow-md transition-shadow rounded-2xl">
            <CardHeader divider>
              <div className="flex items-center justify-between">
                <CardTitle>Today's Schedule</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => navigate('/my-schedule')}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Button>
              </div>
            </CardHeader>
            <CardBody className="p-4">
              <TodayScheduleWidget />
            </CardBody>
          </Card>

          {/* ROW 2: Attendance Alert (4) | Quick Actions (4) | Messages (4) */}
          {unmarkedCount > 0 && (
            <Card className="sm:col-span-3 lg:col-span-4 border-l-4 border-l-amber-500 bg-amber-50/50 border-amber-200 shadow-sm hover:shadow-md transition-shadow rounded-2xl">
              <CardBody className="p-5">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-amber-900">Attendance Needed</h3>
                    <p className="text-xs text-amber-700 font-medium mt-0.5">{unmarkedCount} {unmarkedCount === 1 ? 'class' : 'classes'} pending</p>
                  </div>
                </div>
                <Button onClick={() => navigate('/attendance')} className="w-full bg-amber-600 hover:bg-amber-700 text-white border-0 rounded-xl">
                  Mark Attendance
                </Button>
              </CardBody>
            </Card>
          )}

          <Card className={cn(
            "sm:col-span-3 lg:col-span-4 border-slate-200 shadow-sm hover:shadow-md transition-shadow rounded-2xl",
            unmarkedCount === 0 && "sm:col-start-1"
          )}>
            <CardHeader divider>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardBody className="p-4">
              <div className="grid grid-cols-3 gap-2">
                {[
                  { icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', label: 'Attendance', path: '/attendance', bg: 'bg-emerald-50', text: 'text-emerald-600', hover: 'hover:bg-emerald-600' },
                  { icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z', label: 'Grades', path: '/grade-input', bg: 'bg-violet-50', text: 'text-violet-600', hover: 'hover:bg-violet-600' },
                  { icon: 'M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z', label: 'Announce', path: '/announcements', bg: 'bg-amber-50', text: 'text-amber-600', hover: 'hover:bg-amber-600' },
                  { icon: 'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z', label: 'Messages', path: '/messages', bg: 'bg-rose-50', text: 'text-rose-600', hover: 'hover:bg-rose-600' },
                  { icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253', label: 'Materials', path: '/materials', bg: 'bg-blue-50', text: 'text-blue-600', hover: 'hover:bg-blue-600' },
                  { icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', label: 'Calendar', path: '/my-schedule', bg: 'bg-indigo-50', text: 'text-indigo-600', hover: 'hover:bg-indigo-600' },
                ].map((action, i) => (
                  <button
                    key={i}
                    onClick={() => navigate(action.path)}
                    className={cn(
                      "p-3 rounded-xl border-2 border-slate-200 transition-all group",
                      action.bg,
                      action.hover,
                      "hover:text-white hover:border-transparent"
                    )}
                  >
                    <svg className={cn("w-6 h-6 mx-auto mb-1 transition-colors", action.text, "group-hover:text-white")} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={action.icon} />
                    </svg>
                    <p className={cn("text-[10px] font-bold uppercase tracking-wide transition-colors", action.text, "group-hover:text-white")}>{action.label}</p>
                  </button>
                ))}
              </div>
            </CardBody>
          </Card>

          <Card className="sm:col-span-6 lg:col-span-4 border-slate-200 shadow-sm hover:shadow-md transition-shadow rounded-2xl">
            <CardHeader divider>
              <div className="flex items-center justify-between">
                <CardTitle>Messages</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => navigate('/messages')}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Button>
              </div>
            </CardHeader>
            <CardBody className="p-4">
              <LatestMessagesWidget messages={data?.latest_messages} onOpenChat={() => navigate('/messages')} />
            </CardBody>
          </Card>

          {/* ROW 3: My Classes (8) | Analytics (4) */}
          <Card className="sm:col-span-6 lg:col-span-8 border-slate-200 shadow-sm hover:shadow-md transition-shadow rounded-2xl">
            <CardHeader divider>
              <div className="flex items-center justify-between">
                <CardTitle subtitle={`${classrooms.length} active section${classrooms.length !== 1 ? 's' : ''}`}>
                  My Classes
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => navigate('/my-classes')}>
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardBody className="p-4">
              {classrooms.length === 0 ? (
                <EmptyState
                  className="py-8"
                  title="No classes assigned"
                  description="Your teaching sections will appear here once assigned."
                  icon={
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  }
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {classrooms.slice(0, 4).map((c) => {
                    const marked = todayAttendance[c.id];
                    return (
                      <div
                        key={c.id}
                        className="group p-4 rounded-xl border-2 border-slate-200 bg-white hover:border-violet-300 hover:shadow-md transition-all cursor-pointer"
                        onClick={() => navigate(`/my-classes/${c.id}`)}
                      >
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <div className="w-10 h-10 rounded-lg bg-violet-100 text-violet-700 border border-violet-200 flex items-center justify-center font-bold text-sm shrink-0 group-hover:bg-violet-600 group-hover:text-white transition-colors">
                              {c.name?.match(/\\d+/)?.[0] || 'C'}
                            </div>
                            <div className="min-w-0">
                              <h3 className="text-sm font-bold text-slate-900 leading-tight truncate">{c.name}</h3>
                              <p className="text-xs font-medium text-slate-500 truncate">{c.subject_name || 'General'}</p>
                            </div>
                          </div>
                          {marked !== undefined && (
                            <Badge variant={marked ? "green" : "amber"} size="sm">
                              {marked ? 'Marked' : 'Pending'}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-600 font-medium flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                            {c.student_count || 0} students
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate('/attendance', { state: { classroomId: c.id } });
                            }}
                            className="text-violet-600 hover:text-violet-700 font-semibold"
                          >
                            Quick Action →
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardBody>
          </Card>

          <Card className="sm:col-span-6 lg:col-span-4 border-slate-200 shadow-sm hover:shadow-md transition-shadow rounded-2xl">
            <CardHeader divider>
              <CardTitle>Analytics Snapshot</CardTitle>
            </CardHeader>
            <CardBody className="p-5 space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">Attendance Today</span>
                  <span className="text-lg font-bold text-violet-700">{attendanceRate}%</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-violet-500 to-violet-600 rounded-full transition-all duration-500"
                    style={{ width: `${attendanceRate}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">Grade Progress</span>
                  <span className="text-lg font-bold text-blue-700">{gradeProgress}%</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500"
                    style={{ width: `${gradeProgress}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Announcements Sent</span>
                  <span className="text-lg font-bold text-emerald-700">{announcements}</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (announcements / 10) * 100)}%` }}
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center gap-2 text-xs">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-slate-600 font-medium">Student engagement tracking active</span>
              </div>
            </CardBody>
          </Card>

          {/* ROW 4: Recent Activity (8) | Upcoming Events (4) */}
          <Card className="sm:col-span-6 lg:col-span-8 border-slate-200 shadow-sm hover:shadow-md transition-shadow rounded-2xl">
            <CardHeader divider>
              <div className="flex items-center justify-between">
                <CardTitle>Recent Activity</CardTitle>
                <Button variant="ghost" size="sm">
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardBody className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {data?.recent_activities?.length > 0 ? (
                  data.recent_activities.slice(0, 6).map((activity, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 bg-slate-50 hover:bg-white hover:border-slate-300 transition-all">
                      <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center shrink-0">
                        <TeacherActivityIcon type={activity.type} className="w-4 h-4 text-violet-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-900 leading-tight">{activity.description}</p>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">{activity.timestamp}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-2 py-8 text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-slate-100 mb-3">
                      <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <p className="text-sm font-semibold text-slate-500">No recent activity</p>
                    <p className="text-xs text-slate-400 mt-1">Your actions will appear here</p>
                  </div>
                )}
              </div>
            </CardBody>
          </Card>

          <Card className="sm:col-span-6 lg:col-span-4 border-slate-200 shadow-sm hover:shadow-md transition-shadow rounded-2xl">
            <CardHeader divider>
              <CardTitle>Upcoming Events</CardTitle>
            </CardHeader>
            <CardBody className="p-4">
              {data?.upcoming_events?.length > 0 ? (
                <div className="space-y-3">
                  {data.upcoming_events.slice(0, 4).map((event, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 bg-slate-50 hover:bg-white hover:border-violet-200 transition-all">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-violet-100 to-indigo-100 flex flex-col items-center justify-center shrink-0 border border-violet-200">
                        <span className="text-xs font-bold text-violet-600">{event.day || 'TBD'}</span>
                        <span className="text-[10px] font-semibold text-violet-500 uppercase">{event.month || ''}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-bold text-slate-900 leading-tight">{event.title}</h4>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">{event.time || 'All day'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  className="py-6"
                  title="No upcoming events"
                  description="School events and deadlines will appear here"
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  }
                />
              )}
            </CardBody>
          </Card>

        </div>
      </div>
    </div>
  );
'''
    
    # Construct the new file content
    new_content = before_return + new_return + after_teacher_view
    
    # Write the file
    with open(dashboard_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    
    print("✅ TRUE Bento Grid successfully applied to Dashboard.jsx!")
    print(f"   - Performance metrics added: {('attendanceRate' not in content)}")
    print(f"   - Return statement replaced: True")
    print(f"   - File saved: {dashboard_path}")
    return True

if __name__ == '__main__':
    try:
        success = apply_bento_grid()
        if success:
            print("\n🎉 Implementation complete!")
        else:
            print("\n❌ Implementation failed!")
            exit(1)
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        exit(1)
