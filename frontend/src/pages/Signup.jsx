import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import * as yup from 'yup';
import Swal from 'sweetalert2';

const signupSchema = yup.object().shape({
  username: yup.string().min(3, 'Username must be at least 3 characters').required('Username is required'),
  email: yup.string().email('Invalid email address').required('Email is required'),
  firstName: yup.string().required('First name is required'),
  lastName: yup.string().required('Last name is required'),
  password: yup.string()
    .min(8, 'Password must be at least 8 characters')
    .matches(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .matches(/[a-z]/, 'Password must contain at least one lowercase letter')
    .matches(/[0-9]/, 'Password must contain at least one digit')
    .matches(/[^A-Za-z0-9]/, 'Password must contain at least one special character')
    .required('Password is required'),
  confirmPassword: yup.string().oneOf([yup.ref('password'), null], 'Passwords must match').required('Please confirm your password'),
  role: yup.string().required('Please select an account type'),
});

const Signup = () => {
  const { user } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('student');
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFieldErrors({});

    try {
      await signupSchema.validate(
        { username, email, firstName, lastName, password, confirmPassword, role },
        { abortEarly: false }
      );
    } catch (validationError) {
      const errors = {};
      if (validationError.inner) {
        validationError.inner.forEach((err) => {
          errors[err.path] = err.message;
        });
      }
      setFieldErrors(errors);
      return;
    }

    setLoading(true);

    try {
      const payload = {
        username,
        email,
        password,
        role,
        first_name: firstName,
        last_name: lastName,
      };

      await api.post('/register/', payload);
      setLoading(false);
      Swal.fire({
        icon: 'success',
        title: 'Account Created!',
        text: 'Your account has been created successfully. Please check your email for the OTP verification code.',
        confirmButtonText: 'Verify Email',
        confirmButtonColor: '#9333ea',
      }).then(() => {
        navigate('/verify-otp', { state: { email } });
      });
    } catch (err) {
      setLoading(false);
      const message = err.response?.data?.error || 'An unexpected error occurred. Please try again.';
      Swal.fire({
        icon: 'error',
        title: 'Registration Failed',
        text: message,
        confirmButtonText: 'OK',
        confirmButtonColor: '#9333ea',
      });
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center px-4 py-12">
      {/* Mesh Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />
          <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-violet-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000" />
        </div>
      </div>
      
      <div className="relative w-full max-w-xl rounded-[2.5rem] border border-white/10 bg-white/95 p-8 md:p-12 shadow-2xl backdrop-blur-xl">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-purple-100 rounded-3xl mb-6 shadow-inner">
            <svg className="w-10 h-10 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h1 className="text-4xl font-black text-slate-900 mb-2 tracking-tight">Create Account</h1>
          <p className="text-slate-500 font-medium">Join the Kiwalan NHS School Portal</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* First Name */}
            <div>
              <label className="block text-slate-700 text-sm font-bold mb-2 ml-1">First Name</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Juan"
                className={`w-full px-5 py-4 bg-slate-50 border-2 rounded-2xl focus:outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all ${
                  fieldErrors.firstName ? 'border-red-500 bg-red-50' : 'border-slate-100'
                }`}
              />
              {fieldErrors.firstName && <p className="text-red-500 text-xs mt-2 ml-1 font-bold">{fieldErrors.firstName}</p>}
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-slate-700 text-sm font-bold mb-2 ml-1">Last Name</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Dela Cruz"
                className={`w-full px-5 py-4 bg-slate-50 border-2 rounded-2xl focus:outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all ${
                  fieldErrors.lastName ? 'border-red-500 bg-red-50' : 'border-slate-100'
                }`}
              />
              {fieldErrors.lastName && <p className="text-red-500 text-xs mt-2 ml-1 font-bold">{fieldErrors.lastName}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Username */}
            <div>
              <label className="block text-slate-700 text-sm font-bold mb-2 ml-1">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="jdelacruz"
                className={`w-full px-5 py-4 bg-slate-50 border-2 rounded-2xl focus:outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all ${
                  fieldErrors.username ? 'border-red-500 bg-red-50' : 'border-slate-100'
                }`}
              />
              {fieldErrors.username && <p className="text-red-500 text-xs mt-2 ml-1 font-bold">{fieldErrors.username}</p>}
            </div>

            {/* Role */}
            <div>
              <label className="block text-slate-700 text-sm font-bold mb-2 ml-1">I am a...</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all appearance-none cursor-pointer"
              >
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
              </select>
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-slate-700 text-sm font-bold mb-2 ml-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="juan.delacruz@example.com"
              className={`w-full px-5 py-4 bg-slate-50 border-2 rounded-2xl focus:outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all ${
                fieldErrors.email ? 'border-red-500 bg-red-50' : 'border-slate-100'
              }`}
            />
            {fieldErrors.email && <p className="text-red-500 text-xs mt-2 ml-1 font-bold">{fieldErrors.email}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Password */}
            <div>
              <label className="block text-slate-700 text-sm font-bold mb-2 ml-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full px-5 py-4 bg-slate-50 border-2 rounded-2xl focus:outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all ${
                    fieldErrors.password ? 'border-red-500 bg-red-50' : 'border-slate-100'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-purple-600 transition-colors"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268-2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  )}
                </button>
              </div>
              {fieldErrors.password && <p className="text-red-500 text-xs mt-2 ml-1 font-bold">{fieldErrors.password}</p>}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-slate-700 text-sm font-bold mb-2 ml-1">Confirm</label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className={`w-full px-5 py-4 bg-slate-50 border-2 rounded-2xl focus:outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all ${
                  fieldErrors.confirmPassword ? 'border-red-500 bg-red-50' : 'border-slate-100'
                }`}
              />
              {fieldErrors.confirmPassword && <p className="text-red-500 text-xs mt-2 ml-1 font-bold">{fieldErrors.confirmPassword}</p>}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-black py-5 rounded-2xl transition-all shadow-xl shadow-purple-200 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3 text-lg"
          >
            {loading ? (
              <svg className="animate-spin h-6 w-6 text-white" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-slate-500 font-bold mt-10">
          Already have an account?{' '}
          <Link to="/login" className="text-purple-600 hover:text-purple-700 decoration-2 underline-offset-4 hover:underline">
            Sign in here
          </Link>
        </p>
      </div>

      <style>{`
        @keyframes blob {
          0% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0, 0) scale(1); }
        }
        .animate-blob { animation: blob 7s infinite; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
      `}</style>
    </div>
  );
};

export default Signup;
