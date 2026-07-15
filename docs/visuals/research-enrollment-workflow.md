# Research Paper Enrollment Workflow Visual

## Figure Title

**Figure 4. Enrollment and Admissions Workflow**

## Mermaid Diagram

```mermaid
flowchart TD
    A[Applicant or Parent] --> B[Open Online Enrollment Form]
    B --> C[Enter Personal, Academic, and Contact Details]
    C --> D[Upload Required Documents]
    D --> E[Submit Enrollment Application]

    E --> F[(EnrollmentApplication)]
    D --> G[(EnrollmentDocument)]

    H[Admin] --> I[Review Application]
    I --> J[Check Application Details]
    I --> K[Verify Uploaded Documents]
    K --> L{Documents Complete and Valid?}

    L -- No --> M[Request Missing Requirements]
    M --> N[Update Status to Pending Requirements]
    N --> F

    L -- Yes --> O[Assign Section or Classroom]
    O --> P[Approve Application]
    P --> Q[Generate Student Account]
    Q --> R[(User and Profile)]
    Q --> S[(StudentClassEnrollment)]
    O --> T[(Classroom)]

    P --> U{Parent Account Available?}
    U -- Yes --> V[Link Parent to Student]
    V --> W[(ParentLink)]
    U -- No --> X[Proceed Without Parent Link]

    P --> Y[Update Status History]
    Y --> Z[(EnrollmentStatusHistory)]

    I --> AA{Application Rejected?}
    AA -- Yes --> AB[Reject Application]
    AB --> AC[Store Rejection Remarks]
    AC --> F
```

## Main Parts

- Applicant submission stage
- Document upload stage
- Admin review stage
- Approval or rejection stage
- Student account creation stage
- Parent linking stage

## Caption

This figure illustrates the enrollment and admissions process of the system, beginning with applicant submission and document upload, then proceeding through administrative review, classroom assignment, approval or rejection, student account creation, and optional parent linkage.

