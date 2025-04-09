import React, { useState, useEffect } from 'react';
import { Camera, Loader2, CheckCircle, AlertTriangle, Server } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { faceApiService } from '../services/FaceApiService';

interface ProcessPhotosButtonProps {
  eventId: string;
  className?: string;
}

export const ProcessPhotosButton: React.FC<ProcessPhotosButtonProps> = ({ 
  eventId, 
  className = '' 
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [totalPhotos, setTotalPhotos] = useState(0);
  const [processedPhotos, setProcessedPhotos] = useState(0);
  const [apiAvailable, setApiAvailable] = useState<boolean | null>(null);
  const [unprocessedCount, setUnprocessedCount] = useState(0);

  // Check if API is available on component mount
  useEffect(() => {
    checkApiStatus();
    getUnprocessedPhotosCount();
  }, [eventId]);

  // Check the API status
  const checkApiStatus = async () => {
    try {
      const isAvailable = await faceApiService.isAvailable();
      setApiAvailable(isAvailable);
    } catch (error) {
      console.error('Error checking API status:', error);
      setApiAvailable(false);
    }
  };

  // Get unprocessed photos count
  const getUnprocessedPhotosCount = async () => {
    try {
      const { count, error } = await supabase
        .from('photos')
        .select('id', { count: 'exact', head: true })
        .eq('event_id', eventId)
        .eq('processed', false);
      
      if (error) throw error;
      setUnprocessedCount(count || 0);
    } catch (error) {
      console.error('Error getting unprocessed count:', error);
      setUnprocessedCount(0);
    }
  };

  const handleProcessPhotos = async () => {
    if (!apiAvailable) {
      toast.error("Face recognition API is not available. Please try again later.");
      return;
    }

    if (unprocessedCount === 0) {
      toast.info("No unprocessed photos found for this event");
      return;
    }
    
    try {
      // Confirm operation
      const confirmed = window.confirm(
        `Start processing ${unprocessedCount} unprocessed photos? This may take several minutes.`
      );
      
      if (!confirmed) return;
      
      setIsProcessing(true);
      setTotalPhotos(unprocessedCount);
      setProcessedPhotos(0);
      setProgress(0);
      
      toast.info(`Starting processing for ${unprocessedCount} photos. Please wait...`, {
        duration: 5000
      });

      // Get all unprocessed photos
      const { data: photos, error } = await supabase
        .from('photos')
        .select('id')
        .eq('event_id', eventId)
        .eq('processed', false);
      
      if (error) throw error;
      if (!photos || photos.length === 0) {
        toast.info("No unprocessed photos found");
        setIsProcessing(false);
        return;
      }
      
      const photoIds = photos.map(p => p.id);
      
      // Process photos in batches
      const batchSize = 2; // Process 2 at a time to avoid overwhelming the API
      const batches = [];
      let processed = 0;
      
      for (let i = 0; i < photoIds.length; i += batchSize) {
        batches.push(photoIds.slice(i, i + batchSize));
      }
      
      // Show progress toast
      const progressToast = toast.loading(`Processing photos: 0/${photoIds.length}`, {
        duration: Infinity
      });
      
      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        
        // Process this batch using the Python backend
        await Promise.all(batch.map(async (photoId) => {
          try {
            // Call the Face API service to process this photo
            await faceApiService.processPhoto(photoId);
            processed++;
            setProcessedPhotos(processed);
            setProgress(Math.round((processed / photoIds.length) * 100));
            
            // Update progress toast
            toast.loading(`Processing photos: ${processed}/${photoIds.length}`, {
              id: progressToast
            });
          } catch (err) {
            console.error(`Error processing photo ${photoId}:`, err);
          }
        }));
        
        // Add a delay between batches
        if (i < batches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
      
      // Final update
      toast.success(`Processed ${processed} out of ${photoIds.length} photos`, {
        id: progressToast
      });
      
      if (processed === photoIds.length) {
        toast.success('All photos have been processed successfully!');
      } else if (processed > 0) {
        toast.success(`Processed ${processed} out of ${photoIds.length} photos. Some photos may need reprocessing.`);
      } else {
        toast.error('Failed to process any photos. Please try again.');
      }
      
      // Refresh unprocessed count
      getUnprocessedPhotosCount();
      
    } catch (error) {
      console.error('Error processing photos:', error);
      toast.error('Failed to process photos. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (apiAvailable === null) {
    return (
      <div className={`w-full ${className}`}>
        <button
          disabled
          className="w-full flex items-center justify-center px-4 py-2 bg-gray-400 text-white rounded-md opacity-70 cursor-not-allowed"
        >
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Checking API status...
        </button>
      </div>
    );
  }

  if (apiAvailable === false) {
    return (
      <div className={`w-full ${className}`}>
        <button
          disabled
          className="w-full flex items-center justify-center px-4 py-2 bg-red-500 text-white rounded-md opacity-70 cursor-not-allowed"
        >
          <AlertTriangle className="h-4 w-4 mr-2" />
          Face API unavailable
        </button>
        <p className="mt-2 text-xs text-red-500 dark:text-red-400 text-center">
          The face recognition service is currently unavailable
        </p>
      </div>
    );
  }

  return (
    <div className={`w-full ${className}`}>
      <button
        onClick={handleProcessPhotos}
        disabled={isProcessing || unprocessedCount === 0}
        className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {isProcessing ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Processing: {progress}%
          </>
        ) : (
          <>
            <Camera className="h-4 w-4 mr-2" />
            Process {unprocessedCount} Photos
          </>
        )}
      </button>
      
      {isProcessing && (
        <div className="mt-2">
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
            <div 
              className="bg-blue-600 h-1.5 rounded-full transition-all duration-300" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 text-center">
            {processedPhotos} of {totalPhotos} photos processed
          </p>
        </div>
      )}
      
      <div className="mt-2 flex items-center justify-center">
        <Server className="h-3 w-3 mr-1 text-green-500" />
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Face recognition service connected
        </p>
      </div>
    </div>
  );
};