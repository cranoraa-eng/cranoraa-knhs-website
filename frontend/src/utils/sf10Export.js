/**
 * SF10-JHS Export Utility
 *
 * Generates an Excel workbook that exactly replicates the official DepEd
 * SF10-JHS (Form 137) layout — one full form per student, stacked vertically
 * on a single worksheet, matching the paper form's structure.
 *
 * Layout per student (mirroring SF10 FRONT):
 *   Row 1-2  : Republic / DepEd / form title
 *   Row 3    : LEARNER'S INFORMATION (name, LRN, birthdate, sex)
 *   Row 4    : SCHOLASTIC RECORD header (school, grade, section, SY, adviser)
 *   Row 5    : Column headers (LEARNING AREAS | Q1 | Q2 | Q3 | Q4 | FINAL | REMARKS)
 *   Row 6-16 : One row per JHS learning area with grades
 *   Row 17   : General Average row
 *   Row 18   : Remedial Classes header
 *   Row 19-22: Remedial rows (blank)
 *   Row 23   : Blank separator between students
 */

import * as XLSX from 'xlsx';

// ─── Constants ───────────────────────────────────────────────────────────────

/** Official JHS learning areas per SF10 */
const JHS_LEARNING_AREAS = [
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

/** Grading scale for legend block */
const GRADE_SCALE = [
  ['Outstanding',               '90-100',   'Passed'],
  ['Very Satisfactory',         '85-89',    'Passed'],
  ['Satisfactory',              '80-84',    'Passed'],
  ['Fairly Satisfactory',       '75-79',    'Passed'],
  ['Did Not Meet Expectations', 'Below 75', 'Failed'],
];

// Column indices (0-based) — A=0, B=1, C=2, D=3, E=4, F=5
// Layout: A=Learning Areas, B=T1, C=T2, D=T3, E=Final Rating, F=Remarks
const COL = { AREA: 0, T1: 1, T2: 2, T3: 3, FINAL: 4, REMARKS: 5 };
const TOTAL_COLS = 6;

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Map API subject_name to official SF10 learning area label */
function mapToLearningArea(subjectName) {
  if (!subjectName) return null;
  const s = subjectName.trim().toLowerCase();
  if (s.includes('filipino'))                                      return 'Filipino';
  if (s.includes('english'))                                       return 'English';
  if (s.includes('math'))                                          return 'Mathematics';
  if (s.includes('science'))                                       return 'Science';
  if (s.includes('araling') || s === 'ap')                        return 'Araling Panlipunan (AP)';
  if (s.includes('pagpapakatao') || s === 'esp')                  return 'Edukasyon sa Pagpapakatao (EsP)';
  if (s.includes('tle') || s.includes('livelihood') || s.includes('technology')) return 'Technology and Livelihood Education (TLE)';
  if (s === 'mapeh')                                               return 'MAPEH';
  if (s.includes('music') || s.includes('arts'))                  return 'Music and Arts';
  if (s.includes('physical') || s === 'pe' || s.includes('health')) return 'Physical Education and Health';
  if (s.includes('homeroom') || s.includes('guidance'))           return 'Homeroom Guidance';
  return null; // unrecognised — will be skipped in learning-area lookup
}

/** DepEd rounding: round half-up to nearest whole number */
function depedRound(v) {
  if (v === null || v === undefined || v === '' || isNaN(Number(v))) return '';
  return Math.round(Number(v));
}

/** Compute term average */
function calcFinalGrade(terms) {
  const vals = ['q1','q2','q3']
    .map(k => terms[k])
    .filter(v => v !== null && v !== undefined && v !== '' && !isNaN(Number(v)))
    .map(Number);
  if (!vals.length) return '';
  return depedRound(vals.reduce((a, b) => a + b, 0) / vals.length);
}

/** Passed / Failed based on final grade */
function remarks(finalGrade) {
  if (finalGrade === '' || finalGrade === null) return '';
  return Number(finalGrade) >= 75 ? 'Passed' : 'Failed';
}

/**
 * Write a value into the sheet's cell map.
 * r = 0-based row, c = 0-based col
 */
function setCell(ws, r, c, value, opts = {}) {
  const addr = XLSX.utils.encode_cell({ r, c });
  const cellType = typeof value === 'number' ? 'n' : 's';
  ws[addr] = { v: value, t: cellType, ...opts };
}

/** Update the sheet range to include this row */
function extendRange(ws, maxRow, maxCol) {
  ws['!ref'] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: maxRow, c: maxCol } });
}

// ─── Per-student SF10 block builder ─────────────────────────────────────────

/**
 * Append one full SF10 form for a single student into the worksheet,
 * starting at `startRow` (0-based).  Returns the next available row.
 */
function appendStudentSF10(ws, startRow, student, schoolInfo) {
  let r = startRow;
  const {
    schoolName, schoolId, district, division, region,
    schoolYear, gradeLevel, section, adviser,
  } = schoolInfo;

  // ── Title block ──────────────────────────────────────────────────────────
  setCell(ws, r, 0, 'SF 10 -JHS');
  r++;
  setCell(ws, r, 0, 'Republic of the Philippines');
  r++;
  setCell(ws, r, 0, 'Department of Education');
  r++;
  setCell(ws, r, 0, "Learner's Permanent Academic Record for Junior High School (SF10-JHS)");
  r++;
  setCell(ws, r, 0, '(Formerly Form 137)');
  r++;

  // ── Learner's Information ────────────────────────────────────────────────
  setCell(ws, r, 0, "LEARNER'S INFORMATION");
  r++;

  // Parse name parts
  const fullName = student.name || '';
  const nameParts = fullName.split(',').map(p => p.trim());
  const lastName  = nameParts[0] || fullName;
  const restParts = (nameParts[1] || '').split(' ').filter(Boolean);
  const firstName  = restParts[0] || '';
  const middleName = restParts.slice(1).join(' ') || '';

  setCell(ws, r, 0, 'LAST NAME:');
  setCell(ws, r, 1, lastName);
  setCell(ws, r, 2, 'FIRST NAME:');
  setCell(ws, r, 3, firstName);
  setCell(ws, r, 4, 'MIDDLE NAME:');
  setCell(ws, r, 5, middleName);
  r++;
  setCell(ws, r, 0, 'Learner Reference Number (LRN):');
  setCell(ws, r, 1, student.lrn || '');
  setCell(ws, r, 2, 'Birthdate (mm/dd/yyyy):');
  setCell(ws, r, 3, student.birthdate || '');
  setCell(ws, r, 4, 'Sex:');
  setCell(ws, r, 5, student.sex || '');
  r++;
  r++; // blank

  // ── Eligibility block ─────────────────────────────────────────────────────
  setCell(ws, r, 0, 'ELIGIBILITY FOR JHS ENROLMENT');
  r++;
  setCell(ws, r, 0, 'Elementary School Completer:');
  setCell(ws, r, 2, 'General Average:');
  setCell(ws, r, 4, 'Citation (if any):');
  r++;
  setCell(ws, r, 0, 'Name of Elementary School:');
  setCell(ws, r, 3, 'School ID:');
  setCell(ws, r, 4, 'Address of School:');
  r++;
  r++; // blank

  // ── Scholastic Record header ──────────────────────────────────────────────
  setCell(ws, r, 0, 'SCHOLASTIC RECORD');
  r++;
  setCell(ws, r, 0, 'School:');
  setCell(ws, r, 1, schoolName);
  setCell(ws, r, 2, 'School ID:');
  setCell(ws, r, 3, schoolId);
  setCell(ws, r, 4, 'District:');
  setCell(ws, r, 5, district);
  r++;
  setCell(ws, r, 0, 'Division:');
  setCell(ws, r, 1, division);
  setCell(ws, r, 3, 'Region:');
  setCell(ws, r, 4, region);
  r++;
  setCell(ws, r, 0, `Classified as Grade: ${gradeLevel}`);
  setCell(ws, r, 2, `Section: ${section}`);
  setCell(ws, r, 4, `School Year: ${schoolYear}`);
  r++;
  setCell(ws, r, 0, `Name of Adviser/Teacher: ${adviser}`);
  setCell(ws, r, 4, 'Signature: _____________');
  r++;

  // ── Grade table column headers ────────────────────────────────────────────
  setCell(ws, r, COL.AREA,    'LEARNING AREAS');
  setCell(ws, r, COL.T1,      'Term Rating');
  setCell(ws, r, COL.T2,      '');
  setCell(ws, r, COL.T3,      '');
  setCell(ws, r, COL.FINAL,   'FINAL');
  setCell(ws, r, COL.REMARKS, 'REMARKS');
  r++;
  setCell(ws, r, COL.AREA,    '');
  setCell(ws, r, COL.T1,      '1');
  setCell(ws, r, COL.T2,      '2');
  setCell(ws, r, COL.T3,      '3');
  setCell(ws, r, COL.FINAL,   'RATING');
  setCell(ws, r, COL.REMARKS, '');
  r++;

  // ── Learning area grade rows ──────────────────────────────────────────────
  const areaGrades = student.areaGrades || {};
  let finalsForAvg = [];

  JHS_LEARNING_AREAS.forEach(area => {
    const aq = areaGrades[area] || {};
    const finalGrade = calcFinalGrade(aq);
    if (finalGrade !== '') finalsForAvg.push(Number(finalGrade));

    setCell(ws, r, COL.AREA,    area);
    setCell(ws, r, COL.T1,      aq.q1 !== undefined && aq.q1 !== '' ? depedRound(aq.q1) : '');
    setCell(ws, r, COL.T2,      aq.q2 !== undefined && aq.q2 !== '' ? depedRound(aq.q2) : '');
    setCell(ws, r, COL.T3,      aq.q3 !== undefined && aq.q3 !== '' ? depedRound(aq.q3) : '');
    setCell(ws, r, COL.FINAL,   finalGrade);
    setCell(ws, r, COL.REMARKS, remarks(finalGrade));
    r++;
  });

  // ── General Average row ───────────────────────────────────────────────────
  const genAvg = finalsForAvg.length
    ? depedRound(finalsForAvg.reduce((a, b) => a + b, 0) / finalsForAvg.length)
    : '';
  setCell(ws, r, COL.AREA,    'General Average');
  setCell(ws, r, COL.FINAL,   genAvg);
  setCell(ws, r, COL.REMARKS, remarks(genAvg));
  r++;
  r++; // blank

  // ── Remedial Classes block ────────────────────────────────────────────────
  setCell(ws, r, 0, 'Remedial Classes  Conducted from (mm/dd/yyyy) _________________ to (mm/dd/yyyy) _________________');
  r++;
  setCell(ws, r, 0, 'Learning Areas');
  setCell(ws, r, 1, 'Final Rating');
  setCell(ws, r, 2, 'Remedial Class Mark');
  setCell(ws, r, 4, 'Recomputed Final Grade');
  setCell(ws, r, 6, 'Remarks');
  r++;
  // 3 blank remedial rows
  for (let i = 0; i < 3; i++) {
    setCell(ws, r, 0, ''); r++;
  }
  r++; // blank separator between students

  return r;
}

// ─── Grading scale + certification ───────────────────────────────────────────

function appendLegendAndCertification(ws, startRow, schoolName, schoolId) {
  let r = startRow;

  setCell(ws, r, 0, 'GRADING SCALE / LEGEND');
  r++;
  setCell(ws, r, 0, 'Description');
  setCell(ws, r, 1, 'Grading Scale');
  setCell(ws, r, 2, 'Remarks');
  setCell(ws, r, 4, 'Marking');
  setCell(ws, r, 5, 'Non-numerical Rating');
  r++;

  const markings = [
    ['AO', 'Always Observed'],
    ['SO', 'Sometimes Observed'],
    ['RO', 'Rarely Observed'],
    ['NO', 'Not Observed'],
    ['',   ''],
  ];

  GRADE_SCALE.forEach(([desc, scale, rem], i) => {
    setCell(ws, r, 0, desc);
    setCell(ws, r, 1, scale);
    setCell(ws, r, 2, rem);
    if (markings[i]) {
      setCell(ws, r, 4, markings[i][0]);
      setCell(ws, r, 5, markings[i][1]);
    }
    r++;
  });

  r++;
  setCell(ws, r, 0, 'CERTIFICATION');
  r++;
  setCell(ws, r, 0,
    'I CERTIFY that this is a true record of the learner named above with the LRN indicated ' +
    'and that he/she is eligible for admission to the next grade level.'
  );
  r++;
  setCell(ws, r, 0, `Name of School: ${schoolName}`);
  setCell(ws, r, 3, `School ID: ${schoolId}`);
  r++;
  setCell(ws, r, 0, 'Last School Year Attended: ______________');
  r++;
  r++;
  setCell(ws, r, 0, '________________________');
  setCell(ws, r, 3, '________________________');
  r++;
  setCell(ws, r, 0, 'Date');
  setCell(ws, r, 3, 'Name of Principal/School Head over Printed Name');
  r++;
  setCell(ws, r, 5, '(Affix School Seal here)');
  r++;
  setCell(ws, r, 0, 'Forwarded:');
  r++;

  return r;
}

// ─── Main workbook builder ────────────────────────────────────────────────────

/**
 * Build a workbook where every student occupies their own stacked SF10 block.
 * @param {Object[]} studentData  - processed student objects with areaGrades
 * @param {Object}   schoolInfo   - school metadata
 * @param {string}   sheetLabel   - worksheet tab name (max 31 chars)
 * @returns {Blob}
 */
function buildWorkbook(studentData, schoolInfo, sheetLabel) {
  const wb = XLSX.utils.book_new();
  const ws = { '!cols': buildColWidths() };

  let currentRow = 0;

  studentData.forEach(student => {
    currentRow = appendStudentSF10(ws, currentRow, student, schoolInfo);
    // Append individual certification+legend after each student form
    currentRow = appendLegendAndCertification(
      ws, currentRow,
      schoolInfo.schoolName,
      schoolInfo.schoolId
    );
    // Visual page break between students
    currentRow += 2;
  });

  extendRange(ws, currentRow, TOTAL_COLS - 1);

  const safeName = sheetLabel.replace(/[:\\/?\[\]*]/g, '-').substring(0, 31);
  XLSX.utils.book_append_sheet(wb, ws, safeName || 'SF10');

  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([wbout], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

function buildColWidths() {
  return [
    { wch: 46 }, // A – Learning Area (wide)
    { wch: 8  }, // B – T1
    { wch: 8  }, // C – T2
    { wch: 8  }, // D – T3
    { wch: 12 }, // E – Final Rating
    { wch: 10 }, // F – Remarks
  ];
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Main entry point called from the component.
 *
 * @param {Object}   classroom   - { id, name }
 * @param {Array}    enrollments - from /enrollments/?classroom=
 *   Each: { student, student_name, student_lrn, student_first_name,
 *            student_last_name, student_birthdate, student_sex }
 * @param {Array}    allGrades   - flat grade records from /grades/?classroom=
 *   Each: { student, subject, subject_name, quarter (1-4), raw_score }
 * @param {Object}   info        - schoolName, schoolId, district, division,
 *                                 region, schoolYear, gradeLevel, section, adviser
 */
export function exportSF10(classroom, enrollments, allGrades, info = {}) {
  const schoolInfo = {
    schoolName: info.schoolName  || 'Kiwalan National High School',
    schoolId:   info.schoolId    || '304147',
    district:   info.district    || '',
    division:   info.division    || '',
    region:     info.region      || 'X',
    schoolYear: info.schoolYear  || '',
    gradeLevel: info.gradeLevel  || '',
    section:    info.section     || classroom.name || '',
    adviser:    info.adviser     || '',
  };

  // ── Build per-student areaGrades map ────────────────────────────────────
  // grade index: studentId -> learningArea -> { q1, q2, q3, q4 }
  const gradeIndex = {};
  allGrades.forEach(g => {
    const sid = String(g.student);
    const area = mapToLearningArea(g.subject_name);
    if (!area) return;                   // skip unrecognised subjects
    if (!gradeIndex[sid]) gradeIndex[sid] = {};
    if (!gradeIndex[sid][area]) gradeIndex[sid][area] = {};
    gradeIndex[sid][area][`q${g.quarter}`] = g.raw_score;
  });

  // ── Build student data list ──────────────────────────────────────────────
  const studentData = enrollments.map(e => {
    const sid = String(e.student);
    // Prefer separate name fields; fall back to combined student_name
    const lastName  = e.student_last_name  || '';
    const firstName = e.student_first_name || '';
    const fullName  = lastName && firstName
      ? `${lastName}, ${firstName}`
      : (e.student_name || `Student ${sid}`);

    return {
      name:      fullName,
      lrn:       e.student_lrn || '',
      birthdate: e.student_birthdate || '',
      sex:       e.student_sex || e.sex || '',
      areaGrades: gradeIndex[sid] || {},
    };
  });

  const blob = buildWorkbook(studentData, schoolInfo, classroom.name || 'SF10');

  const url = URL.createObjectURL(blob);
  const a   = document.createElement('a');
  a.href     = url;
  a.download = `SF10_${(classroom.name || 'Class').replace(/\s+/g, '_')}_${schoolInfo.schoolYear || 'SY'}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}
