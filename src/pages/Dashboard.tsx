import React from 'react';
import { useAuthStore } from '../store';
import { AdminDashboard } from './admin/Dashboard';
import { PhotographerDashboard } from './photographer/Dashboard';
import { AttendeeDashboard } from './attendee/Dashboard';

export const Dashboard: React.FC = () => {
  const { user } = useAuthStore();

  if (!user) return null;

  switch (user.role) {
    case 'admin':
      return <AdminDashboard />;
    case 'photographer':
      return <PhotographerDashboard />;
    case 'attendee':
      return <AttendeeDashboard />;
    default:
      return <div>Invalid role</div>;
  }
};