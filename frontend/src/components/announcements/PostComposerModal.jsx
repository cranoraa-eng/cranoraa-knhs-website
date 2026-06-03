import { useRef } from 'react';

const CATEGORY_OPTIONS = [
  { value: 'general', label: 'General' },
  { value: 'academic', label: 'Academic' },
  { value: 'events', label: 'Events' },
  { value: 'holiday', label: 'Holiday' },
  { value: 'emergency', label: 'Emergency' },
  { value: 'system_update', label: 'System' },
];

const isImageFile = (file) =>
  file.type?.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp)$/i.test(file.name);

const PostComposerModal = ({
  open,
  onClose,
  form,
  setForm,
  isEditing,
  saving,
  onSubmit,
  classrooms = [],
  existingAttachments = [],
  onRemoveExistingAttachment,
  authorInitial = 'A',
}) => {
  const fileInputRef = useRef(null);
  if (!open) return null;

  const addFiles = (fileList) => {
    const incoming = Array.from(fileList || []);
    if (!incoming.length) return;
    setForm((f) => ({
      ...f,
      attachments: [...(f.attachments || []), ...incoming],
    }));
  };

  const removeNewFile = (index) => {
    setForm((f) => ({
      ...f,
      attachments: f.attachments.filter((_, i) => i !== index),
    }));
  };

  const toggleClassroom = (id) => {
    setForm((f) => {
      const current = f.target_classrooms || [];
      const updated = current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
      return { ...f, target_classrooms: updated };
    });
  };

  const previews = (form.attachments || []).map((file, i) => ({
    key: `new-${i}-${file.name}`,
    file,
    isImage: isImageFile(file),
    onRemove: () => removeNewFile(i),
  }));

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-[9999] p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-xl max-h-[95vh] sm:max-h-[90vh] flex flex-col rounded-t-sm sm:rounded-sm shadow-2xl border border-gray-300 overflow-hidden">
        <div className="bg-[#5e2a84] flex items-center justify-between px-5 py-3 flex-shrink-0 border-b-2 border-purple-900">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-7 h-7 rounded-full bg-white/20 border border-white/30 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"/>
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-black text-white uppercase tracking-widest leading-none">{isEditing ? 'Edit Announcement' : 'Create Announcement'}</h2>
              <p className="text-purple-200 text-[10px] mt-0.5 font-medium uppercase tracking-wide">Share with students and teachers</p>
            </div>
          </div>
          <button type="button" onClick={onClose}
            className="ml-4 w-7 h-7 flex items-center justify-center rounded text-white/60 hover:bg-white/20 hover:text-white transition-all"
            aria-label="Close">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <form onSubmit={onSubmit} className="flex-1 overflow-y-auto scrollbar-none">
          <div className="p-4 space-y-4">
            <div>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Post title"
                required
                maxLength={100}
                className="w-full text-base font-semibold text-gray-900 placeholder-gray-400 border-0 border-b-2 border-gray-200 focus:border-purple-500 focus:ring-0 px-0 py-2 bg-transparent"
              />
              <p className="text-right text-[10px] text-slate-400 mt-0.5">{form.title.length}/100</p>
            </div>

            <div>
              <textarea
                value={form.content}
                onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                placeholder="What do you want to share?"
                required
                rows={5}
                className="w-full text-sm text-gray-800 placeholder-gray-400 border border-gray-300 rounded-sm px-3 py-3 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 resize-none"
              />
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-600 mb-2">Photos & files</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.gif,.webp,.pdf"
                multiple
                className="hidden"
                onChange={(e) => {
                  addFiles(e.target.files);
                  e.target.value = '';
                }}
              />
              {(previews.length > 0 || existingAttachments.length > 0) && (
                <div className="grid grid-cols-3 gap-2 mb-2">
                  {existingAttachments.map((att) => (
                    <div key={`existing-${att.id}`} className="relative aspect-square rounded-lg border border-slate-200 overflow-hidden bg-slate-50">
                      {att.is_image ? (
                        <img src={att.url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center">
                          <svg className="w-6 h-6 text-slate-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                          <span className="text-[9px] text-slate-500 truncate w-full">{att.filename}</span>
                        </div>
                      )}
                      {onRemoveExistingAttachment && (
                        <button
                          type="button"
                          onClick={() => onRemoveExistingAttachment(att.id)}
                          className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center text-xs"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                  {previews.map(({ key, file, isImage, onRemove }) => (
                    <div key={key} className="relative aspect-square rounded-lg border border-violet-200 overflow-hidden bg-violet-50">
                      {isImage ? (
                        <img src={URL.createObjectURL(file)} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center">
                          <svg className="w-6 h-6 text-violet-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                          <span className="text-[9px] text-slate-600 truncate w-full">{file.name}</span>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={onRemove}
                        className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center text-xs"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-300 text-sm font-semibold text-gray-600 hover:border-purple-400 hover:bg-purple-50/50 hover:text-purple-700 transition-colors rounded-sm"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Add photos or PDFs (multiple allowed)
              </button>
            </div>

            <div className="rounded-xl border border-slate-200 p-3 space-y-3 bg-slate-50/50">
              <p className="text-xs font-semibold text-slate-700">Who can see this?</p>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: 'all', label: 'Everyone' },
                  { value: 'students', label: 'Students' },
                  { value: 'teachers', label: 'Teachers' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, target_audience: opt.value }))}
                    className={`px-3 py-1.5 text-xs font-semibold border transition-colors rounded-sm ${
                      form.target_audience === opt.value
                        ? 'bg-[#5e2a84] text-white border-purple-700'
                        : 'bg-white text-gray-600 border-gray-300 hover:border-purple-400'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              {classrooms.length > 0 && (
                <div>
                  <p className="text-[11px] text-slate-500 mb-1.5">Limit to sections (optional)</p>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                    {classrooms.map((cls) => (
                      <button
                        key={cls.id}
                        type="button"
                        onClick={() => toggleClassroom(cls.id)}
                        className={`px-2 py-1 text-[10px] font-semibold border rounded-sm ${
                          (form.target_classrooms || []).includes(cls.id)
                            ? 'bg-purple-100 text-purple-800 border-purple-300'
                            : 'bg-white text-gray-500 border-gray-200'
                        }`}
                      >
                        {cls.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <details className="rounded-xl border border-slate-200 group">
              <summary className="px-3 py-2.5 text-xs font-semibold text-slate-600 cursor-pointer list-none flex items-center justify-between">
                More options
                <span className="text-slate-400 group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <div className="px-3 pb-3 pt-1 space-y-3 border-t border-slate-100">
                <div className="grid grid-cols-2 gap-2">
                  <label className="text-[11px] font-medium text-slate-500">Category</label>
                  <label className="text-[11px] font-medium text-slate-500">Priority</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                    className="px-2 py-2 rounded-lg border border-slate-200 text-sm bg-white"
                  >
                    {CATEGORY_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
                    className="px-2 py-2 rounded-lg border border-slate-200 text-sm bg-white"
                  >
                    <option value="info">Normal</option>
                    <option value="critical">Urgent</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-medium text-slate-500 block mb-1">Status</label>
                    <select
                      value={form.status}
                      onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                      className="w-full px-2 py-2 rounded-lg border border-slate-200 text-sm bg-white"
                    >
                      <option value="live">Publish now</option>
                      <option value="draft">Save as draft</option>
                    </select>
                  </div>
                  <div className="flex flex-col justify-end gap-2">
                    <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.is_pinned}
                        onChange={(e) => setForm((f) => ({ ...f, is_pinned: e.target.checked }))}
                        className="rounded border-slate-300 text-violet-600"
                      />
                      Pin to top
                    </label>
                    <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.is_public}
                        onChange={(e) => setForm((f) => ({ ...f, is_public: e.target.checked }))}
                        className="rounded border-slate-300 text-violet-600"
                      />
                      Show on public site
                    </label>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-medium text-slate-500 block mb-1">Event date</label>
                    <input
                      type="datetime-local"
                      value={form.event_date}
                      onChange={(e) => setForm((f) => ({ ...f, event_date: e.target.value }))}
                      className="w-full px-2 py-2 rounded-lg border border-slate-200 text-xs bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-slate-500 block mb-1">Expires</label>
                    <input
                      type="datetime-local"
                      value={form.end_date}
                      onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))}
                      className="w-full px-2 py-2 rounded-lg border border-slate-200 text-xs bg-white"
                    />
                  </div>
                </div>
              </div>
            </details>
          </div>

          <div className="sticky bottom-0 flex gap-2 px-6 py-4 border-t border-gray-200 bg-gray-50 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-white text-gray-700 text-xs font-black uppercase tracking-widest border border-gray-300 hover:bg-gray-100 rounded-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-[2] py-2.5 bg-[#5e2a84] text-white text-xs font-black uppercase tracking-widest hover:bg-purple-700 disabled:opacity-60 flex items-center justify-center gap-2 rounded-sm"
            >
              {saving ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : isEditing ? (
                'Save changes'
              ) : (
                'Post'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PostComposerModal;
