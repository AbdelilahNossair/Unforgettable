import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Camera, Upload, CheckCircle, Loader2 } from 'lucide-react';
import { ImageUpload } from '../components/ImageUpload';
import { useAuthStore } from '../store';
import { toast } from 'sonner';
import { getEventByIdOrCode, registerForEvent } from '../lib/api';

export const EventRegistration: React.FC = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [event, setEvent] = useState<any>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);

  useEffect(() => {
    if (!eventId) {
      toast.error('No event ID provided');
      navigate('/');
      return;
    }

    fetchEvent();
  }, [eventId, navigate]);

  const fetchEvent = async () => {
    try {
      const event = await getEventByIdOrCode(eventId);
      
      if (!event) {
        toast.error('Event not found');
        navigate('/');
        return;
      }

      // Check if event is in the past
      const eventDate = new Date(event.date);
      if (eventDate < new Date()) {
        toast.error('This event has already taken place');
        navigate('/');
        return;
      }

      setEvent(event);
    } catch (error: any) {
      console.error('Error fetching event:', error);
      toast.error('Failed to fetch event details');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async () => {
    if (!selectedImage || !user || !event?.qr_code) {
      toast.error('Please select an image for registration');
      return;
    }

    try {
      setUploading(true);
      await registerForEvent(event.qr_code, user.id, selectedImage);
      toast.success('Successfully registered for event');
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Error registering for event:', error);
      toast.error(error.message || 'Failed to register for event');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
          Event not found
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          The event you're looking for doesn't exist or has been removed.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          <div className="px-6 py-8">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
              Register for {event.name}
            </h1>

            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Event Details
                </h2>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Date
                      </p>
                      <p className="mt-1 text-sm text-gray-900 dark:text-white">
                        {new Date(event.date).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Time
                      </p>
                      <p className="mt-1 text-sm text-gray-900 dark:text-white">
                        {event.event_time}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Location
                      </p>
                      <p className="mt-1 text-sm text-gray-900 dark:text-white">
                        {event.location}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Host
                      </p>
                      <p className="mt-1 text-sm text-gray-900 dark:text-white">
                        {event.host_name}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Photo Upload
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Please provide a clear photo of your face for event check-in.
                  This photo will be used to identify you at the event.
                </p>

                <div className="space-y-4">
                  <ImageUpload
                    onImageSelect={(file) => setSelectedImage(file)}
                    onImageClear={() => setSelectedImage(null)}
                    className="max-w-sm mx-auto"
                  />

                  <div className="flex justify-center">
                    <button
                      onClick={handleImageUpload}
                      disabled={!selectedImage || uploading}
                      className="flex items-center px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {uploading ? (
                        <>
                          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-5 w-5 mr-2" />
                          Complete Registration
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};