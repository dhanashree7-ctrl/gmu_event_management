/**
 * src/App.js
 * -----------------------------------------------------------------
 * Root component -- sets up React Router v6 and the global
 * AuthProvider. All route definitions live here.
 *
 * Route map:
 *   /                   -> PreLoginPage       (public)
 *   /login              -> LoginPage          (public; redirects if logged in)
 *   /faculty-dashboard  -> FacultyDashboard   (protected)
 *   /hod-dashboard      -> HODDashboard       (protected)
 *   *                   -> redirect to /
 * -----------------------------------------------------------------
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import { AuthProvider, useAuth } from './context/AuthContext';
import PreLoginPage from './pages/PreLoginPage';
import Login from './pages/Login';
import FacultyDashboard from './pages/FacultyDashboard';
import HODDashboard from './pages/HODDashboard';
import ExecutiveDashboard from './pages/ExecutiveDashboard';
import StudentDashboard from './pages/StudentDashboard';
import StudentAffairsDashboard from './pages/StudentAffairsDashboard';
import QRScanner from './pages/QRScanner';
import EventsAdminDashboard from './pages/EventsAdminDashboard';
import EventDetails from './pages/EventDetails';
import EventDrillDownPage from './pages/EventDrillDownPage';
import StudentEventDetails from './pages/StudentEventDetails';
import EventChatbot from './components/EventChatbot';
import VolunteerDashboard from './pages/VolunteerDashboard';
import { useFCMNotifications } from './hooks/useFCMNotifications'; // [FIREBASE MIGRATION — Phase 4]

/**
 * ProtectedRoute
 * Renders children only when a user is logged in.
 * Otherwise redirects to /login.
 */
function ProtectedRoute({ children, allowedRoles }) {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  return children;
}

/**
 * AppRoutes
 * Separated from App so that useAuth() can be called inside
 * BrowserRouter (hooks must be inside the router provider).
 */
function AppRoutes() {
  // [FIREBASE MIGRATION — Phase 4]
  // Requests notification permission, fetches FCM token, registers with backend,
  // and sets up the foreground message listener. No JSX needed — runs as a side effect.
  useFCMNotifications();

  return (
    <>
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<PreLoginPage />} />
      <Route path="/login" element={<Login />} />

      {/* Protected: Faculty / Organizer */}
      <Route
        path="/faculty-dashboard"
        element={
          <ProtectedRoute allowedRoles={['faculty', 'admin']}>
            <FacultyDashboard />
          </ProtectedRoute>
        }
      />

      {/* Protected: Head of Department */}
      <Route
        path="/hod-dashboard"
        element={
          <ProtectedRoute allowedRoles={['hod']}>
            <HODDashboard />
          </ProtectedRoute>
        }
      />

      {/* Protected: Student */}
      <Route path="/student-dashboard" element={
        <ProtectedRoute allowedRoles={['student']}>
          <StudentDashboard />
        </ProtectedRoute>
      } />
      <Route path="/student/event/:eventId" element={
        <ProtectedRoute allowedRoles={['student']}>
          <StudentEventDetails />
        </ProtectedRoute>
      } />
      <Route path="/sa-dashboard" element={
        <ProtectedRoute allowedRoles={['student_affairs']}>
          <ExecutiveDashboard />
        </ProtectedRoute>
      } />

      {/* Approver Dashboards */}
      <Route path="/director-dashboard" element={<ProtectedRoute allowedRoles={['director']}><ExecutiveDashboard /></ProtectedRoute>} />
      <Route path="/dean-dashboard" element={<ProtectedRoute allowedRoles={['dean']}><ExecutiveDashboard /></ProtectedRoute>} />
      <Route path="/provc-dashboard" element={<ProtectedRoute allowedRoles={['pro_vc', 'provc']}><ExecutiveDashboard /></ProtectedRoute>} />
      <Route path="/vc-dashboard" element={<ProtectedRoute allowedRoles={['vc']}><ExecutiveDashboard /></ProtectedRoute>} />
      
      {/* Events Admin Dashboard */}
      <Route path="/events-admin-dashboard" element={<ProtectedRoute allowedRoles={['events_admin']}><EventsAdminDashboard /></ProtectedRoute>} />
      <Route path="/admin-reports/event/:eventId" element={<ProtectedRoute allowedRoles={['events_admin', 'admin', 'faculty', 'hod', 'dean', 'director', 'provc', 'pro_vc', 'vc', 'student_affairs']}><EventDrillDownPage /></ProtectedRoute>} />
      
      {/* Protected: QR Scanner */}
      <Route path="/scanner" element={
        <ProtectedRoute>
          <QRScanner />
        </ProtectedRoute>
      } />
      
      {/* Protected: Volunteer Dashboard */}
      <Route path="/volunteer-dashboard" element={
        <ProtectedRoute allowedRoles={['volunteer']}>
          <VolunteerDashboard />
        </ProtectedRoute>
      } />
      
      {/* Protected: Event Details Timeline */}
      <Route path="/event-details/:eventId" element={
        <ProtectedRoute>
          <EventDetails />
        </ProtectedRoute>
      } />
      
      {/* Catch-all: redirect unknown paths to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    <EventChatbot />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
