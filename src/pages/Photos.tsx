import React, { useState, useEffect } from 'react';
import { Camera, Upload, CheckCircle, Clock, Loader2, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store';
import { toast } from 'sonner';
import { PhotoUpload } from '../components/PhotoUpload';
import { Database } from '../lib/supabase-types';

type Photo = Database['public']['Tables']['photos']['Row'] & {
  events: {
    name: string;
  } | null;
};

export const Photos: React.FC = () => {
  const { user } = useAuthStore();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [events, setEvents] = useState<{ id: string; name: string }[]>([]);
  
  useEffect(() => {
    fetchPhotos();
    fetchEvents();
  }, [user]);

  const fetchPhotos = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Get photos uploaded by current user or available to them
      let query = supabase
        .from('photos')
        .select(`
          *,
          events:event_id (
            name
          )
        `)
        .order('created_at', { ascending: false });

      // Apply role-based filtering
      if (user.role === 'photographer') {
        query = query.eq('uploaded_by', user.id);
      }

      const { data, error } = await query;

      if (error) throw error;
      setPhotos(data || []);
    } catch (error) {
      console.error('Error fetching photos:', error);
      toast.error('Failed to load photos');
    } finally {
      setLoading(false);
    }
  };

  const fetchEvents = async () => {
    if (!user) return;
    
    try {
      // For photographers, only show events they're assigned to
      if (user.role === 'photographer') {
        const { data: assignedEvents, error } = await supabase
          .from('event_photographers')
          .select(`
            event_id,
            events:event_id (
              id,
              name
            )
          `)
          .eq('photographer_id', user.id);
          
        if (error) throw error;
        
        // Use a more robust approach to transform data
        const eventsArray: { id: string; name: string }[] = [];
        
        if (assignedEvents && Array.isArray(assignedEvents)) {
          assignedEvents.forEach(item => {
            if (item.events && typeof item.events === 'object' && 'id' in item.events && 'name' in item.events) {
              eventsArray.push({
                id: item.events.id || '',
                name: item.events.name || ''
              });
            }
          });
        }
        
        setEvents(eventsArray);
      } else {
        // For admins, show all events
        const { data, error } = await supabase
          .from('events')
          .select('id, name');
          
        if (error) throw error;
        
        if (data && Array.isArray(data)) {
          setEvents(data.map(event => ({
            id: event.id,
            name: event.name
          })));
        } else {
          setEvents([]);
        }
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      toast.error('Failed to load events');
    }
  };

  const handleUploadComplete = () => {
    setShowUploadModal(false);
    fetchPhotos(); // Refresh the photos list
    toast.success('Photos are being processed. They will appear once processing is complete.');
  };

  if (loading && photos.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  return (
    <div className="py-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Photos</h1>
        {user?.role !== 'attendee' && (
          <button 
            onClick={() => setShowUploadModal(true)}
            className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors rounded-md flex items-center"
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload Photos
          </button>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b dark:border-gray-700 p-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Upload Photos</h2>
              <button 
                onClick={() => setShowUploadModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-6">
              {!selectedEvent ? (
                <div className="space-y-4">
                  <p className="text-gray-700 dark:text-gray-300">Select an event to upload photos for:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                    {events.map(event => (
                      <button
                        key={event.id}
                        onClick={() => setSelectedEvent(event.id)}
                        className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 p-4 rounded-lg text-left"
                      >
                        <h3 className="font-medium text-gray-900 dark:text-white">{event.name}</h3>
                      </button>
                    ))}
                  </div>
                  {events.length === 0 && (
                    <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                      No events available for photo upload
                    </p>
                  )}
                </div>
              ) : (
                <PhotoUpload 
                  eventId={selectedEvent} 
                  onUploadComplete={handleUploadComplete} 
                  maxFilesPerBatch={10}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Photos Grid */}
      {photos.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden"
            >
              <div className="aspect-w-16 aspect-h-9 relative">
                <img
                  src={photo.url}
                  alt={photo.events?.name || 'Event photo'}
                  className="w-full h-48 object-cover"
                />
                <div className="absolute top-2 right-2">
                  {photo.processed ? (
                    <div className="bg-green-500 text-white px-2 py-1 rounded-full text-xs flex items-center">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Processed
                    </div>
                  ) : (
                    <div className="bg-yellow-500 text-white px-2 py-1 rounded-full text-xs flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      Processing
                    </div>
                  )}
                </div>
              </div>
              <div className="p-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  {photo.events?.name || 'Unknown Event'}
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center text-gray-500 dark:text-gray-400">
                    <Upload className="h-4 w-4 mr-2" />
                    <span className="text-sm">
                      Uploaded on {new Date(photo.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center text-gray-500 dark:text-gray-400">
                    <Camera className="h-4 w-4 mr-2" />
                    <span className="text-sm">
                      {photo.processed 
                        ? 'Faces detected' 
                        : 'Processing faces...'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 text-center">
          <Camera className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No photos yet
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            {user?.role === 'attendee' 
              ? 'No photos available for you to view yet.' 
              : 'Upload your first event photos to get started.'}
          </p>
        </div>
      )}
    </div>
  );
};