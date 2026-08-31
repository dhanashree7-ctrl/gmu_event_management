# GMU Event Management System - Deployment Guide

This guide details how to deploy the decoupled React (Frontend) and PHP (Backend) application to a test server environment.

## Prerequisites
- **Node.js** (v16+ recommended) and `npm`
- **PHP** (v8.1+ recommended) with `mysqli` extension enabled
- **MySQL** (v8.0+)
- A web server (Apache/Nginx) pointing to the `backend` folder

## 1. Database Setup
A complete unified schema and seed script is provided in `schema_and_seed.sql`.

1. Create a new database on your MySQL server (e.g., `GMU_Events_Test`).
2. Import the provided SQL script:
   ```bash
   mysql -u root -p GMU_Events_Test < schema_and_seed.sql
   ```

## 2. Backend Configuration
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

*Note: CORS headers are centrally managed in `backend/config/cors.php`. They default to allowing `*` or the requesting origin for testing purposes. Error logging is also centralized in `backend/config/db.php`.*

## 3. Frontend Configuration & Build
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
- Log in using one of the seeded accounts (e.g., HOD: `dr_hod_cse`, Password: `password123`).
- Verify that the dashboard loads and API requests are succeeding. Check `backend/error.log` if any issues arise.
