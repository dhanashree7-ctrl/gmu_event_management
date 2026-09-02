# GMU Event Management System - End-User Guide

## 1. System Overview
Welcome to the GMU Event Management System. This centralized, decoupled web application is designed to streamline the entire lifecycle of university events—from initial faculty proposals and hierarchical approvals to student registration and post-event reporting. 

The platform guarantees a seamless experience across devices, ensuring that faculty can organize events efficiently, approvers can review requests rapidly, and students can discover and engage with campus activities through an intuitive interface.

---

## 2. Role-Based Dashboards & Workflows

### The Event Approval Hierarchy
When a Faculty member proposes an event, the system automatically routes it through a strict approval chain based on the event's **Scale**. The event is not visible to students until the final executive in the chain approves it.
- **Department Scale:** Faculty Proposal → HOD Approval → Published
- **Academic Scale:** Faculty Proposal → HOD Approval → Dean Approval → Published
- **University Scale:** Faculty Proposal → HOD Approval → Dean Approval → Pro-VC Approval → VC Approval → Published

---

### Student Dashboard
The Student Dashboard is a gamified, mobile-responsive hub for campus engagement.
- **Discover Events:** View all published upcoming events curated for the student body. Filters allow browsing by Department, Academic, or University scales.
- **Registration:** Easily register for individual events or form groups for team-based competitions (designating a Team Lead and Members).
- **My Tickets & Check-In:** Access a digital ticket and QR code for upcoming events. On the day of the event, the system tracks attendance seamlessly.
- **Feedback:** Upon attending an event, students can submit structured feedback directly through the dashboard.
- **Engagement Profile:** Monitor your reliability score, registration history, and visual charts of your campus involvement.

### Faculty / Organiser Dashboard
The Faculty Dashboard empowers staff to create, manage, and report on events without administrative friction.
- **Propose Events:** Submit comprehensive event proposals. You can propose standalone events or "Mega Events" that contain multiple distinct "Sub-Events" (e.g., a multi-day cultural festival).
- **Resource Management:** Upload supporting documents, event brochures, and budgets during the proposal phase.
- **My Events & Roster:** Track the live approval status of your proposals. Once approved, view the real-time "Attendee Roster" to see exactly who has registered (including external college participants).
- **Post-Event Completion:** After an event concludes, organizers must complete a post-event report, uploading gallery images and documentation to officially mark the event as `completed` for the archives.

### Approvers (HOD, Dean, Pro-VC, VC)
Approvers have access to streamlined dashboards focused on oversight and rapid decision-making across their specific jurisdiction.
- **Action Center:** A dedicated inbox for pending event proposals awaiting their specific level of approval in the hierarchy. Approvers can review the event details, budget, and downloaded brochures.
- **One-Click Decisions:** Instantly approve, reject, or request revisions for proposals. 
- **Approved By Me:** An archive tab that maintains a historical timeline of all events the approver has signed off on.
- **Dynamic Role Mapping:** The system automatically normalizes complex enterprise designations (e.g., "Director - School of Computer Science & Technology") into clean internal roles, ensuring proposals route to the exact right person without failure.

### Events Admin / Student Affairs
The Events Admin dashboard provides a macro-view of the entire university's event ecosystem.
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

### Real-Time Bell Notifications
The platform utilizes Firebase Cloud Messaging (FCM) to deliver instant updates.
- **Bell Icon:** Located in the top right corner of the navigation bar, the bell icon serves as the notification hub.
- **Instant Updates:** Approvers receive notifications the moment a faculty member submits a proposal. Faculty receive immediate alerts when their event advances up the chain (e.g. from HOD to Dean). Students are notified when a new mega-event goes live.
- **Browser Integration:** Because the system uses FCM, these notifications can trigger standard browser-level push notifications, ensuring users are alerted even if they are in another browser tab.
