/**
 * SF10-JHS Styled Export (Template-based)
 *
 * Replicates the exact Excel design from the official SF10 template:
 * - All borders, merged cells, fonts, alignments
 * - Per-student form layout matching the paper form exactly
 * - Cell styling with bold headers, centered text, borders
 */

import * as XLSX from 'xlsx';

// ═══ CONSTANTS ═══════════════════════════════════════════════════════════════

const JHS_AREAS = [
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

const GRADE_SCALE = [
  ['Outstanding',               '90-100',   'Passed'],
  ['Very Satisfactory',         '85-89',    'Passed'],
  ['Satisfactory',              '80-84',    'Passed'],
  ['Fairly Satisfactory',       '75-79',    'Passed'],
  ['Did Not Meet Expectations', 'Below 75', 'Failed'],
];

// ═══ STYLING HELPERS ═════════════════════════════════════════════════════════

/** Standard cell with border */
const bordered = {
  border: {
    top:    { style: 'thin', color: { rgb: '000000' } },
    bottom: { style: 'thin', color: { rgb: '000000' } },
    left:   { style: 'thin', color: { rgb: '000000' } },
    right:  { style: 'thin', color: { rgb: '000000' } },
  }
};

/** Bold text */
const bold = { font: { bold: true, sz: 11 } };

/** Centered alignment */
const centered = { alignment: { horizontal: 'center', vertical: 'center', wrapText: true } };

/** Left aligned */
const leftAligned = { alignment: { horizontal: 'left', vertical: 'center', wrapText: true } };

/** Header style (bold + centered + bordered) */
const headerStyle = { ...bold, ...centered, ...bordered };

/** Data cell style (bordered + left-aligned) */
const dataStyle = { ...bordered, ...leftAligned };

/** Number cell style (bordered + centered) */
const numStyle = { ...bordered, ...centered };

/** Title style (bold + centered, no border) */
const titleStyle = { ...bold, ...centered };

/** Plain centered (no border) */
const plainCentered = { ...centered };

// ═══ HELPER FUNCTIONS ════════════════════════════════════════════════════════

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
  return null;
}

/** DepEd rounding: round half-up to nearest whole number */
function depedRound(v) {
  if (v === null || v === undefined || v === '' || isNaN(Number(v))) return '';
  return Math.round(Number(v));
}

/** Compute quarterly average */
function calcFinalGrade(quarters) {
  const vals = ['q1','q2','q3','q4']
    .map(k => quarters[k])
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
 * Write a styled cell into the worksheet
 */
function setCell(ws, r, c, value, style = {}) {
  const addr = XLSX.utils.encode_cell({ r, c });
  const cellType = typeof value === 'number' ? 'n' : 's';
  ws[addr] = { 
    v: value, 
    t: cellType, 
    s: style
  };
}

/**
 * Merge cells in the worksheet
 */
function mergeCells(ws, startRow, startCol, endRow, endCol) {
  if (!ws['!merges']) ws['!merges'] = [];
  ws['!merges'].push({
    s: { r: startRow, c: startCol },
    e: { r: endRow, c: endCol }
  });
}

/** Update the sheet range */
function extendRange(ws, maxRow, maxCol) {
  ws['!ref'] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: maxRow, c: maxCol } });
}

// ═══ STUDENT SF10 BLOCK BUILDER ═════════════════════════════════════════════

/**
 * Append one complete SF10 form for a single student with exact template styling
 */
function appendStudentSF10(ws, startRow, student, schoolInfo) {
  let r = startRow;
  const {
    schoolName, schoolId, district, division, region,
    schoolYear, gradeLevel, section, adviser,
  } = schoolInfo;

  // ─── Title Block (Rows 1-5) ─────────────────────────────────────────────
  setCell(ws, r, 0, 'SF 10-JHS', titleStyle);
  mergeCells(ws, r, 0, r, 6);
  r++;
  
  setCell(ws, r, 0, 'Republic of the Philippines', titleStyle);
  mergeCells(ws, r, 0, r, 6);
  r++;
  
  setCell(ws, r, 0, 'Department of Education', titleStyle);
  mergeCells(ws, r, 0, r, 6);
  r++;
  
  setCell(ws, r, 0, "Learner's Permanent Academic Record for Junior High School (SF10-JHS)", titleStyle);
  mergeCells(ws, r, 0, r, 6);
  r++;
  
  setCell(ws, r, 0, '(Formerly Form 137)', plainCentered);
  mergeCells(ws, r, 0, r, 6);
  r++;
  r++; // blank

  // ─── Learner's Information ──────────────────────────────────────────────
  setCell(ws, r, 0, "LEARNER'S INFORMATION", headerStyle);
  mergeCells(ws, r, 0, r, 6);
  r++;

  // Parse name
  const fullName = student.name || '';
  const nameParts = fullName.split(',').map(p => p.trim());
  const lastName  = nameParts[0] || fullName;
  const restParts = (nameParts[1] || '').split(' ').filter(Boolean);
  const firstName  = restParts[0] || '';
  const middleName = restParts.slice(1).join(' ') || '';

  setCell(ws, r, 0, 'LAST NAME:', headerStyle);
  setCell(ws, r, 1, lastName, dataStyle);
  mergeCells(ws, r, 1, r, 2);
  setCell(ws, r, 3, 'FIRST NAME:', headerStyle);
  setCell(ws, r, 4, firstName, dataStyle);
  setCell(ws, r, 5, 'MIDDLE NAME:', headerStyle);
  setCell(ws, r, 6, middleName, dataStyle);
  r++;
  
  setCell(ws, r, 0, 'Learner Reference Number (LRN):', headerStyle);
  setCell(ws, r, 1, student.lrn || '', dataStyle);
  mergeCells(ws, r, 1, r, 2);
  setCell(ws, r, 3, 'Birthdate (mm/dd/yyyy):', headerStyle);
  setCell(ws, r, 4, student.birthdate || '', dataStyle);
  setCell(ws, r, 5, 'Sex:', headerStyle);
  setCell(ws, r, 6, student.sex || '', dataStyle);
  r++;
  r++; // blank

  // ─── Eligibility Block ──────────────────────────────────────────────────
  setCell(ws, r, 0, 'ELIGIBILITY FOR JHS ENROLMENT', headerStyle);
  mergeCells(ws, r, 0, r, 6);
  r++;
  
  setCell(ws, r, 0, 'Elementary School Completer:', headerStyle);
  setCell(ws, r, 1, '', dataStyle);
  setCell(ws, r, 2, 'General Average:', headerStyle);
  setCell(ws, r, 3, '', dataStyle);
  setCell(ws, r, 4, 'Citation (if any):', headerStyle);
  setCell(ws, r, 5, '', dataStyle);
  mergeCells(ws, r, 5, r, 6);
  r++;
  
  setCell(ws, r, 0, 'Name of Elementary School:', headerStyle);
  setCell(ws, r, 1, '', dataStyle);
  mergeCells(ws, r, 1, r, 2);
  setCell(ws, r, 3, 'School ID:', headerStyle);
  setCell(ws, r, 4, '', dataStyle);
  setCell(ws, r, 5, 'Address of School:', headerStyle);
  setCell(ws, r, 6, '', dataStyle);
  r++;
  r++; // blank

  // ─── Scholastic Record ──────────────────────────────────────────────────
  setCell(ws, r, 0, 'SCHOLASTIC RECORD', headerStyle);
  mergeCells(ws, r, 0, r, 6);
  r++;
  
  setCell(ws, r, 0, 'School:', headerStyle);
  setCell(ws, r, 1, schoolName, dataStyle);
  mergeCells(ws, r, 1, r, 2);
  setCell(ws, r, 3, 'School ID:', headerStyle);
  setCell(ws, r, 4, schoolId, dataStyle);
  setCell(ws, r, 5, 'District:', headerStyle);
  setCell(ws, r, 6, district, dataStyle);
  r++;
  
  setCell(ws, r, 0, 'Division:', headerStyle);
  setCell(ws, r, 1, division, dataStyle);
  mergeCells(ws, r, 1, r, 2);
  setCell(ws, r, 3, 'Region:', headerStyle);
  setCell(ws, r, 4, region, dataStyle);
  mergeCells(ws, r, 4, r, 6);
  r++;
  
  setCell(ws, r, 0, 'Classified as Grade:', headerStyle);
  setCell(ws, r, 1, gradeLevel, dataStyle);
  setCell(ws, r, 2, 'Section:', headerStyle);
  setCell(ws, r, 3, section, dataStyle);
  setCell(ws, r, 4, 'School Year:', headerStyle);
  setCell(ws, r, 5, schoolYear, dataStyle);
  mergeCells(ws, r, 5, r, 6);
  r++;
  
  setCell(ws, r, 0, 'Name of Adviser/Teacher:', headerStyle);
  setCell(ws, r, 1, adviser, dataStyle);
  mergeCells(ws, r, 1, r, 3);
  setCell(ws, r, 4, 'Signature:', headerStyle);
  setCell(ws, r, 5, '_____________', dataStyle);
  mergeCells(ws, r, 5, r, 6);
  r++;
  r++; // blank

  // ─── Grade Table Headers ────────────────────────────────────────────────
  setCell(ws, r, 0, 'LEARNING AREAS', headerStyle);
  setCell(ws, r, 1, 'Quarterly Rating', headerStyle);
  mergeCells(ws, r, 1, r, 4);
  setCell(ws, r, 5, 'FINAL', headerStyle);
  setCell(ws, r, 6, 'REMARKS', headerStyle);
  r++;
  
  setCell(ws, r, 0, '', headerStyle);
  setCell(ws, r, 1, '1', headerStyle);
  setCell(ws, r, 2, '2', headerStyle);
  setCell(ws, r, 3, '3', headerStyle);
  setCell(ws, r, 4, '4', headerStyle);
  setCell(ws, r, 5, 'RATING', headerStyle);
  setCell(ws, r, 6, '', headerStyle);
  r++;

  // ─── Learning Area Grades ───────────────────────────────────────────────
  const areaGrades = student.areaGrades || {};
  let finalsForAvg = [];

  JHS_AREAS.forEach(area => {
    const aq = areaGrades[area] || {};
    const finalGrade = calcFinalGrade(aq);
    if (finalGrade !== '') finalsForAvg.push(Number(finalGrade));

    setCell(ws, r, 0, area, dataStyle);
    setCell(ws, r, 1, aq.q1 !== undefined && aq.q1 !== '' ? depedRound(aq.q1) : '', numStyle);
    setCell(ws, r, 2, aq.q2 !== undefined && aq.q2 !== '' ? depedRound(aq.q2) : '', numStyle);
    setCell(ws, r, 3, aq.q3 !== undefined && aq.q3 !== '' ? depedRound(aq.q3) : '', numStyle);
    setCell(ws, r, 4, aq.q4 !== undefined && aq.q4 !== '' ? depedRound(aq.q4) : '', numStyle);
    setCell(ws, r, 5, finalGrade, numStyle);
    setCell(ws, r, 6, remarks(finalGrade), numStyle);
    r++;
  });

  // ─── General Average ────────────────────────────────────────────────────
  const genAvg = finalsForAvg.length
    ? depedRound(finalsForAvg.reduce((a, b) => a + b, 0) / finalsForAvg.length)
    : '';
  
  setCell(ws, r, 0, 'General Average', headerStyle);
  mergeCells(ws, r, 0, r, 4);
  setCell(ws, r, 5, genAvg, numStyle);
  setCell(ws, r, 6, remarks(genAvg), numStyle);
  r++;
  r++; // blank

  // ─── Remedial Classes ───────────────────────────────────────────────────
  setCell(ws, r, 0, 'Remedial Classes  Conducted from (mm/dd/yyyy) _____ to (mm/dd/yyyy) _____', headerStyle);
  mergeCells(ws, r, 0, r, 6);
  r++;
  
  setCell(ws, r, 0, 'Learning Areas', headerStyle);
  setCell(ws, r, 1, 'Final Rating', headerStyle);
  setCell(ws, r, 2, 'Remedial Class Mark', headerStyle);
  mergeCells(ws, r, 2, r, 3);
  setCell(ws, r, 4, 'Recomputed Final Grade', headerStyle);
  mergeCells(ws, r, 4, r, 5);
  setCell(ws, r, 6, 'Remarks', headerStyle);
  r++;
  
  // 3 remedial rows
  for (let i = 0; i < 3; i++) {
    setCell(ws, r, 0, '', dataStyle);
    setCell(ws, r, 1, '', dataStyle);
    setCell(ws, r, 2, '', dataStyle);
    mergeCells(ws, r, 2, r, 3);
    setCell(ws, r, 4, '', dataStyle);
    mergeCells(ws, r, 4, r, 5);
    setCell(ws, r, 6, '', dataStyle);
    r++;
  }
  r++; // blank

  // ─── Grading Scale / Legend ─────────────────────────────────────────────
  setCell(ws, r, 0, 'GRADING SCALE / LEGEND', headerStyle);
  mergeCells(ws, r, 0, r, 2);
  setCell(ws, r, 4, 'MARKING', headerStyle);
  mergeCells(ws, r, 4, r, 6);
  r++;
  
  setCell(ws, r, 0, 'Description', headerStyle);
  setCell(ws, r, 1, 'Grading Scale', headerStyle);
  setCell(ws, r, 2, 'Remarks', headerStyle);
  setCell(ws, r, 4, 'Marking', headerStyle);
  setCell(ws, r, 5, 'Non-numerical Rating', headerStyle);
  mergeCells(ws, r, 5, r, 6);
  r++;

  const markings = [
    ['AO', 'Always Observed'],
    ['SO', 'Sometimes Observed'],
    ['RO', 'Rarely Observed'],
    ['NO', 'Not Observed'],
  ];

  GRADE_SCALE.forEach(([desc, scale, rem], i) => {
    setCell(ws, r, 0, desc, dataStyle);
    setCell(ws, r, 1, scale, dataStyle);
    setCell(ws, r, 2, rem, dataStyle);
    if (markings[i]) {
      setCell(ws, r, 4, markings[i][0], dataStyle);
      setCell(ws, r, 5, markings[i][1], dataStyle);
      mergeCells(ws, r, 5, r, 6);
    } else {
      setCell(ws, r, 4, '', dataStyle);
      setCell(ws, r, 5, '', dataStyle);
      mergeCells(ws, r, 5, r, 6);
    }
    r++;
  });
  r++; // blank

  // ─── Certification ──────────────────────────────────────────────────────
  setCell(ws, r, 0, 'CERTIFICATION', headerStyle);
  mergeCells(ws, r, 0, r, 6);
  r++;
  
  setCell(ws, r, 0, 
    'I CERTIFY that this is a true record of the learner named above with the LRN indicated ' +
    'and that he/she is eligible for admission to the next grade level.',
    dataStyle
  );
  mergeCells(ws, r, 0, r, 6);
  r++;
  
  setCell(ws, r, 0, 'Name of School:', headerStyle);
  setCell(ws, r, 1, schoolName, dataStyle);
  mergeCells(ws, r, 1, r, 3);
  setCell(ws, r, 4, 'School ID:', headerStyle);
  setCell(ws, r, 5, schoolId, dataStyle);
  mergeCells(ws, r, 5, r, 6);
  r++;
  
  setCell(ws, r, 0, 'Last School Year Attended:', headerStyle);
  setCell(ws, r, 1, '_____________', dataStyle);
  mergeCells(ws, r, 1, r, 6);
  r++;
  r++; // blank
  
  setCell(ws, r, 0, '________________________', dataStyle);
  mergeCells(ws, r, 0, r, 2);
  setCell(ws, r, 3, '___________________________________', dataStyle);
  mergeCells(ws, r, 3, r, 6);
  r++;
  
  setCell(ws, r, 0, 'Date', headerStyle);
  mergeCells(ws, r, 0, r, 2);
  setCell(ws, r, 3, 'Name of Principal/School Head over Printed Name', headerStyle);
  mergeCells(ws, r, 3, r, 6);
  r++;
  r++; // blank
  
  setCell(ws, r, 5, '(Affix School Seal here)', plainCentered);
  mergeCells(ws, r, 5, r, 6);
  r++;
  r++; // blank

  return r;
}

// ═══ WORKBOOK BUILDER ════════════════════════════════════════════════════════

/**
 * Build the complete workbook with styled student forms
 */
function buildWorkbook(studentData, schoolInfo, sheetLabel) {
  const wb = XLSX.utils.book_new();
  const ws = { 
    '!cols': [
      { wch: 35 }, // A – Learning Area
      { wch: 10 }, // B – Q1
      { wch: 10 }, // C – Q2
      { wch: 10 }, // D – Q3
      { wch: 10 }, // E – Q4
      { wch: 12 }, // F – Final
      { wch: 12 }, // G – Remarks
    ]
  };

  let currentRow = 0;

  studentData.forEach((student, idx) => {
    currentRow = appendStudentSF10(ws, currentRow, student, schoolInfo);
    // Page break between students
    if (idx < studentData.length - 1) {
      currentRow += 3;
    }
  });

  extendRange(ws, currentRow, 6);

  const safeName = sheetLabel.replace(/[:\\/?\[\]*]/g, '-').substring(0, 31);
  XLSX.utils.book_append_sheet(wb, ws, safeName || 'SF10');

  const wbout = XLSX.write(wb, { 
    bookType: 'xlsx', 
    type: 'array',
    cellStyles: true
  });
  
  return new Blob([wbout], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

// ═══ PUBLIC API ══════════════════════════════════════════════════════════════

/**
 * Main export function - generates styled SF10 Excel matching official template
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

  // Build grade index
  const gradeIndex = {};
  allGrades.forEach(g => {
    const sid = String(g.student);
    const area = mapToLearningArea(g.subject_name);
    if (!area) return;
    if (!gradeIndex[sid]) gradeIndex[sid] = {};
    if (!gradeIndex[sid][area]) gradeIndex[sid][area] = {};
    gradeIndex[sid][area][`q${g.quarter}`] = g.raw_score;
  });

  // Build student data
  const studentData = enrollments.map(e => {
    const sid = String(e.student);
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
