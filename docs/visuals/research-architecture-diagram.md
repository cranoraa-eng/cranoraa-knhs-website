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
        F[Browser]
        G[Public Website]
        H[Portal Frontend (React SPA)]
    end

    %% Frontend
    subgraph FRONTEND["Frontend Application Layer"]
        I[React 18]
        J[React Router v6]
        K[Axios (REST API)]
        L[Native WebSocket (Real-time)]
    end

    %% Backend
    subgraph BACKEND["Backend Application Layer"]
        M[Django REST API (DRF)]
        N[Authentication & Authorization (JWT + httpOnly Cookie)]
        O[Business Logic Modules]
    end

    %% Real-time layer
    subgraph REALTIME["Real-time Layer (Django Channels)"]
        P[ChatConsumer<br/>/ws/chat/<roomId>/]
        Q[NotificationConsumer<br/>/ws/notifications/]
        R[TicketConsumer<br/>/ws/tickets/<ticketId>/]
    end

    %% Core modules
    subgraph MODULES["Core Backend Modules"]
        S[Website Content & Public Pages]
        T[Enrollment & Admissions]
        U[Academic Management]
        V[Attendance & Grades]
        W[Messaging & Moderation]
        X[Announcements & Notifications]
        Y[Settings, Audit Logs, Backups, Analytics]
    end

    %% Data layer
    subgraph DATA["Data & External Services"]
        Z[(Relational Database<br/>PostgreSQL / SQLite)]
        AA[File & Media Storage]
        AB[Firebase Cloud Messaging<br/>(Push fallback)]
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
    I --> L

    %% REST API flow
    K --> M
    M --> N
    M --> O

    %% WebSocket flow (separate from REST)
    L --> P
    L --> Q
    L --> R

    %% Module links (REST)
    O --> S
    O --> T
    O --> U
    O --> V
    O --> W
    O --> X
    O --> Y

    %% Real-time module links
    P --> W
    Q --> X
    R --> W

    %% Persistence and services (REST modules)
    S --> Z
    T --> Z
    U --> Z
    V --> Z
    W --> Z
    X --> Z
    Y --> Z

    T --> AA
    V --> AA
    W --> AA
    X --> AA

    %% Push notifications (fallback when WebSocket unavailable)
    X --> AB
    AB --> F

    %% Real-time consumers also persist to DB
    P --> Z
    Q --> Z
    R --> Z
```

## Main Parts

- Client layer (Browser, Public Website, Portal Frontend)
- Frontend application layer (React, Router, Axios, WebSocket)
- Backend REST API layer (Django REST Framework, JWT Auth)
- **Real-time layer (Django Channels WebSocket Consumers)**
- Core backend modules (7 domains)
- Data and external service layer (DB, File Storage, FCM)

## Caption

This figure shows the actual system architecture. All users access the React SPA through a browser. The frontend communicates with the Django backend via **two channels**: (1) REST API (Axios) for CRUD operations, authentication, and most business logic; (2) **Native WebSockets (Django Channels)** for real-time features — chat/messaging (`ChatConsumer`), live notifications (`NotificationConsumer`), and ticket updates (`TicketConsumer`). Both REST and WebSocket consumers persist to the same PostgreSQL database. File uploads go to media storage. Firebase Cloud Messaging serves as a push fallback for notifications when WebSocket is unavailable. There is **no PWA / service worker** in the current implementation.

## Key Corrections from Previous Version

| Aspect | Old Diagram | Actual Implementation |
|--------|-------------|----------------------|
| PWA | Browser / PWA | Browser only (no service worker) |
| Messaging | REST API | **WebSocket (Django Channels)** |
| Notifications | REST + FCM only | **WebSocket primary, FCM fallback** |
| Real-time | Not shown | **3 WebSocket consumers** (Chat, Notifications, Tickets) |
| API Structure | Single API flow | **Dual transport**: REST + WebSocket |