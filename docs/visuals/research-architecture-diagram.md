# Research Paper Architecture Diagram

## Figure Title

**Figure 1. Overall System Architecture of the School Web Application**

## Mermaid Diagram

```mermaid
flowchart LR
    %% Users
    A[Applicant]
    B[Admin]
    C[Teacher]
    D[Student]
    E[Parent]

    %% Client side
    subgraph CLIENT["Client Layer"]
        F[Browser / PWA]
        G[Public Website]
        H[Portal Frontend]
    end

    %% Frontend
    subgraph FRONTEND["Frontend Application Layer"]
        I[React]
        J[React Router]
        K[Axios API Client]
    end

    %% Backend
    subgraph BACKEND["Backend Application Layer"]
        L[Django REST API]
        M[Authentication and Authorization]
        N[Business Logic Modules]
    end

    %% Core modules
    subgraph MODULES["Core Backend Modules"]
        O[Website Content and Public Pages]
        P[Enrollment and Admissions]
        Q[Academic Management]
        R[Attendance and Grades]
        S[Messaging and Moderation]
        T[Announcements and Notifications]
        U[Settings, Audit Logs, Backups, Analytics]
    end

    %% Data layer
    subgraph DATA["Data Layer"]
        V[(Relational Database)]
        W[File and Media Storage]
        X[Firebase Cloud Messaging]
    end

    %% Access flow
    A --> F
    B --> F
    C --> F
    D --> F
    E --> F

    F --> G
    F --> H
    G --> I
    H --> I
    I --> J
    I --> K

    %% API flow
    K --> L
    L --> M
    L --> N

    %% Module links
    N --> O
    N --> P
    N --> Q
    N --> R
    N --> S
    N --> T
    N --> U

    %% Persistence and services
    O --> V
    P --> V
    Q --> V
    R --> V
    S --> V
    T --> V
    U --> V

    P --> W
    R --> W
    S --> W
    T --> W

    T --> X
    X --> F
```

## Main Parts

- Client layer
- Frontend application layer
- Backend API layer
- Core backend modules
- Data and external service layer

## Caption

This figure shows how applicants, administrators, teachers, students, and parents access the React frontend through a browser or PWA, which communicates with the Django REST backend. The backend processes academic, communication, admissions, and system-management features while storing records in the database, files in storage, and push alerts through Firebase Cloud Messaging.

