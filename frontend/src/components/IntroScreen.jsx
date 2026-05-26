import { useState, useEffect } from 'react';

const IntroScreen = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    const hasSeenIntro = sessionStorage.getItem('hasSeenIntro');
    if (!hasSeenIntro) {
      setShouldRender(true);
      // Auto-hide after 3 seconds
      const timer = setTimeout(() => {
        handleClose();
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    sessionStorage.setItem('hasSeenIntro', 'true');
    // Remove from DOM after animation
    setTimeout(() => {
      setShouldRender(false);
    }, 500);
  };

  if (!shouldRender) return null;

  return (
    <div 
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-[#0F071E] transition-opacity duration-700 ease-in-out ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
    >
      {/* SaaS-style Background Accents */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-violet-600/20 via-fuchsia-600/10 to-transparent rounded-full blur-[120px] -mr-64 -mt-64" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-indigo-600/20 rounded-full blur-[100px]" />
      
      <div className="relative flex flex-col items-center text-center px-6">
        {/* Animated Logo Container */}
        <div className="relative mb-8 group">
          <div className="absolute -inset-4 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-full blur-xl opacity-40 group-hover:opacity-60 animate-pulse transition-opacity" />
          <div className="relative w-24 h-24 md:w-32 md:h-32 bg-white rounded-full shadow-2xl flex items-center justify-center p-1 transform rotate-3 hover:rotate-0 transition-transform duration-500 border-4 border-white/20">
            <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden p-3">
               <img src="/icons/school-logo-source.png" alt="KNHS Logo" className="w-full h-full object-contain" />
            </div>
          </div>
        </div>

        {/* Text Content */}
        <div className="space-y-4 animate-fade-in-up">
          <h1 className="text-3xl md:text-5xl font-black text-white tracking-tighter uppercase leading-none">
            KNHS <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-300">Portal</span>
          </h1>
          <p className="text-slate-400 text-xs md:text-sm font-bold uppercase tracking-[0.3em] max-w-xs mx-auto">
            Innovating Education Through Intelligence
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mt-12 w-48 h-1 bg-white/5 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 animate-progress" />
        </div>

        {/* Skip Button (Optional but good for UX) */}
        <button 
          onClick={handleClose}
          className="mt-8 text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-colors"
        >
          Skip Intro
        </button>
      </div>

      <style jsx>{`
        @keyframes progress {
          0% { width: 0%; }
          100% { width: 100%; }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-progress {
          animation: progress 3s ease-in-out forwards;
        }
        .animate-fade-in-up {
          animation: fadeInUp 1s ease-out forwards;
          animation-delay: 0.3s;
          opacity: 0;
        }
      `}</style>
    </div>
  );
};

export default IntroScreen;
