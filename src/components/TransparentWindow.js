import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import TransparentImageViewer from './TransparentImageViewer';

const TransparentWindow = ({ imagePath, onClose }) => {
  const [container] = useState(() => document.createElement('div'));
  const [imageData, setImageData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Create a transparent window container
    container.className = 'transparent-window';
    document.body.appendChild(container);
    
    // Function to load the image
    const loadImage = async () => {
      try {
        setIsLoading(true);
        const data = await window.electron.readFile(imagePath);
        setImageData(`data:image/png;base64,${data}`);
      } catch (error) {
        console.error('Error loading image:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadImage();
    
    // Clean up
    return () => {
      document.body.removeChild(container);
    };
  }, [container, imagePath]);
  
  const handleClose = () => {
    onClose();
  };
  
  // Portal the content to the container
  return createPortal(
    <div className="fixed inset-0 flex items-center justify-center z-50">
      {isLoading ? (
        <div className="bg-white bg-opacity-70 p-8 rounded-lg shadow-lg">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <TransparentImageViewer imageSrc={imageData} onClose={handleClose} />
      )}
    </div>,
    container
  );
};

export default TransparentWindow;