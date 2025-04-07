# PNG Viewer

An Electron + React application for browsing PNG files in a selected folder.

## Features

- Select a folder to browse PNG files
- Display thumbnails of PNG images
- Show image file name and size
- Zoom in/out of images using the mouse wheel (improved zooming centered on cursor)
- Real crop feature using "R" key that physically crops the window to selected area
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

### Using the Crop Tool

1. Press 'R' key to activate the crop tool
2. Draw a crop region by clicking and dragging on the image
3. Adjust the crop by dragging the handles on the corners and edges
4. Press 'Enter' to apply the crop - this will physically resize the window to show only the cropped area
5. Press 'Escape' to cancel the crop operation

This real crop tool is perfect for creating cutout effects for reception desks or other creative presentations, as it physically crops the window to match the selected area.

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
