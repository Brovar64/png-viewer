import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import TransparentImageViewer from './components/TransparentImageViewer';

// Log that we've started loading
console.log('Transparent app script loaded');

// Wait for DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM content loaded');
  
  // Get the image data from localStorage
  const imageData = localStorage.getItem('currentImageData');
  console.log('Retrieved image data from localStorage:', 
    imageData ? `${imageData.substring(0, 30)}... (length: ${imageData.length})` : 'none');

  // Make sure the root element exists
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    console.error('Root element not found!');
    return;
  }
  
  console.log('Creating React root and rendering component...');
  try {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <TransparentImageViewer imageData={imageData} />
      </React.StrictMode>
    );
    console.log('Component rendered successfully');
  } catch (error) {
    console.error('Error rendering component:', error);
  }
});
