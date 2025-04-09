import React, { useState, useEffect } from 'react';
import { Camera, Search, CalendarDays, Clock, Loader2, Download, Trash2, AlertTriangle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store';
import { toast } from 'sonner';

// Define simpler types to avoid potential type mismatches
type SimpleEvent = {
  id: string;
  name: string;
  date: string;
  location: string;
  image_url?: string;
  photo_count: number;
};

type SimplePhoto = {
  id: string;
  url: string;
  created_at: string;
  event_name: string;
  deletion_scheduled_at?: string; // Add this field for expiration date
  faces: {
    id: string;
    bbox?: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
  }[];
};

// Expiration time in days
const PHOTO_EXPIRATION_DAYS = 7;

export const AttendeePhotos: React.FC = () => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<SimpleEvent[]>([]);
  const [photos, setPhotos] = useState<SimplePhoto[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingPhoto, setDeletingPhoto] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchEvents();
    }
  }, [user]);

  useEffect(() => {
    if (selectedEvent) {
      fetchPhotos(selectedEvent);
    }
  }, [selectedEvent]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      if (!user || !user.id) {
        throw new Error('User not authenticated');
      }
  
      // Get events the attendee is registered for
      const { data: eventData, error: eventError } = await supabase
        .from('event_attendees')
        .select(`
          event_id,
          events:event_id (
            id,
            name,
            date,
            location,
            image_url
          )
        `)
        .eq('user_id', user.id)
        .eq('registration_complete', true);
  
      if (eventError) throw eventError;
  
      // Initialize empty array for the events
      const eventsList: SimpleEvent[] = [];
  
      if (eventData && Array.isArray(eventData)) {
        // Process each event one by one
        for (let i = 0; i < eventData.length; i++) {
          const item = eventData[i];
  
          // Skip if the events property is missing or invalid
          if (!item || !item.events || typeof item.events !== 'object') continue;
  
          const eventDetails = item.events;
          if (!eventDetails.id || !eventDetails.name) continue;
  
          // First, fetch all photo IDs from faces where the user is tagged
          const { data: facePhotoIds, error: faceErr } = await supabase
            .from('faces')
            .select('photo_id')
            .eq('user_id', user.id);
  
          if (faceErr) {
            console.error('Error fetching face photo IDs:', faceErr);
            throw faceErr;
          }
  
          // Map the results to an array of photo IDs
          const photoIds = facePhotoIds?.map((item) => item.photo_id) || [];
  
          // Count photos for this event where the user is tagged
          let photoCount = 0;
          try {
            const { count } = await supabase
              .from('photos')
              .select('id', { count: 'exact', head: true })
              .eq('event_id', eventDetails.id)
              .eq('processed', true)
              .in('id', photoIds);
            photoCount = count || 0;
          } catch (countError) {
            console.error('Error counting photos:', countError);
            // Continue with zero count if there's an error
          }
  
          // Add the event to our list
          eventsList.push({
            id: eventDetails.id,
            name: eventDetails.name,
            date: eventDetails.date || new Date().toISOString(),
            location: eventDetails.location || 'Unknown location',
            image_url: eventDetails.image_url,
            photo_count: photoCount,
          });
        }
      }
  
      setEvents(eventsList);
    } catch (error) {
      console.error('Error fetching events:', error);
      toast.error('Failed to load your events');
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPhotos = async (eventId: string) => {
    setLoading(true);
    try {
      if (!user || !user.id) {
        throw new Error('User not authenticated');
      }

      // First get the event name for reference
      const { data: eventData } = await supabase
        .from('events')
        .select('name')
        .eq('id', eventId)
        .single();
      
      const eventName = eventData?.name || 'Unknown Event';

      // Get photos where the user is tagged
      const { data, error } = await supabase
        .from('photos')
        .select(`
          id,
          url,
          created_at,
          deletion_scheduled_at,
          faces!inner (
            id,
            bbox,
            user_id
          )
        `)
        .eq('event_id', eventId)
        .eq('processed', true)
        .eq('faces.user_id', user.id);

      if (error) throw error;
      
      // Transform the data to our simplified structure
      const photosList: SimplePhoto[] = [];
      
      if (data && Array.isArray(data)) {
        data.forEach(photo => {
          if (!photo) return;
          
          // Process faces data safely
          const processedFaces = Array.isArray(photo.faces) 
            ? photo.faces.map(face => ({
                id: face.id || `face-${Math.random().toString(36).substring(2, 9)}`,
                bbox: face.bbox
              }))
            : [];
          
          photosList.push({
            id: photo.id,
            url: photo.url,
            created_at: photo.created_at,
            deletion_scheduled_at: photo.deletion_scheduled_at,
            event_name: eventName,
            faces: processedFaces
          });
        });
      }
      
      setPhotos(photosList);
    } catch (error) {
      console.error('Error fetching photos:', error);
      toast.error('Failed to load your photos');
      setPhotos([]);
    } finally {
      setLoading(false);
    }
  };

  // Calculate days remaining until deletion
  const calculateDaysRemaining = (photo: SimplePhoto): number => {
    let expirationDate: Date;
    
    if (photo.deletion_scheduled_at) {
      // If there's an explicit deletion date, use that
      expirationDate = new Date(photo.deletion_scheduled_at);
    } else {
      // Otherwise calculate based on created_at + PHOTO_EXPIRATION_DAYS
      expirationDate = new Date(photo.created_at);
      expirationDate.setDate(expirationDate.getDate() + PHOTO_EXPIRATION_DAYS);
    }
    
    const now = new Date();
    const timeDiff = expirationDate.getTime() - now.getTime();
    const daysRemaining = Math.max(0, Math.ceil(timeDiff / (1000 * 60 * 60 * 24)));
    
    return daysRemaining;
  };

  // Get expiration warning class based on days remaining
  const getExpirationWarningClass = (daysRemaining: number): string => {
    if (daysRemaining <= 1) return 'bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-300'; // Urgent
    if (daysRemaining <= 3) return 'bg-orange-50 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300'; // Warning
    return 'bg-yellow-50 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300'; // Notice
  };

  // Format expiration message based on days remaining
  const getExpirationMessage = (daysRemaining: number): string => {
    if (daysRemaining === 0) return 'Photos expire today!';
    if (daysRemaining === 1) return 'Photos expire tomorrow!';
    return `Photos expire in ${daysRemaining} days`;
  };

  // Handle photo download
  const handleDownload = async (photoUrl: string, photoName: string) => {
    try {
      // Show loading toast
      toast.loading('Preparing download...');
      
      // Fetch the image data
      const response = await fetch(photoUrl);
      if (!response.ok) throw new Error('Failed to fetch image');
      
      // Convert to blob
      const blob = await response.blob();
      
      // Create object URL
      const url = window.URL.createObjectURL(blob);
      
      // Create download link
      const link = document.createElement('a');
      link.href = url;
      link.download = `${photoName.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(link);
        toast.dismiss();
        toast.success('Download complete');
      }, 100);
    } catch (error) {
      console.error('Error downloading photo:', error);
      toast.dismiss();
      toast.error('Failed to download photo');
    }
  };

  // Handle photo deletion
  const handleDelete = async (photoId: string) => {
    if (!user || !user.id || !selectedEvent) return;
    
    try {
      setDeletingPhoto(photoId);
      
      // First remove the face record for this user
      const { error: faceError } = await supabase
        .from('faces')
        .delete()
        .eq('photo_id', photoId)
        .eq('user_id', user.id);
        
      if (faceError) throw faceError;
      
      // Update photos list to remove this photo
      setPhotos(photos.filter(p => p.id !== photoId));
      toast.success('Photo removed from your collection');
      
      // Fetch updated photo count for this event
      if (selectedEvent) {
        const updatedEvents = [...events];
        const eventIndex = updatedEvents.findIndex(e => e.id === selectedEvent);
        if (eventIndex >= 0) {
          updatedEvents[eventIndex].photo_count = Math.max(0, updatedEvents[eventIndex].photo_count - 1);
          setEvents(updatedEvents);
        }
      }
    } catch (error) {
      console.error('Error removing photo:', error);
      toast.error('Failed to remove photo');
    } finally {
      setDeletingPhoto(null);
    }
  };

  const filteredPhotos = searchTerm
    ? photos.filter(photo => 
        photo.event_name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : photos;

  if (loading && !selectedEvent && events.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  // Get the lowest days remaining for expiration banner
  const getLowestDaysRemaining = (): number => {
    if (!filteredPhotos.length) return 0;
    return Math.min(...filteredPhotos.map(photo => calculateDaysRemaining(photo)));
  };

  return (
    <div className="py-6">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
          Your Photos
        </h1>
        
        {selectedEvent ? (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
              <div>
                <button 
                  onClick={() => setSelectedEvent(null)}
                  className="text-blue-600 dark:text-blue-400 hover:underline mb-2"
                >
                  ← Back to Events
                </button>
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                  {events.find(e => e.id === selectedEvent)?.name || 'Event'}
                </h2>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search photos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                />
              </div>
            </div>

            {/* Global expiration warning - only show if there are photos */}
            {filteredPhotos.length > 0 && (
              <div className={`rounded-lg p-4 ${getExpirationWarningClass(getLowestDaysRemaining())}`}>
                <div className="flex items-start">
                  <AlertTriangle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">
                      {getExpirationMessage(getLowestDaysRemaining())}
                    </p>
                    <p className="mt-1 text-sm opacity-90">
                      These photos will be permanently deleted after the expiration period. 
                      Please download any photos you want to keep.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-gray-600 dark:text-gray-400">
            Select an event below to view your photos
          </p>
        )}
      </div>

      {!selectedEvent ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.length > 0 ? events.map((event) => (
            <div
              key={event.id}
              onClick={() => setSelectedEvent(event.id)}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden cursor-pointer"
            >
              <div className="h-40 relative">
                {event.image_url ? (
                  <img
                    src={event.image_url}
                    alt={event.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8ZXZlbnR8ZW58MHx8MHx8fDA%3D';
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                    <Camera className="h-12 w-12 text-gray-400" />
                  </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
                  <h3 className="text-lg font-medium text-white">{event.name}</h3>
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-center text-gray-500 dark:text-gray-400 mb-2">
                  <CalendarDays className="h-4 w-4 mr-2" />
                  <span className="text-sm">
                    {new Date(event.date).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center text-gray-500 dark:text-gray-400">
                    <Camera className="h-4 w-4 mr-2" />
                    <span className="text-sm">{event.photo_count} photos with you</span>
                  </div>
                  <button className="text-blue-600 dark:text-blue-400 text-sm">
                    View
                  </button>
                </div>
              </div>
            </div>
          )) : (
            <div className="col-span-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 text-center">
              <Camera className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No events found
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                You haven't registered for any events yet, or your registration is not complete.
              </p>
            </div>
          )}
        </div>
      ) : (
        <>
          {filteredPhotos.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPhotos.map((photo) => {
                const daysRemaining = calculateDaysRemaining(photo);
                
                return (
                  <div
                    key={photo.id}
                    className="bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden relative group"
                  >
                    {/* Per-photo expiration tag */}
                    <div className={`absolute top-2 right-2 z-10 px-2 py-1 rounded-full text-xs flex items-center ${daysRemaining <= 1 ? 'bg-red-500 text-white' : 'bg-yellow-500 text-white'}`}>
                      <Clock className="h-3 w-3 mr-1" />
                      {daysRemaining === 0 ? 'Expires today' : daysRemaining === 1 ? 'Expires tomorrow' : `${daysRemaining} days left`}
                    </div>
                    
                    <div className="aspect-w-16 aspect-h-9 relative">
                      <img
                        src={photo.url}
                        alt={`Photo from ${photo.event_name}`}
                        className="w-full h-48 object-cover"
                        onError={(e) => {
                          e.currentTarget.src = 'https://images.unsplash.com/photo-1591115765373-5207764f72e7?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OHx8ZXZlbnR8ZW58MHx8MHx8fDA%3D';
                        }}
                      />
                      
                      {/* Highlight faces */}
                      <div className="absolute inset-0">
                        {photo.faces && photo.faces.length > 0 && photo.faces.map((face) => (
                          <div
                            key={face.id}
                            className="absolute border-2 border-green-500"
                            style={{
                              left: `${face.bbox?.x || 0}%`,
                              top: `${face.bbox?.y || 0}%`,
                              width: `${face.bbox?.width || 10}%`,
                              height: `${face.bbox?.height || 10}%`,
                            }}
                          />
                        ))}
                      </div>
                      
                      {/* Hover overlay with action buttons */}
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-opacity flex items-center justify-center">
                        <div className="hidden group-hover:flex space-x-2">
                          {/* View in fullsize */}
                          <a
                            href={photo.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 bg-white text-gray-900 rounded-full hover:bg-gray-100 transition-colors"
                            title="View full size"
                          >
                            <Search className="h-5 w-5" />
                          </a>
                          
                          {/* Download button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownload(photo.url, `${photo.event_name}-photo`);
                            }}
                            className="p-2 bg-white text-gray-900 rounded-full hover:bg-gray-100 transition-colors"
                            title="Download photo"
                          >
                            <Download className="h-5 w-5" />
                          </button>
                          
                          {/* Delete button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(photo.id);
                            }}
                            disabled={deletingPhoto === photo.id}
                            className="p-2 bg-white text-red-600 rounded-full hover:bg-gray-100 transition-colors"
                            title="Remove from your collection"
                          >
                            {deletingPhoto === photo.id ? (
                              <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                              <Trash2 className="h-5 w-5" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center text-gray-500 dark:text-gray-400">
                          <CalendarDays className="h-4 w-4 mr-2" />
                          <span className="text-sm">
                            {new Date(photo.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        
                        {/* Mini expiration countdown */}
                        <div className={`text-xs flex items-center ${daysRemaining <= 1 ? 'text-red-500' : 'text-yellow-500'}`}>
                          <Clock className="h-3 w-3 mr-1" />
                          {daysRemaining === 0 ? 'Expires today' : `${daysRemaining}d left`}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 text-center">
              <Camera className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No photos found
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                {searchTerm 
                  ? `No photos match your search for "${searchTerm}"`
                  : "The event is scheduled, but no photos with you in them have been uploaded yet. Check back after the event!"}
              </p>
              <div className="mt-4 flex items-center justify-center text-gray-500 dark:text-gray-400">
                <Clock className="h-5 w-5 mr-2" />
                <span>Photos will appear here after the event</span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};