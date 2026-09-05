# GMU Event Management System - End-User Guide

## 1. System Overview
Welcome to the GMU Event Management System. This centralized, decoupled web application is designed to streamline the entire lifecycle of university events—from initial faculty proposals and hierarchical approvals to student registration and post-event reporting. 

The platform guarantees a seamless experience across devices, ensuring that faculty can organize events efficiently, approvers can review requests rapidly, and students can discover and engage with campus activities through an intuitive interface.

---

## 2. Role-Based Dashboards & Workflows

### The Dynamic Event Approval Hierarchy
When a Faculty member proposes an event, the system automatically routes it through a strict approval chain based on the event's **Scale** and the user's **Discipline**. The event is not visible to students until the final executive in the chain approves it.

| Scale | Approval Chain |
|-------|----------------|
| **Department** | Faculty → HOD → ✅ Published |
| **Academic / Faculty** | Faculty → HOD → Director → ✅ Published |
| **University / Mega** | Faculty → HOD → Director → Dean → Pro VC → VC → ✅ Published |

**Full hierarchy (top-down):**
```
Faculty  (proposes)
  └─▶  HOD          (Level 1)
         └─▶  Director    (Level 2)
                └─▶  Dean       (Level 3)
                       └─▶  Pro VC     (Level 4)
                              └─▶  VC         (Level 5 — Final sign-off)
```

*Note: The system dynamically routes the proposal to the exact HOD, Director, or Dean who matches the proposing user's Discipline, eliminating manual routing errors.*

---

### Student Dashboard
The Student Dashboard is a gamified, mobile-responsive hub for campus engagement.
- **Discover Events:** View all published upcoming events curated for the student body. Filters allow browsing by Department, Academic, or University scales.
- **Registration:** Easily register for individual events or form groups for team-based competitions (designating a Team Lead and Members).
- **My Tickets & Check-In:** Access a digital ticket and QR code for upcoming events. On the day of the event, the system tracks attendance seamlessly.
- **Feedback:** Upon attending an event, students can submit structured feedback directly through the dashboard.
- **Engagement Profile:** Monitor your reliability score, registration history, and visual charts of your campus involvement.

### Faculty / Organiser Dashboard
The organizing dashboard empowers staff to create, manage, and report on events without administrative friction.
- **Propose Events:** Submit comprehensive event proposals. You can propose standalone events or "Mega Events" that contain multiple distinct "Sub-Events" (e.g., a multi-day cultural festival).
- **Resource Management:** Upload supporting documents, event brochures, and budgets during the proposal phase.
- **My Events & Roster:** Track the live approval status of your proposals. Once approved, view the real-time "Attendee Roster" to see exactly who has registered (including external college participants).
- **Post-Event Completion:** After an event concludes, organizers must complete a post-event report, uploading gallery images and documentation to officially mark the event as `completed` for the archives.

### Approvers (HOD → Director → Dean → Pro VC → VC)
Approvers have access to streamlined dashboards focused on oversight and rapid decision-making across their specific jurisdiction.
- **Action Center:** A dedicated inbox for pending event proposals awaiting their specific level of approval in the hierarchy. Approvers can review the event details, budget, and downloaded brochures.
- **One-Click Decisions:** Instantly approve, reject, or request revisions for proposals. 
- **Approved By Me:** An archive tab that maintains a historical timeline of all events the approver has signed off on.
- **Dynamic Role Mapping:** The system automatically normalizes complex enterprise designations based on your `USER_GROUP` and `DISCIPLINE` into clean internal roles, ensuring proposals route to the exact right person without failure.

### Events Admin & Student Affairs Director
The Student Affairs and Events Admin dashboards provide a macro-view of the entire university's event ecosystem.
- **System-Wide Monitoring:** View all events across all departments, regardless of approval status.
- **Drill-Down Analytics:** Access deep analytics on event performance, student engagement, external college participation, and departmental activity using interactive visual charts.
- **Event Timeline:** View the complete chronological history of an event's approvals, registrations, and feedback.
- **Routing Oversight:** Ensure that the approval hierarchy is flowing correctly and identify bottlenecks in the proposal pipeline.

---

## 3. Core Features

### The Unified Calendar
Every user dashboard features a standardized **Event Calendar** widget. 
- **Personalized View:** The calendar automatically merges public university events (System Events) with the user's specific schedule (My Events/Registrations). 
- **Interactive UI:** Users can navigate month-by-month. Days with events feature dynamic, clickable event tags. Clicking an event tag immediately opens a detailed view of the event's timeline and logistics.
- **Responsive Design:** The calendar is designed using fluid Flexbox grids, ensuring that event tags remain readable and accessible whether viewed on a widescreen monitor or a mobile phone.

### Real-Time Push Notifications
The platform utilizes Firebase Cloud Messaging (FCM) to deliver instant updates.
- **Bell Icon:** Located in the top right corner of the navigation bar, the bell icon serves as the notification hub.
- **Instant Updates:** Approvers receive notifications the moment a faculty member submits a proposal. Faculty receive immediate alerts when their event advances up the chain (e.g., from HOD to Director). Students are notified when a new mega-event goes live.
- **Browser Integration:** Because the system securely maps FCM tokens to your Enterprise ID, these notifications can trigger standard browser-level push notifications, ensuring you are alerted even if you are in another browser tab.

---

## 4. Testing Accounts

To thoroughly test the platform's features and end-to-end approval workflows, you can use the following mock accounts. 

**Note: The universal password for all test accounts is `test1234`.**

| Enterprise `USER_GROUP` | Username | Description |
|-------------------------|----------|-------------|
| **Faculty / Proposer**  | csfac01  | Use this to create new event proposals and manage rosters. |
| **HOD (Level 1 Approver)** | cshod01 | Approves Department scale events, and routes higher scales to the Director. |
| **Director (Level 2 Approver)** | director@gmu.ac.in | Approves Academic scale events, and routes University scales to the Dean. |
| **Dean (Level 3 Approver)** | dean.fet@gmu.ac.in | Approves University scale events, and routes to the Pro VC. |
| **Pro VC (Level 4 Approver)**| pro-vc@gmu.ac.in | Approves University scale events, and routes to the VC. |
| **VC (Level 5 Approver — Final)** | vc@gmu.ac.in | Final executive sign-off. Event is published after VC approval. |
| **Student** | `U23E01CS018` | Use this to register for events, form teams, and submit feedback. (CSE Student) |
| **Student Affairs Director**| student_affairs | View all global events and analytical drill-downs. |
| **Events Admin**        | events_admin | Manage overall platform settings and view event analytics. |

---

## 5. Approval Workflows by Event Scale

Each event scale triggers a **different approval chain**. The table below shows the exact sequence of approvals, the internal status the system sets at each step, and which test accounts to use to walk through the workflow end-to-end.

---

### 🔵 Department Scale
> Lowest scale. Requires only HOD approval before the event is published.

| Step | Action | Account to Use | Resulting Status |
|------|--------|---------------|-----------------|
| 1 | Faculty proposes the event | `csfac01` | `pending_hod` |
| 2 | HOD approves | `cshod01` | `published` ✅ |

---

### 🟡 Faculty / Academic Scale
> Mid-tier scale. Requires HOD and then Director approval.

| Step | Action | Account to Use | Resulting Status |
|------|--------|---------------|-----------------|
| 1 | Faculty proposes the event | `csfac01` | `pending_hod` |
| 2 | HOD approves | `cshod01` | `pending_director` |
| 3 | Director approves | `director@gmu.ac.in` | `published` ✅ |

---

### 🔴 University / Mega Scale
> Highest scale. Requires the full 5-level executive sign-off chain.

| Step | Action | Account to Use | Resulting Status |
|------|--------|---------------|-----------------|
| 1 | Faculty proposes the event | `csfac01` | `pending_hod` |
| 2 | HOD approves | `cshod01` | `pending_director` |
| 3 | Director approves | `director@gmu.ac.in` | `pending_dean` |
| 4 | Dean approves | `dean.fet@gmu.ac.in` | `pending_pro_vc` |
| 5 | Pro VC approves | `pro-vc@gmu.ac.in` | `pending_vc` |
| 6 | VC gives final sign-off | `vc@gmu.ac.in` | `published` ✅ |

---

### 🟠 State / National / International Scale
> Extended scale. Follows the same full chain as University scale.

| Step | Action | Account to Use | Resulting Status |
|------|--------|---------------|-----------------|
| 1 | Faculty proposes the event | `csfac01` | `pending_hod` |
| 2 | HOD approves | `cshod01` | `pending_director` |
| 3 | Director approves | `director@gmu.ac.in` | `pending_dean` |
| 4 | Dean approves | `dean.fet@gmu.ac.in` | `pending_pro_vc` |
| 5 | Pro VC approves | `pro-vc@gmu.ac.in` | `pending_vc` |
| 6 | VC gives final sign-off | `vc@gmu.ac.in` | `published` ✅ |

---

> **Rejection at any step:** If an approver rejects a proposal at any level, the event status is immediately set to `rejected` and the proposing faculty member receives a push notification. The faculty member can then revise and re-submit the proposal, restarting the chain from `pending_hod`.
