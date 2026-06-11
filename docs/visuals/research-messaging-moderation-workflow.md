# Research Paper Messaging and Moderation Workflow Visual

## Figure Title

**Figure 6. Messaging and Moderation Workflow**

## Mermaid Diagram

```mermaid
flowchart TD
    A[Student or Teacher] --> B[Search User or Friend]
    B --> C[Create or Open Chat Room]
    C --> D[(ChatRoom)]

    A --> E[Send Message]
    E --> F[(ChatMessage)]
    F --> G[Deliver to Recipients]
    G --> H[Read, Reply, React, or Pin]
    H --> I[(MessageReaction)]

    A --> J[Report Abusive Message]
    J --> K[(ReportedMessage)]

    L[Moderator or Admin] --> M[Open Moderation Panel]
    M --> N[Review Reported Content]
    N --> O{Decision}

    O -- Resolve --> P[Resolve Report]
    O -- Dismiss --> Q[Dismiss Report]
    O -- Mute User --> R[Apply Mute]
    O -- Suspend User --> S[Apply Suspension]

    R --> T[(Profile)]
    S --> U[(User)]
    P --> K
    Q --> K
```

## Main Parts

- User messaging flow
- Chat room creation and usage
- Message interaction features
- Report submission
- Moderator review and action flow

## Caption

This figure presents the messaging and moderation workflow of the portal. It covers user messaging, room creation, reactions and replies, abuse reporting, moderator review, and corrective actions such as resolving reports, muting users, and suspending accounts.

