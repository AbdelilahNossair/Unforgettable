import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Camera, Upload, X, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store';
import { v4 as uuidv4 } from 'uuid';

interface PhotoUploadProps {
  eventId: string;
  onUploadComplete?: () => void;
  maxFilesPerBatch?: number;
}

export const PhotoUpload: React.FC<PhotoUploadProps> = ({
  eventId,
  onUploadComplete,
  maxFilesPerBatch = 10,
}) => {
  const { user } = useAuthStore();
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [showCompletionPrompt, setShowCompletionPrompt] = useState(false);
  const [uploadedPhotoIds, setUploadedPhotoIds] = useState<string[]>([]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    // Filter for images only
    const imageFiles = acceptedFiles.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length === 0) {
      toast.error('Only image files are accepted');
      return;
    }

    // Limit number of files per batch
    const filesToAdd = imageFiles.slice(0, maxFilesPerBatch - files.length);
    
    if (files.length + filesToAdd.length > maxFilesPerBatch) {
      toast.warning(`You can only upload ${maxFilesPerBatch} images at a time`);
    }

    // Create preview URLs
    const newPreviews = filesToAdd.map(file => URL.createObjectURL(file));
    
    setFiles(prev => [...prev, ...filesToAdd]);
    setPreviews(prev => [...prev, ...newPreviews]);
  }, [files.length, maxFilesPerBatch]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif']
    },
    maxFiles: maxFilesPerBatch,
    disabled: isUploading || showCompletionPrompt
  });

  const removeFile = (index: number) => {
    // Remove file and preview
    setFiles(files.filter((_, i) => i !== index));
    
    // Revoke object URL to avoid memory leaks
    URL.revokeObjectURL(previews[index]);
    setPreviews(previews.filter((_, i) => i !== index));
  };

  // Upload photos to Supabase
  const uploadPhotos = async () => {
    if (!user) {
      toast.error('You must be logged in to upload photos');
      return;
    }

    if (files.length === 0) {
      toast.error('Please select at least one photo to upload');
      return;
    }

    setIsUploading(true);
    const photoIds: string[] = [];

    try {
      // Upload each file one by one
      for (const file of files) {
        // Generate a unique filename
        const fileExt = file.name.split('.').pop();
        const fileName = `${uuidv4()}.${fileExt}`;
        const filePath = `${fileName}`;

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('event-photos')
          .upload(filePath, file);

        if (uploadError) {
          console.error('Error uploading file:', uploadError);
          toast.error(`Failed to upload ${file.name}`);
          continue;
        }

        // Get the public URL
        const { data: { publicUrl } } = supabase.storage
          .from('event-photos')
          .getPublicUrl(filePath);

        // Create photo record in database
        const { data: photo, error: dbError } = await supabase
          .from('photos')
          .insert({
            event_id: eventId,
            url: publicUrl,
            uploaded_by: user.id,
            processed: false
          })
          .select('id')
          .single();

        if (dbError) {
          console.error('Error creating photo record:', dbError);
          toast.error(`Failed to create database record for ${file.name}`);
          continue;
        }

        photoIds.push(photo.id);
      }

      // Handle results
      if (photoIds.length > 0) {
        setUploadedPhotoIds(prev => [...prev, ...photoIds]);
        
        // Clear current batch
        previews.forEach(preview => URL.revokeObjectURL(preview));
        setFiles([]);
        setPreviews([]);
        
        toast.success(`Successfully uploaded ${photoIds.length} photo${photoIds.length > 1 ? 's' : ''}`);
        setShowCompletionPrompt(true);
      } else {
        toast.error('Failed to upload any photos');
      }
    } catch (error) {
      console.error('Error uploading photos:', error);
      toast.error('Failed to upload photos. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleContinueUploading = () => {
    setShowCompletionPrompt(false);
  };

  const handleCompleteUploads = async () => {
    if (uploadedPhotoIds.length === 0) {
      toast.error('No photos have been uploaded');
      return;
    }

    setIsUploading(true);
    try {
      // Call Supabase Edge Function to process photos
      for (const photoId of uploadedPhotoIds) {
        const { error } = await supabase.functions.invoke('process-photo', {
          body: { photoId }
        });

        if (error) {
          console.error(`Error processing photo ${photoId}:`, error);
          // Continue with other photos even if one fails
        }
      }

      // Update the event status to indicate photos are being processed
      await supabase
        .from('events')
        .update({ 
          status: 'processing_photos',
          updated_at: new Date().toISOString()
        })
        .eq('id', eventId);

      toast.success('Photo uploads completed. Processing started!');
      
      if (onUploadComplete) {
        onUploadComplete();
      }
      
      // Reset the component state
      setShowCompletionPrompt(false);
      setUploadedPhotoIds([]);
    } catch (error) {
      console.error('Error completing photo uploads:', error);
      toast.error('Failed to complete photo uploads. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {showCompletionPrompt ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Upload Complete
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            You've uploaded {uploadedPhotoIds.length} photo{uploadedPhotoIds.length !== 1 ? 's' : ''}. 
            Would you like to upload more or are you finished?
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-end">
            <button
              onClick={handleContinueUploading}
              disabled={isUploading}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Upload More Photos
            </button>
            <button
              onClick={handleCompleteUploads}
              disabled={isUploading}
              className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-black rounded-md hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors flex items-center justify-center"
            >
              {isUploading ? (
                <>
                  <span className="animate-spin mr-2">
                    <Upload className="h-4 w-4" />
                  </span>
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  I'm Done
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        <>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg transition-colors p-6
              ${isDragActive 
                ? 'border-gray-900 bg-gray-50 dark:border-white dark:bg-gray-800' 
                : 'border-gray-300 dark:border-gray-700'
              }
              ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <input {...getInputProps()} />
            <div className="text-center h-32 flex flex-col items-center justify-center">
              <Camera className="h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                {isDragActive
                  ? 'Drop the photos here'
                  : 'Drag & drop photos here, or click to select'}
              </p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
                Upload up to {maxFilesPerBatch} photos at a time
              </p>
            </div>
          </div>

          {previews.length > 0 && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {previews.map((preview, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={preview}
                      alt={`Preview ${index}`}
                      className="h-40 w-full object-cover rounded-lg"
                    />
                    <button
                      onClick={() => removeFile(index)}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      disabled={isUploading}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex justify-end">
                <button
                  onClick={uploadPhotos}
                  disabled={isUploading || files.length === 0}
                  className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-black rounded-md hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors flex items-center"
                >
                  {isUploading ? (
                    <>
                      <span className="animate-spin mr-2">
                        <Upload className="h-4 w-4" />
                      </span>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload {files.length} Photo{files.length !== 1 ? 's' : ''}
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};