import React, { useEffect, useState } from 'react';
import { Camera, Calendar, MapPin, Users, Clock, Loader2, QrCode } from 'lucide-react';
import { useAuthStore } from '../../store';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Database } from '../../lib/supabase-types';

type Event = Database['public']['Tables']['events']['Row'];
type EventAttendee = Database['public']['Tables']['event_attendees']['Row'];
type Photo = Database['public']['Tables']['photos']['Row'];

interface DashboardData {
  upcomingEvents: Event[];
  pastEvents: Event[];
  totalPhotos: number;
  recentPhotos: Photo[];
}

export const AttendeeDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData>({
    upcomingEvents: [],
    pastEvents: [],
    totalPhotos: 0,
    recentPhotos: []
  });
  const [eventCode, setEventCode] = useState('');
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const { user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.id) {
      fetchDashboardData();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user?.id) {
      toast.error('User not authenticated');
      return;
    }

    try {
      setLoading(true);

      // Fetch user's event registrations
      const { data: registrations, error: regError } = await supabase
        .from('event_attendees')
        .select('event_id')
        .eq('user_id', user.id);

      if (regError) {
        console.error('Error fetching registrations:', regError);
        throw new Error('Failed to fetch event registrations');
      }

      const eventIds = registrations?.map(reg => reg.event_id) || [];

      // Initialize dashboard data
      const dashboardData: DashboardData = {
        upcomingEvents: [],
        pastEvents: [],
        totalPhotos: 0,
        recentPhotos: []
      };

      if (eventIds.length > 0) {
        // Fetch events
        const { data: events, error: eventsError } = await supabase
          .from('events')
          .select('*')
          .in('id', eventIds)
          .order('date', { ascending: true });

        if (eventsError) {
          console.error('Error fetching events:', eventsError);
          throw new Error('Failed to fetch events');
        }

        const now = new Date();
        dashboardData.upcomingEvents = events?.filter(event => new Date(event.date) >= now) || [];
        dashboardData.pastEvents = events?.filter(event => new Date(event.date) < now) || [];
      }

      // Fetch photos with faces for the user
      const { data: photos, error: photosError } = await supabase
        .from('faces')
        .select(`
          photos (
            id,
            url,
            event_id,
            created_at
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { foreignTable: 'photos', ascending: false })
        .limit(4);

      if (photosError) {
        console.error('Error fetching photos:', photosError);
        throw new Error('Failed to fetch photos');
      }

      // Extract unique photos from the faces join
      const uniquePhotos = photos
        ?.map(face => face.photos)
        .filter((photo): photo is NonNullable<typeof photo> => photo !== null);

      dashboardData.recentPhotos = uniquePhotos || [];

      // Get total photos count
      const { count, error: countError } = await supabase
        .from('faces')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (countError) {
        console.error('Error fetching photo count:', countError);
        throw new Error('Failed to fetch photo count');
      }

      dashboardData.totalPhotos = count || 0;

      setData(dashboardData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleEventRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventCode.trim()) {
      toast.error('Please enter an event code');
      return;
    }

    try {
      // Navigate to event registration page with the code
      navigate(`/events/${eventCode.trim()}/register`);
      setShowRegistrationModal(false);
      setEventCode('');
    } catch (error) {
      console.error('Error handling event registration:', error);
      toast.error('Failed to find event');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            My Events Dashboard
          </h1>
          <button
            onClick={() => setShowRegistrationModal(true)}
            className="flex items-center px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-black rounded hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
          >
            <QrCode className="h-5 w-5 mr-2" />
            Register for Event
          </button>
        </div>

        {/* Event Registration Modal */}
        {showRegistrationModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-semibold mb-4">Register for Event</h2>
              <form onSubmit={handleEventRegistration}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Event Code
                  </label>
                  <input
                    type="text"
                    value={eventCode}
                    onChange={(e) => setEventCode(e.target.value)}
                    placeholder="Enter event code"
                    className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowRegistrationModal(false);
                      setEventCode('');
                    }}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-black rounded-md hover:bg-gray-800 dark:hover:bg-gray-100"
                  >
                    Register
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Upcoming Events
                </p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {data.upcomingEvents.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <Camera className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Photos Tagged
                </p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {data.totalPhotos}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-purple-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Events Attended
                </p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {data.pastEvents.length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              My Upcoming Events
            </h2>
            <div className="space-y-4">
              {data.upcomingEvents.map((event) => (
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
                        <MapPin className="h-4 w-4 mr-1" />
                        {event.location}
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        {event.status}
                      </span>
                      <span className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        {event.event_time}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              {data.upcomingEvents.length === 0 && (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                  No upcoming events
                </p>
              )}
            </div>
          </div>

          {/* Recent Photos */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Recent Photos
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {data.recentPhotos.map((photo) => (
                <div
                  key={photo.id}
                  className="relative group rounded-lg overflow-hidden aspect-square"
                >
                  <img
                    src={photo.url}
                    alt="Event photo"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity flex items-center justify-center">
                    <div className="hidden group-hover:block text-white text-center">
                      <Camera className="h-8 w-8 mx-auto mb-2" />
                      <p className="text-sm">View Photo</p>
                    </div>
                  </div>
                </div>
              ))}
              {data.recentPhotos.length === 0 && (
                <p className="col-span-2 text-gray-500 dark:text-gray-400 text-center py-4">
                  No photos available
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Past Events */}
        <div className="mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Past Events
            </h2>
            <div className="space-y-4">
              {data.pastEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div className="flex items-center">
                    <Clock className="h-5 w-5 text-gray-500" />
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
                    <div className="mt-1 flex items-center text-sm text-gray-500 dark:text-gray-400">
                      <Camera className="h-4 w-4 mr-1" />
                      {data.recentPhotos.filter(p => p.event_id === event.id).length} photos
                    </div>
                  </div>
                </div>
              ))}
              {data.pastEvents.length === 0 && (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                  No past events
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};