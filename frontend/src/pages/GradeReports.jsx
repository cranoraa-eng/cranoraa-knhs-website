import { useState, useEffect } from 'react';
import api from '../utils/api';
import { getUser } from '../utils/auth';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

const remarksFor = (avg) => {
  if (avg == null) return { label: 'No Grade', color: 'text-gray-400 bg-gray-50 border-gray-200' };
  const n = parseFloat(avg);
  if (n >= 90) return { label: 'Outstanding',            color: 'text-green-700 bg-green-50 border-green-200' };
  if (n >= 85) return { label: 'Very Satisfactory',      color: 'text-blue-700 bg-blue-50 border-blue-200' };
  if (n >= 80) return { label: 'Satisfactory',           color: 'text-yellow-700 bg-yellow-50 border-yellow-200' };
  if (n >= 75) return { label: 'Fairly Satisfactory',    color: 'text-orange-700 bg-orange-50 border-orange-200' };
  return       { label: 'Did Not Meet Expectations',     color: 'text-red-700 bg-red-50 border-red-200' };
};

const GradeReports = () => {
  const user = getUser();
  const isStudent = user?.role === 'student';

  const [reports, setReports] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [filterClassroom, setFilterClassroom] = useState('');
  const [filterQuarter, setFilterQuarter] = useState('');

  // Generate form state (admin/teacher only)
  const [genClassroom, setGenClassroom] = useState('');
  const [genQuarter, setGenQuarter] = useState('');
  const [genYear, setGenYear] = useState(localStorage.getItem('knhs_academic_year') || '2025-2026');

  const handleYearChange = (dir) => {
    const [start, end] = genYear.split('-').map(Number);
    const newYear = dir === 'next' ? `${start + 1}-${end + 1}` : `${start - 1}-${end - 1}`;
    setGenYear(newYear);
    localStorage.setItem('knhs_academic_year', newYear);
  };

  useEffect(() => {
    fetchReports();
    if (!isStudent) {
      api.get('/classrooms/').then(r => setClassrooms(r.data)).catch(() => {});
    }
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const endpoint = isStudent ? '/grade-reports/my_reports/' : '/grade-reports/';
      const res = await api.get(endpoint);
      setReports(res.data);
    } catch {
      toast.error('Failed to load grade reports');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!genClassroom || !genQuarter) return toast.error('Select a classroom and quarter');
    const result = await Swal.fire({
      title: 'Generate Reports?',
      text: 'This will create or update grade reports for all enrolled students.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#9333ea',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Generate',
    });
    if (!result.isConfirmed) return;
    setGenerating(true);
    try {
      const res = await api.post('/grade-reports/generate_for_classroom/', {
        classroom_id: genClassroom,
        quarter: genQuarter,
        school_year: genYear,
      });
      toast.success(res.data.message || 'Reports generated');
      fetchReports();
    } catch {
      toast.error('Failed to generate reports');
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async (report) => {
    const result = await Swal.fire({
      title: 'Delete Report?',
      text: `Delete grade report for ${report.student_name}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Delete',
    });
    if (!result.isConfirmed) return;
    try {
      await api.delete(`/grade-reports/${report.id}/`);
      toast.success('Report deleted');
      fetchReports();
    } catch {
      toast.error('Failed to delete report');
    }
  };

  const filtered = reports.filter(r => {
    const matchC = !filterClassroom || String(r.classroom) === filterClassroom;
    const matchQ = !filterQuarter || String(r.quarter) === filterQuarter;
    return matchC && matchQ;
  });

  // Sort classrooms by grade level (Grade 7-12)
  const sortedClassrooms = [...classrooms].sort((a, b) => {
    const gradeOrder = ['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];
    const getGrade = (name) => gradeOrder.find(g => name.toLowerCase().includes(g.toLowerCase())) || '';
    const gradeA = getGrade(a.name);
    const gradeB = getGrade(b.name);
    const indexA = gradeOrder.indexOf(gradeA);
    const indexB = gradeOrder.indexOf(gradeB);
    if (indexA === -1 && indexB === -1) return a.name.localeCompare(b.name);
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  });

  return (
    <div className="overflow-y-auto h-[calc(100vh-4rem)] p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Grade Reports</h1>
        <p className="text-gray-500 mt-1">
          {isStudent ? 'Your quarterly grade summaries' : 'Generate and view student grade reports'}
        </p>
      </div>

      {/* Generate panel (admin/teacher) */}
      {!isStudent && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 mb-5">
          <h2 className="font-semibold text-gray-800 mb-4">Generate Reports</h2>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <select
              value={genClassroom}
              onChange={e => setGenClassroom(e.target.value)}
              className="px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
            >
              <option value="">Select Classroom</option>
              {sortedClassrooms.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select
              value={genQuarter}
              onChange={e => setGenQuarter(e.target.value)}
              className="px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
            >
              <option value="">Select Quarter</option>
              <option value="1">First Quarter</option>
              <option value="2">Second Quarter</option>
              <option value="3">Third Quarter</option>
              <option value="4">Fourth Quarter</option>
            </select>
            <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden bg-white">
              <button 
                onClick={() => handleYearChange('prev')}
                className="px-3 py-2.5 hover:bg-gray-50 text-gray-500 border-r border-gray-200 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="flex-1 text-center text-sm font-semibold text-gray-700 select-none">
                {genYear}
              </div>
              <button 
                onClick={() => handleYearChange('next')}
                className="px-3 py-2.5 hover:bg-gray-50 text-gray-500 border-l border-gray-200 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white font-medium py-2.5 px-4 rounded-lg transition-colors text-sm"
            >
              {generating ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Generating...
                </>
              ) : 'Generate'}
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      {!isStudent && reports.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
          <select
            value={filterClassroom}
            onChange={e => setFilterClassroom(e.target.value)}
            className="px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
          >
            <option value="">All Classrooms</option>
            {sortedClassrooms.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select
            value={filterQuarter}
            onChange={e => setFilterQuarter(e.target.value)}
            className="px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
          >
            <option value="">All Quarters</option>
            <option value="1">First Quarter</option>
            <option value="2">Second Quarter</option>
            <option value="3">Third Quarter</option>
            <option value="4">Fourth Quarter</option>
          </select>
        </div>
      )}

      {/* Reports */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-16 text-center">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-gray-500 font-medium">
            {reports.length === 0
              ? isStudent ? 'No grade reports available yet.' : 'No reports generated yet. Use the form above to generate reports.'
              : 'No reports match your filters.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map(r => {
            const rm = remarksFor(r.general_average);
            return (
              <div key={r.id} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                {/* Card header */}
                <div className="flex items-start justify-between px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-indigo-50">
                  <div>
                    <div className="font-bold text-gray-800">{r.student_name}</div>
                    <div className="text-sm text-gray-500">{r.classroom_name}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-sm font-semibold text-gray-700">Q{r.quarter} · {r.school_year}</div>
                      <div className="text-xs text-gray-400">{new Date(r.generated_at).toLocaleDateString()}</div>
                    </div>
                    {!isStudent && (
                      <button
                        onClick={() => handleDelete(r)}
                        className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                        title="Delete report"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-4 divide-x divide-gray-100 border-b border-gray-100">
                  {[
                    { label: 'Average', value: r.general_average ?? '—', big: true },
                    { label: 'Subjects', value: r.total_subjects },
                    { label: 'Passed', value: r.passed_subjects, color: 'text-green-600' },
                    { label: 'Failed', value: r.failed_subjects, color: 'text-red-600' },
                  ].map((s, i) => (
                    <div key={i} className="px-4 py-3 text-center">
                      <div className={`font-bold ${s.big ? 'text-2xl' : 'text-xl'} ${s.color || 'text-gray-800'}`}>{s.value}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* Remarks */}
                <div className="px-5 py-3 flex items-center justify-between">
                  <span className="text-sm text-gray-500">Overall Remarks</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${rm.color}`}>
                    {rm.label}
                  </span>
                </div>

                {r.class_rank && (
                  <div className="px-5 pb-3 text-center text-sm text-gray-500">
                    Class Rank: <span className="font-bold text-purple-600">#{r.class_rank}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <p className="text-sm text-gray-400 mt-4">Showing {filtered.length} of {reports.length} reports</p>
      )}
    </div>
  );
};

export default GradeReports;
