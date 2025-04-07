import React, { useState, useEffect, useRef } from 'react';
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

function TransparentImageViewer({ imageData }) {
  const [isOverImage, setIsOverImage] = useState(false);
  const canvasRef = useRef(null);
  const imageRef = useRef(null);
  const [isTransparentAreaClicked, setIsTransparentAreaClicked] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Setup canvas for hit testing transparent areas
  useEffect(() => {
    if (imageData && imageRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      // When image loads, set up the canvas for hit testing
      imageRef.current.onload = () => {
        canvas.width = imageRef.current.naturalWidth;
        canvas.height = imageRef.current.naturalHeight;
        ctx.drawImage(imageRef.current, 0, 0);
      };
    }
  }, [imageData]);

  // Check if a pixel is transparent at the given coordinates
  const isPixelTransparent = (x, y) => {
    if (!canvasRef.current || !imageRef.current) return true;

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
    try {
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
    // Only start dragging on non-transparent pixels
    const isTransparent = isPixelTransparent(e.clientX, e.clientY);
    if (!isTransparent) {
      setIsTransparentAreaClicked(true);
      setIsDragging(true);
      
      // Calculate drag offset from current mouse position
      const rect = imageRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
      
      // Set drag start coordinates
      setDragStart({
        x: e.screenX,
        y: e.screenY
      });
      
      // Notify Electron we're starting to drag
      window.transparentWindow.startDrag();
    }
  };

  const handleMouseMove = (e) => {
    // Update cursor based on transparency
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
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsTransparentAreaClicked(false);
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
      className="h-screen w-screen bg-transparent overflow-hidden"
      onMouseMove={handleMouseMove}
      style={{ cursor: isOverImage ? 'move' : 'default' }}
    >
      <TransformWrapper
        initialScale={1}
        minScale={0.1}
        maxScale={10}
        limitToBounds={false}
        centerOnInit={true}
        disablePadding={true}
        wheel={{ disabled: isTransparentAreaClicked }}
        panning={{ disabled: isTransparentAreaClicked || isDragging }}
        doubleClick={{ disabled: isTransparentAreaClicked }}
        onPanning={({ state }) => {
          // Prevent starting panning on transparent pixels
          if (isPixelTransparent(state.startClientX, state.startClientY)) {
            return false;
          }
        }}
      >
        <TransformComponent
          wrapperStyle={{ width: '100%', height: '100%', background: 'transparent' }}
          contentStyle={{ background: 'transparent' }}
        >
          <img
            ref={imageRef}
            src={imageData}
            alt="Transparent PNG"
            onMouseDown={handleMouseDown}
            style={{ userSelect: 'none', WebkitUserDrag: 'none' }}
          />
        </TransformComponent>
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