import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Camera, Upload, CheckCircle, Loader2, AlertTriangle, Calendar, Clock } from 'lucide-react';
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
  const [error, setError] = useState<string | null>(null);
  const [processingStatus, setProcessingStatus] = useState<string>('');

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

      // Check event status instead of date
      // Only prevent registration for completed or archived events
      if (event.status === 'completed' || event.status === 'archived') {
        toast.error('This event has ended and photos have been processed. Registration is closed.');
        navigate('/');
        return;
      }

      setEvent(event);
    } catch (error: any) {
      console.error('Error fetching event:', error);
      toast.error(error.message || 'Failed to fetch event details');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const validateImage = (file: File): boolean => {
    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('Image is too large. Please upload an image smaller than 10MB.');
      return false;
    }

    // Check file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      setError('Please upload a valid image (JPEG or PNG).');
      return false;
    }

    return true;
  };

  const handleImageUpload = async () => {
    if (!selectedImage || !user || !event?.qr_code) {
      toast.error('Please select an image for registration');
      return;
    }

    // Validate image
    if (!validateImage(selectedImage)) {
      return;
    }

    setError(null);
    setUploading(true);
    setProcessingStatus('Uploading image...');

    try {
      // Add a small delay for UI feedback
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setProcessingStatus('Processing face...');
      const result = await registerForEvent(event.qr_code, user.id, selectedImage);
      
      setProcessingStatus('Registration complete!');
      toast.success('Successfully registered for event');
      
      // Short delay before redirecting to dashboard
      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);
    } catch (error: any) {
      console.error('Error registering for event:', error);
      const errorMessage = error.message || 'Failed to register for event';
      
      // Check for specific error messages
      if (errorMessage.includes('No face detected')) {
        setError('No face detected in the image. Please upload a clear photo of your face.');
      } else if (errorMessage.includes('Multiple faces detected')) {
        setError('Multiple faces detected. Please upload a photo with only your face.');
      } else if (errorMessage.includes('Already registered')) {
        setError('You are already registered for this event.');
      } else {
        setError(errorMessage);
      }
      
      toast.error(errorMessage);
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

  // Determine if event is active/ongoing based on status
  const isActive = event.status === 'active';
  const isPast = new Date(event.date) < new Date();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          <div className="px-6 py-8">
            <div className="flex justify-between items-start mb-6">
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
                Register for {event.name}
              </h1>
              
              {isActive && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                  <Clock className="w-4 h-4 mr-1" />
                  {isPast ? 'In Progress' : 'Upcoming'}
                </span>
              )}
            </div>

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

              {isPast && (
                <div className="p-4 border-l-4 border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-600">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <AlertTriangle className="h-5 w-5 text-yellow-400 dark:text-yellow-300" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-yellow-700 dark:text-yellow-200">
                        This event has already taken place, but you can still register to access your photos once they're processed!
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Face Registration
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Please provide a clear photo of your face for event check-in and photo tagging.
                  This photo will be used to identify you in event photos{isPast ? ' once they are uploaded by the photographers' : ''}.
                </p>

                {error && (
                  <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md flex items-start">
                    <AlertTriangle className="h-5 w-5 text-red-500 dark:text-red-400 mr-2 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-red-600 dark:text-red-300">{error}</div>
                  </div>
                )}

                <div className="space-y-4">
                  <ImageUpload
                    onImageSelect={(file) => {
                      setSelectedImage(file);
                      setError(null);
                    }}
                    onImageClear={() => {
                      setSelectedImage(null);
                      setError(null);
                    }}
                    className="max-w-sm mx-auto"
                  />

                  <div className="flex flex-col items-center">
                    <button
                      onClick={handleImageUpload}
                      disabled={!selectedImage || uploading}
                      className="flex items-center px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {uploading ? (
                        <>
                          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                          {processingStatus || 'Processing...'}
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-5 w-5 mr-2" />
                          Complete Registration
                        </>
                      )}
                    </button>
                    
                    {/* Tips for best results */}
                    <div className="mt-6 text-sm text-gray-600 dark:text-gray-400">
                      <h3 className="font-medium mb-2">Tips for best results:</h3>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Use good lighting, facing your face</li>
                        <li>Remove sunglasses, hats, or masks</li>
                        <li>Look directly at the camera</li>
                        <li>Only one person should be in the photo</li>
                        <li>Use a JPEG or PNG format image</li>
                      </ul>
                    </div>
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