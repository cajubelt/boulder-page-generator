# Image Arrow Annotator

A web application that allows users to upload images and annotate them with arrows and text boxes. The application provides coordinates for each annotation, making it easy to use these annotations in other contexts.

## Features

- Upload and display images
- Draw arrows on images with adjustable curvature
- Create connected line segments
- Add text boxes with customizable content
- Drag and position text boxes
- Copy coordinates of all annotations
- Delete annotations with keyboard shortcuts or buttons

## Prerequisites

Before you begin, ensure you have the following installed on your system:

### Node.js and npm

This project requires Node.js (version 18.x or later) and npm (version 9.x or later).

#### Installing Node.js and npm

**Option 1: Using the official installer**

1. Visit the [Node.js download page](https://nodejs.org/en/download/)
2. Download the installer for your operating system
3. Run the installer and follow the installation wizard
4. Verify the installation by running the following commands in your terminal:
   ```bash
   node --version
   npm --version
   ```

**Option 2: Using a package manager**

- **macOS (with Homebrew):**
  ```bash
  brew install node
  ```

- **Windows (with Chocolatey):**
  ```bash
  choco install nodejs
  ```

- **Linux (with apt):**
  ```bash
  curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
  sudo apt-get install -y nodejs
  ```

For more detailed instructions, refer to the [official Node.js installation guide](https://nodejs.org/en/download/package-manager/).

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/image-arrow-annotator.git
   cd image-arrow-annotator
   ```

2. Install the dependencies:
   ```bash
   npm install
   ```

## Getting Started

After installing the dependencies, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## Usage

1. Upload an image using the file uploader
2. Use the following controls to annotate your image:
   - Click and drag to draw arrows
   - Click near the start or end of an existing arrow to extend it with a connected segment
   - Click on an arrow to select it and adjust its curvature with the slider
   - Click "Add Text Box" and then click on the image to add a text box
   - Double-click on a text box to edit its text
   - Click and drag to move text boxes
   - Select an arrow or text box and press Delete key (or use the Delete button) to remove it
   - Press Escape to deselect the current selection
3. The coordinates of all annotations are displayed below the image for easy copying

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
