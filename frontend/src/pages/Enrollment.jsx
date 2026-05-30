import { useState, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import Swal from 'sweetalert2';

const SHS_STRANDS = [
  { value: 'STEM', label: 'STEM' },
  { value: 'ABM', label: 'ABM' },
  { value: 'HUMSS', label: 'HUMSS' },
  { value: 'GAS', label: 'GAS' },
  { value: 'TVL-ICT', label: 'TVL-ICT' },
  { value: 'TVL-HE', label: 'TVL-HE' },
  { value: 'TVL-IA', label: 'TVL-IA' },
  { value: 'TVL-AFA', label: 'TVL-AFA' },
  { value: 'Sports', label: 'Sports' },
  { value: 'Arts & Design', label: 'Arts & Design' },
];

const ENROLLMENT_TYPES = [
  { value: 'new', label: 'New Student', desc: 'First-time enrollment', icon: '\u2728' },
  { value: 'returning', label: 'Returning Student', desc: 'Previously enrolled', icon: '\uD83D\uDD04' },
  { value: 'transferee', label: 'Transferee', desc: 'From another school', icon: '\uD83D\uDCC6' },
  { value: 'sh_applicant', label: 'SHS Applicant', desc: 'Senior High School', icon: '\uD83C\uDF93' },
  { value: 'parent_assisted', label: 'Parent-Assisted', desc: 'With parent help', icon: '\uD83D\uDC65' },
];

const TYPE_LABELS = {
  new: 'New Student', returning: 'Returning Student', transferee: 'Transferee',
  sh_applicant: 'SHS Applicant', parent_assisted: 'Parent-Assisted',
};

const STEPS = [
  { key: 'type', label: 'Type', icon: '1' },
  { key: 'personal', label: 'Personal', icon: '2' },
  { key: 'address', label: 'Address', icon: '3' },
  { key: 'parents', label: 'Parents', icon: '4' },
  { key: 'academic', label: 'Academic', icon: '5' },
  { key: 'documents', label: 'Documents', icon: '6' },
  { key: 'review', label: 'Review', icon: '7' },
];

const FileUpload = ({ label, required, file, onFile, onRemove, note }) => {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) onFile(f);
  }, [onFile]);

  return (
    <div className={`rounded-xl border-2 border-dashed transition-all p-4 ${
      dragOver ? 'border-violet-400 bg-violet-50' :
      file ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 bg-white hover:border-slate-300'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-bold text-slate-800">{label} {required && <span className="text-red-500">*</span>}</p>
          {note && <p className="text-[10px] text-slate-400 mt-0.5 italic">{note}</p>}
          {file && (
            <p className="text-xs text-emerald-600 font-semibold mt-1 flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              {file.name}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {file && (
            <button type="button" onClick={() => { onRemove(); if (inputRef.current) inputRef.current.value = ''; }}
              className="text-rose-400 hover:text-rose-600 p-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          )}
          <label className="cursor-pointer px-3 py-1.5 rounded-lg bg-violet-100 text-violet-700 text-xs font-bold hover:bg-violet-200 transition-colors">
            {file ? 'Change' : 'Browse'}
            <input ref={inputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden"
              onChange={e => { if (e.target.files[0]) onFile(e.target.files[0]); }} />
          </label>
        </div>
      </div>
      {!file && (
        <div
          className="mt-3 text-center py-4"
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          <svg className="w-8 h-8 mx-auto text-slate-300 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <p className="text-[10px] text-slate-400 font-medium">Drag & drop or click Browse</p>
          <p className="text-[9px] text-slate-300">PDF, JPG, PNG (max 10MB)</p>
        </div>
      )}
    </div>
  );
};

const Field = ({ label, required, children, hint }) => (
  <div>
    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
      {label} {required && <span className="text-red-500 normal-case">*</span>}
    </label>
    {children}
    {hint && <p className="text-[10px] text-slate-400 mt-1">{hint}</p>}
  </div>
);

const Input = (props) => (
  <input {...props}
    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-colors" />
);

const Select = ({ children, ...props }) => (
  <select {...props}
    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-colors">
    {children}
  </select>
);

const Textarea = (props) => (
  <textarea {...props}
    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-colors resize-none" />
);

const Enrollment = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(null);
  const [step, setStep] = useState(0);

  const [enrollmentType, setEnrollmentType] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [sex, setSex] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [placeOfBirth, setPlaceOfBirth] = useState('');
  const [nationality, setNationality] = useState('Filipino');
  const [religion, setReligion] = useState('');

  const [streetAddress, setStreetAddress] = useState('');
  const [barangay, setBarangay] = useState('');
  const [cityMunicipality, setCityMunicipality] = useState('');
  const [province, setProvince] = useState('');
  const [zipCode, setZipCode] = useState('');

  const [fatherName, setFatherName] = useState('');
  const [fatherOccupation, setFatherOccupation] = useState('');
  const [fatherContact, setFatherContact] = useState('');
  const [fatherEmail, setFatherEmail] = useState('');
  const [motherName, setMotherName] = useState('');
  const [motherOccupation, setMotherOccupation] = useState('');
  const [motherContact, setMotherContact] = useState('');
  const [motherEmail, setMotherEmail] = useState('');
  const [guardianName, setGuardianName] = useState('');
  const [guardianRelationship, setGuardianRelationship] = useState('');
  const [guardianContact, setGuardianContact] = useState('');
  const [guardianEmail, setGuardianEmail] = useState('');

  const [gradeLevel, setGradeLevel] = useState('');
  const [strand, setStrand] = useState('');
  const [schoolYear, setSchoolYear] = useState('2026-2027');
  const [previousSchool, setPreviousSchool] = useState('');
  const [previousSchoolAddress, setPreviousSchoolAddress] = useState('');
  const [lrn, setLrn] = useState('');
  const [noLrn, setNoLrn] = useState(false);
  const [lrnRequestReason, setLrnRequestReason] = useState('');
  const [isAls, setIsAls] = useState(false);

  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactRelationship, setEmergencyContactRelationship] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');

  const [birthCertificate, setBirthCertificate] = useState(null);
  const [reportCard, setReportCard] = useState(null);
  const [form138, setForm138] = useState(null);
  const [certificateOfCompletion, setCertificateOfCompletion] = useState(null);
  const [goodMoralCertificate, setGoodMoralCertificate] = useState(null);
  const [idPicture, setIdPicture] = useState(null);
  const [lastSchoolAttendedCert, setLastSchoolAttendedCert] = useState(null);

  const isTransferee = enrollmentType === 'transferee';
  const isReturning = enrollmentType === 'returning';
  const isSHS = enrollmentType === 'sh_applicant';
  const isParentAssisted = enrollmentType === 'parent_assisted';
  const isNew = enrollmentType === 'new';

  const getAge = (dob) => {
    if (!dob) return 0;
    const today = new Date();
    const birth = new Date(dob);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  const getRequirementsForGrade = () => {
    const base = [];
    if (isSHS) {
      base.push(
        { key: 'birthCertificate', label: 'PSA Birth Certificate', required: true },
        { key: 'reportCard', label: 'Progress Report Card (Gr. 10)', required: true },
        { key: 'certificateOfCompletion', label: 'Grade 10 Completion Certificate', required: true },
      );
      if (!isReturning) base.push({ key: 'goodMoralCertificate', label: 'Good Moral Certificate', required: true });
      return base;
    }
    if (isAls) return [
      { key: 'birthCertificate', label: 'PSA Birth Certificate', required: true, note: 'If unavailable, submit Baptismal Certificate' },
      { key: 'lastSchoolAttendedCert', label: 'Certificate of Last School Year Attended', required: true },
    ];
    switch (gradeLevel) {
      case '7': return [
        { key: 'form138', label: 'Grade 6 Certificate (Form 138)', required: true },
        { key: 'birthCertificate', label: 'PSA Birth Certificate', required: true },
        { key: 'idPicture', label: 'ID Picture', required: false },
      ];
      case '11': return [
        { key: 'birthCertificate', label: 'PSA Birth Certificate', required: true },
        { key: 'reportCard', label: 'Progress Report Card', required: true },
        { key: 'certificateOfCompletion', label: 'Grade 10 Completion Certificate', required: true },
        { key: 'idPicture', label: 'ID Picture', required: false },
      ];
      default: {
        const docs = [
          { key: 'birthCertificate', label: 'PSA Birth Certificate', required: true },
        ];
        if (isTransferee || !isReturning) {
          docs.push({ key: 'reportCard', label: 'Progress Report Card', required: true });
        }
        if (isTransferee) {
          docs.push({ key: 'goodMoralCertificate', label: 'Good Moral Certificate', required: true });
        }
        docs.push({ key: 'idPicture', label: 'ID Picture', required: false });
        return docs;
      }
    }
  };

  const fileMap = { birthCertificate, reportCard, form138, certificateOfCompletion, goodMoralCertificate, idPicture, lastSchoolAttendedCert };
  const setFileMap = { birthCertificate: setBirthCertificate, reportCard: setReportCard, form138: setForm138, certificateOfCompletion: setCertificateOfCompletion, goodMoralCertificate: setGoodMoralCertificate, idPicture: setIdPicture, lastSchoolAttendedCert: setLastSchoolAttendedCert };

  const validateStep = (s) => {
    if (s === 0 && !enrollmentType) {
      Swal.fire({ icon: 'error', title: 'Required', text: 'Select an enrollment type.' });
      return false;
    }
    if (s === 1 && (!firstName || !lastName || !sex || !dateOfBirth)) {
      Swal.fire({ icon: 'error', title: 'Missing Fields', text: 'Fill in all required personal fields.' });
      return false;
    }
    if (s === 2 && (!streetAddress || !barangay || !cityMunicipality || !province)) {
      Swal.fire({ icon: 'error', title: 'Missing Fields', text: 'Fill in all required address fields.' });
      return false;
    }
    if (s === 3) {
      if (isParentAssisted && (!guardianName || !guardianRelationship || !guardianContact)) {
        Swal.fire({ icon: 'error', title: 'Missing Guardian Info', text: 'Fill in guardian fields (required for parent-assisted enrollment).' });
        return false;
      } else if (!isParentAssisted && !fatherName && !motherName) {
        Swal.fire({ icon: 'error', title: 'Missing Info', text: 'Provide at least one parent/guardian name.' });
        return false;
      }
    }
    if (s === 4) {
      if (!gradeLevel || !email || !phoneNumber || !emergencyContactName || !emergencyContactRelationship || !emergencyContactPhone) {
        Swal.fire({ icon: 'error', title: 'Missing Fields', text: 'Fill in all required academic and contact fields.' });
        return false;
      }
      if (isSHS && !['11','12'].includes(gradeLevel)) {
        Swal.fire({ icon: 'error', title: 'Invalid Grade', text: 'SHS applicants must select Grade 11 or 12.' });
        return false;
      }
      if (['11','12'].includes(gradeLevel) && !strand) {
        Swal.fire({ icon: 'error', title: 'Strand Required', text: 'Select a strand for SHS.' });
        return false;
      }
      if (isTransferee && !previousSchool) {
        Swal.fire({ icon: 'error', title: 'Previous School Required', text: 'Transferees must provide their previous school.' });
        return false;
      }
      if (!noLrn && (!lrn || lrn.length !== 12 || !/^\d{12}$/.test(lrn))) {
        Swal.fire({ icon: 'error', title: 'LRN Required', text: 'A valid 12-digit LRN is required. Check "No LRN" if you do not have one yet.' });
        return false;
      }
      if (noLrn && !lrnRequestReason) {
        Swal.fire({ icon: 'error', title: 'Reason Required', text: 'Please provide a reason for not having an LRN.' });
        return false;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        Swal.fire({ icon: 'error', title: 'Invalid Email', text: 'Enter a valid email address.' });
        return false;
      }
      if (getAge(dateOfBirth) < 10) {
        Swal.fire({ icon: 'error', title: 'Age Requirement', text: 'Applicant must be at least 10 years old.' });
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(step)) setStep(s => s + 1);
  };

  const handleSubmit = async () => {
    if (loading) return;
    const requirements = getRequirementsForGrade();
    const requiredDocs = requirements.filter(r => r.required);
    const missing = requiredDocs.filter(r => !fileMap[r.key]).map(r => r.label);
    if (missing.length > 0) {
      return Swal.fire({ icon: 'error', title: 'Missing Documents', text: `Upload:\n${missing.map(f => '\u2022 ' + f).join('\n')}` });
    }

    setLoading(true);
    try {
      const formData = new FormData();
      const fields = {
        enrollment_type: enrollmentType, school_year: schoolYear,
        first_name: firstName, last_name: lastName, middle_name: middleName,
        sex, date_of_birth: dateOfBirth, place_of_birth: placeOfBirth,
        nationality, religion, street_address: streetAddress, barangay,
        city_municipality: cityMunicipality, province, zip_code: zipCode,
        father_name: fatherName, father_occupation: fatherOccupation,
        father_contact: fatherContact, father_email: fatherEmail,
        mother_name: motherName, mother_occupation: motherOccupation,
        mother_contact: motherContact, mother_email: motherEmail,
        guardian_name: guardianName, guardian_relationship: guardianRelationship,
        guardian_contact: guardianContact, guardian_email: guardianEmail,
        grade_level: gradeLevel, strand: strand || '', previous_school: previousSchool,
        previous_school_address: previousSchoolAddress,
        lrn: noLrn ? '' : lrn, is_als: isAls, email, phone_number: phoneNumber,
        emergency_contact_name: emergencyContactName,
        emergency_contact_relationship: emergencyContactRelationship,
        emergency_contact_phone: emergencyContactPhone,
        lrn_request_reason: noLrn ? lrnRequestReason : '',
      };
      Object.entries(fields).forEach(([k, v]) => formData.append(k, v));

      if (birthCertificate) formData.append('birth_certificate', birthCertificate);
      if (reportCard) formData.append('report_card', reportCard);
      if (form138) formData.append('form_138', form138);
      if (certificateOfCompletion) formData.append('certificate_of_completion', certificateOfCompletion);
      if (goodMoralCertificate) formData.append('good_moral_certificate', goodMoralCertificate);
      if (idPicture) formData.append('id_picture', idPicture);
      if (lastSchoolAttendedCert) formData.append('last_school_attended_cert', lastSchoolAttendedCert);

      const res = await api.post('/enrollment-applications/', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setSubmitted(res.data);
    } catch (error) {
      const msg = error.response?.data?.error || error.response?.data?.details?.[0] || 'Submission failed. Please try again.';
      Swal.fire({ icon: 'error', title: 'Submission Failed', text: msg });
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="bg-gradient-to-br from-violet-50 via-white to-emerald-50 min-h-screen py-12 flex items-center">
        <div className="max-w-lg mx-auto px-4 w-full">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-xl p-8 text-center">
            <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-5">
              <svg className="w-10 h-10 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-2">Application Submitted!</h2>
            <p className="text-sm text-slate-500 mb-6">Your enrollment application has been received successfully.</p>
            <div className="bg-gradient-to-r from-violet-50 to-purple-50 rounded-2xl p-6 mb-6 border border-violet-100">
              <p className="text-[10px] font-bold text-violet-400 uppercase tracking-widest mb-1">Enrollment Number</p>
              <p className="text-3xl font-black text-violet-700 tracking-wider">{submitted.enrollment_number}</p>
              <p className="text-xs text-violet-500 mt-2 font-medium">Save this number to track your application</p>
            </div>
            <div className="flex flex-col gap-3">
              <Link to={`/track-enrollment?number=${submitted.enrollment_number}`}
                className="w-full py-3.5 rounded-xl bg-violet-600 text-white text-sm font-bold hover:bg-violet-700 transition-all shadow-lg shadow-violet-200">
                Track Application Status
              </Link>
              <button onClick={() => navigate('/')}
                className="w-full py-3.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-bold hover:bg-slate-50 transition-colors">
                Back to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-violet-50 via-white to-slate-50 min-h-screen py-8 md:py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-8">
          <p className="text-xs font-bold text-violet-600 uppercase tracking-widest mb-2">Online Application</p>
          <h1 className="text-3xl font-black text-slate-900 mb-1">Enrollment Application</h1>
          <p className="text-sm text-slate-500">Kiwalan National High School</p>
        </div>

        {/* Progress Stepper */}
        <div className="flex items-center justify-between mb-8 px-1">
          {STEPS.map((s, i) => {
            const done = i < step;
            const active = i === step;
            return (
              <div key={s.key} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center gap-1.5">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    done ? 'bg-violet-600 text-white shadow-md shadow-violet-200' :
                    active ? 'bg-violet-600 text-white ring-4 ring-violet-100 shadow-lg shadow-violet-200' :
                    'bg-white border-2 border-slate-200 text-slate-400'
                  }`}>
                    {done ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg> : s.icon}
                  </div>
                  <span className={`text-[8px] font-bold uppercase tracking-wider hidden sm:block ${active ? 'text-violet-600' : done ? 'text-violet-400' : 'text-slate-400'}`}>{s.label}</span>
                </div>
                {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 mx-2 mb-4 transition-colors ${i < step ? 'bg-violet-500' : 'bg-slate-200'}`} />}
              </div>
            );
          })}
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-lg p-6 md:p-8">
          {enrollmentType && step > 0 && (
            <div className="mb-6 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-violet-50 border border-violet-100">
              <span className="text-[10px] font-bold text-violet-600 uppercase tracking-wide">{TYPE_LABELS[enrollmentType]}</span>
              <button type="button" onClick={() => { setStep(0); setEnrollmentType(''); }} className="text-violet-400 hover:text-violet-600">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          )}

          {/* Step 0: Type Selection */}
          {step === 0 && (
            <div className="space-y-5">
              <h2 className="text-xl font-black text-slate-900 mb-1">Enrollment Type</h2>
              <p className="text-sm text-slate-500 mb-4">Select the type that applies to you.</p>
              <div className="grid gap-3">
                {ENROLLMENT_TYPES.map(t => (
                  <button key={t.value} type="button" onClick={() => { setEnrollmentType(t.value); if (t.value !== 'sh_applicant') setStrand(''); }}
                    className={`text-left p-4 rounded-2xl border-2 transition-all ${
                      enrollmentType === t.value ? 'border-violet-500 bg-violet-50 shadow-md shadow-violet-100' : 'border-slate-200 hover:border-slate-300 bg-white hover:shadow-sm'
                    }`}>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{t.icon}</span>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{t.label}</p>
                        <p className="text-xs text-slate-500">{t.desc}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 1: Personal Information */}
          {step === 1 && (
            <div className="space-y-5">
              <h2 className="text-xl font-black text-slate-900 mb-4">Personal Information</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="First Name" required><Input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Juan" /></Field>
                <Field label="Last Name" required><Input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Dela Cruz" /></Field>
                <Field label="Middle Name"><Input value={middleName} onChange={e => setMiddleName(e.target.value)} placeholder="Optional" /></Field>
                <Field label="Sex" required>
                  <Select value={sex} onChange={e => setSex(e.target.value)}>
                    <option value="">Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </Select>
                </Field>
                <Field label="Date of Birth" required><Input type="date" value={dateOfBirth} onChange={e => setDateOfBirth(e.target.value)} /></Field>
                <Field label="Age"><Input value={getAge(dateOfBirth) || ''} disabled className="bg-slate-50 text-slate-500 font-bold" /></Field>
                <Field label="Place of Birth"><Input value={placeOfBirth} onChange={e => setPlaceOfBirth(e.target.value)} placeholder="City, Province" /></Field>
                <Field label="Nationality"><Input value={nationality} onChange={e => setNationality(e.target.value)} /></Field>
                <Field label="Religion"><Input value={religion} onChange={e => setReligion(e.target.value)} placeholder="Optional" /></Field>
              </div>
            </div>
          )}

          {/* Step 2: Address */}
          {step === 2 && (
            <div className="space-y-5">
              <h2 className="text-xl font-black text-slate-900 mb-4">Address Information</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2"><Field label="Street Address" required><Input value={streetAddress} onChange={e => setStreetAddress(e.target.value)} /></Field></div>
                <Field label="Barangay" required><Input value={barangay} onChange={e => setBarangay(e.target.value)} /></Field>
                <Field label="City / Municipality" required><Input value={cityMunicipality} onChange={e => setCityMunicipality(e.target.value)} /></Field>
                <Field label="Province" required><Input value={province} onChange={e => setProvince(e.target.value)} /></Field>
                <Field label="Zip Code"><Input value={zipCode} onChange={e => setZipCode(e.target.value)} placeholder="Optional" /></Field>
              </div>
            </div>
          )}

          {/* Step 3: Parents */}
          {step === 3 && (
            <div className="space-y-5">
              <h2 className="text-xl font-black text-slate-900 mb-4">Parent / Guardian Information</h2>
              {isParentAssisted ? (
                <div className="bg-slate-50 rounded-2xl border border-slate-100 p-5 space-y-4">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Guardian Information</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Guardian's Full Name" required><Input value={guardianName} onChange={e => setGuardianName(e.target.value)} /></Field>
                    <Field label="Relationship" required><Input value={guardianRelationship} onChange={e => setGuardianRelationship(e.target.value)} placeholder="e.g. Parent, Aunt" /></Field>
                    <Field label="Contact Number" required><Input value={guardianContact} onChange={e => setGuardianContact(e.target.value)} /></Field>
                    <Field label="Email"><Input type="email" value={guardianEmail} onChange={e => setGuardianEmail(e.target.value)} placeholder="Optional" /></Field>
                  </div>
                </div>
              ) : (
                <>
                  <div className="bg-slate-50 rounded-2xl border border-slate-100 p-5 space-y-4">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Father's Information</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Field label="Father's Name" required><Input value={fatherName} onChange={e => setFatherName(e.target.value)} /></Field>
                      <Field label="Occupation"><Input value={fatherOccupation} onChange={e => setFatherOccupation(e.target.value)} placeholder="Optional" /></Field>
                      <Field label="Contact Number"><Input value={fatherContact} onChange={e => setFatherContact(e.target.value)} /></Field>
                      <Field label="Email"><Input type="email" value={fatherEmail} onChange={e => setFatherEmail(e.target.value)} placeholder="Optional" /></Field>
                    </div>
                  </div>
                  <div className="bg-slate-50 rounded-2xl border border-slate-100 p-5 space-y-4">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Mother's Information</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Field label="Mother's Name" required><Input value={motherName} onChange={e => setMotherName(e.target.value)} /></Field>
                      <Field label="Occupation"><Input value={motherOccupation} onChange={e => setMotherOccupation(e.target.value)} placeholder="Optional" /></Field>
                      <Field label="Contact Number"><Input value={motherContact} onChange={e => setMotherContact(e.target.value)} /></Field>
                      <Field label="Email"><Input type="email" value={motherEmail} onChange={e => setMotherEmail(e.target.value)} placeholder="Optional" /></Field>
                    </div>
                  </div>
                  <div className="bg-slate-50 rounded-2xl border border-slate-100 p-5 space-y-4">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Guardian (if applicable)</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Field label="Guardian's Name"><Input value={guardianName} onChange={e => setGuardianName(e.target.value)} /></Field>
                      <Field label="Relationship"><Input value={guardianRelationship} onChange={e => setGuardianRelationship(e.target.value)} /></Field>
                      <Field label="Contact Number"><Input value={guardianContact} onChange={e => setGuardianContact(e.target.value)} /></Field>
                      <Field label="Email"><Input type="email" value={guardianEmail} onChange={e => setGuardianEmail(e.target.value)} placeholder="Optional" /></Field>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Step 4: Academic */}
          {step === 4 && (
            <div className="space-y-5">
              <h2 className="text-xl font-black text-slate-900 mb-4">Academic & Contact Information</h2>
              <div className="bg-slate-50 rounded-2xl border border-slate-100 p-5 space-y-4">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Academic Information</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Grade Level" required>
                    <Select value={gradeLevel} onChange={e => { setGradeLevel(e.target.value); if (!['11','12'].includes(e.target.value)) setStrand(''); }}>
                      <option value="">Select Grade</option>
                      {isSHS ? ['11','12'].map(g => <option key={g} value={g}>Grade {g}</option>) :
                        ['7','8','9','10','11','12'].map(g => <option key={g} value={g}>Grade {g}</option>)}
                    </Select>
                  </Field>
                  {['11','12'].includes(gradeLevel) && (
                    <Field label="Strand" required>
                      <Select value={strand} onChange={e => setStrand(e.target.value)}>
                        <option value="">Select Strand</option>
                        {SHS_STRANDS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                      </Select>
                    </Field>
                  )}
                  <Field label="School Year" required>
                    <Select value={schoolYear} onChange={e => setSchoolYear(e.target.value)}>
                      <option value="2025-2026">2025-2026</option>
                      <option value="2026-2027">2026-2027</option>
                    </Select>
                  </Field>
                  <Field label="LRN (Learner Reference Number)" required={!noLrn}>
                    <Input value={lrn} onChange={e => setLrn(e.target.value)} placeholder="12-digit LRN"
                      disabled={noLrn} className={noLrn ? 'bg-slate-100 text-slate-400' : ''} />
                    {!noLrn && lrn && lrn.length !== 12 && (
                      <p className="text-[10px] text-red-500 mt-1">LRN must be exactly 12 digits</p>
                    )}
                  </Field>
                  <div className="sm:col-span-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={noLrn} onChange={e => { setNoLrn(e.target.checked); if (e.target.checked) setLrn(''); }}
                        className="w-4 h-4 text-violet-600 border-slate-300 rounded focus:ring-violet-500" />
                      <span className="text-sm text-slate-700 font-medium">I do not have an LRN yet</span>
                    </label>
                    {noLrn && (
                      <div className="mt-3 p-3 rounded-xl bg-amber-50 border border-amber-200 space-y-3">
                        <p className="text-xs text-amber-700 font-medium">
                          No LRN? You can still apply. The school will assist you in obtaining one. Please provide a reason:
                        </p>
                        <Field label="Reason for no LRN" required>
                          <Select value={lrnRequestReason} onChange={e => setLrnRequestReason(e.target.value)}>
                            <option value="">Select reason</option>
                            <option value="new_student">New student, never enrolled in DepEd</option>
                            <option value="lost_lrn">LRN was lost or forgotten</option>
                            <option value="als_graduate">ALS graduate, no LRN issued</option>
                            <option value="transferee_no_lrn">Transferee from private school, no LRN</option>
                            <option value="other">Other reason</option>
                          </Select>
                        </Field>
                        {lrnRequestReason === 'other' && (
                          <Field label="Please specify">
                            <Input value={lrn} onChange={e => setLrn(e.target.value)} placeholder="Describe your situation" />
                          </Field>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="sm:col-span-2">
                    <Field label="Previous School" required={isTransferee}>
                      <Input value={previousSchool} onChange={e => setPreviousSchool(e.target.value)} placeholder={isTransferee ? 'Required for transferees' : 'Optional'} />
                    </Field>
                  </div>
                  <div className="sm:col-span-2">
                    <Field label="Previous School Address"><Textarea rows={2} value={previousSchoolAddress} onChange={e => setPreviousSchoolAddress(e.target.value)} placeholder="Optional" /></Field>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={isAls} onChange={e => setIsAls(e.target.checked)} className="w-4 h-4 text-violet-600 border-slate-300 rounded focus:ring-violet-500" />
                      <span className="text-sm text-slate-700 font-medium">Alternative Learning System (ALS) applicant</span>
                    </label>
                  </div>
                </div>
              </div>
              <div className="bg-slate-50 rounded-2xl border border-slate-100 p-5 space-y-4">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Contact Information</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Email" required><Input type="email" value={email} onChange={e => setEmail(e.target.value)} /></Field>
                  <Field label="Phone Number" required><Input value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} /></Field>
                </div>
              </div>
              <div className="bg-slate-50 rounded-2xl border border-slate-100 p-5 space-y-4">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Emergency Contact</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Name" required><Input value={emergencyContactName} onChange={e => setEmergencyContactName(e.target.value)} /></Field>
                  <Field label="Relationship" required><Input value={emergencyContactRelationship} onChange={e => setEmergencyContactRelationship(e.target.value)} /></Field>
                  <div className="sm:col-span-2"><Field label="Phone Number" required><Input value={emergencyContactPhone} onChange={e => setEmergencyContactPhone(e.target.value)} /></Field></div>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Documents */}
          {step === 5 && (
            <div className="space-y-5">
              <h2 className="text-xl font-black text-slate-900 mb-2">Document Requirements</h2>
              <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-100">
                <svg className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <p className="text-xs text-amber-700 font-medium">
                  Requirements for <strong>{TYPE_LABELS[enrollmentType]}</strong>
                  {!isSHS && gradeLevel && !isAls ? ` \u2014 Grade ${gradeLevel}` : ''}
                  {isAls ? ' \u2014 ALS' : ''}
                </p>
              </div>
              <div className="space-y-3">
                {getRequirementsForGrade().map(req => (
                  <FileUpload key={req.key} label={req.label} required={req.required} note={req.note}
                    file={fileMap[req.key]} onFile={f => setFileMap[req.key](f)} onRemove={() => setFileMap[req.key](null)} />
                ))}
              </div>
            </div>
          )}

          {/* Step 6: Review */}
          {step === 6 && (
            <div className="space-y-5">
              <h2 className="text-xl font-black text-slate-900 mb-2">Review & Submit</h2>
              <p className="text-sm text-slate-500 mb-4">Please review your information before submitting.</p>

              <ReviewSection title="Enrollment Type">
                <ReviewRow label="Type" value={TYPE_LABELS[enrollmentType]} />
                <ReviewRow label="School Year" value={schoolYear} />
              </ReviewSection>

              <ReviewSection title="Personal Information">
                <ReviewRow label="Full Name" value={`${lastName}, ${firstName} ${middleName || ''}`} />
                <ReviewRow label="Sex" value={sex === 'male' ? 'Male' : sex === 'female' ? 'Female' : 'Other'} />
                <ReviewRow label="Date of Birth" value={dateOfBirth} />
                <ReviewRow label="Age" value={getAge(dateOfBirth)} />
                <ReviewRow label="Place of Birth" value={placeOfBirth || 'N/A'} />
                <ReviewRow label="Nationality" value={nationality} />
                <ReviewRow label="Religion" value={religion || 'N/A'} />
              </ReviewSection>

              <ReviewSection title="Address">
                <ReviewRow label="Street" value={streetAddress} />
                <ReviewRow label="Barangay" value={barangay} />
                <ReviewRow label="City" value={cityMunicipality} />
                <ReviewRow label="Province" value={province} />
                <ReviewRow label="Zip" value={zipCode || 'N/A'} />
              </ReviewSection>

              <ReviewSection title="Parents / Guardian">
                {fatherName && <ReviewRow label="Father" value={`${fatherName} ${fatherContact ? `\u2014 ${fatherContact}` : ''}`} />}
                {motherName && <ReviewRow label="Mother" value={`${motherName} ${motherContact ? `\u2014 ${motherContact}` : ''}`} />}
                {guardianName && <ReviewRow label="Guardian" value={`${guardianName} (${guardianRelationship}) ${guardianContact ? `\u2014 ${guardianContact}` : ''}`} />}
              </ReviewSection>

              <ReviewSection title="Academic">
                <ReviewRow label="Grade Level" value={`Grade ${gradeLevel}${strand ? ` \u2014 ${strand}` : ''}`} />
                <ReviewRow label="LRN" value={noLrn ? `Not available (${lrnRequestReason.replace(/_/g, ' ')})` : (lrn || 'N/A')} />
                <ReviewRow label="Previous School" value={previousSchool || 'N/A'} />
                <ReviewRow label="ALS" value={isAls ? 'Yes' : 'No'} />
              </ReviewSection>

              <ReviewSection title="Contact">
                <ReviewRow label="Email" value={email} />
                <ReviewRow label="Phone" value={phoneNumber} />
                <ReviewRow label="Emergency" value={`${emergencyContactName} (${emergencyContactRelationship}) ${emergencyContactPhone}`} />
              </ReviewSection>

              <ReviewSection title="Documents">
                {getRequirementsForGrade().map(req => {
                  const f = fileMap[req.key];
                  return <ReviewRow key={req.key} label={req.label} value={f ? '\u2713 Uploaded' : (req.required ? '\u2717 Missing' : 'Not provided')} />;
                })}
              </ReviewSection>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-100">
            {step > 0 ? (
              <button type="button" onClick={() => setStep(s => s - 1)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                Back
              </button>
            ) : <div />}
            {step < 6 ? (
              <button type="button" onClick={handleNext}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-bold hover:bg-violet-700 transition-all shadow-md shadow-violet-200">
                Next
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
            ) : (
              <button type="button" onClick={handleSubmit} disabled={loading}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 disabled:opacity-50 transition-all shadow-md shadow-emerald-200">
                {loading ? (
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                )}
                {loading ? 'Submitting...' : 'Submit Application'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const ReviewSection = ({ title, children }) => (
  <div className="bg-slate-50 rounded-2xl border border-slate-100 p-5">
    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">{title}</p>
    <div className="space-y-2">{children}</div>
  </div>
);

const ReviewRow = ({ label, value }) => (
  <div className="flex items-start justify-between gap-4 text-sm">
    <span className="text-slate-500 font-medium">{label}</span>
    <span className="text-slate-900 font-bold text-right">{value}</span>
  </div>
);

export default Enrollment;
