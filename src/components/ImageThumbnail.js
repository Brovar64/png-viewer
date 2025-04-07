import React from 'react';

function ImageThumbnail({ image, src }) {
  const formatSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleClick = async () => {
    if (!src) return; // Don't do anything if image isn't loaded yet
    
    try {
      await window.electron.openTransparentWindow(image.path, src);
    } catch (error) {
      console.error('Error opening transparent window:', error);
    }
  };

  return (
    <div 
      className="border rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer"
      onClick={handleClick}
    >
      <div className="h-40 bg-gray-100 flex items-center justify-center">
        {src ? (
          <img 
            src={src} 
            alt={image.name} 
            className="max-h-full max-w-full object-contain" 
          />
        ) : (
          <div className="animate-pulse h-32 w-32 bg-gray-200 rounded"></div>
        )}
      </div>
      <div className="p-3">
        <p className="text-sm font-medium truncate" title={image.name}>
          {image.name}
        </p>
        <p className="text-xs text-gray-500">{formatSize(image.size)}</p>
      </div>
    </div>
  );
}

export default ImageThumbnail;