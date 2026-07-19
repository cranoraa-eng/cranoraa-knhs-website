/**
 * SF10 Export Utility
 *
 * Generates an Excel workbook that follows the structure of the official
 * DepEd SF10-JHS "Learner's Permanent Academic Record for Junior High School"
 * (formerly Form 137).
 *
 * One sheet = one classroom/section.  The layout mirrors the paper form:
 *   - Header block   : school info, learner info (one row per student)
 *   - Grade table    : Q1–Q4 + Final Rating per learning area + General Average
 *   - Remarks legend : Grading scale & non-numerical rating
 *   - Certification  : Principal signature block
 */

import * as XLSX from 'xlsx';

/** DepEd JHS learning areas in display order */
export const JHS_LEARNING_AREAS = [
  'Filipino',
  'English',
  'Mathematics',
  'Science',
  'Araling Panlipunan (AP)',
  'Edukasyon sa Pagpapakatao (EsP)',
  'Technology and Livelihood Education (TLE)',
  'MAPEH',
  'Music and Arts',
  'Physical Education and Health',
  'Homeroom Guidance',
];

/** Grading scale rows (bottom legend) */
const GRADE_SCALE = [
  ['Outstanding',           '90-100', 'Passed'],
  ['Very Satisfactory',     '85-89',  'Passed'],
  ['Satisfactory',          '80-84',  'Passed'],
  ['Fairly Satisfactory',   '75-79',  'Passed'],
  ['Did Not Meet Expectations', 'Below 75', 'Failed'],
];

/**
 * Map a subject_name (from the API) to one of the JHS_LEARNING_AREAS display
 * names.  Falls back to the raw name when no match is found.
 */
function mapSubjectToLearningArea(subjectName) {
  if (!subjectName) return subjectName;
  const s = subjectName.trim().toLowerCase();

  if (s.includes('filipino')) return 'Filipino';
  if (s.includes('english')) return 'English';
  if (s.includes('math')) return 'Mathematics';
  if (s.includes('science')) return 'Science';
  if (s.includes('araling') || s === 'ap') return 'Araling Panlipunan (AP)';
  if (s.includes('pagpapakatao') || s === 'esp' || s.includes('edukasyon sa pagp'))
    return 'Edukasyon sa Pagpapakatao (EsP)';
  if (s.includes('tle') || s.includes('livelihood') || s.includes('technology'))
    return 'Technology and Livelihood Education (TLE)';
  if (s === 'mapeh' || s.includes('mapeh')) return 'MAPEH';
  if (s.includes('music') || s.includes('arts'))   return 'Music and Arts';
  if (s.includes('physical education') || s === 'pe' || s.includes('health'))
    return 'Physical Education and Health';
  if (s.includes('homeroom') || s.includes('guidance')) return 'Homeroom Guidance';

  return subjectName; // fallback
}

/**
 * Compute average of non-null quarterly values.
 * Returns the numeric value (not yet rounded) or null.
 */
function calcFinal(quarters) {
  const vals = [quarters.q1, quarters.q2, quarters.q3, quarters.q4]
    .filter(v => v !== null && v !== undefined && !isNaN(Number(v)));
  if (!vals.length) return null;
  return vals.reduce((a, b) => a + Number(b), 0) / vals.length;
}

/** Round to nearest whole number (DepEd rounding) */
function depedRound(v) {
  if (v === null || v === undefined || isNaN(v)) return '';
  return Math.round(v);
}

/** Remarks based on final grade */
function getRemarks(finalGrade) {
  if (finalGrade === null || finalGrade === undefined || finalGrade === '') return '';
  return Number(finalGrade) >= 75 ? 'Passed' : 'Failed';
}

/**
 * Build a full SF10-JHS workbook for one classroom/section.
 *
 * @param {Object} params
 * @param {Object}   params.classroom   - { id, name, subjects: [{id,name,code}] }
 * @param {string}   params.schoolName  - e.g. "Kiwalan National High School"
 * @param {string}   params.schoolId    - e.g. "304147"
 * @param {string}   params.district    - e.g. "Cagayan de Oro City"
 * @param {string}   params.division    - e.g. "Misamis Oriental"
 * @param {string}   params.region      - e.g. "X"
 * @param {string}   params.schoolYear  - e.g. "2023-2024"
 * @param {string}   params.gradeLevel  - e.g. "7"
 * @param {string}   params.section     - e.g. "Sampaguita"
 * @param {string}   params.adviser     - teacher full name
 * @param {Array}    params.students    - enrollment records from /enrollments/?classroom=
 *                                         Each: { student, student_name, student_lrn, ... }
 * @param {Object}   params.gradesMap   - Map of subjectId -> array of grade objects
 *                                         Grade object: { student, quarter, raw_score }
 *
 * @returns {Blob}  .xlsx Blob ready for download
 */
export function generateSF10(params) {
  const {
    classroom,
    schoolName  = 'Kiwalan National High School',
    schoolId    = '304147',
    district    = '',
    division    = '',
    region      = 'X',
    schoolYear  = '',
    gradeLevel  = '',
    section     = '',
    adviser     = '',
    students    = [],
    gradesMap   = {},  // subjectId (string) -> [{ student, quarter, raw_score }]
  } = params;

  const wb = XLSX.utils.book_new();

  // ── Build per-student SF10 data ──────────────────────────────────────────
  // For each student build a map: learning area -> { q1, q2, q3, q4 }
  const studentRows = students.map(enrollment => {
    const studentId = enrollment.student;
    const name = enrollment.student_name || enrollment.student_email || `Student ${studentId}`;
    const lrn  = enrollment.student_lrn  || '';

    // Collect grades per subject
    const areaGrades = {}; // learningArea -> { q1, q2, q3, q4 }

    Object.entries(gradesMap).forEach(([, gradeList]) => {
      gradeList.forEach(g => {
        if (String(g.student) !== String(studentId)) return;
        const area = g._learningArea || 'Unknown';
        if (!areaGrades[area]) areaGrades[area] = {};
        areaGrades[area][`q${g.quarter}`] = g.raw_score;
      });
    });

    // Final grades per area & general average
    const areaFinals = {};
    JHS_LEARNING_AREAS.forEach(area => {
      if (!areaGrades[area]) { areaGrades[area] = {}; }
      const f = calcFinal(areaGrades[area]);
      areaFinals[area] = f !== null ? depedRound(f) : '';
    });

    const finalsWithValues = JHS_LEARNING_AREAS
      .map(a => areaFinals[a])
      .filter(v => v !== '' && !isNaN(Number(v)))
      .map(Number);

    const generalAverage = finalsWithValues.length
      ? depedRound(finalsWithValues.reduce((a, b) => a + b, 0) / finalsWithValues.length)
      : '';

    return { studentId, name, lrn, areaGrades, areaFinals, generalAverage };
  });

  // ── Sheet: SF10 (one worksheet per classroom) ────────────────────────────
  _buildSF10Sheet(wb, {
    classroom, schoolName, schoolId, district, division, region,
    schoolYear, gradeLevel, section, adviser, studentRows,
  });

  // Write workbook to binary
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([wbout], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

/* ─── internal helpers ─────────────────────────────────────────────────────── */

/**
 * Build the SF10 worksheet and append to workbook.
 */
function _buildSF10Sheet(wb, opts) {
  const {
    classroom, schoolName, schoolId, district, division, region,
    schoolYear, gradeLevel, section, adviser, studentRows,
  } = opts;

  // We'll collect rows as arrays then convert
  const aoa = []; // array of arrays

  // ── Row 0: Republic header ───────────────────────────────────────────────
  aoa.push(['Republic of the Philippines']);
  aoa.push(['Department of Education']);
  aoa.push(["Learner's Permanent Academic Record for Junior High School (SF10-JHS)"]);
  aoa.push(['(Formerly Form 137)']);
  aoa.push([]);

  // ── Section info row ─────────────────────────────────────────────────────
  aoa.push([
    'School:', schoolName,
    'School ID:', schoolId,
    'District:', district,
    'Division:', division,
    'Region:', region,
  ]);
  aoa.push([
    `Classified as Grade: ${gradeLevel}`,
    `Section: ${section}`,
    '',
    `School Year: ${schoolYear}`,
    '',
    `Name of Adviser: ${adviser}`,
  ]);
  aoa.push([]);

  // ── Column headers ───────────────────────────────────────────────────────
  const headerRow = [
    '#', 'LRN', "Learner's Name",
    ...JHS_LEARNING_AREAS.flatMap(a => [a, '', '', '', '']),  // Q1-Q4, Final per area
    'General Average', 'Remarks',
  ];

  // Sub-header
  const subHeader = [
    '', '', '',
    ...JHS_LEARNING_AREAS.flatMap(() => ['Q1', 'Q2', 'Q3', 'Q4', 'Final']),
    '', '',
  ];

  aoa.push(headerRow);
  aoa.push(subHeader);

  // ── Data rows ────────────────────────────────────────────────────────────
  studentRows.forEach((sr, idx) => {
    const row = [
      idx + 1,
      sr.lrn,
      sr.name,
      ...JHS_LEARNING_AREAS.flatMap(area => {
        const aq = sr.areaGrades[area] || {};
        const final = sr.areaFinals[area];
        return [
          aq.q1 !== undefined ? depedRound(aq.q1) : '',
          aq.q2 !== undefined ? depedRound(aq.q2) : '',
          aq.q3 !== undefined ? depedRound(aq.q3) : '',
          aq.q4 !== undefined ? depedRound(aq.q4) : '',
          final,
        ];
      }),
      sr.generalAverage,
      sr.generalAverage !== '' ? getRemarks(sr.generalAverage) : '',
    ];
    aoa.push(row);
  });

  aoa.push([]);

  // ── Grading scale legend ─────────────────────────────────────────────────
  aoa.push(['GRADING SCALE']);
  aoa.push(['Description', 'Scale', 'Remarks']);
  GRADE_SCALE.forEach(r => aoa.push(r));
  aoa.push([]);

  // ── Certification block ──────────────────────────────────────────────────
  aoa.push(['CERTIFICATION']);
  aoa.push([
    `I CERTIFY that this is a true record of the learners listed above ` +
    `and that they are eligible for promotion to the next grade level.`,
  ]);
  aoa.push([]);
  aoa.push([`Name of School: ${schoolName}`, '', `School ID: ${schoolId}`]);
  aoa.push([]);
  aoa.push(['________________________', '', '________________________']);
  aoa.push(['Date', '', 'Name of Principal/School Head']);
  aoa.push(['', '', '(Affix School Seal here)']);

  const ws = XLSX.utils.aoa_to_sheet(aoa);

  // ── Column widths ─────────────────────────────────────────────────────────
  const colWidths = [
    { wch: 4  }, // #
    { wch: 16 }, // LRN
    { wch: 30 }, // Name
    ...JHS_LEARNING_AREAS.flatMap(() => [
      { wch: 5 }, { wch: 5 }, { wch: 5 }, { wch: 5 }, { wch: 7 }, // Q1-Q4 + Final
    ]),
    { wch: 10 }, // General Average
    { wch: 8  }, // Remarks
  ];
  ws['!cols'] = colWidths;

  const sheetName = (classroom.name || 'SF10').replace(/[:\\/?\[\]*]/g, '-').substring(0, 31);
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
}

/**
 * High-level helper called from the component.
 *
 * @param {Object} classroom  - { id, name, subjects }
 * @param {Array}  students   - enrollment list from /enrollments/?classroom=
 * @param {Array}  allGrades  - flat list of all grade records for this classroom
 *                             Each record: { student, subject, subject_name, quarter, raw_score, ... }
 * @param {Object} info       - { schoolName, schoolId, district, division, region,
 *                               schoolYear, gradeLevel, section, adviser }
 */
export function exportSF10(classroom, students, allGrades, info = {}) {
  // Build gradesMap: subjectId -> grades[], with _learningArea injected
  const gradesMap = {};
  allGrades.forEach(g => {
    const subjectId = String(g.subject);
    if (!gradesMap[subjectId]) gradesMap[subjectId] = [];

    gradesMap[subjectId].push({
      ...g,
      _learningArea: mapSubjectToLearningArea(g.subject_name),
    });
  });

  const blob = generateSF10({
    classroom,
    gradesMap,
    students,
    schoolName:  info.schoolName  || 'Kiwalan National High School',
    schoolId:    info.schoolId    || '304147',
    district:    info.district    || '',
    division:    info.division    || '',
    region:      info.region      || 'X',
    schoolYear:  info.schoolYear  || '',
    gradeLevel:  info.gradeLevel  || '',
    section:     info.section     || classroom.name || '',
    adviser:     info.adviser     || '',
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `SF10_${(classroom.name || 'Class').replace(/\s+/g, '_')}_${info.schoolYear || 'SY'}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}
