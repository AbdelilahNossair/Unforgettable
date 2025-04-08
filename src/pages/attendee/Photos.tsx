import React, { useEffect, useState } from 'react';
import { Camera, Download, Calendar, Search, Loader2 } from 'lucide-react';
import { useAuthStore } from '../../store';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import { Database } from '../../lib/supabase-types';

type Photo = Database['public']['Tables']['photos']['Row'] & {
  events: Database['public']['Tables']['events']['Row'];
};

export const AttendeePhotos: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<string>('');
  const [events, setEvents] = useState<Database['public']['Tables']['events']['Row'][]>([]);
  const { user } = useAuthStore();

  useEffect(() => {
    if (user?.id) {
      fetchPhotos();
      fetchEvents();
    }
  }, [user]);

  const fetchEvents = async () => {
    try {
      const { data: eventAttendees, error: attendeesError } = await supabase
        .from('event_attendees')
        .select('event_id')
        .eq('user_id', user?.id);

      if (attendeesError) throw attendeesError;

      const eventIds = eventAttendees?.map(ea => ea.event_id) || [];

      if (eventIds.length > 0) {
        const { data: events, error: eventsError } = await supabase
          .from('events')
          .select('*')
          .in('id', eventIds)
          .order('date', { ascending: false });

        if (eventsError) throw eventsError;
        setEvents(events || []);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      toast.error('Failed to fetch events');
    }
  };

  const fetchPhotos = async () => {
    try {
      setLoading(true);

      const { data: faces, error: facesError } = await supabase
        .from('faces')
        .select(`
          photos (
            *,
            events (*)
          )
        `)
        .eq('user_id', user?.id);

      if (facesError) throw facesError;

      // Extract unique photos from faces
      const uniquePhotos = faces
        ?.map(face => face.photos)
        .filter((photo): photo is NonNullable<typeof photo> => photo !== null)
        .reduce((acc: Photo[], current) => {
          if (!acc.find(p => p.id === current.id)) {
            acc.push(current as Photo);
          }
          return acc;
        }, []);

      setPhotos(uniquePhotos || []);
    } catch (error) {
      console.error('Error fetching photos:', error);
      toast.error('Failed to fetch photos');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (photo: Photo) => {
    try {
      const response = await fetch(photo.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `event-photo-${photo.id}.jpg`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Photo downloaded successfully');
    } catch (error) {
      console.error('Error downloading photo:', error);
      toast.error('Failed to download photo');
    }
  };

  const filteredPhotos = photos.filter(photo => {
    const matchesSearch = searchQuery.toLowerCase() === '' ||
      photo.events?.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesEvent = selectedEvent === '' || photo.event_id === selectedEvent;
    return matchesSearch && matchesEvent;
  });

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
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-8">
          My Photos
        </h1>

        {/* Filters */}
        <div className="mb-8 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
            />
          </div>
          <select
            value={selectedEvent}
            onChange={(e) => setSelectedEvent(e.target.value)}
            className="px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
          >
            <option value="">All Events</option>
            {events.map((event) => (
              <option key={event.id} value={event.id}>
                {event.name}
              </option>
            ))}
          </select>
        </div>

        {filteredPhotos.length === 0 ? (
          <div className="text-center py-12">
            <Camera className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No photos found</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {photos.length === 0
                ? "You haven't been tagged in any photos yet."
                : "No photos match your current filters."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPhotos.map((photo) => (
              <div
                key={photo.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden"
              >
                <div className="aspect-w-16 aspect-h-9 relative">
                  <img
                    src={photo.url}
                    alt="Event photo"
                    className="w-full h-48 object-cover"
                  />
                  <button
                    onClick={() => handleDownload(photo)}
                    className="absolute top-2 right-2 p-2 bg-white/90 rounded-full hover:bg-white transition-colors"
                    title="Download photo"
                  >
                    <Download className="h-5 w-5 text-gray-700" />
                  </button>
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    {photo.events?.name}
                  </h3>
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                    <Calendar className="h-4 w-4 mr-2" />
                    {new Date(photo.events?.date || '').toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};