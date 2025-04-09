import React, { useState, useEffect } from 'react';
import { getPhotoFaces } from '../lib/api';
import { Loader2, User, Tag, AlertTriangle, Download, Clock } from 'lucide-react';

interface PhotoViewerProps {
  photoId: string;
  photoUrl: string;
  processed: boolean;
  createdAt: string;
}

interface Face {
  id: string;
  confidence: number;
  bbox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  users?: {
    id: string;
    full_name: string | null;
    email: string;
    avatar_url: string | null;
  } | null;
}

export const PhotoViewer: React.FC<PhotoViewerProps> = ({ 
  photoId, 
  photoUrl, 
  processed,
  createdAt 
}) => {
  const [loading, setLoading] = useState(true);
  const [faces, setFaces] = useState<Face[]>([]);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [selectedFace, setSelectedFace] = useState<string | null>(null);

  useEffect(() => {
    // Only fetch faces if the photo has been processed
    if (processed) {
      fetchFaces();
    } else {
      setLoading(false);
    }
  }, [photoId, processed]);

  const fetchFaces = async () => {
    try {
      setLoading(true);
      const facesData = await getPhotoFaces(photoId);
      setFaces(facesData);
    } catch (error) {
      console.error('Error fetching faces:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setImageSize({
      width: img.naturalWidth,
      height: img.naturalHeight
    });
    setImageLoaded(true);
  };

  const handleDownload = () => {
    // Create a temporary link element
    const link = document.createElement('a');
    link.href = photoUrl;
    link.download = `photo-${photoId}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Calculate days until deletion (7 days from when the photo was processed)
  const calculateDaysRemaining = () => {
    const processedDate = new Date(createdAt);
    const expirationDate = new Date(processedDate);
    expirationDate.setDate(expirationDate.getDate() + 7);
    
    const now = new Date();
    return Math.max(0, Math.ceil((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  };

  if (loading) {
    return (
      <div className="w-full h-64 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  return (
    <div className="relative">
      {processed && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-md mb-4">
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 text-yellow-500 dark:text-yellow-400 mr-2 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                Photo will be deleted in {calculateDaysRemaining()} days
              </p>
              <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
                Please download any photos you want to keep before they are permanently deleted.
              </p>
            </div>
            <button
              onClick={handleDownload}
              className="ml-4 px-3 py-1.5 bg-yellow-100 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-300 rounded-md text-sm flex items-center hover:bg-yellow-200 dark:hover:bg-yellow-700 transition-colors"
            >
              <Download className="h-4 w-4 mr-1.5" />
              Download
            </button>
          </div>
        </div>
      )}

      {/* Photo container */}
      <div className="relative rounded-lg overflow-hidden">
        <img 
          src={photoUrl} 
          alt="Event photo" 
          className="w-full h-auto rounded-lg"
          onLoad={handleImageLoad}
        />
        
        {/* Face rectangles overlay */}
        {imageLoaded && faces.length > 0 && (
          <div className="absolute top-0 left-0 w-full h-full">
            {faces.map((face) => {
              if (!face.bbox) return null;
              
              // Calculate relative positions
              const relX = (face.bbox.x / imageSize.width) * 100;
              const relY = (face.bbox.y / imageSize.height) * 100;
              const relWidth = (face.bbox.width / imageSize.width) * 100;
              const relHeight = (face.bbox.height / imageSize.height) * 100;
              
              // Determine border color based on recognition confidence
              let borderColor = "border-yellow-500"; // Default for unknown
              if (face.users) {
                borderColor = face.confidence >= 0.8 
                  ? "border-green-500"   // High confidence
                  : face.confidence >= 0.6 
                    ? "border-blue-500"  // Medium confidence
                    : "border-orange-500"; // Lower confidence
              }
              
              const isSelected = selectedFace === face.id;
              
              return (
                <div 
                  key={face.id}
                  className={`absolute border-2 cursor-pointer transition-all ${borderColor} ${isSelected ? 'border-4' : 'border-2'}`}
                  style={{
                    left: `${relX}%`,
                    top: `${relY}%`,
                    width: `${relWidth}%`,
                    height: `${relHeight}%`,
                  }}
                  onClick={() => setSelectedFace(isSelected ? null : face.id)}
                >
                  {/* Name tag */}
                  {(isSelected || face.users) && (
                    <div 
                      className={`absolute -top-8 left-0 px-2 py-0.5 rounded text-xs text-white
                        ${face.users ? 'bg-green-600' : 'bg-gray-600'}`}
                    >
                      {face.users ? face.users.full_name || face.users.email : 'Unknown'}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      {/* Controls */}
      <div className="mt-4 flex justify-between items-center">
        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
          <Clock className="h-4 w-4 mr-1.5" />
          <span>Processed on {new Date(createdAt).toLocaleDateString()}</span>
        </div>
        
        <button
          onClick={handleDownload}
          className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-md text-sm flex items-center hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          <Download className="h-4 w-4 mr-1.5" />
          Download Photo
        </button>
      </div>
      
      {/* Faces information */}
      {faces.length > 0 && (
        <div className="mt-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            People in this photo
          </h3>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="space-y-2">
              {faces.map((face) => (
                <div 
                  key={face.id}
                  className={`flex items-center justify-between py-2 px-3 rounded-md
                    ${selectedFace === face.id ? 'bg-gray-200 dark:bg-gray-600' : ''}`}
                  onClick={() => setSelectedFace(selectedFace === face.id ? null : face.id)}
                >
                  <div className="flex items-center">
                    {face.users?.avatar_url ? (
                      <img
                        src={face.users.avatar_url}
                        alt={face.users.full_name || "User"}
                        className="h-8 w-8 rounded-full mr-3"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-gray-300 dark:bg-gray-500 flex items-center justify-center mr-3">
                        <User className="h-4 w-4 text-gray-500 dark:text-gray-300" />
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {face.users ? (face.users.full_name || face.users.email) : 'Unknown Person'}
                      </p>
                      {face.users && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Confidence: {Math.round(face.confidence * 100)}%
                        </p>
                      )}
                    </div>
                  </div>
                  <Tag className="h-4 w-4 text-gray-400" />
                </div>
              ))}

              {faces.length === 0 && processed && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No people were detected in this photo.
                </p>
              )}

              {!processed && (
                <div className="flex items-center">
                  <Loader2 className="h-4 w-4 animate-spin text-gray-500 mr-2" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    This photo is still being processed...
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};