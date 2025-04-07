import React, { useState, useEffect, useRef } from 'react';
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

function TransparentImageViewer({ imageData }) {
  const [isOverImage, setIsOverImage] = useState(false);
  const canvasRef = useRef(null);
  const imageRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  // Log data for debugging
  useEffect(() => {
    console.log('TransparentImageViewer rendered with imageData:', 
      imageData ? `${imageData.substring(0, 50)}... (length: ${imageData.length})` : 'none');
  }, [imageData]);
  
  // Setup canvas for hit testing transparent areas once image is loaded
  const setupCanvas = () => {
    console.log('Setting up canvas for hit testing');
    
    if (imageRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      try {
        // Clear any previous content
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Set canvas dimensions to match image
        canvas.width = imageRef.current.naturalWidth;
        canvas.height = imageRef.current.naturalHeight;
        
        // Draw the image onto the canvas
        ctx.drawImage(imageRef.current, 0, 0);
        console.log('Image drawn to canvas for hit testing');
        
        // Mark as loaded
        setIsLoaded(true);
      } catch (error) {
        console.error('Error setting up canvas:', error);
      }
    }
  };
  
  // Check if a pixel is transparent at the given coordinates
  const isPixelTransparent = (x, y) => {
    if (!canvasRef.current || !imageRef.current || !isLoaded) return true;

    try {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const rect = imageRef.current.getBoundingClientRect();

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
      const imgX = Math.floor(((x - rect.left) / rect.width) * canvas.width);
      const imgY = Math.floor(((y - rect.top) / rect.height) * canvas.height);

      // Check if coordinates are within canvas bounds
      if (
        imgX < 0 || 
        imgX >= canvas.width || 
        imgY < 0 || 
        imgY >= canvas.height
      ) {
        return true;
      }

      // Get pixel data (RGBA)
      const pixelData = ctx.getImageData(imgX, imgY, 1, 1).data;
      // Check alpha channel (index 3) for transparency
      return pixelData[3] === 0;
    } catch (error) {
      console.error('Error checking pixel transparency:', error);
      return true; // Assume transparent on error
    }
  };

  // Window dragging handlers
  const handleMouseDown = (e) => {
    if (!isLoaded) return;
    
    // Only start dragging on non-transparent pixels
    const isTransparent = isPixelTransparent(e.clientX, e.clientY);
    
    if (!isTransparent) {
      console.log('Mouse down on non-transparent area');
      setIsDragging(true);
      
      // Calculate drag offset from current mouse position
      const rect = imageRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX,
        y: e.clientY
      });
      
      // Notify Electron we're starting to drag
      try {
        window.transparentWindow.startDrag();
      } catch (error) {
        console.error('Error starting drag:', error);
      }
      
      // Stop event propagation to prevent zoom/pan
      e.stopPropagation();
    }
  };

  const handleMouseMove = (e) => {
    if (!isLoaded) return;
    
    // Update cursor based on transparency
    try {
      const isTransparent = isPixelTransparent(e.clientX, e.clientY);
      setIsOverImage(!isTransparent);
      
      // Handle dragging
      if (isDragging) {
        window.transparentWindow.drag(
          e.screenX,
          e.screenY,
          dragOffset.x,
          dragOffset.y
        );
      }
    } catch (error) {
      console.error('Error in handleMouseMove:', error);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Handle close with W key
  const handleKeyDown = (e) => {
    if (e.key.toLowerCase() === 'w' && isOverImage) {
      window.transparentWindow.close();
    }
  };

  // Set up event listeners for window
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isOverImage]);

  return (
    <div 
      className="h-screen w-screen overflow-hidden select-none"
      onMouseMove={handleMouseMove}
      style={{ 
        cursor: isOverImage ? 'move' : 'default',
        background: 'transparent' 
      }}
    >
      <TransformWrapper
        initialScale={1}
        minScale={0.1}
        maxScale={10}
        limitToBounds={false}
        centerOnInit={true}
        disablePadding={true}
        disabled={isDragging}
      >
        {({ zoomIn, zoomOut, resetTransform }) => (
          <>
            <TransformComponent
              wrapperStyle={{ 
                width: '100%', 
                height: '100%', 
                background: 'transparent'
              }}
              contentStyle={{ 
                background: 'transparent'
              }}
            >
              <img
                ref={imageRef}
                src={imageData}
                alt="Transparent PNG"
                onLoad={setupCanvas}
                onMouseDown={handleMouseDown}
                style={{ 
                  userSelect: 'none', 
                  WebkitUserDrag: 'none',
                  background: 'transparent'
                }}
              />
            </TransformComponent>

            {/* Add debug button in dev mode */}
            {process.env.NODE_ENV === 'development' && (
              <div className="absolute bottom-4 right-4 flex gap-2">
                <button onClick={() => zoomIn()} className="bg-blue-500 text-white p-2 rounded opacity-50 hover:opacity-100">+</button>
                <button onClick={() => zoomOut()} className="bg-blue-500 text-white p-2 rounded opacity-50 hover:opacity-100">-</button>
                <button onClick={() => resetTransform()} className="bg-blue-500 text-white p-2 rounded opacity-50 hover:opacity-100">Reset</button>
              </div>
            )}
          </>
        )}
      </TransformWrapper>
      
      {/* Hidden canvas for hit testing */}
      <canvas
        ref={canvasRef}
        style={{ display: 'none' }}
      />
    </div>
  );
}

export default TransparentImageViewer;