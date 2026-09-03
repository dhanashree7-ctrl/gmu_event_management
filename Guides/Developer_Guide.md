# GMU Event Management System - Developer Guide

## 1. Architecture Overview
This application utilizes a completely decoupled, modern web stack designed for robust separation of concerns, scalability, and ease of integration with existing enterprise systems.

- **Frontend (Client):** Built with **React.js**. It functions as an independent Single Page Application (SPA). All state routing is handled client-side via React Router. The frontend communicates with the server exclusively via asynchronous `fetch` calls.
- **Backend (REST API):** Built with raw **PHP (v8.1+)**. Instead of serving HTML views, the PHP backend acts purely as a stateless RESTful API, returning JSON payloads.
- **Database:** **MySQL (v8.0+)**. The relational schema is optimized for complex approval hierarchies, while strategically utilizing JSON columns for flexible data schemas. The architecture is designed to respect read-only enterprise dependencies.

---

## 2. Environment Setup
The codebase relies on environment variables (`.env` files) to ensure zero hardcoded paths or credentials exist in the source code.

### React Frontend `.env`
Located at `frontend/.env`. This file controls the base URL that the React application uses to communicate with the PHP backend.
```env
# Point this to the domain/IP where the PHP backend is hosted
REACT_APP_API_URL=http://your-test-server-ip-or-domain/backend
```
*Note: Because React runs in the browser, these variables are baked into the static files during the build process. You must set this file **before** running `npm run build`.*

### PHP Backend `.env`
Located at `backend/.env`. This file secures the database connection. The backend uses a custom `.env` parser inside `backend/config/db.php` to load these values dynamically on every request.
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASS=your_secure_password_here
DB_NAME=GMU_Events_Test
```

---

## 3. Database Schema & Enterprise Constraints
The database (`GMU_Events_Test`) is highly normalized and strictly enforces enterprise architectural patterns, particularly concerning the `users` table.

### The Enterprise User Constraint
The `users` table is treated as a **Read-Only Enterprise Dependency**. 
- **`SL_NO` vs. `ID`:** The table uses `SL_NO` (an internal auto-incrementing integer) as its Primary Key. However, our application logic and foreign keys (e.g., in `event_registrations` or `event_master`) strictly rely on the string-based `ID` (which represents the user's USN or Employee Roll Number) or `USER_NAME`.
- **Immutability:** The application is explicitly prohibited from writing to or altering the schema of the `users` table, ensuring seamless synchronization with central university IT systems.

### Role & Department Routing
To maintain the read-only constraint, the system derives authorization and workflow logic from existing enterprise fields:
- **`USER_GROUP` & `DISCIPLINE`:** Instead of dedicated `role` or `dept` columns, React route protection, conditional UI rendering, and HOD approval logic rely entirely on mapping the `USER_GROUP` (e.g., WARDEN, FACULTY, STUDENT) and `DISCIPLINE` (e.g., CSE, ECE) fields. 

### Modern Data Storage
- **JSON Columns:** 
  - `attachments_json` (in `event_master`): Stores an array of file paths for dynamic document uploads without requiring a separate `attachments` join table.
  - `feedback_json` (in `event_registrations`): Stores flexible key-value pairs for student post-event feedback.
- **Hierarchical Approvals:** The `approval_hierarchy` and `approval_rules` tables dynamically dictate the flow of events based on the proposer's `DISCIPLINE` (e.g., Faculty -> HOD -> Executive).

---

## 4. Enterprise Integration & Security

### Role Normalization & JWT
When the system interfaces with the university's enterprise `users` table, it encounters raw, unstructured job titles (e.g., "Director - School of Computer Science & Technology"). 
- **Normalization:** The `role_helper.php` intercepts these raw `DESIGNATION` and `USER_GROUP` strings during login and maps them to clean internal roles (e.g., `director`, `hod`, `dean`, `vc`).
- **JWT Authorization:** Only the clean, normalized internal role is baked into the JWT. The backend API endpoints strictly use this JWT role for authorization checks, ensuring robust security and preventing SQL-level string mismatches.

### Realistic Data Seeding
For testing purposes, the repository includes a custom algorithm script: `backend/seed_realistic.php`. Running this script wipes all test events and populates the database with exactly 10 extremely realistic events to guarantee all edge-case features (external cross-college participants, team leads, JSON payloads) are seeded.

---

## 5. Firebase FCM & The Token Bridging Architecture
The platform utilizes Firebase Cloud Messaging (FCM) to push real-time updates directly to the user's browser.

### The Token Bridging Architecture
Because the `users` table is strictly read-only, we cannot modify its schema to store dynamically generated Firebase web tokens.
- **The `notifications` Table:** To solve this securely, we utilize a dedicated bridging table named `notifications` (containing `id`, `user_id`, and `fcm_web_token`). This table manages the 1-to-many relationship between enterprise users and their authorized browser instances.
- **Backend `JOIN`s:** When a critical state changes (e.g., an HOD approves an event), the PHP script (`update_event_status.php`) performs a `JOIN` between the read-only `users` table and our `notifications` table to extract the target's `fcm_web_token` and dispatch the push payload via `fcm_helper.php`.

### Frontend Implementation
The React app uses the Firebase Web SDK (`firebase-messaging-sw.js` service worker) to request notification permissions. Upon granting permission, Firebase generates an FCM token, which the frontend securely POSTs to `update_fcm_token.php`, populating the `notifications` bridging table.

---

## 6. Deployment Steps
To deploy the application to a test server:

### Step 1: Host the Backend API
1. Place the entire `backend` directory into your web server's document root.
2. Ensure the `backend/.env` is configured correctly.
3. Ensure the web user (e.g., `www-data`) has write permissions to `backend/uploads/` and `backend/error.log`.

### Step 2: Build the Frontend
On your local machine or build server, configure the frontend to point to your newly hosted backend:
```bash
cd frontend
# Ensure REACT_APP_API_URL is set in .env
npm install
npm run build
```

### Step 3: Host the Frontend
1. The `npm run build` command generates a `build/` directory containing purely static files.
2. Copy the contents of `frontend/build/` to the root of your web server.
3. **CRITICAL:** Because React uses client-side routing, you must configure your web server to route all `404` requests back to `index.html` (e.g., `FallbackResource /index.html` in Apache).
