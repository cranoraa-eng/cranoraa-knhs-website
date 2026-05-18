import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { isAuthenticated, getUser } from '../utils/auth';
import api from '../utils/api';
import toast from 'react-hot-toast';
import * as yup from 'yup';
import Swal from 'sweetalert2';

const accountSchema = yup.object().shape({
  username: yup.string().min(3, 'Username must be at least 3 characters').required('Username is required'),
  email: yup.string().email('Invalid email address').required('Email is required'),
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

const signupSchema = yup.object().shape({
  username: yup.string().min(3, 'Username must be at least 3 characters').required('Username is required'),
  email: yup.string().email('Invalid email address').required('Email is required'),
  password: yup.string()
    .min(8, 'Password must be at least 8 characters')
    .matches(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .matches(/[a-z]/, 'Password must contain at least one lowercase letter')
    .matches(/[0-9]/, 'Password must contain at least one digit')
    .matches(/[^A-Za-z0-9]/, 'Password must contain at least one special character')
    .required('Password is required'),
  confirmPassword: yup.string().oneOf([yup.ref('password'), null], 'Passwords must match').required('Please confirm your password'),
  role: yup.string().required('Please select an account type'),
  firstName: yup.string(),
  lastName: yup.string(),
  sex: yup.string(),
  birthDate: yup.string(),
});

const Signup = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('student');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [step, setStep] = useState(1);
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated()) {
      const user = getUser();
      const redirectPath = user?.role === 'admin' ? '/dashboard' : '/dashboard';
      navigate(redirectPath);
    }
  }, [navigate]);

  // Student-specific fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [sex, setSex] = useState('');
  const [state, setState] = useState('');
  const [nationality, setNationality] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [motherName, setMotherName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [contactInfo, setContactInfo] = useState('');

  const checkPasswordStrength = (pwd) => {
    let strength = 0;
    if (pwd.length >= 8) strength += 1;
    if (pwd.match(/[A-Z]/)) strength += 1;
    if (pwd.match(/[a-z]/)) strength += 1;
    if (pwd.match(/[0-9]/)) strength += 1;
    if (pwd.match(/[^A-Za-z0-9]/)) strength += 1;
    setPasswordStrength(strength);
  };

  const handleNextStep = async () => {
    setError('');
    setFieldErrors({});

    // Validate step 1 fields using accountSchema
    try {
      await accountSchema.validate(
        { username, email, password, confirmPassword, role },
        { abortEarly: false }
      );
    } catch (validationError) {
      const errors = {};
      if (validationError.inner && Array.isArray(validationError.inner)) {
        validationError.inner.forEach((err) => {
          errors[err.path] = err.message;
        });
      }
      setFieldErrors(errors);
      return;
    }

    setStep(2);
  };

  const handleBackStep = () => {
    setStep(1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    console.log('Submitting with:', { username, email, password, confirmPassword, firstName, lastName, sex, birthDate, role });

    // Manual validation for student-specific fields
    const errors = {};
    if (role === 'student') {
      if (!firstName || firstName.trim() === '') {
        errors.firstName = 'First name is required';
      }
      if (!lastName || lastName.trim() === '') {
        errors.lastName = 'Surname is required';
      }
      if (!sex) {
        errors.sex = 'Sex is required';
      }
      if (!birthDate) {
        errors.birthDate = 'Birth date is required';
      }
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    try {
      await signupSchema.validate(
        { username, email, password, confirmPassword, firstName, lastName, sex, birthDate, role },
        { abortEarly: false }
      );
    } catch (validationError) {
      console.error('Validation error:', validationError);
      if (validationError.inner && Array.isArray(validationError.inner)) {
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

      // Add student profile data if registering as student
      if (role === 'student') {
        payload.profile = {
          sex,
          state,
          nationality,
          father_name: fatherName,
          mother_name: motherName,
          date_of_birth: birthDate,
          contact_information: contactInfo,
        };
      }

      console.log('Sending payload:', payload);

      const response = await api.post('/register/', payload);
      setLoading(false);
      Swal.fire({
        icon: 'success',
        title: 'Account Created!',
        text: 'Your account has been created successfully. Please check your email for the OTP verification code.',
        confirmButtonText: 'Verify Email',
      }).then(() => {
        navigate('/verify-otp', { state: { email } });
      });
    } catch (err) {
      console.error('Registration error:', err);
      setLoading(false);
      if (err.response) {
        if (err.response.status === 404) {
          Swal.fire({
            icon: 'error',
            title: 'Registration Service Unavailable',
            text: 'The registration service is currently unavailable. Please try again later.',
            confirmButtonText: 'OK',
          });
        } else if (err.response.status === 400) {
          Swal.fire({
            icon: 'error',
            title: 'Invalid Data Provided',
            text: err.response.data.error || 'Please check your input and try again.',
            confirmButtonText: 'OK',
          });
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Registration Failed',
            text: 'An unexpected error occurred. Please try again.',
            confirmButtonText: 'OK',
          });
        }
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Network Error',
          text: 'Please check your internet connection and try again.',
          confirmButtonText: 'OK',
        });
      }
    }
  };

  return (
    <div className="auth-page min-h-screen relative overflow-hidden flex items-center justify-center px-4 py-10">
      {/* Mesh Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-0 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-violet-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
        </div>
      </div>
      
      <div className="relative w-full max-w-2xl rounded-2xl border border-violet-100 bg-white p-10 shadow-2xl shadow-violet-900/20 backdrop-blur-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
            <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Create Portal Account</h1>
          <p className="text-gray-500 text-sm mb-2">For existing students and teachers of Kiwalan National High School</p>
          <p className="text-gray-400 text-xs">
            New students? <Link to="/enroll" className="text-purple-600 hover:text-purple-700 font-semibold">Apply for enrollment here</Link>
          </p>
        </div>

        {/* Progress Stepper */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-4">
            <div className={`flex items-center ${step === 1 ? 'text-purple-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm ${step === 1 ? 'bg-purple-600 text-white' : 'bg-gray-200'}`}>
                1
              </div>
              <span className="ml-2 text-sm font-medium">Account</span>
            </div>
            <div className={`w-16 h-1 ${step === 2 ? 'bg-purple-600' : 'bg-gray-200'}`}></div>
            <div className={`flex items-center ${step === 2 ? 'text-purple-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm ${step === 2 ? 'bg-purple-600 text-white' : 'bg-gray-200'}`}>
                2
              </div>
              <span className="ml-2 text-sm font-medium">Personal Info</span>
            </div>
          </div>
        </div>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Step 1: Account Details */}
          {step === 1 && (
            <div className="animate-fadeIn">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">Account Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-gray-700 text-sm font-semibold">
                      Username
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        Swal.fire({
                          title: 'Username Tips',
                          html: `
                            <div class="text-left text-sm text-gray-600 space-y-2">
                              <p class="font-semibold text-gray-800 mb-2">Choose a username that:</p>
                              <ul class="space-y-1">
                                <li class="flex items-center"><span class="text-green-500 mr-2">✓</span> Is easy to remember</li>
                                <li class="flex items-center"><span class="text-green-500 mr-2">✓</span> Contains at least 3 characters</li>
                                <li class="flex items-center"><span class="text-green-500 mr-2">✓</span> Doesn't include personal info (avoid birth year)</li>
                                <li class="flex items-center"><span class="text-green-500 mr-2">✓</span> Is appropriate for school use</li>
                              </ul>
                              <p class="mt-3 text-xs text-gray-500 italic">Your username will be visible to teachers and classmates.</p>
                            </div>
                          `,
                          icon: 'info',
                          confirmButtonText: 'Got it',
                          customClass: {
                            popup: 'bg-white rounded-xl shadow-2xl',
                            title: 'text-gray-800 text-xl font-bold',
                            confirmButton: 'bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-6 rounded-lg transition-all duration-200',
                          },
                          buttonsStyling: false,
                        });
                      }}
                      className="text-purple-600 hover:text-purple-700 text-xs font-semibold"
                    >
                      Tips
                    </button>
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      setFieldErrors({ ...fieldErrors, username: '' });
                    }}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all ${
                      fieldErrors.username ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Choose a username"
                    required
                  />
                  {fieldErrors.username && (
                    <p className="text-red-500 text-xs mt-1">{fieldErrors.username}</p>
                  )}
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-gray-700 text-sm font-semibold">
                      Email Address
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        Swal.fire({
                          title: 'Email Information',
                          html: `
                            <div class="text-left text-sm text-gray-600 space-y-2">
                              <p class="font-semibold text-gray-800 mb-2">Important notes:</p>
                              <ul class="space-y-1">
                                <li class="flex items-start"><span class="text-purple-600 mr-2">•</span> Use a valid email you check regularly</li>
                                <li class="flex items-start"><span class="text-purple-600 mr-2">•</span> School communications will be sent here</li>
                                <li class="flex items-start"><span class="text-purple-600 mr-2">•</span> Use your personal email, not a school-provided one</li>
                                <li class="flex items-start"><span class="text-purple-600 mr-2">•</span> This will be your login username</li>
                              </ul>
                              <p class="mt-3 text-xs text-gray-500 italic">Make sure your email is correct before proceeding.</p>
                            </div>
                          `,
                          icon: 'info',
                          confirmButtonText: 'Got it',
                          customClass: {
                            popup: 'bg-white rounded-xl shadow-2xl',
                            title: 'text-gray-800 text-xl font-bold',
                            confirmButton: 'bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-6 rounded-lg transition-all duration-200',
                          },
                          buttonsStyling: false,
                        });
                      }}
                      className="text-purple-600 hover:text-purple-700 text-xs font-semibold"
                    >
                      Why is this important?
                    </button>
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setFieldErrors({ ...fieldErrors, email: '' });
                    }}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all ${
                      fieldErrors.email ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter your email"
                    required
                  />
                  {fieldErrors.email && (
                    <p className="text-red-500 text-xs mt-1">{fieldErrors.email}</p>
                  )}
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-gray-700 text-sm font-semibold">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        Swal.fire({
                          title: 'Password Requirements',
                          html: `
                            <div class="text-left text-sm text-gray-600 space-y-2">
                              <p class="font-semibold text-gray-800 mb-3">Your password must contain:</p>
                              <ul class="space-y-1">
                                <li class="flex items-center"><span class="text-green-500 mr-2">✓</span> At least 8 characters</li>
                                <li class="flex items-center"><span class="text-green-500 mr-2">✓</span> At least 1 uppercase letter (A-Z)</li>
                                <li class="flex items-center"><span class="text-green-500 mr-2">✓</span> At least 1 lowercase letter (a-z)</li>
                                <li class="flex items-center"><span class="text-green-500 mr-2">✓</span> At least 1 digit (0-9)</li>
                                <li class="flex items-center"><span class="text-green-500 mr-2">✓</span> At least 1 special character (!@#$%^&*)</li>
                              </ul>
                              <p class="mt-4 text-xs text-gray-500 italic">These requirements ensure your account is protected against common attacks.</p>
                            </div>
                          `,
                          icon: 'info',
                          confirmButtonText: 'Got it',
                          customClass: {
                            popup: 'bg-white rounded-xl shadow-2xl',
                            title: 'text-gray-800 text-xl font-bold',
                            confirmButton: 'bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-6 rounded-lg transition-all duration-200',
                          },
                          buttonsStyling: false,
                        });
                      }}
                      className="text-purple-600 hover:text-purple-700 text-xs font-semibold"
                    >
                      Requirements
                    </button>
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setFieldErrors({ ...fieldErrors, password: '' });
                      checkPasswordStrength(e.target.value);
                    }}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all ${
                      fieldErrors.password ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Create a password"
                    required
                  />
                  {password && (
                    <div className="mt-2">
                      <div className="flex gap-1 mb-1">
                        <div className={`h-1 flex-1 rounded ${passwordStrength >= 1 ? 'bg-red-500' : 'bg-gray-200'}`}></div>
                        <div className={`h-1 flex-1 rounded ${passwordStrength >= 2 ? 'bg-orange-500' : 'bg-gray-200'}`}></div>
                        <div className={`h-1 flex-1 rounded ${passwordStrength >= 3 ? 'bg-yellow-500' : 'bg-gray-200'}`}></div>
                        <div className={`h-1 flex-1 rounded ${passwordStrength >= 4 ? 'bg-green-500' : 'bg-gray-200'}`}></div>
                        <div className={`h-1 flex-1 rounded ${passwordStrength >= 5 ? 'bg-green-600' : 'bg-gray-200'}`}></div>
                      </div>
                      <p className="text-xs text-gray-500">
                        {passwordStrength === 0 && 'Password strength: Very weak'}
                        {passwordStrength === 1 && 'Password strength: Weak'}
                        {passwordStrength === 2 && 'Password strength: Fair'}
                        {passwordStrength === 3 && 'Password strength: Good'}
                        {passwordStrength === 4 && 'Password strength: Strong'}
                        {passwordStrength === 5 && 'Password strength: Very strong'}
                      </p>
                    </div>
                  )}
                  {fieldErrors.password && (
                    <p className="text-red-500 text-xs mt-1">{fieldErrors.password}</p>
                  )}
                </div>
                <div>
                  <label className="block text-gray-700 text-sm font-semibold mb-2">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setFieldErrors({ ...fieldErrors, confirmPassword: '' });
                    }}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all ${
                      fieldErrors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Confirm your password"
                    required
                  />
                  {fieldErrors.confirmPassword && (
                    <p className="text-red-500 text-xs mt-1">{fieldErrors.confirmPassword}</p>
                  )}
                </div>
              </div>

              {/* Role Selection */}
              <div className="mt-6">
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-gray-700 text-sm font-semibold">
                    I am a
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      Swal.fire({
                        title: 'Account Type',
                        html: `
                          <div class="text-left text-sm text-gray-600 space-y-3">
                            <div class="bg-purple-50 p-3 rounded-lg">
                              <p class="font-semibold text-purple-800 mb-1">🎓 Student</p>
                              <p class="text-xs">Access grades, view announcements, check schedules, and more.</p>
                            </div>
                            <div class="bg-blue-50 p-3 rounded-lg">
                              <p class="font-semibold text-blue-800 mb-1">👨‍🏫 Teacher</p>
                              <p class="text-xs">Manage classes, record grades, post materials, and track attendance.</p>
                            </div>
                          </div>
                        `,
                        icon: 'question',
                        confirmButtonText: 'Got it',
                        customClass: {
                          popup: 'bg-white rounded-xl shadow-2xl',
                          title: 'text-gray-800 text-xl font-bold',
                          confirmButton: 'bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-6 rounded-lg transition-all duration-200',
                        },
                        buttonsStyling: false,
                      });
                    }}
                    className="text-purple-600 hover:text-purple-700 text-xs font-semibold"
                  >
                    What's the difference?
                  </button>
                </div>
                <div className="flex space-x-4 max-w-md mx-auto">
                  <button
                    type="button"
                    onClick={() => setRole('student')}
                    className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all duration-200 ${
                      role === 'student'
                        ? 'bg-purple-600 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Student
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('teacher')}
                    className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all duration-200 ${
                      role === 'teacher'
                        ? 'bg-purple-600 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Teacher
                  </button>
                </div>
              </div>

              {/* Navigation Button */}
              <div className="flex justify-center mt-8">
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="w-full md:w-1/2 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center"
                >
                  Next: Personal Info
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Personal Information */}
          {step === 2 && (
            <div className="animate-fadeIn">
              {role === 'student' ? (
                <>
                  <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">Personal Information</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-700 text-sm font-semibold mb-2">
                        First Name
                      </label>
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => {
                          setFirstName(e.target.value);
                          setFieldErrors({ ...fieldErrors, firstName: '' });
                        }}
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all ${
                          fieldErrors.firstName ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Enter first name"
                        required
                      />
                      {fieldErrors.firstName && (
                        <p className="text-red-500 text-xs mt-1">{fieldErrors.firstName}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-gray-700 text-sm font-semibold mb-2">
                        Surname
                      </label>
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) => {
                          setLastName(e.target.value);
                          setFieldErrors({ ...fieldErrors, lastName: '' });
                        }}
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all ${
                          fieldErrors.lastName ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Enter surname"
                        required
                      />
                      {fieldErrors.lastName && (
                        <p className="text-red-500 text-xs mt-1">{fieldErrors.lastName}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-gray-700 text-sm font-semibold mb-2">
                        Sex
                      </label>
                      <select
                        value={sex}
                        onChange={(e) => {
                          setSex(e.target.value);
                          setFieldErrors({ ...fieldErrors, sex: '' });
                        }}
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all ${
                          fieldErrors.sex ? 'border-red-500' : 'border-gray-300'
                        }`}
                        required
                      >
                        <option value="">Select sex</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                      {fieldErrors.sex && (
                        <p className="text-red-500 text-xs mt-1">{fieldErrors.sex}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-gray-700 text-sm font-semibold mb-2">
                        Birth Date
                      </label>
                      <input
                        type="date"
                        value={birthDate}
                        onChange={(e) => {
                          setBirthDate(e.target.value);
                          setFieldErrors({ ...fieldErrors, birthDate: '' });
                        }}
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all ${
                          fieldErrors.birthDate ? 'border-red-500' : 'border-gray-300'
                        }`}
                        required
                      />
                      {fieldErrors.birthDate && (
                        <p className="text-red-500 text-xs mt-1">{fieldErrors.birthDate}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-gray-700 text-sm font-semibold mb-2">
                        State
                      </label>
                      <input
                        type="text"
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                        placeholder="Enter state/province"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 text-sm font-semibold mb-2">
                        Nationality
                      </label>
                      <input
                        type="text"
                        value={nationality}
                        onChange={(e) => setNationality(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                        placeholder="Enter nationality"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 text-sm font-semibold mb-2">
                        Father's Name
                      </label>
                      <input
                        type="text"
                        value={fatherName}
                        onChange={(e) => setFatherName(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                        placeholder="Enter father's name"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 text-sm font-semibold mb-2">
                        Mother's Name
                      </label>
                      <input
                        type="text"
                        value={motherName}
                        onChange={(e) => setMotherName(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                        placeholder="Enter mother's name"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-gray-700 text-sm font-semibold mb-2">
                          Contact Information
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            Swal.fire({
                              title: 'Contact Information',
                              html: `
                                <div class="text-left text-sm text-gray-600 space-y-2">
                                  <p class="font-semibold text-gray-800 mb-2">What to include:</p>
                                  <ul class="space-y-1">
                                    <li class="flex items-start"><span class="text-purple-600 mr-2">•</span> Home address</li>
                                    <li class="flex items-start"><span class="text-purple-600 mr-2">•</span> Phone number</li>
                                    <li class="flex items-start"><span class="text-purple-600 mr-2">•</span> Emergency contact name and number</li>
                                    <li class="flex items-start"><span class="text-purple-600 mr-2">•</span> Guardian contact (if applicable)</li>
                                  </ul>
                                  <p class="mt-3 text-xs text-gray-500 italic">This information helps the school reach you for important updates and emergencies.</p>
                                </div>
                              `,
                              icon: 'info',
                              confirmButtonText: 'Got it',
                              customClass: {
                                popup: 'bg-white rounded-xl shadow-2xl',
                                title: 'text-gray-800 text-xl font-bold',
                                confirmButton: 'bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-6 rounded-lg transition-all duration-200',
                              },
                              buttonsStyling: false,
                            });
                          }}
                          className="text-purple-600 hover:text-purple-700 text-xs font-semibold"
                        >
                          What to include?
                        </button>
                      </div>
                      <textarea
                        value={contactInfo}
                        onChange={(e) => setContactInfo(e.target.value)}
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
                        placeholder="Enter additional contact details (address, emergency contact, etc.)"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-600">No additional information needed for teacher accounts.</p>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-center space-x-4 mt-8">
                <button
                  type="button"
                  onClick={handleBackStep}
                  className="px-6 py-3 border-2 border-purple-600 text-purple-600 font-semibold rounded-lg hover:bg-purple-50 transition-all duration-200 flex items-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                  </svg>
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating Account...
                    </>
                  ) : (
                    'Complete Registration'
                  )}
                </button>
              </div>
            </div>
          )}
        </form>
        
        <p className="text-center text-gray-500 text-sm mt-6">
          Already have an account?{' '}
          <a href="/login" className="text-purple-600 hover:text-purple-700 font-semibold">
            Sign in here
          </a>
        </p>
        <p className="text-center text-gray-400 text-xs mt-4">
          © 2026 School Portal. All rights reserved.
        </p>
      </div>
      
      <style>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default Signup;
