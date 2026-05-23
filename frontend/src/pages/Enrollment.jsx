import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import Swal from 'sweetalert2';

// ── Reusable field components ─────────────────────────────────────────────────
const Field = ({ label, required, children }) => (
  <div>
    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
      {label} {required && <span className="text-red-500 normal-case">*</span>}
    </label>
    {children}
  </div>
);

const Input = ({ ...props }) => (
  <input
    {...props}
    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-colors"
  />
);

const Select = ({ children, ...props }) => (
  <select
    {...props}
    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-colors"
  >
    {children}
  </select>
);

const Textarea = ({ ...props }) => (
  <textarea
    {...props}
    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-colors resize-none"
  />
);

const SectionCard = ({ title, children }) => (
  <div className="bg-slate-50 rounded-2xl border border-slate-100 p-6 space-y-4">
    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{title}</p>
    {children}
  </div>
);

// ── Step labels ───────────────────────────────────────────────────────────────
const STEPS = ['Personal', 'Address', 'Parents', 'Academic', 'Documents'];

// ── Main component ────────────────────────────────────────────────────────────
const Enrollment = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  // Personal
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [sex, setSex] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [placeOfBirth, setPlaceOfBirth] = useState('');
  const [nationality, setNationality] = useState('Filipino');
  const [religion, setReligion] = useState('');

  // Address
  const [streetAddress, setStreetAddress] = useState('');
  const [barangay, setBarangay] = useState('');
  const [cityMunicipality, setCityMunicipality] = useState('');
  const [province, setProvince] = useState('');
  const [zipCode, setZipCode] = useState('');

  // Parents
  const [fatherName, setFatherName] = useState('');
  const [fatherOccupation, setFatherOccupation] = useState('');
  const [fatherContact, setFatherContact] = useState('');
  const [motherName, setMotherName] = useState('');
  const [motherOccupation, setMotherOccupation] = useState('');
  const [motherContact, setMotherContact] = useState('');
  const [guardianName, setGuardianName] = useState('');
  const [guardianRelationship, setGuardianRelationship] = useState('');
  const [guardianContact, setGuardianContact] = useState('');

  // Academic
  const [gradeLevel, setGradeLevel] = useState('');
  const [previousSchool, setPreviousSchool] = useState('');
  const [previousSchoolAddress, setPreviousSchoolAddress] = useState('');
  const [lrn, setLrn] = useState('');
  const [isAls, setIsAls] = useState(false);

  // Contact
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  // Emergency
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactRelationship, setEmergencyContactRelationship] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');

  // Files
  const [birthCertificate, setBirthCertificate] = useState(null);
  const [reportCard, setReportCard] = useState(null);
  const [form138, setForm138] = useState(null);
  const [certificateOfCompletion, setCertificateOfCompletion] = useState(null);
  const [goodMoralCertificate, setGoodMoralCertificate] = useState(null);
  const [lastSchoolAttendedCert, setLastSchoolAttendedCert] = useState(null);

  const getRequirementsForGrade = () => {
    if (isAls) return [
      { key: 'birthCertificate', label: 'PSA Birth Certificate (Photocopy)', required: true, note: 'If unavailable, submit Baptismal Certificate or Local Live Birth' },
      { key: 'lastSchoolAttendedCert', label: 'Certificate/Report Card of Last School Year Attended', required: true, note: '' },
    ];
    switch (gradeLevel) {
      case '7': return [
        { key: 'form138', label: 'Grade 6 Candidate for Graduation Certificate (Form 138)', required: true, note: '' },
        { key: 'birthCertificate', label: 'PSA Birth Certificate (Photocopy)', required: true, note: 'If unavailable, submit Baptismal Certificate or Local Live Birth' },
      ];
      case '11': return [
        { key: 'birthCertificate', label: 'PSA Birth Certificate (Photocopy)', required: true, note: 'If unavailable, submit Baptismal Certificate or Local Live Birth' },
        { key: 'reportCard', label: 'Photocopy of Progress Report Card', required: true, note: '' },
        { key: 'certificateOfCompletion', label: 'Grade 10 Candidate for Completion Certificate', required: true, note: '' },
      ];
      default: return [
        { key: 'birthCertificate', label: 'PSA Birth Certificate (Photocopy)', required: true, note: 'If unavailable, submit Baptismal Certificate or Local Live Birth' },
        { key: 'reportCard', label: 'Photocopy of Progress Report Card', required: true, note: '' },
        { key: 'goodMoralCertificate', label: 'Certificate of Good Moral Character', required: false, note: '' },
      ];
    }
  };

  const handleFileChange = (e, setter) => { if (e.target.files[0]) setter(e.target.files[0]); };

  const handleNextStep = () => {
    if (step === 1 && (!firstName || !lastName || !sex || !dateOfBirth)) {
      return Swal.fire({ icon: 'error', title: 'Missing Information', text: 'Please fill in all required fields.' });
    }
    if (step === 2 && (!streetAddress || !barangay || !cityMunicipality || !province)) {
      return Swal.fire({ icon: 'error', title: 'Missing Information', text: 'Please fill in all required address fields.' });
    }
    if (step === 3 && (!fatherName || !motherName)) {
      return Swal.fire({ icon: 'error', title: 'Missing Information', text: 'Please provide parent/guardian information.' });
    }
    if (step === 4) {
      if (!gradeLevel || !email || !phoneNumber) {
        return Swal.fire({ icon: 'error', title: 'Missing Information', text: 'Please fill in all required academic and contact fields.' });
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return Swal.fire({ icon: 'error', title: 'Invalid Email', text: 'Please enter a valid email address.' });
      }
    }
    setStep(s => s + 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (step !== 5) return;

    const requirements = getRequirementsForGrade();
    const missingFiles = requirements
      .filter(req => req.required)
      .filter(req => {
        const fileMap = { birthCertificate, reportCard, form138, certificateOfCompletion, goodMoralCertificate, lastSchoolAttendedCert };
        return !fileMap[req.key];
      })
      .map(req => req.label);

    if (missingFiles.length > 0) {
      return Swal.fire({ icon: 'error', title: 'Missing Required Documents', text: `Please upload:\n${missingFiles.map(f => '• ' + f).join('\n')}` });
    }

    setLoading(true);
    try {
      const formData = new FormData();
      const fields = {
        first_name: firstName, last_name: lastName, middle_name: middleName,
        sex, date_of_birth: dateOfBirth, place_of_birth: placeOfBirth,
        nationality, religion, street_address: streetAddress, barangay,
        city_municipality: cityMunicipality, province, zip_code: zipCode,
        father_name: fatherName, father_occupation: fatherOccupation, father_contact: fatherContact,
        mother_name: motherName, mother_occupation: motherOccupation, mother_contact: motherContact,
        guardian_name: guardianName, guardian_relationship: guardianRelationship, guardian_contact: guardianContact,
        grade_level: gradeLevel, previous_school: previousSchool, previous_school_address: previousSchoolAddress,
        lrn, is_als: isAls, email, phone_number: phoneNumber,
        emergency_contact_name: emergencyContactName,
        emergency_contact_relationship: emergencyContactRelationship,
        emergency_contact_phone: emergencyContactPhone,
      };
      Object.entries(fields).forEach(([k, v]) => formData.append(k, v));
      if (birthCertificate) formData.append('birth_certificate', birthCertificate);
      if (reportCard) formData.append('report_card', reportCard);
      if (form138) formData.append('form_138', form138);
      if (certificateOfCompletion) formData.append('certificate_of_completion', certificateOfCompletion);
      if (goodMoralCertificate) formData.append('good_moral_certificate', goodMoralCertificate);
      if (lastSchoolAttendedCert) formData.append('last_school_attended_cert', lastSchoolAttendedCert);

      await api.post('/enrollment-applications/', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setLoading(false);
      Swal.fire({ icon: 'success', title: 'Application Submitted!', text: 'Your enrollment application has been submitted. We will review it and contact you soon.', confirmButtonText: 'OK' })
        .then(() => navigate('/'));
    } catch (error) {
      setLoading(false);
      Swal.fire({ icon: 'error', title: 'Submission Failed', text: error.response?.data?.error || 'An error occurred. Please try again.' });
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">

        {/* Header */}
        <div className="text-center mb-8">
          <p className="text-xs font-bold text-violet-600 uppercase tracking-widest mb-2">Online Application</p>
          <h1 className="text-3xl font-black text-slate-900 mb-1">Enrollment Application</h1>
          <p className="text-sm text-slate-500">Kiwalan National High School — School Year 2026–2027</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-between mb-8 px-2">
          {STEPS.map((label, i) => {
            const s = i + 1;
            const done = step > s;
            const active = step === s;
            return (
              <div key={s} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center gap-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                    done ? 'bg-violet-600 text-white' : active ? 'bg-violet-600 text-white ring-4 ring-violet-100' : 'bg-white border-2 border-slate-200 text-slate-400'
                  }`}>
                    {done ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                    ) : s}
                  </div>
                  <span className={`text-[9px] font-bold uppercase tracking-wider hidden sm:block ${active ? 'text-violet-600' : 'text-slate-400'}`}>{label}</span>
                </div>
                {s < STEPS.length && (
                  <div className={`flex-1 h-0.5 mx-2 mb-4 transition-colors ${step > s ? 'bg-violet-600' : 'bg-slate-200'}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Form card */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 md:p-8">
          <form onSubmit={handleSubmit}>

            {/* Step 1: Personal */}
            {step === 1 && (
              <div className="space-y-5">
                <h2 className="text-lg font-black text-slate-900 mb-5">Personal Information</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="First Name" required><Input value={firstName} onChange={e => setFirstName(e.target.value)} /></Field>
                  <Field label="Last Name" required><Input value={lastName} onChange={e => setLastName(e.target.value)} /></Field>
                  <Field label="Middle Name"><Input value={middleName} onChange={e => setMiddleName(e.target.value)} /></Field>
                  <Field label="Sex" required>
                    <Select value={sex} onChange={e => setSex(e.target.value)}>
                      <option value="">Select</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </Select>
                  </Field>
                  <Field label="Date of Birth" required><Input type="date" value={dateOfBirth} onChange={e => setDateOfBirth(e.target.value)} /></Field>
                  <Field label="Place of Birth"><Input value={placeOfBirth} onChange={e => setPlaceOfBirth(e.target.value)} /></Field>
                  <Field label="Nationality"><Input value={nationality} onChange={e => setNationality(e.target.value)} /></Field>
                  <Field label="Religion"><Input value={religion} onChange={e => setReligion(e.target.value)} /></Field>
                </div>
              </div>
            )}

            {/* Step 2: Address */}
            {step === 2 && (
              <div className="space-y-5">
                <h2 className="text-lg font-black text-slate-900 mb-5">Address Information</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <Field label="Street Address" required><Input value={streetAddress} onChange={e => setStreetAddress(e.target.value)} /></Field>
                  </div>
                  <Field label="Barangay" required><Input value={barangay} onChange={e => setBarangay(e.target.value)} /></Field>
                  <Field label="City / Municipality" required><Input value={cityMunicipality} onChange={e => setCityMunicipality(e.target.value)} /></Field>
                  <Field label="Province" required><Input value={province} onChange={e => setProvince(e.target.value)} /></Field>
                  <Field label="Zip Code"><Input value={zipCode} onChange={e => setZipCode(e.target.value)} /></Field>
                </div>
              </div>
            )}

            {/* Step 3: Parents */}
            {step === 3 && (
              <div className="space-y-5">
                <h2 className="text-lg font-black text-slate-900 mb-5">Parent / Guardian Information</h2>
                <SectionCard title="Father's Information">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Father's Name" required><Input value={fatherName} onChange={e => setFatherName(e.target.value)} /></Field>
                    <Field label="Occupation"><Input value={fatherOccupation} onChange={e => setFatherOccupation(e.target.value)} /></Field>
                    <Field label="Contact Number"><Input value={fatherContact} onChange={e => setFatherContact(e.target.value)} /></Field>
                  </div>
                </SectionCard>
                <SectionCard title="Mother's Information">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Mother's Name" required><Input value={motherName} onChange={e => setMotherName(e.target.value)} /></Field>
                    <Field label="Occupation"><Input value={motherOccupation} onChange={e => setMotherOccupation(e.target.value)} /></Field>
                    <Field label="Contact Number"><Input value={motherContact} onChange={e => setMotherContact(e.target.value)} /></Field>
                  </div>
                </SectionCard>
                <SectionCard title="Guardian Information (if applicable)">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Guardian's Name"><Input value={guardianName} onChange={e => setGuardianName(e.target.value)} /></Field>
                    <Field label="Relationship"><Input value={guardianRelationship} onChange={e => setGuardianRelationship(e.target.value)} /></Field>
                    <Field label="Contact Number"><Input value={guardianContact} onChange={e => setGuardianContact(e.target.value)} /></Field>
                  </div>
                </SectionCard>
              </div>
            )}

            {/* Step 4: Academic & Contact */}
            {step === 4 && (
              <div className="space-y-5">
                <h2 className="text-lg font-black text-slate-900 mb-5">Academic & Contact Information</h2>
                <SectionCard title="Academic Information">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Grade Level Applying For" required>
                      <Select value={gradeLevel} onChange={e => setGradeLevel(e.target.value)}>
                        <option value="">Select Grade Level</option>
                        {['7','8','9','10','11','12'].map(g => <option key={g} value={g}>Grade {g}</option>)}
                      </Select>
                    </Field>
                    <Field label="Learner Reference Number (LRN)"><Input value={lrn} onChange={e => setLrn(e.target.value)} placeholder="12-digit LRN" /></Field>
                    <div className="sm:col-span-2">
                      <Field label="Previous School Attended"><Input value={previousSchool} onChange={e => setPreviousSchool(e.target.value)} /></Field>
                    </div>
                    <div className="sm:col-span-2">
                      <Field label="Previous School Address"><Textarea rows={2} value={previousSchoolAddress} onChange={e => setPreviousSchoolAddress(e.target.value)} /></Field>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={isAls} onChange={e => setIsAls(e.target.checked)} className="w-4 h-4 text-violet-600 border-slate-300 rounded focus:ring-violet-500" />
                        <span className="text-sm text-slate-700 font-medium">I am an Alternative Learning System (ALS) applicant</span>
                      </label>
                    </div>
                  </div>
                </SectionCard>
                <SectionCard title="Contact Information">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Email Address" required><Input type="email" value={email} onChange={e => setEmail(e.target.value)} /></Field>
                    <Field label="Phone Number" required><Input value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} /></Field>
                  </div>
                </SectionCard>
                <SectionCard title="Emergency Contact">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Name" required><Input value={emergencyContactName} onChange={e => setEmergencyContactName(e.target.value)} /></Field>
                    <Field label="Relationship" required><Input value={emergencyContactRelationship} onChange={e => setEmergencyContactRelationship(e.target.value)} /></Field>
                    <div className="sm:col-span-2">
                      <Field label="Phone Number" required><Input value={emergencyContactPhone} onChange={e => setEmergencyContactPhone(e.target.value)} /></Field>
                    </div>
                  </div>
                </SectionCard>
              </div>
            )}

            {/* Step 5: Documents */}
            {step === 5 && (
              <div className="space-y-5">
                <h2 className="text-lg font-black text-slate-900 mb-2">Document Requirements</h2>
                <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-100">
                  <svg className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <p className="text-xs text-amber-700 font-medium">
                    Requirements for <strong>{isAls ? 'ALS Applicants' : `Grade ${gradeLevel}`}</strong>. Accepted formats: PDF, JPG, PNG.
                  </p>
                </div>
                <div className="space-y-4">
                  {getRequirementsForGrade().map(req => (
                    <div key={req.key} className="bg-slate-50 rounded-xl border border-slate-100 p-4">
                      <Field label={req.label} required={req.required}>
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={e => {
                            const map = { birthCertificate: setBirthCertificate, reportCard: setReportCard, form138: setForm138, certificateOfCompletion: setCertificateOfCompletion, goodMoralCertificate: setGoodMoralCertificate, lastSchoolAttendedCert: setLastSchoolAttendedCert };
                            handleFileChange(e, map[req.key]);
                          }}
                          className="w-full text-sm text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100 transition-colors"
                        />
                      </Field>
                      {req.note && <p className="text-[11px] text-slate-400 mt-1.5 italic">{req.note}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-100">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={() => setStep(s => s - 1)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                  Previous
                </button>
              ) : <div />}

              {step < 5 ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-bold hover:bg-violet-700 transition-colors"
                >
                  Next
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50"
                >
                  {loading ? (
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  )}
                  {loading ? 'Submitting…' : 'Submit Application'}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Enrollment;
