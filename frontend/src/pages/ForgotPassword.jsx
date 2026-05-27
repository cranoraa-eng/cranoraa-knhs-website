import { Link, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

const ForgotPassword = () => {
  const navigate = useNavigate();

  const handleEmailReset = () => {
    Swal.fire({
      title: 'Reset via Email',
      html: `
        <p style="font-size:13px;color:#64748b;margin-bottom:16px;">
          Enter your registered email address and we'll send you a reset code.
        </p>
        <input
          id="swal-email"
          type="email"
          placeholder="your@email.com"
          class="swal2-input"
          style="font-size:14px;"
        />
      `,
      confirmButtonText: 'Send Reset Code',
      confirmButtonColor: '#7c3aed',
      showCancelButton: true,
      cancelButtonColor: '#64748b',
      customClass: { popup: 'rounded-[2rem]' },
      focusConfirm: false,
      showLoaderOnConfirm: true,
      preConfirm: async () => {
        const email = document.getElementById('swal-email').value.trim();
        if (!email) {
          Swal.showValidationMessage('Please enter your email address');
          return false;
        }
        try {
          // Dynamic import to avoid circular deps
          const { default: api } = await import('../utils/api');
          await api.post('/password-reset/', { email });
          return email;
        } catch (err) {
          const msg = err.response?.data?.error || err.response?.data?.message || 'Failed to send reset code.';
          Swal.showValidationMessage(msg);
          return false;
        }
      },
      allowOutsideClick: () => !Swal.isLoading(),
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        Swal.fire({
          icon: 'success',
          title: 'Code Sent!',
          text: `A reset code has been sent to ${result.value}. Check your inbox and spam folder.`,
          confirmButtonColor: '#7c3aed',
          confirmButtonText: 'Enter Code',
          customClass: { popup: 'rounded-[2rem]' },
        }).then(() => {
          navigate('/reset-password', { state: { email: result.value } });
        });
      }
    });
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center px-4 py-12 bg-[#0F071E]">
      {/* Background accents */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-violet-600/20 via-fuchsia-600/10 to-transparent rounded-full blur-[120px] -mr-64 -mt-64" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-indigo-600/20 rounded-full blur-[100px]" />
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      <div className="relative w-full max-w-sm">
        {/* Back link */}
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-8 text-sm font-bold transition-colors group"
        >
          <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Login
        </Link>

        <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-8 shadow-2xl shadow-black/40 ring-1 ring-white/5 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-500/[0.05] to-transparent pointer-events-none" />

          {/* Header */}
          <div className="text-center mb-8 relative">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full mb-6 shadow-[0_0_30px_rgba(139,92,246,0.3)] p-1.5 border-4 border-white/10">
              <img src="/icons/school-logo-source.png" alt="KNHS Logo" className="w-full h-full object-contain" />
            </div>
            <h1 className="text-2xl font-black text-white mb-2 tracking-tight uppercase leading-none">Forgot Password?</h1>
            <p className="text-[10px] text-violet-400 font-bold uppercase tracking-[0.2em]">Account Recovery</p>
          </div>

          {/* Info message */}
          <div className="relative space-y-5">
            {/* Key icon */}
            <div className="flex justify-center mb-2">
              <div className="w-14 h-14 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                <svg className="w-7 h-7 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>
            </div>

            {/* Main message */}
            <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-3">
              <p className="text-sm font-bold text-white leading-relaxed">
                Contact your teacher or visit the school office to request a password reset.
              </p>
              <p className="text-xs text-slate-400 leading-relaxed">
                Your teacher or admin will provide you with a temporary password. You'll be asked to change it on your next login.
              </p>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">or</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            {/* Email reset option */}
            <div className="text-center">
              <p className="text-xs text-slate-400 mb-3">
                If you have a registered email address, you can reset your password directly.
              </p>
              <button
                onClick={handleEmailReset}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/30 hover:border-violet-500/50 text-violet-300 hover:text-violet-200 rounded-xl text-xs font-black uppercase tracking-widest transition-all active:scale-95"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Reset via email
              </button>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-white/5 text-center">
            <p className="text-slate-600 font-bold text-[9px] uppercase tracking-[0.2em]">
              Kiwalan National High School • Data Privacy Protected
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
