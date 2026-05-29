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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-[100] p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-xl max-h-[95vh] sm:max-h-[90vh] flex flex-col rounded-t-2xl sm:rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 shrink-0">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
            {authorInitial}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-slate-900">{isEditing ? 'Edit post' : 'Create post'}</h2>
            <p className="text-xs text-slate-500">Share news with students and teachers</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
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
                className="w-full text-lg font-semibold text-slate-900 placeholder-slate-400 border-0 border-b border-slate-100 focus:border-violet-400 focus:ring-0 px-0 py-2 bg-transparent"
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
                className="w-full text-[15px] text-slate-800 placeholder-slate-400 border border-slate-200 rounded-xl px-3 py-3 focus:outline-none focus:ring-2 focus:ring-violet-500/25 focus:border-violet-400 resize-none"
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
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-slate-200 text-sm font-semibold text-slate-600 hover:border-violet-300 hover:bg-violet-50/50 hover:text-violet-700 transition-colors"
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
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                      form.target_audience === opt.value
                        ? 'bg-violet-600 text-white border-violet-600'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-violet-300'
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
                        className={`px-2 py-1 rounded-md text-[10px] font-semibold border ${
                          (form.target_classrooms || []).includes(cls.id)
                            ? 'bg-violet-100 text-violet-800 border-violet-300'
                            : 'bg-white text-slate-500 border-slate-200'
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

          <div className="sticky bottom-0 flex gap-2 p-4 border-t border-slate-100 bg-white">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-sm font-semibold hover:bg-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-[2] py-2.5 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 disabled:opacity-60 flex items-center justify-center gap-2"
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
