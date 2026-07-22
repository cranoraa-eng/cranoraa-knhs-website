/**
 * SF10-JHS PDF Export
 * 
 * Generates a PDF that exactly replicates the official SF10-JHS template design.
 * Uses jsPDF with precise positioning to match the paper form layout.
 */

import { jsPDF } from 'jspdf';

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

// PDF dimensions (A4 size in mm)
const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const MARGIN = 10;

// ═══ HELPER FUNCTIONS ════════════════════════════════════════════════════════

/** Map API subject_name to official SF10 learning area label */
function mapToLearningArea(subjectName) {
  if (!subjectName) return null;
  const s = subjectName.trim().toLowerCase();
  if (s.includes('filipino')) return 'Filipino';
  if (s.includes('english')) return 'English';
  if (s.includes('math')) return 'Mathematics';
  if (s.includes('science')) return 'Science';
  if (s.includes('araling') || s === 'ap') return 'Araling Panlipunan (AP)';
  if (s.includes('pagpapakatao') || s === 'esp') return 'Edukasyon sa Pagpapakatao (EsP)';
  if (s.includes('tle') || s.includes('livelihood') || s.includes('technology')) return 'Technology and Livelihood Education (TLE)';
  if (s === 'mapeh') return 'MAPEH';
  if (s.includes('music') || s.includes('arts')) return 'Music and Arts';
  if (s.includes('physical') || s === 'pe' || s.includes('health')) return 'Physical Education and Health';
  if (s.includes('homeroom') || s.includes('guidance')) return 'Homeroom Guidance';
  return null;
}

/** DepEd rounding */
function depedRound(v) {
  if (v === null || v === undefined || v === '' || isNaN(Number(v))) return '';
  return Math.round(Number(v)).toString();
}

/** Compute term average */
function calcFinalGrade(terms) {
  const vals = ['q1', 'q2', 'q3']
    .map(k => terms[k])
    .filter(v => v !== null && v !== undefined && v !== '' && !isNaN(Number(v)))
    .map(Number);
  if (!vals.length) return '';
  return depedRound(vals.reduce((a, b) => a + b, 0) / vals.length);
}

/** Generate SF10 PDF for one student */
function generateSF10PDF(student, schoolInfo) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  let y = MARGIN;

  // ─── TITLE BLOCK ─────────────────────────────────────────────────────────
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('SF 10-JHS', PAGE_WIDTH / 2, y, { align: 'center' });
  y += 5;

  doc.setFontSize(9);
  doc.text('Republic of the Philippines', PAGE_WIDTH / 2, y, { align: 'center' });
  y += 4;
  doc.text('Department of Education', PAGE_WIDTH / 2, y, { align: 'center' });
  y += 4;
  doc.setFontSize(8);
  doc.text("Learner's Permanent Academic Record for Junior High School (SF10-JHS)", PAGE_WIDTH / 2, y, { align: 'center' });
  y += 4;
  doc.setFont('helvetica', 'normal');
  doc.text('(Formerly Form 137)', PAGE_WIDTH / 2, y, { align: 'center' });
  y += 8;

  // ─── LEARNER'S INFORMATION ───────────────────────────────────────────────
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text("LEARNER'S INFORMATION", MARGIN, y);
  y += 5;

  // Parse name
  const fullName = student.name || '';
  const nameParts = fullName.split(',').map(p => p.trim());
  const lastName = nameParts[0] || fullName;
  const restParts = (nameParts[1] || '').split(' ').filter(Boolean);
  const firstName = restParts[0] || '';
  const middleName = restParts.slice(1).join(' ') || '';

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  
  // Row 1: Name fields
  doc.setFont('helvetica', 'bold');
  doc.text('LAST NAME:', MARGIN, y);
  doc.setFont('helvetica', 'normal');
  doc.text(lastName, MARGIN + 25, y);
  
  doc.setFont('helvetica', 'bold');
  doc.text('FIRST NAME:', MARGIN + 70, y);
  doc.setFont('helvetica', 'normal');
  doc.text(firstName, MARGIN + 95, y);
  
  doc.setFont('helvetica', 'bold');
  doc.text('MIDDLE NAME:', MARGIN + 135, y);
  doc.setFont('helvetica', 'normal');
  doc.text(middleName, MARGIN + 165, y);
  y += 5;

  // Row 2: LRN, Birthdate, Sex
  doc.setFont('helvetica', 'bold');
  doc.text('Learner Reference Number (LRN):', MARGIN, y);
  doc.setFont('helvetica', 'normal');
  doc.text(student.lrn || '', MARGIN + 60, y);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Birthdate:', MARGIN + 90, y);
  doc.setFont('helvetica', 'normal');
  doc.text(student.birthdate || '', MARGIN + 110, y);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Sex:', MARGIN + 145, y);
  doc.setFont('helvetica', 'normal');
  doc.text(student.sex || '', MARGIN + 155, y);
  y += 8;

  // ─── ELIGIBILITY BLOCK ───────────────────────────────────────────────────
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('ELIGIBILITY FOR JHS ENROLMENT', MARGIN, y);
  y += 5;
  
  doc.setFontSize(8);
  doc.text('Elementary School Completer:', MARGIN, y);
  doc.text('General Average:', MARGIN + 80, y);
  doc.text('Citation (if any):', MARGIN + 135, y);
  y += 5;
  
  doc.text('Name of Elementary School:', MARGIN, y);
  doc.text('School ID:', MARGIN + 110, y);
  doc.text('Address:', MARGIN + 145, y);
  y += 8;

  // ─── SCHOLASTIC RECORD ───────────────────────────────────────────────────
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('SCHOLASTIC RECORD', MARGIN, y);
  y += 5;

  doc.setFontSize(8);
  doc.text('School:', MARGIN, y);
  doc.setFont('helvetica', 'normal');
  doc.text(schoolInfo.schoolName, MARGIN + 15, y);
  
  doc.setFont('helvetica', 'bold');
  doc.text('School ID:', MARGIN + 90, y);
  doc.setFont('helvetica', 'normal');
  doc.text(schoolInfo.schoolId, MARGIN + 107, y);
  
  doc.setFont('helvetica', 'bold');
  doc.text('District:', MARGIN + 135, y);
  doc.setFont('helvetica', 'normal');
  doc.text(schoolInfo.district, MARGIN + 150, y);
  y += 5;

  doc.setFont('helvetica', 'bold');
  doc.text('Division:', MARGIN, y);
  doc.setFont('helvetica', 'normal');
  doc.text(schoolInfo.division, MARGIN + 18, y);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Region:', MARGIN + 90, y);
  doc.setFont('helvetica', 'normal');
  doc.text(schoolInfo.region, MARGIN + 103, y);
  y += 5;

  doc.setFont('helvetica', 'bold');
  doc.text(`Classified as Grade: ${schoolInfo.gradeLevel}`, MARGIN, y);
  doc.text(`Section: ${schoolInfo.section}`, MARGIN + 70, y);
  doc.text(`School Year: ${schoolInfo.schoolYear}`, MARGIN + 130, y);
  y += 5;

  doc.text('Name of Adviser/Teacher:', MARGIN, y);
  doc.setFont('helvetica', 'normal');
  doc.text(schoolInfo.adviser, MARGIN + 45, y);
  doc.setFont('helvetica', 'bold');
  doc.text('Signature: ___________', MARGIN + 135, y);
  y += 8;

  // ─── GRADES TABLE ────────────────────────────────────────────────────────
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  
  // Table header
  const colX = {
    area: MARGIN,
    q1: MARGIN + 85,
    q2: MARGIN + 100,
    q3: MARGIN + 115,
    final: MARGIN + 130,
    remarks: MARGIN + 155
  };

  // Draw header
  doc.text('LEARNING AREAS', colX.area, y);
  doc.text('Term Rating', colX.q1 + 20, y);
  doc.text('FINAL', colX.final, y);
  doc.text('REMARKS', colX.remarks, y);
  y += 4;

  doc.text('1', colX.q1, y);
  doc.text('2', colX.q2, y);
  doc.text('3', colX.q3, y);
  doc.text('RATING', colX.final, y);
  y += 1;

  // Draw horizontal line
  doc.line(MARGIN, y, PAGE_WIDTH - MARGIN, y);
  y += 4;

  // Draw grades
  doc.setFont('helvetica', 'normal');
  const areaGrades = student.areaGrades || {};
  
  JHS_AREAS.forEach(area => {
    const aq = areaGrades[area] || {};
    const finalGrade = calcFinalGrade(aq);
    const remarkText = finalGrade && parseInt(finalGrade) >= 75 ? 'Passed' : (finalGrade ? 'Failed' : '');

    doc.text(area, colX.area, y);
    doc.text(depedRound(aq.q1) || '', colX.q1, y);
    doc.text(depedRound(aq.q2) || '', colX.q2, y);
    doc.text(depedRound(aq.q3) || '', colX.q3, y);
    doc.text(finalGrade || '', colX.final, y);
    doc.text(remarkText, colX.remarks, y);
    y += 4.5;
  });

  // General Average
  const allFinals = JHS_AREAS
    .map(area => calcFinalGrade(areaGrades[area] || {}))
    .filter(f => f !== '')
    .map(Number);
  const genAvg = allFinals.length
    ? depedRound(allFinals.reduce((a, b) => a + b, 0) / allFinals.length)
    : '';
  const genRemarks = genAvg && parseInt(genAvg) >= 75 ? 'Passed' : (genAvg ? 'Failed' : '');

  doc.line(MARGIN, y, PAGE_WIDTH - MARGIN, y);
  y += 4;
  doc.setFont('helvetica', 'bold');
  doc.text('General Average', colX.area, y);
  doc.text(genAvg, colX.final, y);
  doc.text(genRemarks, colX.remarks, y);
  y += 8;

  // ─── REMEDIAL SECTION ────────────────────────────────────────────────────
  doc.setFontSize(8);
  doc.text('Remedial Classes  Conducted from (mm/dd/yyyy) _______ to (mm/dd/yyyy) _______', MARGIN, y);
  y += 5;

  doc.text('Learning Areas', MARGIN, y);
  doc.text('Final Rating', MARGIN + 60, y);
  doc.text('Remedial Class Mark', MARGIN + 90, y);
  doc.text('Recomputed Final Grade', MARGIN + 130, y);
  doc.text('Remarks', MARGIN + 175, y);
  y += 1;
  doc.line(MARGIN, y, PAGE_WIDTH - MARGIN, y);

  return doc;
}

// ═══ PUBLIC API ══════════════════════════════════════════════════════════════

export async function exportSF10PDF(classroom, enrollments, allGrades, info = {}) {
  try {
    const schoolInfo = {
      schoolName: info.schoolName || 'Kiwalan National High School',
      schoolId: info.schoolId || '304147',
      district: info.district || '',
      division: info.division || '',
      region: info.region || 'X',
      schoolYear: info.schoolYear || '',
      gradeLevel: info.gradeLevel || '9',
      section: info.section || classroom.name || '',
      adviser: info.adviser || '',
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
      const lastName = e.student_last_name || '';
      const firstName = e.student_first_name || '';
      const fullName = lastName && firstName
        ? `${lastName}, ${firstName}`
        : (e.student_name || `Student ${sid}`);

      return {
        name: fullName,
        lrn: e.student_lrn || '',
        birthdate: e.student_birthdate || '',
        sex: e.student_sex || e.sex || '',
        areaGrades: gradeIndex[sid] || {},
      };
    });

    if (studentData.length === 0) {
      throw new Error('No students to export');
    }

    // Generate PDF for first student
    const student = studentData[0];
    const doc = generateSF10PDF(student, schoolInfo);

    // Download
    const filename = `SF10_${student.name.replace(/[^a-zA-Z0-9]/g, '_')}_${schoolInfo.schoolYear}.pdf`;
    doc.save(filename);

    console.log('SF10 PDF exported successfully');
  } catch (error) {
    console.error('SF10 PDF export error:', error);
    throw error;
  }
}
