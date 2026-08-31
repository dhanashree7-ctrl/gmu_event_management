# GMU Event Management System - End-User Guide

## 1. System Overview
Welcome to the GMU Event Management System. This centralized, decoupled web application is designed to streamline the entire lifecycle of university events—from initial faculty proposals and hierarchical approvals to student registration and post-event reporting. 

The platform guarantees a seamless experience across devices, ensuring that faculty can organize events efficiently, approvers can review requests rapidly, and students can discover and engage with campus activities through an intuitive interface.

---

## 2. Role-Based Dashboards

### Student Dashboard
The Student Dashboard is a gamified, mobile-responsive hub for campus engagement.
- **Discover Events:** View all published upcoming events curated for the student body.
- **Registration:** Easily register for individual events or form groups for team-based competitions (designating a Team Lead and Members).
- **My Tickets & Check-In:** Access a digital ticket for upcoming events. On the day of the event, the system tracks attendance seamlessly.
- **Feedback:** Upon attending an event, students can submit structured feedback directly through the dashboard.
- **Engagement Profile:** Monitor your reliability score and attendance metrics through interactive visual charts.

### Faculty / Organiser Dashboard
The Faculty Dashboard empowers staff to create, manage, and report on events without administrative friction.
- **Propose Events:** Submit comprehensive event proposals. You can propose standalone events or "Mega Events" that contain multiple distinct "Sub-Events" (e.g., a multi-day cultural festival).
- **Resource Management:** Upload supporting documents, event brochures, and cover images during the proposal phase.
- **My Events & Roster:** Track the approval status of your proposals. Once approved, view the real-time "Attendee Roster" to see exactly who has registered (including team groupings).
- **Post-Event Completion:** After an event concludes, organizers must complete a post-event report, uploading gallery images and documentation to officially finalize the event.

### Approvers (HOD & Director/Executive)
Approvers have access to streamlined dashboards focused on oversight and rapid decision-making.
- **Action Center:** A dedicated inbox for pending event proposals. Approvers can review the event details, budget, and brochures.
- **One-Click Decisions:** Instantly approve, reject, or request revisions for proposals. 
- **Approved By Me:** An archive tab that maintains a historical record of all events the approver has signed off on.
- *Note:* The approval chain is hierarchical. An event proposed by Faculty first goes to the HOD. Upon HOD approval, it automatically routes to the Director/Executive for final sign-off before being published to students.

### Events Admin / Student Affairs
The Events Admin dashboard provides a macro-view of the entire university's event ecosystem.
- **System-Wide Monitoring:** View all events across all departments, regardless of approval status.
- **Drill-Down Analytics:** Access deep analytics on event performance, student engagement, and departmental activity.
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
- **Instant Updates:** Approvers receive notifications the moment a faculty member submits a proposal. Faculty receive immediate alerts when their event is approved or rejected. Students are notified when a new mega-event goes live.
- **Browser Integration:** Because the system uses FCM, these notifications can trigger standard browser-level push notifications, ensuring users are alerted even if they are in another browser tab.
