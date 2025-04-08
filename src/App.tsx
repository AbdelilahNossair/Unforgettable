import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';
import { Layout } from './components/Layout';
import { AuthForm } from './components/auth/AuthForm';
import { Dashboard } from './pages/Dashboard';
import { Events } from './pages/Events';
import { Photos } from './pages/Photos';
import { Users } from './pages/Users';
import { Settings } from './pages/Settings';
import { Landing } from './pages/Landing';
import { EventRegistration } from './pages/EventRegistration';
import { AttendeePhotos } from './pages/attendee/Photos';
import { useAuthStore } from './store';
import { getCurrentUser } from './lib/auth';
import { useSupabaseSubscriptions } from './hooks/useSupabase';

// Protected route wrapper component
const ProtectedEventRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuthStore();
  const location = useLocation();

  if (!user) {
    // Preserve the attempted URL in state for post-login redirect
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

function App() {
  const { user, setUser, isDarkMode, fetchProfile } = useAuthStore();

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      fetchProfile(currentUser.id);
    }
  }, [setUser, fetchProfile]);

  useSupabaseSubscriptions();

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  return (
    <Router>
      <div className={isDarkMode ? 'dark' : ''}>
        <Toaster 
          position="top-right" 
          duration={3000}
          closeButton
          richColors
          theme={isDarkMode ? 'dark' : 'light'}
        />
        <Routes>
          {/* Public routes */}
          <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Landing />} />
          <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <AuthForm mode="login" />} />
          <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <AuthForm mode="register" />} />
          
          {/* Event registration routes - protected but accessible via login */}
          <Route path="/events/:eventId/register" element={
            <ProtectedEventRoute>
              <EventRegistration />
            </ProtectedEventRoute>
          } />
          <Route path="/events/:eventId" element={
            <ProtectedEventRoute>
              <EventRegistration />
            </ProtectedEventRoute>
          } />

          {/* Protected routes */}
          <Route element={user ? <Layout /> : <Navigate to="/" />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/events" element={<Events />} />
            <Route path="/photos" element={user?.role === 'attendee' ? <AttendeePhotos /> : <Photos />} />
            <Route path="/users" element={<Users />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/dashboard" />} />
          </Route>
        </Routes>
      </div>
    </Router>
  );
}

export default App;