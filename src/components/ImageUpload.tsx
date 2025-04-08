import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Image as ImageIcon, X, FileText } from 'lucide-react';

interface ImageUploadProps {
  onImageSelect: (file: File) => void;
  onImageClear: () => void;
  currentImage?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  onImageSelect,
  onImageClear,
  currentImage,
  className = '',
  size = 'md'
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      onImageSelect(file);
      setSelectedFileName(file.name);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, [onImageSelect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif']
    },
    maxFiles: 1,
    multiple: false,
  });

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onImageClear();
    setPreviewUrl(null);
    setSelectedFileName(null);
  };

  const displayImage = previewUrl || currentImage;

  const sizeClasses = {
    sm: 'h-24',
    md: 'h-48',
    lg: 'h-64'
  };

  const containerClasses = {
    sm: 'h-24 w-24',
    md: 'h-48',
    lg: 'h-64'
  };

  return (
    <div className={className}>
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg transition-colors relative
          ${isDragActive 
            ? 'border-gray-900 bg-gray-50 dark:border-white dark:bg-gray-800' 
            : 'border-gray-300 dark:border-gray-700'
          }
          ${displayImage ? 'p-0' : 'p-6'}
          ${containerClasses[size]}
        `}
      >
        <input {...getInputProps()} />
        
        {displayImage ? (
          <div className="relative h-full w-full group">
            <img
              src={displayImage}
              alt="Preview"
              className={`w-full h-full object-cover rounded-lg ${size === 'sm' ? 'rounded-full' : ''}`}
            />
            <div className={`absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-opacity flex items-center justify-center ${size === 'sm' ? 'rounded-full' : 'rounded-lg'}`}>
              <div className="hidden group-hover:flex items-center space-x-2">
                <button
                  onClick={handleClear}
                  className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center h-full flex flex-col items-center justify-center">
            <ImageIcon className={`${size === 'sm' ? 'h-8 w-8' : 'h-12 w-12'} text-gray-400`} />
            {size !== 'sm' && (
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                {isDragActive
                  ? 'Drop the image here'
                  : 'Drag & drop an image here, or click to select'}
              </p>
            )}
          </div>
        )}
      </div>

      {/* File name display */}
      {selectedFileName && size !== 'sm' && (
        <div className="mt-2 flex items-center text-sm text-gray-600 dark:text-gray-400">
          <FileText className="h-4 w-4 mr-2" />
          <span className="truncate">{selectedFileName}</span>
        </div>
      )}
    </div>
  );
};