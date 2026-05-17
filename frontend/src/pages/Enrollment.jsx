import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import Swal from 'sweetalert2';

const Enrollment = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  // Personal Information
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [sex, setSex] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [placeOfBirth, setPlaceOfBirth] = useState('');
  const [nationality, setNationality] = useState('Filipino');
  const [religion, setReligion] = useState('');

  // Address Information
  const [streetAddress, setStreetAddress] = useState('');
  const [barangay, setBarangay] = useState('');
  const [cityMunicipality, setCityMunicipality] = useState('');
  const [province, setProvince] = useState('');
  const [zipCode, setZipCode] = useState('');

  // Parent/Guardian Information
  const [fatherName, setFatherName] = useState('');
  const [fatherOccupation, setFatherOccupation] = useState('');
  const [fatherContact, setFatherContact] = useState('');
  const [motherName, setMotherName] = useState('');
  const [motherOccupation, setMotherOccupation] = useState('');
  const [motherContact, setMotherContact] = useState('');
  const [guardianName, setGuardianName] = useState('');
  const [guardianRelationship, setGuardianRelationship] = useState('');
  const [guardianContact, setGuardianContact] = useState('');

  // Academic Information
  const [gradeLevel, setGradeLevel] = useState('');
  const [previousSchool, setPreviousSchool] = useState('');
  const [previousSchoolAddress, setPreviousSchoolAddress] = useState('');
  const [lrn, setLrn] = useState('');
  const [isAls, setIsAls] = useState(false);

  // Contact Information
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  // Emergency Contact
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactRelationship, setEmergencyContactRelationship] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');

  // Document Uploads
  const [birthCertificate, setBirthCertificate] = useState(null);
  const [reportCard, setReportCard] = useState(null);
  const [form138, setForm138] = useState(null);
  const [certificateOfCompletion, setCertificateOfCompletion] = useState(null);
  const [goodMoralCertificate, setGoodMoralCertificate] = useState(null);
  const [lastSchoolAttendedCert, setLastSchoolAttendedCert] = useState(null);

  const getRequirementsForGrade = () => {
    if (isAls) {
      return [
        { key: 'birthCertificate', label: 'PSA Birth Certificate (Photocopy)', required: true, note: 'If unavailable, submit Baptismal Certificate or Local Live Birth' },
        { key: 'lastSchoolAttendedCert', label: 'Certificate/Report Card of Last School Year Attended', required: true, note: '' }
      ];
    }
    
    switch (gradeLevel) {
      case '7':
        return [
          { key: 'form138', label: 'Grade 6 Candidate for Graduation Certificate (Form 138)', required: true, note: '' },
          { key: 'birthCertificate', label: 'PSA Birth Certificate (Photocopy)', required: true, note: 'If unavailable, submit Baptismal Certificate or Local Live Birth' }
        ];
      case '11':
        return [
          { key: 'birthCertificate', label: 'PSA Birth Certificate (Photocopy)', required: true, note: 'If unavailable, submit Baptismal Certificate or Local Live Birth' },
          { key: 'reportCard', label: 'Photocopy of Progress Report Card', required: true, note: '' },
          { key: 'certificateOfCompletion', label: 'Grade 10 Candidate for Completion Certificate', required: true, note: '' }
        ];
      default:
        return [
          { key: 'birthCertificate', label: 'PSA Birth Certificate (Photocopy)', required: true, note: 'If unavailable, submit Baptismal Certificate or Local Live Birth' },
          { key: 'reportCard', label: 'Photocopy of Progress Report Card', required: true, note: '' },
          { key: 'goodMoralCertificate', label: 'Certificate of Good Moral Character', required: false, note: '' }
        ];
    }
  };

  const handleFileChange = (e, setter) => {
    if (e.target.files[0]) {
      setter(e.target.files[0]);
    }
  };

  const handleNextStep = () => {
    if (step === 1) {
      if (!firstName || !lastName || !sex || !dateOfBirth) {
        Swal.fire({
          icon: 'error',
          title: 'Missing Information',
          text: 'Please fill in all required fields.',
        });
        return;
      }
    } else if (step === 2) {
      if (!streetAddress || !barangay || !cityMunicipality || !province) {
        Swal.fire({
          icon: 'error',
          title: 'Missing Information',
          text: 'Please fill in all required address fields.',
        });
        return;
      }
    } else if (step === 3) {
      if (!fatherName || !motherName) {
        Swal.fire({
          icon: 'error',
          title: 'Missing Information',
          text: 'Please provide parent/guardian information.',
        });
        return;
      }
    } else if (step === 4) {
      if (!gradeLevel || !email || !phoneNumber) {
        Swal.fire({
          icon: 'error',
          title: 'Missing Information',
          text: 'Please fill in all required academic and contact fields.',
        });
        return;
      }
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        Swal.fire({
          icon: 'error',
          title: 'Invalid Email',
          text: 'Please enter a valid email address.',
        });
        return;
      }
    }
    setStep(step + 1);
  };

  const handlePreviousStep = () => {
    setStep(step - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Only allow submission on step 5 (document uploads)
    if (step !== 5) {
      return;
    }
    
    // Validate required files based on grade level and ALS status
    const requirements = getRequirementsForGrade();
    const missingFiles = [];
    
    requirements.forEach(req => {
      if (req.required) {
        let hasFile = false;
        if (req.key === 'birthCertificate' && birthCertificate) hasFile = true;
        else if (req.key === 'reportCard' && reportCard) hasFile = true;
        else if (req.key === 'form138' && form138) hasFile = true;
        else if (req.key === 'certificateOfCompletion' && certificateOfCompletion) hasFile = true;
        else if (req.key === 'goodMoralCertificate' && goodMoralCertificate) hasFile = true;
        else if (req.key === 'lastSchoolAttendedCert' && lastSchoolAttendedCert) hasFile = true;
        
        if (!hasFile) {
          missingFiles.push(req.label);
        }
      }
    });
    
    if (missingFiles.length > 0) {
      Swal.fire({
        icon: 'error',
        title: 'Missing Required Documents',
        text: `Please upload the following required documents:\n${missingFiles.map(f => '- ' + f).join('\n')}`,
      });
      return;
    }
    
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('first_name', firstName);
      formData.append('last_name', lastName);
      formData.append('middle_name', middleName);
      formData.append('sex', sex);
      formData.append('date_of_birth', dateOfBirth);
      formData.append('place_of_birth', placeOfBirth);
      formData.append('nationality', nationality);
      formData.append('religion', religion);
      formData.append('street_address', streetAddress);
      formData.append('barangay', barangay);
      formData.append('city_municipality', cityMunicipality);
      formData.append('province', province);
      formData.append('zip_code', zipCode);
      formData.append('father_name', fatherName);
      formData.append('father_occupation', fatherOccupation);
      formData.append('father_contact', fatherContact);
      formData.append('mother_name', motherName);
      formData.append('mother_occupation', motherOccupation);
      formData.append('mother_contact', motherContact);
      formData.append('guardian_name', guardianName);
      formData.append('guardian_relationship', guardianRelationship);
      formData.append('guardian_contact', guardianContact);
      formData.append('grade_level', gradeLevel);
      formData.append('previous_school', previousSchool);
      formData.append('previous_school_address', previousSchoolAddress);
      formData.append('lrn', lrn);
      formData.append('is_als', isAls);
      formData.append('email', email);
      formData.append('phone_number', phoneNumber);
      formData.append('emergency_contact_name', emergencyContactName);
      formData.append('emergency_contact_relationship', emergencyContactRelationship);
      formData.append('emergency_contact_phone', emergencyContactPhone);

      // Add files
      if (birthCertificate) formData.append('birth_certificate', birthCertificate);
      if (reportCard) formData.append('report_card', reportCard);
      if (form138) formData.append('form_138', form138);
      if (certificateOfCompletion) formData.append('certificate_of_completion', certificateOfCompletion);
      if (goodMoralCertificate) formData.append('good_moral_certificate', goodMoralCertificate);
      if (lastSchoolAttendedCert) formData.append('last_school_attended_cert', lastSchoolAttendedCert);

      await api.post('/enrollment-applications/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setLoading(false);

      Swal.fire({
        icon: 'success',
        title: 'Application Submitted!',
        text: 'Your enrollment application has been submitted successfully. We will review your application and contact you soon.',
        confirmButtonText: 'OK',
      }).then(() => {
        navigate('/');
      });
    } catch (error) {
      setLoading(false);
      Swal.fire({
        icon: 'error',
        title: 'Submission Failed',
        text: error.response?.data?.error || 'An error occurred. Please try again.',
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Enrollment Application</h1>
          <p className="text-gray-600">Kiwalan National High School - School Year 2026-2027</p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-between mb-8">
          {[1, 2, 3, 4, 5].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                  step >= s ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-600'
                }`}
              >
                {s}
              </div>
              {s < 5 && (
                <div
                  className={`w-16 h-1 ${step > s ? 'bg-purple-600' : 'bg-gray-200'}`}
                ></div>
              )}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <form>
            {/* Step 1: Personal Information */}
            {step === 1 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Personal Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Middle Name
                    </label>
                    <input
                      type="text"
                      value={middleName}
                      onChange={(e) => setMiddleName(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Sex <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={sex}
                      onChange={(e) => setSex(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      required
                    >
                      <option value="">Select</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Date of Birth <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Place of Birth
                    </label>
                    <input
                      type="text"
                      value={placeOfBirth}
                      onChange={(e) => setPlaceOfBirth(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Nationality
                    </label>
                    <input
                      type="text"
                      value={nationality}
                      onChange={(e) => setNationality(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Religion
                    </label>
                    <input
                      type="text"
                      value={religion}
                      onChange={(e) => setReligion(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Address Information */}
            {step === 2 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Address Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Street Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={streetAddress}
                      onChange={(e) => setStreetAddress(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Barangay <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={barangay}
                      onChange={(e) => setBarangay(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      City/Municipality <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={cityMunicipality}
                      onChange={(e) => setCityMunicipality(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Province <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={province}
                      onChange={(e) => setProvince(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Zip Code
                    </label>
                    <input
                      type="text"
                      value={zipCode}
                      onChange={(e) => setZipCode(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Parent/Guardian Information */}
            {step === 3 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Parent/Guardian Information</h2>
                <div className="space-y-6">
                  <div className="bg-purple-50 p-6 rounded-lg">
                    <h3 className="font-semibold text-gray-800 mb-4">Father's Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Father's Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={fatherName}
                          onChange={(e) => setFatherName(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Occupation
                        </label>
                        <input
                          type="text"
                          value={fatherOccupation}
                          onChange={(e) => setFatherOccupation(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Contact Number
                        </label>
                        <input
                          type="text"
                          value={fatherContact}
                          onChange={(e) => setFatherContact(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 p-6 rounded-lg">
                    <h3 className="font-semibold text-gray-800 mb-4">Mother's Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Mother's Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={motherName}
                          onChange={(e) => setMotherName(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Occupation
                        </label>
                        <input
                          type="text"
                          value={motherOccupation}
                          onChange={(e) => setMotherOccupation(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Contact Number
                        </label>
                        <input
                          type="text"
                          value={motherContact}
                          onChange={(e) => setMotherContact(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-50 p-6 rounded-lg">
                    <h3 className="font-semibold text-gray-800 mb-4">Guardian Information (if applicable)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Guardian's Name
                        </label>
                        <input
                          type="text"
                          value={guardianName}
                          onChange={(e) => setGuardianName(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Relationship
                        </label>
                        <input
                          type="text"
                          value={guardianRelationship}
                          onChange={(e) => setGuardianRelationship(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Contact Number
                        </label>
                        <input
                          type="text"
                          value={guardianContact}
                          onChange={(e) => setGuardianContact(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Academic & Contact Information */}
            {step === 4 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Academic & Contact Information</h2>
                <div className="space-y-6">
                  <div className="bg-purple-50 p-6 rounded-lg">
                    <h3 className="font-semibold text-gray-800 mb-4">Academic Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Grade Level Applying For <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={gradeLevel}
                          onChange={(e) => setGradeLevel(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          required
                        >
                          <option value="">Select Grade Level</option>
                          <option value="7">Grade 7</option>
                          <option value="8">Grade 8</option>
                          <option value="9">Grade 9</option>
                          <option value="10">Grade 10</option>
                          <option value="11">Grade 11</option>
                          <option value="12">Grade 12</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Learner Reference Number (LRN)
                        </label>
                        <input
                          type="text"
                          value={lrn}
                          onChange={(e) => setLrn(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          placeholder="12-digit LRN"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Previous School Attended
                        </label>
                        <input
                          type="text"
                          value={previousSchool}
                          onChange={(e) => setPreviousSchool(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Previous School Address
                        </label>
                        <textarea
                          value={previousSchoolAddress}
                          onChange={(e) => setPreviousSchoolAddress(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          rows={2}
                        ></textarea>
                      </div>
                      <div className="md:col-span-2">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={isAls}
                            onChange={(e) => setIsAls(e.target.checked)}
                            className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">I am an Alternative Learning System (ALS) applicant</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 p-6 rounded-lg">
                    <h3 className="font-semibold text-gray-800 mb-4">Contact Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Email Address <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Phone Number <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-red-50 p-6 rounded-lg">
                    <h3 className="font-semibold text-gray-800 mb-4">Emergency Contact</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Emergency Contact Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={emergencyContactName}
                          onChange={(e) => setEmergencyContactName(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Relationship <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={emergencyContactRelationship}
                          onChange={(e) => setEmergencyContactRelationship(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          required
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Emergency Contact Phone <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={emergencyContactPhone}
                          onChange={(e) => setEmergencyContactPhone(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 5: Document Uploads */}
            {step === 5 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Document Requirements</h2>
                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mb-6">
                  <p className="text-sm text-yellow-800">
                    <strong>Requirements for {isAls ? 'ALS Applicants' : `Grade ${gradeLevel}`}:</strong>
                  </p>
                </div>
                <div className="space-y-4">
                  {getRequirementsForGrade().map((req) => (
                    <div key={req.key} className="bg-gray-50 p-4 rounded-lg">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        {req.label} {req.required && <span className="text-red-500">*</span>}
                      </label>
                      <input
                        type="file"
                        onChange={(e) => {
                          if (req.key === 'birthCertificate') handleFileChange(e, setBirthCertificate);
                          else if (req.key === 'reportCard') handleFileChange(e, setReportCard);
                          else if (req.key === 'form138') handleFileChange(e, setForm138);
                          else if (req.key === 'certificateOfCompletion') handleFileChange(e, setCertificateOfCompletion);
                          else if (req.key === 'goodMoralCertificate') handleFileChange(e, setGoodMoralCertificate);
                          else if (req.key === 'lastSchoolAttendedCert') handleFileChange(e, setLastSchoolAttendedCert);
                        }}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        accept=".pdf,.jpg,.jpeg,.png"
                      />
                      {req.note && (
                        <p className="text-xs text-gray-500 mt-2 italic">{req.note}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8">
              {step > 1 && (
                <button
                  type="button"
                  onClick={handlePreviousStep}
                  className="px-6 py-3 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Previous
                </button>
              )}
              {step < 5 ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="ml-auto px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Next
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="ml-auto px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Submitting...' : 'Submit Application'}
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
