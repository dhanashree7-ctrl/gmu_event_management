# GMU Event Management System - Deployment Guide

This guide details how to deploy the decoupled React (Frontend) and PHP (Backend) application to a test server environment.

## Prerequisites
- **Node.js** (v16+ recommended) and `npm`
- **PHP** (v8.1+ recommended) with `mysqli` extension enabled
- **MySQL** (v8.0+)
- A web server (Apache/Nginx) pointing to the `backend` folder

## 1. Comprehensive Documentation
Before diving into deployment, please review our comprehensive guides located in the `Guides/` directory:
- **[User Guide](Guides/User_Guide.md):** Detailed breakdown of role-based dashboards, approval hierarchies, gamification metrics, and a list of **Testing Accounts**.
- **[Developer Guide](Guides/Developer_Guide.md):** Architectural overview, JWT/Enterprise role normalization, Firebase integration, and advanced database workflows.

## 2. Deployment & Database Setup
A complete unified schema and seed script is provided in `database/schema_and_seed.sql`.

> **⚠️ CRITICAL ENTERPRISE DEPENDENCY: The `users` Table**
> The `users` table is treated as a strict **Read-Only** enterprise dependency. `SL_NO` is the internal integer Primary Key, while `ID` acts as the string-based USN/Roll Number. The application derives route protection and logic from the `USER_GROUP` and `DISCIPLINE` columns. We **do not** write or mutate data in this table directly.

To securely extend the read-only user data (e.g., for Push Notifications), the database setup script will generate application-specific tables, including a dedicated bridging table:

1. Create a new database on your MySQL server (e.g., `GMU_Events_Test`).
2. Import the provided SQL script:
   ```bash
   mysql -u root -p GMU_Events_Test < database/schema_and_seed.sql
   ```
   *This script generates the required internal tables: `event_master`, `event_registrations`, `approval_hierarchy`, and the crucial `notifications` table (which bridges the `users` table with Firebase FCM tokens without altering enterprise data).*

3. *(Optional)* **Realistic Data Seeding:** The `schema_and_seed.sql` file comes pre-loaded with pristine, highly detailed events to demonstrate platform features. If you ever need to wipe the database and regenerate this realistic data, run the custom PHP seeder script:
   ```bash
   php backend/seed_realistic.php
   ```

## 3. Backend Configuration
The backend has been configured to be completely portable using relative paths and environment variables.

1. Navigate to the `backend` directory.
2. Open the `.env` file and configure your database credentials:
   ```env
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASS=your_secure_password_here
   DB_NAME=GMU_Events_Test
   ```
3. Host the `backend` folder on your web server (e.g., Apache `htdocs` or Nginx `www`). Ensure your web server is configured to serve PHP files.

*Note: CORS headers are centrally managed in `backend/config/cors.php`. Error logging is centralized in `backend/config/db.php`.*

## 4. Frontend Configuration & Build
The React frontend is environment-aware and requires the backend API URL to be set before building.

1. Navigate to the `frontend` directory.
2. Open the `.env` file and set the `REACT_APP_API_URL` to point to your hosted backend:
   ```env
   # Example: http://192.168.1.100/backend
   REACT_APP_API_URL=http://your-test-server-ip-or-domain/backend
   ```
3. Install dependencies and build the application:
   ```bash
   npm install
   npm run build
   ```
4. Serve the static files generated in the `frontend/build/` directory using your web server or a static file host.

## Verification
- Navigate to the frontend URL.
- Log in using one of the seeded accounts (e.g., HOD: `cshod01`, Password: `test1234`).
- Verify that the dashboard loads and API requests are succeeding. Check `backend/error.log` if any issues arise.
