import React, { useEffect, useRef, useState } from 'react';
import { BrowserQRCodeReader } from '@zxing/browser';
import { useNavigate } from 'react-router-dom';
import { Camera, X } from 'lucide-react';
import { toast } from 'sonner';

// UUID validation regex
const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

interface QRScannerProps {
  onClose: () => void;
}

export const QRScanner: React.FC<QRScannerProps> = ({ onClose }) => {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [scanning, setScanning] = useState(true);
  const codeReaderRef = useRef<BrowserQRCodeReader | null>(null);
  const [hasCamera, setHasCamera] = useState(true);

  useEffect(() => {
    const codeReader = new BrowserQRCodeReader();
    codeReaderRef.current = codeReader;
    let selectedDeviceId: string;

    const startScanning = async () => {
      try {
        const videoInputDevices = await BrowserQRCodeReader.listVideoInputDevices();
        
        if (!videoInputDevices.length) {
          setHasCamera(false);
          toast.error('No camera found');
          return;
        }

        // Select the back camera if available, otherwise use the first camera
        selectedDeviceId = videoInputDevices.find(device => 
          device.label.toLowerCase().includes('back'))?.deviceId || videoInputDevices[0].deviceId;

        if (videoRef.current) {
          // Initialize video stream first
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { deviceId: selectedDeviceId }
          });
          videoRef.current.srcObject = stream;
          
          // Wait for video to be ready
          await new Promise<void>((resolve) => {
            if (!videoRef.current) return;
            videoRef.current.onloadedmetadata = () => {
              if (!videoRef.current) return;
              videoRef.current.play()
                .then(() => resolve())
                .catch((error) => {
                  console.error('Error playing video:', error);
                  toast.error('Error initializing camera');
                  setHasCamera(false);
                });
            };
          });

          // Ensure video is playing and has enough data
          if (videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
            await codeReader.decodeFromVideoDevice(
              selectedDeviceId,
              videoRef.current,
              (result, error) => {
                if (result && scanning) {
                  const data = result.getText().trim();
                  
                  // First try to validate the scanned data directly as a UUID
                  if (UUID_REGEX.test(data)) {
                    setScanning(false);
                    navigate(`/events/${data}/register`);
                    onClose();
                    return;
                  }

                  // If not a direct UUID, try to extract it from a URL
                  try {
                    // Try parsing as URL first
                    const url = new URL(data);
                    const pathSegments = url.pathname.split('/').filter(Boolean);
                    const eventId = pathSegments[pathSegments.length - 1];
                    
                    if (eventId && UUID_REGEX.test(eventId)) {
                      setScanning(false);
                      navigate(`/events/${eventId}/register`);
                      onClose();
                      return;
                    }
                  } catch (e) {
                    // If URL parsing fails, try extracting UUID from the string
                    const uuidMatch = data.match(UUID_REGEX);
                    if (uuidMatch) {
                      setScanning(false);
                      navigate(`/events/${uuidMatch[0]}/register`);
                      onClose();
                      return;
                    }
                  }

                  // If we get here, no valid event ID was found
                  toast.error('Invalid event QR code');
                }
                
                // Handle errors
                if (error) {
                  // Ignore expected errors when no QR code is in view
                  if (error.name === 'NotFoundException' || 
                      error.name === 'NotFoundException2' ||
                      error.name === 'FormatException2' ||
                      error?.message === 'No MultiFormat Readers were able to detect the code.') {
                    return;
                  }
                  
                  // Log other errors for debugging
                  console.error('QR Scanner error:', {
                    name: error.name,
                    message: error.message
                  });
                }
              }
            );
          }
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        toast.error('Error accessing camera');
        setHasCamera(false);
      }
    };

    startScanning();

    return () => {
      if (codeReaderRef.current) {
        try {
          // Use reset() instead of close()
          codeReaderRef.current.reset();
          if (videoRef.current) {
            const stream = videoRef.current.srcObject as MediaStream;
            if (stream) {
              stream.getTracks().forEach(track => track.stop());
            }
            videoRef.current.srcObject = null;
          }
        } catch (error) {
          console.error('Error cleaning up video stream:', error);
        }
      }
    };
  }, [navigate, scanning, onClose]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
            <Camera className="h-5 w-5 mr-2" />
            Scan Event QR Code
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {hasCamera ? (
          <>
            <div className="relative aspect-square overflow-hidden rounded-lg">
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 border-2 border-white border-opacity-50 rounded-lg pointer-events-none">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-3/4 h-3/4 border-2 border-white border-opacity-75 rounded-lg" />
                </div>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                Position the QR code within the frame to scan
              </p>
              <ul className="text-xs text-gray-500 dark:text-gray-400 space-y-1 list-disc list-inside">
                <li>Ensure good lighting</li>
                <li>Hold the camera steady</li>
                <li>Keep the QR code within the center frame</li>
                <li>Make sure the QR code is clearly visible and not blurry</li>
              </ul>
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <p className="text-red-500 dark:text-red-400 mb-2">Camera not available</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Please ensure you have granted camera permissions and have a working camera connected.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};