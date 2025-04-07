import React, { useState } from 'react';
import FolderPicker from './components/FolderPicker';
import ImageGrid from './components/ImageGrid';

function App() {
  const [images, setImages] = useState([]);
  const [folderPath, setFolderPath] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFolderSelected = async (path) => {
    if (!path) return;
    
    setFolderPath(path);
    setLoading(true);
    try {
      const pngFiles = await window.electron.readDirectory(path);
      setImages(pngFiles);
    } catch (error) {
      console.error('Error reading directory:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold text-center mb-6">PNG Viewer</h1>
      
      <FolderPicker onFolderSelected={handleFolderSelected} />
      
      {folderPath && (
        <div className="mt-3 mb-6 text-sm text-gray-600 truncate">
          <span className="font-medium">Current folder:</span> {folderPath}
        </div>
      )}
      
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <ImageGrid images={images} folderPath={folderPath} />
      )}
    </div>
  );
}

export default App;