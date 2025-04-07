import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import TransparentImageViewer from './components/TransparentImageViewer';

// Get the image data from localStorage
const imageData = localStorage.getItem('currentImageData');

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <TransparentImageViewer imageData={imageData} />
  </React.StrictMode>
);