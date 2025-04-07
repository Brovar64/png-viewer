import React, { useState, useEffect } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';

function TransparentImageViewer({ imageSrc, onClose }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isOverImage, setIsOverImage] = useState(false);
  const [hitTestCanvas] = useState(document.createElement('canvas'));
  const [ctx] = useState(hitTestCanvas.getContext('2d'));
  
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key.toLowerCase() === 'w' && isOverImage) {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOverImage, onClose]);
  
  const handleImageLoad = (e) => {
    const img = e.target;
    
    // Set up the hit-test canvas
    hitTestCanvas.width = img.naturalWidth;
    hitTestCanvas.height = img.naturalHeight;
    ctx.clearRect(0, 0, hitTestCanvas.width, hitTestCanvas.height);
    ctx.drawImage(img, 0, 0);
    
    setIsLoaded(true);
  };
  
  const isPixelTransparent = (x, y, img, rect) => {
    if (!ctx || !isLoaded) return true;
    
    // Check if coordinates are outside image bounds
    if (
      x < rect.left ||
      x > rect.right ||
      y < rect.top ||
      y > rect.bottom
    ) {
      return true;
    }
    
    // Convert window coordinates to image coordinates
    const scale = img.naturalWidth / rect.width;
    const imgX = Math.floor((x - rect.left) * scale);
    const imgY = Math.floor((y - rect.top) * scale);
    
    // Check if coordinates are within canvas bounds
    if (
      imgX < 0 || 
      imgX >= hitTestCanvas.width || 
      imgY < 0 || 
      imgY >= hitTestCanvas.height
    ) {
      return true;
    }
    
    // Get pixel data (RGBA)
    try {
      const pixelData = ctx.getImageData(imgX, imgY, 1, 1).data;
      // Check alpha channel (index 3) for transparency
      return pixelData[3] === 0;
    } catch (error) {
      console.error('Error checking pixel transparency:', error);
      return true; // Assume transparent on error
    }
  };
  
  const handleMouseMove = (e) => {
    if (!isLoaded) return;
    
    const img = document.getElementById('transparent-image');
    if (!img) return;
    
    const rect = img.getBoundingClientRect();
    const isTransparent = isPixelTransparent(e.clientX, e.clientY, img, rect);
    
    setIsOverImage(!isTransparent);
    document.body.style.cursor = !isTransparent ? 'move' : 'default';
  };
  
  return (
    <div 
      className="fixed inset-0 bg-transparent"
      onMouseMove={handleMouseMove}
    >
      <TransformWrapper
        initialScale={1}
        minScale={0.1}
        maxScale={10}
        limitToBounds={false}
        disabled={!isOverImage}
        onPanningStart={() => setIsDragging(true)}
        onPanningStop={() => setIsDragging(false)}
      >
        {({ zoomIn, zoomOut, resetTransform }) => (
          <React.Fragment>
            <TransformComponent
              wrapperClass="w-full h-full"
              contentClass="flex items-center justify-center w-full h-full"
            >
              <img
                id="transparent-image"
                src={imageSrc}
                alt="Transparent PNG"
                className="max-h-full max-w-full"
                onLoad={handleImageLoad}
                style={{ 
                  userSelect: 'none',
                  WebkitUserDrag: 'none'
                }}
              />
            </TransformComponent>
          </React.Fragment>
        )}
      </TransformWrapper>
    </div>
  );
}

export default TransparentImageViewer;