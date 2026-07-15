# Research Paper Notification and Push Flow Visual

## Figure Title

**Figure 7. Notification and Push Delivery Flow**

## Mermaid Diagram

```mermaid
flowchart LR
    A[System Event]
    B[Announcement Published]
    C[Grade Updated]
    D[Attendance Recorded]
    E[Message Received]
    F[Fee or System Reminder]

    A --> G[Create Notification Record]
    B --> G
    C --> G
    D --> G
    E --> G
    F --> G

    G --> H[(Notification)]
    H --> I[Realtime Broadcast]
    H --> J[Push Notification Service]
    J --> K[(FCMToken)]
    K --> L[User Device]

    L --> M[Notification Dropdown]
    L --> N[Notifications Page]
    M --> O[Mark as Read]
    N --> P[Mark Selected or All as Read]
    O --> H
    P --> H
```

## Main Parts

- Event source
- Notification creation
- Realtime broadcast
- Push delivery through FCM
- User read and acknowledgement flow

## Caption

This figure illustrates how system events generate notifications, how those notifications are delivered through realtime broadcast and Firebase push services, and how users access and mark them as read through the portal interface.

