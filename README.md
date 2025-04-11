# PNG Viewer

An Electron + React application for browsing PNG files in a selected folder.

## Features

- Select a folder to browse PNG files
- Display thumbnails of PNG images
- Show image file name and size
- Zoom in/out of images using the mouse wheel
- Drag transparent PNGs by their visible parts
- Auto-crop transparent PNG images to optimize window size
- 1px red outline around all PNG images for better visibility
- Simple and intuitive user interface

## Installation

```bash
# Clone this repository
git clone https://github.com/Brovar64/png-viewer.git

# Navigate to the project directory
cd png-viewer

# Install dependencies
npm install
```

## Usage

```bash
# Start the application in development mode
npm start
```

The application will launch and you can click the "Select PNG Folder" button to browse your directories and view PNG files.

### Viewing and Interacting with Images

- Click on any thumbnail to open the image in a dedicated transparent window
- PNG images are automatically cropped to their visible content for optimal display
- PNG images have a 1px red outline for better visibility
- Use the mouse wheel to zoom in/out of the image
- Drag the image by clicking and holding on any non-transparent part
- Press 'W' key while hovering over the image to close the window

## Building for Production

```bash
# Build the application for your platform
npm run package
```

The packaged application will be available in the `dist` directory.

## Tech Stack

- Electron: Desktop application framework
- React: UI library
- TailwindCSS: Utility-first CSS framework
- Jimp: Pure JavaScript image processing library for transparency detection

## License

[MIT](LICENSE)