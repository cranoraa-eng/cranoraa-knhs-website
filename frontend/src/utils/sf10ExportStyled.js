/**
 * SF10-JHS Template-based Export
 *
 * Loads the official SF10 template Excel file and fills in student data.
 * Preserves all existing formatting, merged cells, formulas, and styles.
 * Uses ExcelJS for reliable template preservation.
 *
 * Template location: /public/templates/SF10_Template.xlsx
 * 
 * Cell mapping:
 * - FRONT sheet: Student info (B7-M8), School info (B20-N21), Grade 7 & 8 grades
 * - BACK sheet: Grade 9 & 10 grades (same structure)
 */

import ExcelJS from 'exceljs';

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
 * Set cell value without losing style
 */
function setCellValue(cell, value) {
  // Store the existing style
  const existingStyle = { ...cell.style };
  
  // Set the value
  cell.value = value;
  
  // Restore the style
  cell.style = existingStyle;
}

/**
 * Fill student information section (FRONT sheet)
 */
function fillStudentInfo(worksheet, student) {
  // Parse name
  const fullName = student.name || '';
  const nameParts = fullName.split(',').map(p => p.trim());
  const lastName  = nameParts[0] || fullName;
  const restParts = (nameParts[1] || '').split(' ').filter(Boolean);
  const firstName  = restParts[0] || '';
  const middleName = restParts.slice(1).join(' ') || '';

  // LEARNER'S INFORMATION (Row 7-8) - preserve existing cell styles
  setCellValue(worksheet.getCell('B7'), lastName);
  setCellValue(worksheet.getCell('F7'), firstName);
  setCellValue(worksheet.getCell('M7'), middleName);
  
  setCellValue(worksheet.getCell('B8'), student.lrn || '');
  setCellValue(worksheet.getCell('H8'), student.birthdate || '');
  setCellValue(worksheet.getCell('M8'), student.sex || '');
}

/**
 * Fill school/scholastic information (FRONT sheet)
 */
function fillSchoolInfo(worksheet, schoolInfo) {
  const {
    schoolName, schoolId, district, division, region,
    schoolYear, gradeLevel, section, adviser,
  } = schoolInfo;

  // SCHOLASTIC RECORD (Row 20-21) - preserve existing cell styles
  setCellValue(worksheet.getCell('B20'), schoolName);
  setCellValue(worksheet.getCell('G20'), schoolId);
  setCellValue(worksheet.getCell('I20'), district);
  setCellValue(worksheet.getCell('N20'), division);
  setCellValue(worksheet.getCell('Q20'), region);
  
  setCellValue(worksheet.getCell('B21'), gradeLevel);
  setCellValue(worksheet.getCell('D21'), section);
  setCellValue(worksheet.getCell('G21'), schoolYear);
  setCellValue(worksheet.getCell('J21'), adviser);
}

/**
 * Fill grades for a specific grade level block
 * 
 * @param {Object} worksheet - ExcelJS worksheet
 * @param {number} startRow - Starting row for grade table data (first Filipino row)
 * @param {Object} areaGrades - { 'Filipino': { q1: 85, q2: 87, ... }, ... }
 */
function fillGradesBlock(worksheet, startRow, areaGrades) {
  JHS_AREAS.forEach((area, index) => {
    const row = startRow + index;
    const aq = areaGrades[area] || {};
    
    const q1 = aq.q1 !== undefined && aq.q1 !== '' ? depedRound(aq.q1) : null;
    const q2 = aq.q2 !== undefined && aq.q2 !== '' ? depedRound(aq.q2) : null;
    const q3 = aq.q3 !== undefined && aq.q3 !== '' ? depedRound(aq.q3) : null;
    const q4 = aq.q4 !== undefined && aq.q4 !== '' ? depedRound(aq.q4) : null;
    
    // Set values while preserving cell styles
    setCellValue(worksheet.getCell(row, 2), q1);  // Column B (Q1)
    setCellValue(worksheet.getCell(row, 3), q2);  // Column C (Q2)
    setCellValue(worksheet.getCell(row, 4), q3);  // Column D (Q3)
    setCellValue(worksheet.getCell(row, 5), q4);  // Column E (Q4)
    
    // Only set Final Rating if there's no formula
    const finalCell = worksheet.getCell(row, 6); // Column F
    if (!finalCell.formula && !finalCell.formulaType) {
      const finalGrade = calcFinalGrade(aq);
      setCellValue(finalCell, finalGrade);
    }
  });
}

/**
 * Fill a single student's SF10 from template
 */
async function fillStudentSF10(templatePath, student, schoolInfo, gradeLevel) {
  // Load template
  const workbook = new ExcelJS.Workbook();
  
  try {
    const response = await fetch(templatePath);
    
    if (!response.ok) {
      throw new Error(
        `Template file not found at ${templatePath}. ` +
        `Please place SF10_Template.xlsx in frontend/public/templates/ directory. ` +
        `Status: ${response.status}`
      );
    }
    
    const arrayBuffer = await response.arrayBuffer();
    
    if (arrayBuffer.byteLength === 0) {
      throw new Error('Template file is empty. Please check the file.');
    }
    
    await workbook.xlsx.load(arrayBuffer);
  } catch (error) {
    if (error.message.includes('central directory')) {
      throw new Error(
        'Template file is not a valid Excel file. ' +
        'Please ensure SF10_Template.xlsx is a proper .xlsx file (not .xls or corrupted). ' +
        'Original error: ' + error.message
      );
    }
    throw error;
  }

  // Get worksheets - handle both multi-sheet and single-sheet templates
  const frontSheet = workbook.getWorksheet('FRONT') || 
                     workbook.getWorksheet('Grade 9 - Emerald') ||
                     workbook.getWorksheet(1);
  const backSheet = workbook.getWorksheet('BACK') || workbook.getWorksheet(2);

  if (!frontSheet) {
    throw new Error('Template is missing required worksheet');
  }

  // Fill student info (appears on FRONT sheet or first sheet)
  fillStudentInfo(frontSheet, student);
  fillSchoolInfo(frontSheet, schoolInfo);

  // Fill grades based on grade level
  const areaGrades = student.areaGrades || {};
  
  // Determine which block to fill based on current grade level
  const currentGrade = parseInt(gradeLevel) || 9;
  
  // The grades table starts after the "LEARNING AREAS" header row
  // Based on the template document structure, grades start around row 19-20
  // Let's use row 19 as the starting point for grade data
  const gradesStartRow = 19;
  
  // For single-sheet templates, use the same row range
  // For multi-sheet templates, each grade level might be on a different sheet
  if (currentGrade === 7) {
    fillGradesBlock(frontSheet, gradesStartRow, areaGrades);
  } else if (currentGrade === 8) {
    fillGradesBlock(frontSheet, backSheet ? 46 : gradesStartRow, areaGrades);
  } else if (currentGrade === 9) {
    fillGradesBlock(backSheet || frontSheet, backSheet ? 1 : gradesStartRow, areaGrades);
  } else if (currentGrade === 10) {
    fillGradesBlock(backSheet || frontSheet, backSheet ? 25 : gradesStartRow, areaGrades);
  }

  return workbook;
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

    // For now, export first student as example
    if (studentData.length === 0) {
      throw new Error('No students to export');
    }

    const student = studentData[0];
    const templatePath = TEMPLATE_PATH;
    
    const workbook = await fillStudentSF10(templatePath, student, schoolInfo, schoolInfo.gradeLevel);

    // Generate and download the file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SF10_${student.name.replace(/[^a-zA-Z0-9]/g, '_')}_${schoolInfo.schoolYear}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
    
    console.log('SF10 exported successfully');
  } catch (error) {
    console.error('SF10 export error:', error);
    throw error;
  }
}
