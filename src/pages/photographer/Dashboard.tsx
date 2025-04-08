import React, { useEffect, useState } from 'react';
import { Camera, Upload, CheckCircle, Clock, Calendar, MapPin, Loader2 } from 'lucide-react';
import { getDashboardStats } from '../../lib/api';
import { useAuthStore } from '../../store';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import { Database } from '../../lib/supabase-types';

type Event = Database['public']['Tables']['events']['Row'];

export const PhotographerDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<Event[]>([]);
  const [photos, setPhotos] = useState<any[]>([]);
  const { user } = useAuthStore();

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      if (!user) return;

      // Fetch events assigned to the photographer
      const { data: photographerEvents, error: eventsError } = await supabase
        .from('event_photographers')
        .select(`
          events (
            id,
            name,
            description,
            date,
            location,
            status,
            event_time,
            host_name,
            host_type,
            image_url
          )
        `)
        .eq('photographer_id', user.id);

      if (eventsError) throw eventsError;

      // Fetch photos uploaded by the photographer
      const { data: photographerPhotos, error: photosError } = await supabase
        .from('photos')
        .select('*')
        .eq('uploaded_by', user.id)
        .order('created_at', { ascending: false });

      if (photosError) throw photosError;

      const eventsList = photographerEvents
        ?.map(pe => pe.events)
        .filter(event => event) as Event[];

      setEvents(eventsList || []);
      setPhotos(photographerPhotos || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  const upcomingEvents = events.filter(event => event.status === 'upcoming');
  const activeEvents = events.filter(event => event.status === 'active');
  const completedEvents = events.filter(event => event.status === 'completed');

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-8">
          Photographer Dashboard
        </h1>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Upcoming Events
                </p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {upcomingEvents.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <Camera className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Active Events
                </p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {activeEvents.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-purple-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Completed Events
                </p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {completedEvents.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <Upload className="h-8 w-8 text-orange-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Photos Uploaded
                </p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {photos.length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Active and Upcoming Events */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Active Events */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Active Events
            </h2>
            <div className="space-y-4">
              {activeEvents.map((event) => (
                <div
                  key={event.id}
                  className="border-l-4 border-green-500 pl-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-r-lg"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        {event.name}
                      </h3>
                      <div className="mt-1 flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <Calendar className="h-4 w-4 mr-1" />
                        {new Date(event.date).toLocaleDateString()}
                      </div>
                      <div className="mt-1 flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <MapPin className="h-4 w-4 mr-1" />
                        {event.location}
                      </div>
                    </div>
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      {event.status}
                    </span>
                  </div>
                </div>
              ))}
              {activeEvents.length === 0 && (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                  No active events
                </p>
              )}
            </div>
          </div>

          {/* Upcoming Events */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Upcoming Events
            </h2>
            <div className="space-y-4">
              {upcomingEvents.map((event) => (
                <div
                  key={event.id}
                  className="border-l-4 border-blue-500 pl-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-r-lg"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        {event.name}
                      </h3>
                      <div className="mt-1 flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <Calendar className="h-4 w-4 mr-1" />
                        {new Date(event.date).toLocaleDateString()}
                      </div>
                      <div className="mt-1 flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <Clock className="h-4 w-4 mr-1" />
                        {event.event_time}
                      </div>
                    </div>
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      {event.status}
                    </span>
                  </div>
                </div>
              ))}
              {upcomingEvents.length === 0 && (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                  No upcoming events
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Recent Activity
          </h2>
          <div className="space-y-4">
            {completedEvents.map((event) => (
              <div
                key={event.id}
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {event.name}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {event.location}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {new Date(event.date).toLocaleDateString()}
                  </div>
                  <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {photos.filter(p => p.event_id === event.id).length} photos
                  </div>
                </div>
              </div>
            ))}
            {completedEvents.length === 0 && (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                No completed events
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};