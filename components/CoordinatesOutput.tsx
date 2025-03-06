'use client';

import { useState } from 'react';

interface Point {
  x: number;
  y: number;
}

interface Line {
  start: Point;
  end: Point;
  controlPoint?: Point;
  curvature: number;
  segmentId?: string;
  isEndSegment?: boolean;
}

interface TextBox {
  id: string;
  position: Point;
  text: string;
  width: number;
  height: number;
}

interface CoordinatesOutputProps {
  lines: Line[];
  textBoxes: TextBox[];
  imageWidth: number;
  imageHeight: number;
}

export default function CoordinatesOutput({ lines, textBoxes, imageWidth, imageHeight }: CoordinatesOutputProps) {
  const [copied, setCopied] = useState(false);

  // Group lines by segment ID for better display
  const groupLinesBySegment = () => {
    const segments: { [key: string]: Line[] } = {};
    const standaloneLines: Line[] = [];
    
    lines.forEach(line => {
      if (line.segmentId) {
        if (!segments[line.segmentId]) {
          segments[line.segmentId] = [];
        }
        segments[line.segmentId].push(line);
      } else {
        standaloneLines.push(line);
      }
    });
    
    return { segments, standaloneLines };
  };

  const formatCoordinates = () => {
    if (lines.length === 0 && textBoxes.length === 0) {
      return 'No annotations added yet';
    }

    // Group lines by segment ID
    const { segments, standaloneLines } = groupLinesBySegment();
    
    // Create the curveSet array
    const curveSetArray = [];
    
    // Add standalone lines as individual arrays with one element
    standaloneLines.forEach(line => {
      const normalizedStartX = parseFloat((line.start.x / imageWidth).toFixed(2));
      const normalizedStartY = parseFloat((line.start.y / imageHeight).toFixed(2));
      const normalizedEndX = parseFloat((line.end.x / imageWidth).toFixed(2));
      const normalizedEndY = parseFloat((line.end.y / imageHeight).toFixed(2));
      const curvature = parseFloat(line.curvature.toFixed(2));
      
      curveSetArray.push([
        { 
          x1: normalizedStartX, 
          y1: normalizedStartY, 
          x2: normalizedEndX, 
          y2: normalizedEndY, 
          curvature: curvature
        }
      ]);
    });
    
    // Add connected segments as arrays with multiple elements
    Object.values(segments).forEach(segmentLines => {
      // Sort segment lines to maintain order (this is a simple approach)
      const sortedLines = [...segmentLines];
      
      const segmentArray = sortedLines.map(line => {
        const normalizedStartX = parseFloat((line.start.x / imageWidth).toFixed(2));
        const normalizedStartY = parseFloat((line.start.y / imageHeight).toFixed(2));
        const normalizedEndX = parseFloat((line.end.x / imageWidth).toFixed(2));
        const normalizedEndY = parseFloat((line.end.y / imageHeight).toFixed(2));
        const curvature = parseFloat(line.curvature.toFixed(2));
        
        return { 
          x1: normalizedStartX, 
          y1: normalizedStartY, 
          x2: normalizedEndX, 
          y2: normalizedEndY, 
          curvature: curvature
        };
      });
      
      curveSetArray.push(segmentArray);
    });
    
    // Create the textSet array
    const textSetArray = textBoxes.map(textBox => {
      const normalizedX = parseFloat((textBox.position.x / imageWidth).toFixed(2));
      const normalizedY = parseFloat((textBox.position.y / imageHeight).toFixed(2));
      
      return {
        text: textBox.text,
        x: normalizedX,
        y: normalizedY,
        color: 'rgba(0, 255, 0, 0.6)'
      };
    });
    
    // Format the output as JavaScript code
    let output = 'const curveSet = ' + JSON.stringify(curveSetArray, null, 4)
      .replace(/\[\[/g, '[\n    [')
      .replace(/\],\[/g, '],\n    [')
      .replace(/\]\]/g, ']\n]')
      .replace(/"x1":/g, 'x1:')
      .replace(/"y1":/g, 'y1:')
      .replace(/"x2":/g, 'x2:')
      .replace(/"y2":/g, 'y2:')
      .replace(/"curvature":/g, 'curvature:');
    
    if (textSetArray.length > 0) {
      output += '\n\nconst textSet = ' + JSON.stringify(textSetArray, null, 4)
        .replace(/\[/g, '[\n    ')
        .replace(/\},\{/g, '},\n    {')
        .replace(/\]/g, '\n]')
        .replace(/"text":/g, 'text:')
        .replace(/"x":/g, 'x:')
        .replace(/"y":/g, 'y:')
        .replace(/"color":/g, 'color:');
    }

    
    return output;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(formatCoordinates());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div className="bg-gray-50 p-2 flex justify-between items-center">
        <span className="font-medium text-sm text-gray-800">JavaScript Code</span>
        <button
          onClick={handleCopy}
          className="text-xs px-2 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          disabled={lines.length === 0 && textBoxes.length === 0}
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <pre className="p-4 bg-white border-t border-gray-100 overflow-x-auto text-sm max-h-60 overflow-y-auto text-gray-800">
        <code>{formatCoordinates()}</code>
      </pre>
    </div>
  );
}
