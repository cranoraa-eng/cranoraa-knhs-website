# Research Paper Use Case Diagram

## Figure Title

**Figure 2. Use Case Diagram of the School Web Application**

## Mermaid Diagram

```mermaid
flowchart LR
    %% Actors
    A[Applicant]
    B[Admin]
    C[Teacher]
    D[Student]
    E[Parent]

    %% System boundary
    subgraph SYS["School Web Application"]
        U1([Submit Enrollment Application])
        U2([Upload Requirements])
        U3([Track Enrollment Status])

        U4([Manage Users])
        U5([Manage Classrooms])
        U6([Assign Subjects and Teachers])
        U7([Approve or Reject Enrollment])
        U8([Manage Announcements])
        U9([Manage Website Content])
        U10([Monitor Audit Logs, Backups, and System Health])

        U11([Mark Attendance])
        U12([Input Grades])
        U13([Upload Materials and Assignments])
        U14([View Class Members])
        U15([Send Messages])

        U16([View Grades])
        U17([View Attendance])
        U18([Access Learning Materials])
        U19([View Schedule])
        U20([Receive Announcements and Notifications])

        U21([View Child Grades])
        U22([View Child Attendance])
        U23([View Child Schedule])
        U24([Receive Child-Related Notifications])
    end

    %% Applicant
    A --> U1
    A --> U2
    A --> U3

    %% Admin
    B --> U4
    B --> U5
    B --> U6
    B --> U7
    B --> U8
    B --> U9
    B --> U10
    B --> U15

    %% Teacher
    C --> U11
    C --> U12
    C --> U13
    C --> U14
    C --> U15
    C --> U20

    %% Student
    D --> U16
    D --> U17
    D --> U18
    D --> U19
    D --> U20
    D --> U15

    %% Parent
    E --> U21
    E --> U22
    E --> U23
    E --> U24
    E --> U20
```

## Main Parts

- Applicant use cases
- Admin use cases
- Teacher use cases
- Student use cases
- Parent use cases

## Caption

This figure presents the primary user roles of the system and the major functions available to each actor. It highlights how the platform supports admissions, academic management, communication, monitoring, and parent visibility within one integrated school web application.

