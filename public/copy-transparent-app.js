const fs = require('fs');
const path = require('path');

// In development mode, we need to manually copy the built transparent-app.js 
// to the public folder for transparent.html to access it

// Paths
const srcPath = path.join(__dirname, '../build/static/js/transparent-app.js');
const destPath = path.join(__dirname, 'transparent-app.js');

// Check if the build directory exists
if (fs.existsSync(srcPath)) {
  // Copy the file
  fs.copyFileSync(srcPath, destPath);
  console.log('Successfully copied transparent-app.js to public folder');
} else {
  console.error('Could not find transparent-app.js in build folder. Build the project first!');
}
