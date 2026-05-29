/**
 * Renders tutorial / help copy: summary, numbered steps, and optional note.
 */
const GuideContent = ({ body, bullets, note, size = 'sm', className = '' }) => {
  const bodyClass = size === 'sm'
    ? 'text-sm font-medium leading-6 text-slate-600'
    : 'text-xs font-medium leading-6 text-slate-600';
  const bulletClass = size === 'sm'
    ? 'text-xs font-medium leading-5 text-slate-600'
    : 'text-xs font-medium leading-5 text-slate-600';
  const noteClass = 'text-[11px] font-semibold leading-5 text-violet-700 bg-violet-50 border border-violet-100 rounded-xl px-3 py-2';

  return (
    <div className={className}>
      {body && <p className={bodyClass}>{body}</p>}
      {bullets?.length > 0 && (
        <ol className={`${body ? 'mt-3' : ''} space-y-2 list-decimal pl-4 marker:font-black marker:text-violet-500`}>
          {bullets.map((item, index) => (
            <li key={index} className={bulletClass}>{item}</li>
          ))}
        </ol>
      )}
      {note && <p className={`${body || bullets?.length ? 'mt-3' : ''} ${noteClass}`}>{note}</p>}
    </div>
  );
};

export default GuideContent;
