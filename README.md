# Event Management System

The GMU Event Management System is a React and PHP application for proposing, approving, publishing, running, and reviewing university events.

## Features

### Event workflows

- Create event proposals with department, category, scale, venue, schedule, budget, mode, capacity, rewards, and coordinator details.
- Support festival events with multiple sub-events, participation types, team details, and sub-event logistics.
- Configure approval routes by event scale and move proposals through HOD, Director, Dean, Pro-VC, and VC approval stages.
- Approve or reject proposals with remarks, view approval history, and finalize approved events with operational logistics.
- Upload brochures and post-event reports, then publish completed records to the event archive.

### Role-based workspaces

The application routes users to dedicated workspaces based on their institutional role:

- **Students**: Browse upcoming events, filter by category or university/department scope, register as a participant or volunteer, select festival sub-events, download QR tickets, view registered events, submit feedback, and generate certificates.
- **Faculty and Organizers**: Propose events, track submissions, finalize logistics, view attendee rosters, review feedback insights, and access organizer reports.
- **HODs**: Review department proposals, approve or reject with remarks, view approval history, rosters, feedback, and approved-event history.
- **Directors, Deans, Pro-VCs, and VCs**: Process events assigned to their approval stage, review remarks and history, inspect analytics, and view events already processed by their role.
- **Student Affairs**: Manage Student Affairs event proposals and the related approval and reporting workflow.
- **Events Admins**: View dashboard metrics, manage users, configure approval routing with drag-and-drop ordering, inspect reports, and browse the event archive.
- **Volunteers**: Use the volunteer workspace and QR scanning flow for event operations.

### Attendance, communication, and reporting

- Generate participant QR codes and scan them for check-in using the QR scanner.
- Track registration capacity, participant roles, volunteer/coordinator counts, and attendance status.
- Send and display approval, event, and reminder notifications, including unread notification polling.
- Collect 1-to-5-star feedback and comments after events.
- View participation, check-in, demographics, feedback, budget, category, department, and academic-year analytics.
- Drill into individual events and browse completed-event history with participant counts and average ratings.
- Export report data and certificates from the frontend.
- Ask the Gemini-backed event assistant questions about current approved events, dates, venues, categories, and scales.

## Technology Stack

- **Frontend**: React 19, React Router, Recharts, React Select, `@hello-pangea/dnd`, `qrcode.react`, `html5-qrcode`, `jsPDF`, and `xlsx`.
- **Backend**: PHP 7.4+ APIs using MySQLi and JSON or multipart requests.
- **Database**: MySQL, using the `GMU_Events01` database and event, user, approval, registration, notification, and metadata tables.
- **AI**: Google Gemini REST API through `backend/chat_assistant.php`.

## Project Structure

```text
Event Management/
├── backend/                 # PHP API endpoints
│   ├── config/db.php        # MySQL connection configuration
│   ├── migration/           # Schema, migration, and seed scripts
│   └── uploads/             # Brochure and report uploads
├── frontend/                # React application
│   ├── public/               # Static assets
│   └── src/
│       ├── components/       # Chatbot, reports, archive, notifications, QR, etc.
│       ├── context/          # Authentication context
│       └── pages/            # Public page and role dashboards
├── database/                 # SQL schema and database exports
├── .env                      # Local secrets; do not commit
└── README.md
```

## Local Setup

### Prerequisites

- Node.js and npm
- PHP with the `mysqli` extension
- MySQL or MariaDB
- A Google Gemini API key for the chat assistant

### 1. Configure the database

Create the database and tables using the SQL files in `database/` or the migration scripts in `backend/migration/`. The application defaults are:

```text
Host: localhost
Port: 3306
Database: GMU_Events01
User: root
```

Set these environment variables when your local database differs:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASS=your_database_password
DB_NAME=GMU_Events01
```

The PHP connection helper reads these variables and should be updated before using the application outside local development.

### 2. Configure the AI assistant

Create a root `.env` file. `backend/chat_assistant.php` reads the Gemini key from this file:

```env
GEMINI_API_KEY=your_gemini_api_key
```

The assistant is optional for the rest of the event-management workflows, but it will not answer requests without this key.

### 3. Start the PHP backend

From the repository root, run:

```bash
php -S localhost:8080 -t .
```

The frontend is configured to call `http://localhost:8080/backend`. If you use Apache or another server, update `frontend/src/config/api.js` to match its backend URL.

### 4. Start the React frontend

In a second terminal:

```bash
cd frontend
npm install
npm start
```

Open `http://localhost:3000` in a browser.

### Available frontend commands

Run these from `frontend/`:

```bash
npm start       # Start the development server
npm test        # Run the test runner
npm run build   # Create a production build
```

## Main Routes

| Route | Access |
| --- | --- |
| `/` and `/login` | Public landing page and login |
| `/student-dashboard` | Students |
| `/faculty-dashboard` | Faculty and admins |
| `/hod-dashboard` | HODs |
| `/sa-dashboard` | Student Affairs |
| `/director-dashboard` | Directors |
| `/dean-dashboard` | Deans |
| `/provc-dashboard` | Pro-VCs |
| `/vc-dashboard` | VCs |
| `/events-admin-dashboard` | Events Admins |
| `/volunteer-dashboard` | Volunteers |
| `/scanner` | Authenticated QR scanning |
| `/event-details/:eventId` | Authenticated event timeline/details |
| `/admin-reports/event/:eventId` | Events Admin event drill-down |

## Development Notes

- Keep credentials and API keys out of version control.
- Update the SQL schema or migration scripts when changing database structure.
- Keep frontend API calls pointed at the shared `API_BASE` in `frontend/src/config/api.js`.
- Seed and migration scripts can change existing data; review them before running against a non-development database.
