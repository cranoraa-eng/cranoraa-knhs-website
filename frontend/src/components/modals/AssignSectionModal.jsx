import { useState, useEffect, useRef, useMemo } from 'react';
import { X } from 'lucide-react';
import { Button } from '../components/ui';

export function AssignSectionModal({
  isOpen,
  onClose,
  onConfirm,
  student,
  classrooms,
  loadingClassrooms,
  title = 'Assign Section',
  confirmText = 'Assign',
}) {
  const [selectedClassroomId, setSelectedClassroomId] = useState('');
  const [error, setError] = useState('');
  const selectRef = useRef(null);

  // Reset when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setSelectedClassroomId('');
      setError('');
      setTimeout(() => selectRef.current?.focus(), 0);
    } else {
      setSelectedClassroomId('');
      setError('');
    }
  }, [isOpen]);

  // Filter classrooms by student's grade level if available
  const filteredClassrooms = useMemo(() => {
    if (!student?.profile?.grade_level) return classrooms || [];
    return (classrooms || []).filter(c => String(c.grade_level) === String(student.profile.grade_level));
  }, [classrooms, student?.profile?.grade_level]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedClassroomId) {
      setError('Please select a section');
      return;
    }
    onConfirm(selectedClassroomId);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10010] bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white w-full max-w-md border border-gray-300 shadow-2xl rounded-sm flex flex-col max-h-[92vh]" onClick={e => e.stopPropagation()}>
        <div className="bg-[#5e2a84] flex items-center justify-between px-5 py-3 flex-shrink-0 border-b-2 border-violet-900">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-7 h-7 rounded-full bg-white/20 border border-white/30 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a7 7 0 0112 0h14a7 7 0 01-7 7H3a7 7 0 01-7-7z" />
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-black text-white uppercase tracking-widest leading-none">{title}</h2>
              {student && (
                <p className="text-violet-200 text-[10px] mt-0.5 font-medium uppercase tracking-wide">{student.first_name} {student.last_name}</p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="ml-4 w-7 h-7 flex items-center justify-center rounded text-white/60 hover:bg-white/20 hover:text-white transition-all"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 overflow-y-auto flex-1 space-y-4">
          <div>
            <label className="block text-xs font-black text-gray-700 uppercase tracking-wider mb-1.5">Select Section</label>
            <select
              ref={selectRef}
              value={selectedClassroomId}
              onChange={e => { setSelectedClassroomId(e.target.value); setError(''); }}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-sm bg-white text-sm focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500"
            >
              <option value="">Choose a section...</option>
              {filteredClassrooms.map(c => {
                const count = c.student_count ?? 0;
                const cap = c.capacity ?? 40;
                const isFull = count >= cap;
                return (
                  <option key={c.id} value={c.id} disabled={isFull}>
                    {c.name} ({count}/{cap}){isFull ? ' — Full' : ''}
                  </option>
                );
              })}
            </select>
            {filteredClassrooms.length === 0 && (
              <p className="text-[10px] text-amber-600 mt-1.5">No sections available for this grade level</p>
            )}
          </div>
          {error && (
            <div className="flex items-center gap-1.5 px-2.5 py-2 bg-red-50 border border-red-200 rounded-sm text-red-700 text-[10px] font-medium">
              <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM8.707 7.293a1 1 0 00-1.414 1.414L10.586 10l-3.293 3.293a1 1 0 101.414 1.414L10 11.414l3.293 3.293a1 1 0 001.414-1.414L11.414 10l3.293-3.293a1 1 0 00-1.414-1.414L10 8.586 6.707 5.293a1 1 0 00-1.414 1.414L8.586 10l-3.293 3.293z" clipRule="evenodd"/></svg>
              {error}
            </div>
          )}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-200 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 bg-white text-gray-700 text-xs font-black uppercase tracking-widest border border-gray-300 hover:bg-gray-100 rounded-sm transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedClassroomId || loadingClassrooms}
              className="px-6 py-2.5 bg-[#5e2a84] text-white text-xs font-black uppercase tracking-widest hover:bg-violet-700 rounded-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingClassrooms ? 'Loading...' : confirmText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

import { useMemo } from 'react';