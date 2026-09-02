# GMU Event Management System - Developer Guide

## 1. Architecture Overview
This application utilizes a completely decoupled, modern web stack designed for robust separation of concerns, scalability, and ease of deployment.

- **Frontend (Client):** Built with **React.js**. It functions as an independent Single Page Application (SPA). All state routing is handled client-side via React Router. The frontend communicates with the server exclusively via asynchronous `fetch` calls.
- **Backend (REST API):** Built with raw **PHP (v8.1+)**. Instead of serving HTML views, the PHP backend acts purely as a stateless RESTful API, returning JSON payloads.
- **Database:** **MySQL (v8.0+)**. The relational schema is optimized for complex approval hierarchies, while strategically utilizing JSON columns for flexible data schemas (like dynamic forms or varying sub-event logistics).

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

## 3. Database Schema Highlights
The database (`GMU_Events_Test`) is highly normalized but incorporates modern JSON data types to handle edge cases without table bloat.

- **JSON Columns:** 
  - `attachments_json` (in `event_master`): Stores an array of file paths for dynamic document uploads without requiring a separate `attachments` join table.
  - `feedback_json` (in `event_registrations`): Stores flexible key-value pairs for student post-event feedback.
- **Hierarchical Approvals:** The `approval_hierarchy` and `approval_rules` tables dictate the flow of events from Faculty -> HOD -> Executive.
- **Firebase Token Columns:** 
  - `fcm_web_token` (in `users`): Stores the unique browser fingerprint required to send targeted push notifications.
  - `notification_sent` (in `event_master`): A boolean flag used to prevent duplicate broadcast notifications from being fired by concurrent admin actions.

---

## 4. Enterprise Integration & Security

### Role Normalization & JWT
When the system interfaces with the university's enterprise `users` table, it encounters raw, unstructured job titles (e.g., "Director - School of Computer Science & Technology"). 
- **Normalization:** The `role_helper.php` intercepts these raw `DESIGNATION` strings during login and maps them to clean internal roles (e.g., `director`, `hod`, `dean`, `vc`).
- **JWT Authorization:** Only the clean, normalized internal role is baked into the JWT. The backend API endpoints (`get_pending_events.php`, `update_event_status.php`) strictly use this JWT role for authorization checks, ensuring robust security and preventing SQL-level string mismatches.

### Realistic Data Seeding
For testing purposes, the repository includes a custom algorithm script: `backend/seed_realistic.php`.
- **Function:** Running this script automatically wipes all test events and populates the database with exactly 10 extremely realistic events. 
- **Coverage:** The script programmatically guarantees that all edge-case features are seeded, including external cross-college participants, team leads for mega-events, dynamic dates, JSON feedback payloads, and dummy file attachments (brochures/reports).

---

## 5. Firebase FCM Integration
The platform utilizes Firebase Cloud Messaging to push real-time updates (e.g., approval status changes, mega-event launches) directly to the user's browser, even if they are in another tab.

### Frontend Implementation
The React app uses the Firebase Web SDK (`firebase-messaging-sw.js` service worker) to request notification permissions from the browser. Upon granting permission, Firebase generates an FCM token, which the frontend securely POSTs to `update_fcm_token.php`.

### Backend Implementation
The PHP backend acts as the broadcaster. When a critical state changes (e.g., an HOD approves an event via `update_event_status.php`), the script queries the `users` table for the target's `fcm_web_token`. It then uses `fcm_helper.php` to securely negotiate with the Firebase Admin REST API (using the Service Account Key) to push the payload to the browser. 
*Locking:* The backend strictly uses the `notification_sent` flag in transactions to prevent duplicate push broadcasts during rapid concurrent approvals.

---

## 5. Deployment Steps
To deploy the application to a test server (e.g., Apache or Nginx):

### Step 1: Host the Backend API
1. Place the entire `backend` directory into your web server's document root (e.g., `/var/www/html/backend`).
2. Ensure the `backend/.env` is configured correctly.
3. Ensure the web user (e.g., `www-data`) has write permissions to `backend/uploads/` and `backend/error.log`.
4. *Note:* CORS is globally handled by `backend/config/cors.php`. Ensure your web server is not aggressively blocking `OPTIONS` preflight requests.

### Step 2: Build the Frontend
On your local machine or build server, configure the frontend to point to your newly hosted backend, then build the static bundle:
```bash
cd frontend
# Ensure REACT_APP_API_URL is set in .env
npm install
npm run build
```

### Step 3: Host the Frontend
1. The `npm run build` command generates a `build/` directory containing purely static files (HTML, JS, CSS).
2. Copy the contents of `frontend/build/` to the root of your web server (e.g., `/var/www/html/`).
3. **CRITICAL:** Because React uses client-side routing, you must configure your web server to route all `404` requests back to `index.html`. 
   - *Apache:* Use an `.htaccess` file with `FallbackResource /index.html`.
   - *Nginx:* Use `try_files $uri $uri/ /index.html;`.
