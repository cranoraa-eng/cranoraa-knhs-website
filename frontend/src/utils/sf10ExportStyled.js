/**
 * SF10-JHS Template-based Export with xlsx-populate
 *
 * Uses xlsx-populate library which preserves ALL template formatting perfectly.
 * Loads the template, fills cells, maintains all styles, borders, colors, merged cells.
 */

import XlsxPopulate from 'xlsx-populate';

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

// Template path (relative to public directory)
const TEMPLATE_PATH = '/templates/SF10_Template.xlsx';

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
  if (v === null || v === undefined || v === '' || isNaN(Number(v))) return null;
  return Math.round(Number(v));
}

/** Compute quarterly average */
function calcFinalGrade(quarters) {
  const vals = ['q1','q2','q3','q4']
    .map(k => quarters[k])
    .filter(v => v !== null && v !== undefined && v !== '' && !isNaN(Number(v)))
    .map(Number);
  if (!vals.length) return null;
  return depedRound(vals.reduce((a, b) => a + b, 0) / vals.length);
}

/**
 * Fill student information section
 */
function fillStudentInfo(sheet, student) {
  // Parse name
  const fullName = student.name || '';
  const nameParts = fullName.split(',').map(p => p.trim());
  const lastName  = nameParts[0] || fullName;
  const restParts = (nameParts[1] || '').split(' ').filter(Boolean);
  const firstName  = restParts[0] || '';
  const middleName = restParts.slice(1).join(' ') || '';

  // Row 7: LAST NAME, FIRST NAME, MIDDLE NAME
  sheet.cell('C7').value(lastName);
  sheet.cell('G7').value(firstName);
  sheet.cell('M7').value(middleName);
  
  // Row 8: LRN, Birthdate, Sex
  sheet.cell('C8').value(student.lrn || '');
  sheet.cell('G8').value(student.birthdate || '');
  sheet.cell('M8').value(student.sex || '');
}

/**
 * Fill school/scholastic information
 */
function fillSchoolInfo(sheet, schoolInfo) {
  const {
    schoolName, schoolId, district, division, region,
    schoolYear, gradeLevel, section, adviser,
  } = schoolInfo;

  // Row 14: School, School ID, District
  sheet.cell('C14').value(schoolName);
  sheet.cell('G14').value(schoolId);
  sheet.cell('K14').value(district);
  
  // Row 15: Division, Region
  sheet.cell('C15').value(division);
  sheet.cell('G15').value(region);
  
  // Row 16: Grade, Section, School Year
  sheet.cell('D16').value(gradeLevel);
  sheet.cell('G16').value(section);
  sheet.cell('K16').value(schoolYear);
  
  // Row 17: Adviser
  sheet.cell('E17').value(adviser);
}

/**
 * Fill grades for a specific grade level block
 */
function fillGradesBlock(sheet, startRow, areaGrades) {
  JHS_AREAS.forEach((area, index) => {
    const row = startRow + index;
    const aq = areaGrades[area] || {};
    
    const q1 = aq.q1 !== undefined && aq.q1 !== '' ? depedRound(aq.q1) : null;
    const q2 = aq.q2 !== undefined && aq.q2 !== '' ? depedRound(aq.q2) : null;
    const q3 = aq.q3 !== undefined && aq.q3 !== '' ? depedRound(aq.q3) : null;
    const q4 = aq.q4 !== undefined && aq.q4 !== '' ? depedRound(aq.q4) : null;
    
    // Columns: B=Q1, C=Q2, D=Q3, E=Q4, F=Final, G=Remarks
    if (q1 !== null) sheet.row(row).cell(2).value(q1);
    if (q2 !== null) sheet.row(row).cell(3).value(q2);
    if (q3 !== null) sheet.row(row).cell(4).value(q3);
    if (q4 !== null) sheet.row(row).cell(5).value(q4);
    
    // Final Rating and Remarks (only if no formula)
    const finalCell = sheet.row(row).cell(6);
    const remarksCell = sheet.row(row).cell(7);
    
    // Check if cell has a formula
    const hasFormula = finalCell.formula();
    
    if (!hasFormula) {
      const finalGrade = calcFinalGrade(aq);
      if (finalGrade !== null) {
        finalCell.value(finalGrade);
        remarksCell.value(finalGrade >= 75 ? 'Passed' : 'Failed');
      }
    }
  });
}

/**
 * Fill a single student's SF10 from template
 */
async function fillStudentSF10(templatePath, student, schoolInfo, gradeLevel) {
  try {
    // Fetch the template file
    const response = await fetch(templatePath);
    
    if (!response.ok) {
      throw new Error(
        `Template file not found at ${templatePath}. ` +
        `Status: ${response.status}`
      );
    }
    
    const arrayBuffer = await response.arrayBuffer();
    
    if (arrayBuffer.byteLength === 0) {
      throw new Error('Template file is empty.');
    }
    
    // Load workbook from array buffer - xlsx-populate preserves ALL formatting
    const workbook = await XlsxPopulate.fromDataAsync(arrayBuffer);
    
    // Get the first sheet
    const sheet = workbook.sheet(0);
    
    if (!sheet) {
      throw new Error('Template is missing worksheet');
    }
    
    // Fill student and school information
    fillStudentInfo(sheet, student);
    fillSchoolInfo(sheet, schoolInfo);
    
    // Fill grades - Row 21 is Filipino (first subject)
    const areaGrades = student.areaGrades || {};
    fillGradesBlock(sheet, 21, areaGrades);
    
    return workbook;
  } catch (error) {
    console.error('Error loading template:', error);
    throw error;
  }
}

// ═══ PUBLIC API ══════════════════════════════════════════════════════════════

/**
 * Main export function - loads template and fills with student data
 */
export async function exportSF10(classroom, enrollments, allGrades, info = {}) {
  try {
    const schoolInfo = {
      schoolName: info.schoolName  || 'Kiwalan National High School',
      schoolId:   info.schoolId    || '304147',
      district:   info.district    || '',
      division:   info.division    || '',
      region:     info.region      || 'X',
      schoolYear: info.schoolYear  || '',
      gradeLevel: info.gradeLevel  || '9',
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

    // Export first student
    if (studentData.length === 0) {
      throw new Error('No students to export');
    }

    const student = studentData[0];
    const workbook = await fillStudentSF10(TEMPLATE_PATH, student, schoolInfo, schoolInfo.gradeLevel);

    // Generate blob - xlsx-populate preserves ALL formatting
    const blob = await workbook.outputAsync();

    // Download
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SF10_${student.name.replace(/[^a-zA-Z0-9]/g, '_')}_${schoolInfo.schoolYear}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
    
    console.log('SF10 exported successfully with full formatting');
  } catch (error) {
    console.error('SF10 export error:', error);
    throw error;
  }
}
