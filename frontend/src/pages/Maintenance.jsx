import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Maintenance = ({ message }) => {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();

  const handleAction = () => {
    if (user) {
      signOut();
      navigate('/login');
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
      <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl p-10 text-center space-y-8 border border-rose-100 relative overflow-hidden">
        {/* Background Accent */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-rose-50 rounded-full blur-3xl opacity-50" />
        
        <div className="relative">
          <div className="w-24 h-24 bg-rose-50 rounded-[2rem] flex items-center justify-center mx-auto text-5xl shadow-inner animate-bounce">
            🚧
          </div>
          
          <div className="mt-8 space-y-3">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-tight">
              Portal Under <br />
              <span className="text-rose-600">Maintenance</span>
            </h1>
            <div className="h-1 w-12 bg-rose-200 mx-auto rounded-full" />
            <p className="text-slate-500 font-medium leading-relaxed px-2">
              {message || 'We are currently performing scheduled improvements to the Kiwalan NHS School Portal. Please check back in a few moments.'}
            </p>
          </div>
        </div>

        <div className="space-y-4 relative">
          <button
            onClick={handleAction}
            className="w-full py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-black transition-all shadow-xl shadow-slate-200 active:scale-[0.98]"
          >
            {user ? 'Sign Out and Exit' : 'Back to Home'}
          </button>
          
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
            Official School Portal · System v2.0
          </p>
        </div>
      </div>
    </div>
  );
};

export default Maintenance;
