import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  Card, CardHeader, CardBody, CardTitle, Button, Badge,
  LoadingSpinner, EmptyState
} from '../components/ui';
import Modal, { ModalBody, ModalFooter, ModalBtnPrimary, ModalBtnSecondary, modalInputCls } from '../components/ui/Modal';
import {
  BookOpen, Users, FileText, Award, CheckSquare,
  Upload, Download, Clock, Folder,
  MessageSquare, Bell, ArrowLeft,
  Search, ChevronRight, BarChart2, X
} from 'lucide-react';
import { GradeManagementView, AttendanceView, AnalyticsView } from './ClassroomHub/EmbeddedViews';

/**
 * ClassroomHub - Google Classroom-inspired class management
 * Combines classes, materials, assignments, and announcements
 */

const ClassroomHub = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Get classroom from search params (separate from tab param)
  const classroomIdParam = searchParams.get('classroom');
  const classroomId = classroomIdParam ? parseInt(classroomIdParam) : null;

  // State
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [announcementText, setAnnouncementText] = useState('');
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(false);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('stream'); // stream, materials, people, grades
  const [searchQuery, setSearchQuery] = useState('');

  // Sync activeTab with ?view= URL param
  const viewParam = searchParams.get('view');
  const validTabs = ['stream', 'materials', 'people', 'grades'];

  useEffect(() => {
    if (viewParam && validTabs.includes(viewParam)) {
      setActiveTab(viewParam);
    }
  }, [viewParam]);

  const handleTabChange = (key) => {
    setActiveTab(key);
    const newParams = new URLSearchParams(searchParams);
    newParams.set('view', key);
    setSearchParams(newParams);
  };

  const isTeacher = user?.role === 'staff' || user?.role === 'admin';

  useEffect(() => {
    fetchClasses();
  }, [user?.id]);

  useEffect(() => {
    if (classroomId && classes.length > 0) {
      const classroom = classes.find(c => c.id === classroomId);
      if (classroom) {
        selectClassroom(classroom);
      }
    }
  }, [classroomId, classes]);

  const fetchClasses = async () => {
    try {
      if (isTeacher) {
        // Use /classrooms/ directly — the backend already filters by advisory + subject assignments for staff.
        // The old by_teacher endpoint only returned classrooms with subject assignments,
        // leaving advisory-only teachers with an empty list.
        const res = await api.get('/classrooms/');
        const classroomList = Array.isArray(res.data) ? res.data : res.data?.results || [];

        // For each classroom, fetch subjects assigned to this teacher
        const withSubjects = await Promise.all(
          classroomList.map(async (cls) => {
            try {
              const subjRes = await api.get(`/classroom-subjects/by_classroom/?classroom_id=${cls.id}`);
              const mySubjects = (Array.isArray(subjRes.data) ? subjRes.data : [])
                .filter(s => s.teacher === user?.id)
                .map(s => ({ id: s.subject, name: s.subject_name, code: s.subject_code }));
              return {
                id: cls.id,
                name: cls.name,
                grade_level: cls.grade_level,
                subjects: mySubjects,
                studentCount: cls.student_count ?? null,
                students: [],
                color: getClassroomColor(cls.name),
              };
            } catch {
              return {
                id: cls.id,
                name: cls.name,
                grade_level: cls.grade_level,
                subjects: [],
                studentCount: cls.student_count ?? null,
                students: [],
                color: getClassroomColor(cls.name),
              };
            }
          })
        );

        setClasses(withSubjects);
      } else {
        // Students: fetch enrollments then resolve classroom details
        const res = await api.get(`/enrollments/?student=${user?.id}`);
        const classroomIds = [...new Set(res.data.map(e => e.classroom))];
        const classroomsData = await Promise.all(classroomIds.map(id => api.get(`/classrooms/${id}/`)));
        setClasses(classroomsData.map((r) => ({
          ...r.data,
          color: getClassroomColor(r.data.name),
        })));
      }
    } catch {
      toast.error('Failed to load classes');
    } finally {
      setLoading(false);
    }
  };

  const selectClassroom = async (classroom) => {
    setSelectedClass(classroom);
    // Update URL with both tab and classroom params
    const newParams = new URLSearchParams(searchParams);
    newParams.set('classroom', classroom.id.toString());
    setSearchParams(newParams);
    setLoading(true);
    
    try {
      // Fetch classroom details
      const [materialsRes, studentsRes, announcementsRes] = await Promise.all([
        api.get(`/materials/?classroom=${classroom.id}`),
        isTeacher 
          ? api.get(`/enrollments/?classroom=${classroom.id}`)
          : Promise.resolve({ data: [] }),
        api.get(`/announcements/?classroom=${classroom.id}`)
      ]);
      
      setMaterials(materialsRes.data);
      if (isTeacher) {
        setStudents(studentsRes.data);
      }
      setAnnouncements(announcementsRes.data.sort((a, b) => 
        new Date(b.created_at) - new Date(a.created_at)
      ));
    } catch {
      toast.error('Failed to load classroom details');
    } finally {
      setLoading(false);
    }
  };

  const handlePostAnnouncement = async () => {
    if (!announcementText.trim()) {
      toast.error('Announcement cannot be empty');
      return;
    }
    
    setLoadingAnnouncements(true);
    try {
      const response = await api.post('/announcements/', {
        classroom: selectedClass.id,
        content: announcementText.trim(),
        title: '' // Optional title field
      });
      
      // Add new announcement to top of list
      setAnnouncements([response.data, ...announcements]);
      setAnnouncementText('');
      toast.success('Announcement posted');
    } catch (error) {
      toast.error('Failed to post announcement');
      // Keep text in input so teacher can retry
    } finally {
      setLoadingAnnouncements(false);
    }
  };

  const getClassroomColor = (name) => {
    const colors = [
      'bg-gradient-to-br from-violet-500 to-purple-600',
      'bg-gradient-to-br from-blue-500 to-cyan-600',
      'bg-gradient-to-br from-green-500 to-emerald-600',
      'bg-gradient-to-br from-orange-500 to-amber-600',
      'bg-gradient-to-br from-rose-500 to-pink-600',
      'bg-gradient-to-br from-indigo-500 to-blue-600',
    ];
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  const getMaterialIcon = (type) => {
    const icons = {
      dlp: FileText,
      dll: BookOpen,
      module: Folder,
      activity: CheckSquare,
      assessment: Award,
      other: FileText
    };
    return icons[type] || FileText;
  };

  const filteredMaterials = useMemo(() => {
    if (!searchQuery) return materials;
    return materials.filter(m =>
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [materials, searchQuery]);

  // If no classroom is selected, show class list
  if (!selectedClass) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="page-bottom-safe max-w-[1800px] mx-auto bg-slate-50 px-4 py-6 md:px-8 md:py-8"
      >
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">My Classes</h1>
              <p className="text-sm text-slate-600">
                {isTeacher ? 'Classes you teach' : 'Your enrolled classes'}
              </p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <LoadingSpinner />
          </div>
        ) : classes.length === 0 ? (
          <Card>
            <CardBody className="p-12">
              <EmptyState
                title="No Classes Found"
                description={isTeacher
                  ? "You haven't been assigned to any classes yet."
                  : "You're not enrolled in any classes yet."}
                icon={<BookOpen className="w-8 h-8" />}
              />
            </CardBody>
          </Card>
        ) : (
          <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5`}>
            {classes.map(classroom => (
              <motion.div
                key={classroom.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ y: -4 }}
                className="group cursor-pointer"
                onClick={() => selectClassroom(classroom)}
              >
                <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 border-0">
                  {/* Header with gradient */}
                  <div className={`${classroom.color} h-32 relative`}>
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20" />
                    <div className="absolute bottom-4 left-4 right-4">
                      <h3 className="text-xl font-bold text-white truncate">
                        {classroom.name}
                      </h3>
                      {isTeacher && classroom.subjects && (
                        <p className="text-sm text-white/90 mt-1">
                          {classroom.subjects.length} {classroom.subjects.length === 1 ? 'Subject' : 'Subjects'}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <CardBody className="p-4">
                    <div className="flex items-center justify-between text-sm text-slate-600">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        <span>
                          {classroom.studentCount !== null && classroom.studentCount !== undefined
                            ? `${classroom.studentCount} student${classroom.studentCount === 1 ? '' : 's'}`
                            : (classroom.students?.length || 0) + ' students'
                          }
                        </span>
                      </div>
                      {isTeacher && (
                        <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-violet-600 group-hover:translate-x-1 transition-all" />
                      )}
                    </div>
                  </CardBody>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    );
  }

  // Classroom detail view
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="page-bottom-safe min-h-screen bg-slate-50"
    >
      {/* Header Banner */}
      <div className={`${selectedClass.color} relative`}>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/30" />
        <div className="relative max-w-[1800px] mx-auto px-4 py-8 md:px-8 md:py-12">
          <button
            onClick={() => {
              setSelectedClass(null);
              // Remove classroom param but keep tab param
              const newParams = new URLSearchParams(searchParams);
              newParams.delete('classroom');
              setSearchParams(newParams);
            }}
            className="flex items-center gap-2 text-white/90 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Back to Classes</span>
          </button>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                {selectedClass.name}
              </h1>
              {isTeacher && selectedClass.subjects && (
                <div className="flex flex-wrap gap-2">
                  {selectedClass.subjects.map(subject => (
                    <Badge key={subject.id} variant="white" className="bg-white/20 text-white border-white/30">
                      {subject.code}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Loading banner — shown while classroom data is being fetched */}
      {loading && (
        <div className="bg-white border-b border-slate-200 px-4 md:px-8 py-3 flex items-center gap-3 text-sm text-slate-600">
          <div className="w-4 h-4 border-2 border-violet-500 border-t-transparent rounded-full animate-spin shrink-0" />
          <span>Loading classroom data…</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-[1800px] mx-auto px-4 md:px-8">
          <div className="flex items-center gap-1 overflow-x-auto">
            {[
              { key: 'stream', label: 'Stream', icon: MessageSquare },
              { key: 'materials', label: 'Materials', icon: Folder },
              { key: 'people', label: 'People', icon: Users },
              { key: 'grades', label: 'Grades', icon: Award }
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => handleTabChange(tab.key)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    isActive
                      ? 'border-violet-600 text-violet-600'
                      : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="max-w-[1800px] mx-auto px-4 py-6 md:px-8 md:py-8">
        <AnimatePresence mode="wait">
          {activeTab === 'stream' && (
            <StreamTab
              classroom={selectedClass}
              isTeacher={isTeacher}
              announcements={announcements}
              announcementText={announcementText}
              setAnnouncementText={setAnnouncementText}
              handlePostAnnouncement={handlePostAnnouncement}
              loadingAnnouncements={loadingAnnouncements}
            />
          )}

          {activeTab === 'materials' && (
            <MaterialsTab
              classroom={selectedClass}
              materials={filteredMaterials}
              isTeacher={isTeacher}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              getMaterialIcon={getMaterialIcon}
              loading={loading}
            />
          )}

          {activeTab === 'people' && (
            <PeopleTab
              classroom={selectedClass}
              students={students}
              isTeacher={isTeacher}
              loading={loading}
            />
          )}

          {activeTab === 'grades' && (
            <GradesTab
              classroom={selectedClass}
              isTeacher={isTeacher}
              navigate={navigate}
            />
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

// Stream Tab Component
const StreamTab = ({ classroom, isTeacher, announcements, announcementText, setAnnouncementText, handlePostAnnouncement, loadingAnnouncements }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    className="space-y-6"
  >
    {isTeacher && (
      <Card>
        <CardBody className="p-4">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-violet-600" />
              </div>
              <textarea
                className="flex-1 px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                placeholder="Share an announcement with your class..."
                value={announcementText}
                onChange={(e) => setAnnouncementText(e.target.value)}
                rows={3}
              />
            </div>
            <div className="flex justify-end">
              <Button
                onClick={handlePostAnnouncement}
                variant="primary"
                size="sm"
                disabled={!announcementText.trim() || loadingAnnouncements}
                loading={loadingAnnouncements}
              >
                Post Announcement
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>
    )}

    {announcements.length === 0 ? (
      <Card>
        <CardBody className="p-8 text-center">
          <Bell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600">No announcements yet</p>
        </CardBody>
      </Card>
    ) : (
      <div className="space-y-4">
        {announcements.map(announcement => (
          <Card key={announcement.id}>
            <CardBody className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
                  <MessageSquare className="w-5 h-5 text-violet-600" />
                </div>
                <div className="flex-1 min-w-0">
                  {announcement.title && (
                    <h4 className="font-semibold text-slate-900 mb-1">{announcement.title}</h4>
                  )}
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">{announcement.content}</p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                    <span>{announcement.author_name || 'Teacher'}</span>
                    <span>•</span>
                    <span>{new Date(announcement.created_at).toLocaleDateString()}</span>
                    <span>at</span>
                    <span>{new Date(announcement.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    )}
  </motion.div>
);

// Materials Tab Component
const MaterialsTab = ({ classroom, materials, isTeacher, searchQuery, setSearchQuery, getMaterialIcon, loading }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    className="space-y-6"
  >
    {/* Search and Actions */}
    <div className="flex items-center gap-4">
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search materials..."
          className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500"
        />
      </div>
      {isTeacher && (
        <Button variant="primary">
          <Upload className="w-4 h-4 mr-2" />
          Upload
        </Button>
      )}
    </div>

    {loading ? (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    ) : materials.length === 0 ? (
      <Card>
        <CardBody className="p-12">
          <EmptyState
            title="No Materials Yet"
            description={isTeacher ? "Upload your first material to get started" : "Your teacher hasn't uploaded any materials yet"}
            icon={<Folder className="w-8 h-8" />}
          />
        </CardBody>
      </Card>
    ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {materials.map(material => {
          const Icon = getMaterialIcon(material.material_type);
          return (
            <Card key={material.id} className="hover:shadow-lg transition-shadow">
              <CardBody className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-violet-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-900 truncate">{material.title}</h3>
                    <p className="text-xs text-slate-600 mt-1 line-clamp-2">{material.description}</p>
                    <div className="flex items-center gap-2 mt-3">
                      <Badge variant="slate" size="sm">{material.material_type?.toUpperCase()}</Badge>
                      {material.quarter && (
                        <Badge variant="blue" size="sm">Q{material.quarter}</Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                  <span className="text-xs text-slate-500">
                    <Clock className="w-3 h-3 inline mr-1" />
                    {new Date(material.uploaded_at).toLocaleDateString()}
                  </span>
                  <Button variant="ghost" size="sm">
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </CardBody>
            </Card>
          );
        })}
      </div>
    )}
  </motion.div>
);

// People Tab Component
const PeopleTab = ({ classroom, students, isTeacher, loading }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    className="space-y-6"
  >
    <Card>
      <CardHeader divider>
        <div className="flex items-center justify-between">
          <CardTitle>Students</CardTitle>
          <Badge variant="slate">{students.length} enrolled</Badge>
        </div>
      </CardHeader>
      <CardBody>
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <LoadingSpinner />
          </div>
        ) : students.length === 0 ? (
          <EmptyState
            title="No Students"
            description="No students are enrolled in this class"
            icon={<Users className="w-6 h-6" />}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {students.map((student) => (
              <div key={student.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                  {student.student_name
                    ? student.student_name.trim().split(/\s+/).slice(0, 2).map(n => n.charAt(0).toUpperCase()).join('')
                    : '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 truncate">
                    {student.student_name || student.student_email || 'Unknown Student'}
                  </p>
                  {student.student_email && (
                    <p className="text-xs text-slate-500 truncate">{student.student_email}</p>
                  )}
                  {student.student_lrn && (
                    <p className="text-xs text-slate-400">LRN: {student.student_lrn}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  </motion.div>
);

// Grades Tab Component - Enhanced with inline functionality
const GradesTab = ({ classroom, isTeacher, navigate }) => {
  const [activeView, setActiveView] = useState('overview'); // overview, input, manage, attendance, analytics
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activeView === 'overview') {
      fetchGradesOverview();
    }
  }, [activeView, classroom.id]);

  const fetchGradesOverview = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/grades/?classroom=${classroom.id}`);
      setGrades(res.data);
    } catch {
      // Handle error silently
    } finally {
      setLoading(false);
    }
  };

  // Render different views based on activeView
  const renderView = () => {
    switch (activeView) {
      case 'input':
        return (
          <GradeInputView
            classroom={classroom}
            onBack={() => setActiveView('overview')}
          />
        );
      case 'manage':
        return (
          <GradeManagementView
            classroom={classroom}
            onBack={() => setActiveView('overview')}
          />
        );
      case 'attendance':
        return (
          <AttendanceView
            classroom={classroom}
            onBack={() => setActiveView('overview')}
          />
        );
      case 'analytics':
        return (
          <AnalyticsView
            classroom={classroom}
            onBack={() => setActiveView('overview')}
          />
        );
      default:
        return (
          <OverviewView
            classroom={classroom}
            grades={grades}
            loading={loading}
            isTeacher={isTeacher}
            onNavigate={(view) => setActiveView(view)}
            navigate={navigate}
          />
        );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      {renderView()}
    </motion.div>
  );
};

// Overview View - Quick Actions Dashboard
const OverviewView = ({ classroom, grades, loading, isTeacher, onNavigate, navigate }) => {
  if (!isTeacher) {
    return (
      <Card>
        <CardBody className="p-6">
          <div className="text-center">
            <Award className="w-12 h-12 text-violet-500 mx-auto mb-3" />
            <h3 className="font-semibold text-slate-900 mb-2">Your Grades</h3>
            <p className="text-sm text-slate-600 mb-4">
              View your grades for this class
            </p>
            <Button variant="primary" onClick={() => navigate('/grades')}>
              View My Grades
            </Button>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <>
      {/* Quick Actions for Teachers */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card 
          className="hover:shadow-lg transition-shadow cursor-pointer group" 
          onClick={() => onNavigate('input')}
        >
          <CardBody className="p-6 text-center">
            <div className="w-12 h-12 rounded-lg bg-violet-100 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
              <FileText className="w-6 h-6 text-violet-600" />
            </div>
            <h3 className="font-semibold text-slate-900 mb-2">Input Grades</h3>
            <p className="text-sm text-slate-600">Enter student grades</p>
          </CardBody>
        </Card>

        <Card 
          className="hover:shadow-lg transition-shadow cursor-pointer group" 
          onClick={() => onNavigate('manage')}
        >
          <CardBody className="p-6 text-center">
            <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
              <Award className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-semibold text-slate-900 mb-2">Manage Grades</h3>
            <p className="text-sm text-slate-600">Review and adjust</p>
          </CardBody>
        </Card>

        <Card 
          className="hover:shadow-lg transition-shadow cursor-pointer group" 
          onClick={() => onNavigate('attendance')}
        >
          <CardBody className="p-6 text-center">
            <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
              <CheckSquare className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="font-semibold text-slate-900 mb-2">Attendance</h3>
            <p className="text-sm text-slate-600">Mark attendance</p>
          </CardBody>
        </Card>

        <Card 
          className="hover:shadow-lg transition-shadow cursor-pointer group" 
          onClick={() => onNavigate('analytics')}
        >
          <CardBody className="p-6 text-center">
            <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
              <BarChart2 className="w-6 h-6 text-amber-600" />
            </div>
            <h3 className="font-semibold text-slate-900 mb-2">Analytics</h3>
            <p className="text-sm text-slate-600">View performance</p>
          </CardBody>
        </Card>
      </div>

      {/* Grade Overview */}
      <Card>
        <CardHeader divider>
          <CardTitle>Grade Overview</CardTitle>
        </CardHeader>
        <CardBody>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <LoadingSpinner />
            </div>
          ) : grades.length === 0 ? (
            <EmptyState
              title="No Grades Yet"
              description="Start by inputting grades for your students"
              icon={<Award className="w-8 h-8" />}
            />
          ) : (
            <div className="text-center py-8">
              <p className="text-slate-600">
                {grades.length} grade records for this class
              </p>
              <Button
                variant="primary"
                className="mt-4"
                onClick={() => onNavigate('manage')}
              >
                View All Grades
              </Button>
            </div>
          )}
        </CardBody>
      </Card>
    </>
  );
};

// Grade Input View - Custom inline implementation
const GradeInputView = ({ classroom, onBack }) => {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedQuarter, setSelectedQuarter] = useState(1);
  const [grades, setGrades] = useState({});
  const [existingGrades, setExistingGrades] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [currentAcademicYear, setCurrentAcademicYear] = useState(null);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  // Modal state for replace browser dialogs
  const [modalState, setModalState] = useState({
    open: false,
    type: 'confirm', // 'confirm' or 'input'
    title: '',
    message: '',
    inputValue: '',
    onConfirm: null
  });

  // Load current academic year from system settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('/system/settings/');
        if (res.data?.academic_year) {
          setCurrentAcademicYear(res.data.academic_year);
        }
        if (res.data?.current_quarter) {
          setSelectedQuarter(parseInt(res.data.current_quarter, 10));
        }
      } catch {
        toast.error('Failed to load system settings. Cannot submit grades.');
      } finally {
        setSettingsLoaded(true);
      }
    };
    fetchSettings();
  }, []);

  // Load subjects for this classroom
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const res = await api.get(`/classroom-subjects/by_classroom/?classroom_id=${classroom.id}`);
        setSubjects(res.data);
        if (res.data.length > 0) {
          setSelectedSubject(res.data[0].subject.toString());
        }
      } catch {
        toast.error('Failed to load subjects');
      }
    };
    fetchSubjects();
  }, [classroom.id]);

  // Load students
  useEffect(() => {
    const fetchStudents = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/enrollments/?classroom=${classroom.id}`);
        // Sort by name
        const sorted = res.data.sort((a, b) => {
          const nameA = (a.student_name || '').toLowerCase();
          const nameB = (b.student_name || '').toLowerCase();
          return nameA.localeCompare(nameB);
        });
        setStudents(sorted);
        // Initialize grades object
        const initGrades = {};
        sorted.forEach(s => { initGrades[s.student] = ''; });
        setGrades(initGrades);
      } catch {
        toast.error('Failed to load students');
      } finally {
        setLoading(false);
      }
    };
    if (classroom.id) {
      fetchStudents();
    }
  }, [classroom.id]);

  // Clear entered grades when subject or quarter changes
  useEffect(() => {
    if (students.length > 0) {
      const clearedGrades = {};
      students.forEach(s => { clearedGrades[s.student] = ''; });
      setGrades(clearedGrades);
    }
  }, [selectedSubject, selectedQuarter]);

  // Load existing grades when subject or quarter changes
  useEffect(() => {
    const fetchExistingGrades = async () => {
      if (!selectedSubject || !selectedQuarter) return;
      try {
        const res = await api.get(
          `/grades/?classroom=${classroom.id}&subject=${selectedSubject}&quarter=${selectedQuarter}&grade_type=final_grade&academic_year=${currentAcademicYear}`
        );
        const gradeMap = {};
        res.data.forEach(g => {
          gradeMap[g.student] = g; // store full grade object (id, raw_score, etc.)
        });
        setExistingGrades(gradeMap);
      } catch {
        console.error('Failed to load existing grades');
      }
    };
    fetchExistingGrades();
  }, [selectedSubject, selectedQuarter, classroom.id, currentAcademicYear]);

  const handleGradeChange = (studentId, value) => {
    setGrades(prev => ({ ...prev, [studentId]: value }));
  };

  const handleSubmit = async () => {
    if (!selectedSubject) {
      toast.error('Please select a subject');
      return;
    }

    if (!currentAcademicYear) {
      toast.error('System settings not loaded. Please refresh and try again.');
      return;
    }

    const toSubmit = students.filter(s => grades[s.student] && grades[s.student] !== '');
    if (toSubmit.length === 0) {
      toast.error('Enter at least one grade');
      return;
    }

    // Validate grades
    for (const s of toSubmit) {
      const val = parseFloat(grades[s.student]);
      if (isNaN(val) || val < 0 || val > 100) {
        toast.error(`Invalid grade for ${s.student_name || s.student_email}`);
        return;
      }
    }

    const subjectAssignment = subjects.find(s => s.subject.toString() === selectedSubject);
    if (!subjectAssignment) {
      toast.error('Subject assignment not found');
      return;
    }

    setSubmitting(true);
    let successCount = 0;
    let errorCount = 0;

    for (const student of toSubmit) {
      try {
        const payload = {
          student: student.student,
          subject: parseInt(selectedSubject, 10),
          classroom: classroom.id,
          teacher: subjectAssignment.teacher,
          grade_type: 'final_grade',
          quarter: selectedQuarter,
          academic_year: currentAcademicYear,
          raw_score: parseFloat(grades[student.student]),
          total_score: 100,
        };
        const existing = existingGrades[student.student];
        if (existing?.id) {
          await api.put(`/grades/${existing.id}/`, payload);
        } else {
          await api.post('/grades/', payload);
        }
        successCount++;
      } catch (err) {
        errorCount++;
        console.error(`Failed to submit grade for ${student.student_name}`, err);
      }
    }

    setSubmitting(false);

    if (successCount > 0) {
      toast.success(`Successfully submitted ${successCount} grade(s)`);
      // Clear submitted grades
      const clearedGrades = { ...grades };
      toSubmit.forEach(s => { clearedGrades[s.student] = ''; });
      setGrades(clearedGrades);
      // Reload existing grades
      const res = await api.get(
        `/grades/?classroom=${classroom.id}&subject=${selectedSubject}&quarter=${selectedQuarter}&grade_type=final_grade&academic_year=${currentAcademicYear}`
      );
      const gradeMap = {};
      res.data.forEach(g => {
        gradeMap[g.student] = g; // store full grade object
      });
      setExistingGrades(gradeMap);
    }

    if (errorCount > 0) {
      toast.error(`Failed to submit ${errorCount} grade(s)`);
    }
  };

  const handleClearAll = () => {
    const clearedGrades = {};
    students.forEach(s => { clearedGrades[s.student] = ''; });
    setGrades(clearedGrades);
    toast.success('All grades cleared');
  };

  const handleFillAll = () => {
    setModalState({
      open: true,
      type: 'input',
      title: 'Fill All Grades',
      message: 'Enter a grade to apply to all students (0–100):',
      inputValue: '',
      onConfirm: (value) => {
        const numValue = parseFloat(value);
        if (isNaN(numValue) || numValue < 0 || numValue > 100) {
          toast.error('Grade must be between 0 and 100');
          return;
        }
        const filledGrades = {};
        students.forEach(s => { filledGrades[s.student] = value; });
        setGrades(filledGrades);
        toast.success(`Filled all with ${value}`);
        setModalState(prev => ({ ...prev, open: false }));
      }
    });
  };

  const filled = students.filter(s => grades[s.student] && grades[s.student] !== '').length;
  const scores = students
    .map(s => parseFloat(grades[s.student]))
    .filter(v => !isNaN(v) && v >= 0 && v <= 100);
  const avg = scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2) : null;
  const highest = scores.length ? Math.max(...scores) : null;
  const lowest = scores.length ? Math.min(...scores) : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Overview
        </Button>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearAll}
            disabled={filled === 0}
          >
            <X className="w-4 h-4 mr-2" />
            Clear All
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={!selectedSubject || filled === 0 || !currentAcademicYear || !settingsLoaded}
            loading={submitting}
            title={!currentAcademicYear ? 'System settings not loaded' : undefined}
          >
            <Upload className="w-4 h-4 mr-2" />
            {!settingsLoaded ? 'Loading...' : `Submit (${filled})`}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader divider>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Grade Input - {classroom.name}</CardTitle>
              {currentAcademicYear && (
                <p className="text-xs text-slate-500 mt-0.5">Academic Year: <span className="font-semibold text-violet-600">{currentAcademicYear}</span></p>
              )}
              {!currentAcademicYear && settingsLoaded && (
                <p className="text-xs text-red-500 mt-0.5">⚠ Academic year not configured in system settings</p>
              )}
            </div>
            {scores.length > 0 && (
              <div className="flex gap-2">
                <Badge variant="violet" className="text-sm px-2 py-1">
                  Avg: {avg}
                </Badge>
                <Badge variant="green" className="text-sm px-2 py-1">
                  High: {highest}
                </Badge>
                <Badge variant="red" className="text-sm px-2 py-1">
                  Low: {lowest}
                </Badge>
              </div>
            )}
          </div>
        </CardHeader>
        <CardBody className="p-6">
          {/* Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Subject
              </label>
              <select
                value={selectedSubject}
                onChange={e => setSelectedSubject(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                <option value="">Select subject</option>
                {subjects.map(s => (
                  <option key={s.id} value={s.subject}>
                    {s.subject_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Quarter
              </label>
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3, 4].map(q => (
                  <button
                    key={q}
                    onClick={() => setSelectedQuarter(q)}
                    className={`px-4 py-3 min-h-[44px] min-w-[44px] text-sm font-semibold transition-colors rounded-md ${
                      selectedQuarter === q
                        ? 'bg-violet-600 text-white'
                        : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-300'
                    }`}
                  >
                    Q{q}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {selectedSubject && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-blue-900 font-medium">
                  Bulk Actions
                </span>
              </div>
              <Button variant="outline" size="sm" className="border-blue-300 text-blue-600 hover:bg-blue-100" onClick={handleFillAll}>
                <Upload className="w-4 h-4 mr-2" />
                Fill All with Same Grade
              </Button>
            </div>
          )}

          {/* Grade Table */}
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <LoadingSpinner />
            </div>
          ) : !selectedSubject ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600">Select a subject to start entering grades</p>
            </div>
          ) : students.length === 0 ? (
            <EmptyState
              title="No Students"
              description="No students enrolled in this class"
              icon={<Users className="w-8 h-8" />}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b-2 border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase">
                      #
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase">
                      Student Name
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-slate-700 uppercase w-32">
                      New Grade (0-100)
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-slate-700 uppercase w-32">
                      Current
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                  {students.map((student, idx) => {
                    const currentGrade = existingGrades[student.student];
                    const newGrade = grades[student.student];
                    const hasValue = newGrade && newGrade !== '';
                    const isOverwrite = currentGrade && hasValue;
                    
                    return (
                      <tr 
                        key={student.id} 
                        className={`hover:bg-slate-50 ${hasValue ? 'bg-violet-50/30' : ''} ${isOverwrite ? 'bg-yellow-50 border-l-4 border-yellow-500' : ''}`}
                      >
                        <td className="px-4 py-3 text-sm text-slate-500 font-semibold">
                          {idx + 1}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center text-violet-600 font-bold text-xs">
                              {student.student_name
                                ? student.student_name.trim().split(/\s+/).slice(0, 2).map(n => n.charAt(0).toUpperCase()).join('')
                                : '?'}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-900">
                                {student.student_name || student.student_email || 'Unknown'}
                              </p>
                              <p className="text-xs text-slate-500">{student.student_username}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            value={newGrade}
                            onChange={e => handleGradeChange(student.student, e.target.value)}
                            className={`w-full px-3 py-2 border rounded-md text-center font-semibold focus:outline-none focus:ring-2 focus:ring-violet-500 ${
                              isOverwrite ? 'border-yellow-500' : hasValue ? 'border-violet-400 bg-white' : 'border-slate-300'
                            }`}
                            placeholder="0-100"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col items-center gap-1">
                            {currentGrade ? (
                              <Badge variant="slate" className="font-semibold">
                                {currentGrade.raw_score}
                              </Badge>
                            ) : (
                              <span className="text-slate-400 text-sm">—</span>
                            )}
                            {isOverwrite && (
                              <div className="flex items-center gap-1 text-yellow-700 text-xs">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                                </svg>
                                <span className="font-semibold">Overwrite</span>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Modal for confirmations and inputs */}
      <Modal
        open={modalState.open}
        onClose={() => setModalState(prev => ({ ...prev, open: false }))}
        title={modalState.title}
        size="md"
      >
        <ModalBody>
          <p className="text-sm text-slate-700 mb-4">{modalState.message}</p>
          {modalState.type === 'input' && (
            <input
              type="number"
              className={modalInputCls}
              value={modalState.inputValue}
              onChange={(e) => setModalState(prev => ({ ...prev, inputValue: e.target.value }))}
              placeholder="0-100"
              min="0"
              max="100"
              step="0.01"
            />
          )}
        </ModalBody>
        <ModalFooter>
          <ModalBtnSecondary onClick={() => setModalState(prev => ({ ...prev, open: false }))}>
            Cancel
          </ModalBtnSecondary>
          <ModalBtnPrimary onClick={() => {
            if (modalState.onConfirm) {
              if (modalState.type === 'input') {
                modalState.onConfirm(modalState.inputValue);
              } else {
                modalState.onConfirm();
              }
            }
          }}>
            Confirm
          </ModalBtnPrimary>
        </ModalFooter>
      </Modal>
    </div>
  );
};

export default ClassroomHub;
