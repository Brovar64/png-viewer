import React from 'react';

function FolderPicker({ onFolderSelected }) {
  const handleClick = async () => {
    try {
      const result = await window.electron.openDirectory();
      if (!result.canceled && result.filePath) {
        onFolderSelected(result.filePath);
      }
    } catch (error) {
      console.error('Error opening directory picker:', error);
    }
  };

  return (
    <div className="flex justify-center mb-6">
      <button
        onClick={handleClick}
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
      >
        Select PNG Folder
      </button>
    </div>
  );
}

export default FolderPicker;