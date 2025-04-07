import React, { useState, useEffect } from 'react';
import ImageThumbnail from './ImageThumbnail';

function ImageGrid({ images, folderPath }) {
  const [imageData, setImageData] = useState({});

  useEffect(() => {
    const loadImages = async () => {
      const imageDataMap = {};
      
      // Load only the first 100 images to prevent performance issues
      const imagesToLoad = images.slice(0, 100);
      
      for (const image of imagesToLoad) {
        try {
          const base64Data = await window.electron.readFile(image.path);
          imageDataMap[image.path] = `data:image/png;base64,${base64Data}`;
        } catch (error) {
          console.error(`Error loading image ${image.name}:`, error);
        }
      }
      
      setImageData(imageDataMap);
    };
    
    if (images.length > 0) {
      loadImages();
    }
  }, [images]);

  if (images.length === 0 && folderPath) {
    return (
      <div className="text-center py-20 text-gray-500">
        No PNG files found in the selected folder.
      </div>
    );
  }

  if (!folderPath) {
    return (
      <div className="text-center py-20 text-gray-500">
        Select a folder to view PNG files.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {images.map((image) => (
        <ImageThumbnail
          key={image.path}
          image={image}
          src={imageData[image.path]}
        />
      ))}
      {images.length > 100 && (
        <div className="col-span-full text-center mt-6 text-gray-500">
          Showing first 100 images. Select a more specific folder for better performance.
        </div>
      )}
    </div>
  );
}

export default ImageGrid;