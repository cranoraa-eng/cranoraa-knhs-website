import { useState, useEffect } from 'react';

const ChevronIcon = ({ direction }) => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    {direction === 'left' ? (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
    ) : (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
    )}
  </svg>
);

/**
 * Carousel for post images and file attachments with < > navigation.
 * @param {{ items: { url: string, filename?: string, is_image?: boolean }[], onImageClick?: (url: string, index: number) => void, maxHeight?: string, className?: string }} props
 */
const PostMediaCarousel = ({
  items = [],
  onImageClick,
  maxHeight = '420px',
  className = '',
}) => {
  const [index, setIndex] = useState(0);
  const hasMultiple = items.length > 1;
  const current = items[index];

  useEffect(() => {
    setIndex(0);
  }, [items.length, items[0]?.url]);

  if (!items.length || !current) return null;

  const goPrev = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIndex((i) => (i - 1 + items.length) % items.length);
  };

  const goNext = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIndex((i) => (i + 1) % items.length);
  };

  const navBtnClass =
    'absolute top-1/2 -translate-y-1/2 z-10 w-9 h-9 md:w-10 md:h-10 rounded-full bg-white/95 text-slate-800 shadow-md border border-slate-200/80 flex items-center justify-center hover:bg-white hover:scale-105 active:scale-95 transition-all no-min';

  return (
    <div className={`relative bg-slate-100 overflow-hidden ${className}`}>
      <div className="relative w-full" style={{ minHeight: current.is_image ? undefined : '140px' }}>
        {current.is_image ? (
          <button
            type="button"
            onClick={() => onImageClick?.(current.url, index)}
            className="block w-full no-min"
          >
            <img
              src={current.url}
              alt={current.filename || 'Post image'}
              className="w-full object-cover object-center bg-slate-200"
              style={{ maxHeight }}
            />
          </button>
        ) : (
          <a
            href={current.url}
            target="_blank"
            rel="noreferrer"
            className="flex flex-col items-center justify-center gap-2 px-6 py-10 bg-slate-50 hover:bg-slate-100 transition-colors"
            style={{ minHeight: '140px' }}
          >
            <div className="w-14 h-14 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-sm">
              <svg className="w-7 h-7 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-slate-800 truncate max-w-[90%]">{current.filename || 'Download file'}</p>
            <p className="text-xs text-slate-500">Tap to open or download</p>
          </a>
        )}
      </div>

      {hasMultiple && (
        <>
          <button
            type="button"
            onClick={goPrev}
            className={`${navBtnClass} left-2 md:left-3`}
            aria-label="Previous"
          >
            <ChevronIcon direction="left" />
          </button>
          <button
            type="button"
            onClick={goNext}
            className={`${navBtnClass} right-2 md:right-3`}
            aria-label="Next"
          >
            <ChevronIcon direction="right" />
          </button>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/55 text-white text-[11px] font-semibold tabular-nums pointer-events-none">
            {index + 1} / {items.length}
          </div>
        </>
      )}
    </div>
  );
};

export default PostMediaCarousel;
