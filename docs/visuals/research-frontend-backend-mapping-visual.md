# Research Paper Frontend-Page-to-Backend-Model Mapping Visual

## Figure Title

**Figure 8. Frontend Page to Backend Model Mapping**

## Mermaid Diagram

```mermaid
flowchart LR
    subgraph FRONTEND["Frontend Pages"]
        A[Public Pages]
        B[Enrollment Pages]
        C[Admin Pages]
        D[Teacher Pages]
        E[Student Pages]
        F[Parent Pages]
        G[Communication Pages]
    end

    subgraph API["Backend API Layer"]
        H[Public Content Endpoints]
        I[Enrollment Endpoints]
        J[Academic Management Endpoints]
        K[Learning and Grade Endpoints]
        L[Parent Endpoints]
        M[Messaging and Notification Endpoints]
        N[System and Audit Endpoints]
    end

    subgraph MODELS["Backend Models"]
        O[WebsiteContent and Announcement]
        P[EnrollmentApplication, EnrollmentDocument, ParentLink]
        Q[Classroom, Subject, ClassroomSubject, StudentClassEnrollment]
        R[Attendance, Grade, GradeReport, LearningMaterial, Assignment, Submission, Schedule]
        S[User and Profile]
        T[ChatRoom, ChatMessage, ReportedMessage, Friendship, Notification, FCMToken]
        U[SystemSetting, AuditLog, DatabaseBackup, AcademicYear, Semester]
    end

    A --> H --> O
    B --> I --> P
    C --> J --> Q
    C --> N --> U
    D --> K --> R
    D --> J --> Q
    E --> K --> R
    E --> M --> T
    F --> L --> P
    F --> K --> R
    G --> M --> T

    C --> S
    D --> S
    E --> S
    F --> S
```

## Main Parts

- Frontend page groups
- Backend endpoint groups
- Backend model groups
- Flow from UI to API to data layer

## Caption

This figure shows how groups of frontend pages connect to backend endpoints and finally to the backend model groups that store and manage the application data.

