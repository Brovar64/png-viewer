# PNG Viewer

An Electron + React application for browsing PNG files in a selected folder.

## Features

- Select a folder to browse PNG files
- Display thumbnails of PNG images
- Show image file name and size
- Enhanced zooming and panning with react-zoom-pan-pinch
- Drag transparent PNGs by their visible parts
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

- Click on any thumbnail to open the image in a dedicated viewer window
- Use the mouse wheel to zoom in/out of the image without any cropping limitations
- Pan the image by clicking and dragging on any non-transparent part
- Press 'W' key while hovering over the image to close the window

## Recent Improvements

- Fixed the image cropping issue when zooming in too much
- Implemented react-zoom-pan-pinch for smoother zooming and panning
- Improved transparency detection for better interaction
- Maintained the ability to interact with the area behind transparent parts of PNGs

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
- react-zoom-pan-pinch: Advanced zooming and panning library

## License

[MIT](LICENSE)
