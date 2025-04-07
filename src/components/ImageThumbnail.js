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
    try {
      // For large images, use the more efficient method that reads the file directly in the main process
      if (image.size > 1024 * 1024) { // For files larger than 1MB
        await window.electron.openTransparentFile(image.path);
      } else if (src) {
        // For smaller images, we can still use the original method with base64 data
        await window.electron.openTransparentWindow(image.path, src);
      }
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