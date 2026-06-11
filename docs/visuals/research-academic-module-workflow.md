# Research Paper Academic Module Workflow Visual

## Figure Title

**Figure 5. Academic Module Workflow**

## Mermaid Diagram

```mermaid
flowchart TD
    A[Admin] --> B[Create Academic Year]
    A --> C[Create Semester]
    A --> D[Create Classroom]
    A --> E[Create Subject]
    A --> F[Assign Teacher to Subject and Classroom]

    B --> G[(AcademicYear)]
    C --> H[(Semester)]
    D --> I[(Classroom)]
    E --> J[(Subject)]
    F --> K[(ClassroomSubject)]

    A --> L[Enroll Students into Classroom]
    L --> M[(StudentClassEnrollment)]

    K --> N[Attendance Module]
    K --> O[Grade Input Module]
    K --> P[Learning Materials Module]
    K --> Q[Assignment Module]
    K --> R[Schedule Module]

    N --> S[(Attendance)]
    O --> T[(Grade)]
    O --> U[(GradeReport)]
    P --> V[(LearningMaterial)]
    Q --> W[(Assignment)]
    W --> X[(Submission)]
    R --> Y[(Schedule)]
    R --> Z[(Room)]
    R --> AA[(TimeSlot)]

    T --> AB[Student Grade View]
    S --> AC[Attendance Monitoring]
    Y --> AD[My Schedule View]
```

## Main Parts

- Academic setup
- Classroom and subject configuration
- Teacher assignment
- Student enrollment
- Attendance, grade, material, assignment, and schedule execution

## Caption

This figure shows the academic workflow of the school portal, beginning with the creation of academic structures such as year, semester, classroom, and subject, then continuing into teacher assignment, student enrollment, attendance tracking, grade processing, materials distribution, assignment handling, and scheduling.

