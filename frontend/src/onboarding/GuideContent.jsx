/**
 * Renders tutorial / help copy with visual indicators.
 */
const GuideContent = ({ body, bullets, note, size = 'sm', className = '' }) => {
  const bodyClass = size === 'sm'
    ? 'text-sm font-medium leading-6 text-slate-600'
    : 'text-xs font-medium leading-5 text-slate-500';
  const bulletClass = size === 'sm'
    ? 'text-xs font-medium leading-5 text-slate-600'
    : 'text-[11px] font-medium leading-5 text-slate-500';

  return (
    <div className={className}>
      {body && <p className={bodyClass}>{body}</p>}
      {bullets?.length > 0 && (
        <ul className={`${body ? 'mt-2.5' : ''} space-y-1.5`}>
          {bullets.map((item, index) => (
            <li key={index} className="flex items-start gap-2">
              <svg className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              <span className={bulletClass}>{item}</span>
            </li>
          ))}
        </ul>
      )}
      {note && (
        <div className={`${body || bullets?.length ? 'mt-2.5' : ''} flex items-start gap-2 rounded-xl bg-violet-50 border border-violet-100 px-3 py-2`}>
          <svg className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 3a9 9 0 110 18 9 9 0 010-18z" />
          </svg>
          <p className="text-[11px] font-semibold leading-5 text-violet-700">{note}</p>
        </div>
      )}
    </div>
  );
};

export default GuideContent;
