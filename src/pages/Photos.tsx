import React from 'react';
import { Camera, Upload, CheckCircle, Clock } from 'lucide-react';

export const Photos: React.FC = () => {
  const photos = [
    {
      id: '1',
      eventName: 'Tech Conference 2025',
      url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87',
      uploadDate: '2025-03-15',
      status: 'processed',
      facesDetected: 24,
    },
    {
      id: '2',
      eventName: 'Startup Summit',
      url: 'https://images.unsplash.com/photo-1591115765373-5207764f72e7',
      uploadDate: '2025-03-10',
      status: 'processing',
      facesDetected: 12,
    },
    // Add more photos as needed
  ];

  return (
    <div className="py-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Photos</h1>
        <button className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors">
          Upload Photos
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {photos.map((photo) => (
          <div
            key={photo.id}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden"
          >
            <div className="aspect-w-16 aspect-h-9 relative">
              <img
                src={photo.url}
                alt={photo.eventName}
                className="w-full h-48 object-cover"
              />
              <div className="absolute top-2 right-2">
                {photo.status === 'processed' ? (
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
                {photo.eventName}
              </h3>
              <div className="space-y-2">
                <div className="flex items-center text-gray-500 dark:text-gray-400">
                  <Upload className="h-4 w-4 mr-2" />
                  <span className="text-sm">Uploaded on {photo.uploadDate}</span>
                </div>
                <div className="flex items-center text-gray-500 dark:text-gray-400">
                  <Camera className="h-4 w-4 mr-2" />
                  <span className="text-sm">{photo.facesDetected} faces detected</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};