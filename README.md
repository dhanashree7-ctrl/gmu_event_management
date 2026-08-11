# GMU Event Management System

Welcome to the **GMU Event Management System**! This is a comprehensive, full-stack web application designed to streamline the proposal, approval, and management of academic and extracurricular events at GM University.

## 🚀 Features

- **Role-Based Dashboards**: Customized interfaces for Students, Faculty, HODs (Head of Departments), Deans, and Executives.
- **Hierarchical Approval Workflow**: Faculty can propose events which are systematically routed through HODs and higher authorities for approval before publication.
- **Student Event Registration**: Students can browse published events (filtered by Department vs. University level) and register seamlessly.
- **AI Chat Assistant**: Integrated with Google's Gemini AI to answer user queries about upcoming events, schedules, and venues based directly on the university's real-time database.
- **QR Code Check-ins & Certificates**: Automated attendance tracking via QR codes and certificate generation for participants.
- **Real-Time Notifications**: Automated alert system to notify users of approval status changes and event reminders.

## 🛠️ Technology Stack

- **Frontend**: React.js (Component-based architecture, dynamic routing, modern UI)
- **Backend**: PHP (RESTful APIs handling business logic and authentication)
- **Database**: MySQL (`GMU_Events01` database with an optimized relational schema)
- **AI Integration**: Google Gemini API via REST calls

## 📂 Project Structure

```text
gmu_event_management/
├── backend/                # PHP API endpoints and database scripts
│   ├── config/             # Database connection settings (db.php)
│   ├── migration/          # SQL schemas and data migration scripts
│   └── ...                 # API endpoints (e.g., login, fetch events)
├── frontend/               # React frontend application
│   ├── public/             # Static assets and index.html
│   ├── src/                # React components, pages, context, and styles
│   └── package.json        # Frontend dependencies
├── .env                    # Environment variables (API Keys) - NOT COMMITTED
└── .gitignore              # Git ignore rules
```

## ⚙️ Local Setup Instructions

1. **Clone the repository:**
   ```bash
   git clone https://github.com/dhanashree7-ctrl/gmu_event_management.git
   cd gmu_event_management
   ```

2. **Database Configuration:**
   - Install XAMPP or another MySQL server.
   - Run `backend/migration/01_create_GMU_Events01.sql` to generate the 6-table schema.
   - Run `backend/migration/02_migrate_data.php` to populate the database with seed data.
   - Ensure your MySQL credentials in `backend/config/db.php` are correct.

3. **Environment Variables:**
   - Create a `.env` file in the root directory.
   - Add your Google Gemini API key:
     ```env
     GEMINI_API_KEY=your_api_key_here
     ```

4. **Start the Frontend:**
   ```bash
   cd frontend
   npm install
   npm start
   ```
   The React application will run on `http://localhost:3000`.

5. **Start the Backend:**
   - Serve the `backend/` folder using Apache (XAMPP) on port `8000`.

## 🤝 Contributing
Ensure you pull the latest changes before starting work to avoid schema conflicts. If proposing database changes, please update the SQL migration scripts accordingly!
