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
}

interface CoordinatesOutputProps {
  lines: Line[];
  imageWidth: number;
  imageHeight: number;
}

export default function CoordinatesOutput({ lines, imageWidth, imageHeight }: CoordinatesOutputProps) {
  const [copied, setCopied] = useState(false);

  const formatCoordinates = () => {
    if (lines.length === 0) {
      return 'No arrows drawn yet';
    }

    let output = '';
    lines.forEach((line, index) => {
      // Round to 2 decimal places for cleaner output
      const startX = Math.round(line.start.x * 100) / 100;
      const startY = Math.round(line.start.y * 100) / 100;
      const endX = Math.round(line.end.x * 100) / 100;
      const endY = Math.round(line.end.y * 100) / 100;
      
      output += `Arrow ${index + 1}:\n`;
      output += `  Start: (${startX}, ${startY})\n`;
      output += `  End: (${endX}, ${endY})\n`;
      
      // Add curvature information if it's not a straight line
      if (line.curvature && line.curvature !== 0) {
        const curvature = Math.round(line.curvature * 100) / 100;
        output += `  Curvature: ${curvature}\n`;
        
        if (line.controlPoint) {
          const ctrlX = Math.round(line.controlPoint.x * 100) / 100;
          const ctrlY = Math.round(line.controlPoint.y * 100) / 100;
          output += `  Control Point: (${ctrlX}, ${ctrlY})\n`;
        }
      }
      
      // Calculate length and angle for additional information
      const dx = endX - startX;
      const dy = endY - startY;
      const length = Math.round(Math.sqrt(dx * dx + dy * dy) * 100) / 100;
      const angle = Math.round(Math.atan2(dy, dx) * (180 / Math.PI) * 100) / 100;
      
      output += `  Length: ${length} pixels\n`;
      output += `  Angle: ${angle} degrees\n\n`;
    });

    // Add JSON format for easy copying to code
    output += '\n// JSON Format:\n';
    output += JSON.stringify(lines.map(line => ({
      start: {
        x: Math.round(line.start.x * 100) / 100,
        y: Math.round(line.start.y * 100) / 100
      },
      end: {
        x: Math.round(line.end.x * 100) / 100,
        y: Math.round(line.end.y * 100) / 100
      },
      curvature: line.curvature ? Math.round(line.curvature * 100) / 100 : 0,
      ...(line.controlPoint && {
        controlPoint: {
          x: Math.round(line.controlPoint.x * 100) / 100,
          y: Math.round(line.controlPoint.y * 100) / 100
        }
      })
    })), null, 2);

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
        <span className="font-medium text-sm text-gray-800">Arrow Coordinates</span>
        <button
          onClick={handleCopy}
          className="text-xs px-2 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          disabled={lines.length === 0}
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
