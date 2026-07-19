# SF10 Template Directory

This directory contains the official SF10-JHS Excel template used for generating student permanent academic records.

## Required File

Place the SF10 template file here with the name: **SF10_Template.xlsx**

The template should contain:
- **FRONT sheet**: Student information, Grade 7 & 8 sections
- **BACK sheet**: Grade 9 & 10 sections

## Template Structure

The export utility fills in these specific cells:

### FRONT Sheet:
- **B7**: Last Name
- **F7**: First Name  
- **M7**: Middle Name
- **B8**: LRN (Learner Reference Number)
- **H8**: Birthdate
- **M8**: Sex

- **B20**: School Name
- **G20**: School ID
- **I20**: District
- **N20**: Division
- **Q20**: Region
- **B21**: Grade Level
- **D21**: Section
- **G21**: School Year
- **J21**: Adviser Name

- **Rows 24-34**: Grade 7 grades (columns G-J for Q1-Q4, K for Final)
- **Rows 46-56**: Grade 8 grades (columns G-J for Q1-Q4, K for Final)

### BACK Sheet:
- **Rows 1-11**: Grade 9 grades (columns G-J for Q1-Q4, K for Final)
- **Rows 25-35**: Grade 10 grades (columns G-J for Q1-Q4, K for Final)

## Usage

The SF10 export function automatically loads this template and preserves all:
- Cell formatting and styles
- Merged cells
- Formulas (e.g., final rating calculations)
- Borders and colors
- Page layout settings

Only the data values are filled in, keeping the official template design intact.
