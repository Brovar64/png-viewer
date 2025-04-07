# PNG Viewer

An Electron + React application for browsing PNG files in a selected folder.

## Features

- Select a folder to browse PNG files
- Display thumbnails of PNG images
- Show image file name and size
- Zoom in/out of images using the mouse wheel (improved zooming centered on cursor)
- Create cutout effect with "R" key for creative image presentations
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

- Click on any thumbnail to open the image in a dedicated transparent window
- Use the mouse wheel to zoom in/out of the image (zoom centers on cursor position)
- Drag the image by clicking and holding on any non-transparent part
- Press 'W' key while hovering over the image to close the window
- Press 'R' key to toggle the cutout mode (shows only the top half of the image)

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

## License

[MIT](LICENSE)
