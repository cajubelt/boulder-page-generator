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

    let output = '';
    const { segments, standaloneLines } = groupLinesBySegment();
    
    // Display connected segments first
    let segmentCount = 0;
    Object.entries(segments).forEach(([segmentId, segmentLines]) => {
      segmentCount++;
      output += `Connected Segment ${segmentCount}:\n`;
      
      // Sort segment lines to maintain order
      // This is a simple approach - could be improved for more complex paths
      const sortedLines = [...segmentLines];
      
      sortedLines.forEach((line, lineIndex) => {
        // Round to 2 decimal places for cleaner output
        const startX = Math.round(line.start.x * 100) / 100;
        const startY = Math.round(line.start.y * 100) / 100;
        const endX = Math.round(line.end.x * 100) / 100;
        const endY = Math.round(line.end.y * 100) / 100;
        
        output += `  Segment Line ${lineIndex + 1}:\n`;
        output += `    Start: (${startX}, ${startY})\n`;
        output += `    End: (${endX}, ${endY})\n`;
        
        // Add curvature information if it's not a straight line
        if (line.curvature && line.curvature !== 0) {
          const curvature = Math.round(line.curvature * 100) / 100;
          output += `    Curvature: ${curvature}\n`;
          
          if (line.controlPoint) {
            const ctrlX = Math.round(line.controlPoint.x * 100) / 100;
            const ctrlY = Math.round(line.controlPoint.y * 100) / 100;
            output += `    Control Point: (${ctrlX}, ${ctrlY})\n`;
          }
        }
        
        // Calculate length and angle for additional information
        const dx = endX - startX;
        const dy = endY - startY;
        const length = Math.round(Math.sqrt(dx * dx + dy * dy) * 100) / 100;
        const angle = Math.round(Math.atan2(dy, dx) * (180 / Math.PI) * 100) / 100;
        
        output += `    Length: ${length} pixels\n`;
        output += `    Angle: ${angle} degrees\n`;
        output += `    Is End Segment: ${line.isEndSegment ? 'Yes' : 'No'}\n\n`;
      });
    });
    
    // Display standalone lines
    standaloneLines.forEach((line, index) => {
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

    // Display text boxes
    if (textBoxes.length > 0) {
      output += '\nText Boxes:\n';
      textBoxes.forEach((textBox, index) => {
        const { position, width, height, text } = textBox;
        const posX = Math.round(position.x * 100) / 100;
        const posY = Math.round(position.y * 100) / 100;
        
        output += `Text Box ${index + 1}:\n`;
        output += `  Position: (${posX}, ${posY})\n`;
        output += `  Size: ${Math.round(width)} x ${Math.round(height)} pixels\n`;
        output += `  Text: "${text}"\n\n`;
      });
    }
    
    // Add JSON format for easy copying to code
    output += '\n// JSON Format:\n';
    const jsonData = {
      lines: lines.map(line => ({
        start: {
          x: Math.round(line.start.x * 100) / 100,
          y: Math.round(line.start.y * 100) / 100
        },
        end: {
          x: Math.round(line.end.x * 100) / 100,
          y: Math.round(line.end.y * 100) / 100
        },
        curvature: line.curvature ? Math.round(line.curvature * 100) / 100 : 0,
        ...(line.segmentId && {
          segmentId: line.segmentId,
          isEndSegment: line.isEndSegment
        }),
        ...(line.controlPoint && {
          controlPoint: {
            x: Math.round(line.controlPoint.x * 100) / 100,
            y: Math.round(line.controlPoint.y * 100) / 100
          }
        })
      })),
      textBoxes: textBoxes.map(textBox => ({
        position: {
          x: Math.round(textBox.position.x * 100) / 100,
          y: Math.round(textBox.position.y * 100) / 100
        },
        width: Math.round(textBox.width),
        height: Math.round(textBox.height),
        text: textBox.text
      }))
    };
    
    output += JSON.stringify(jsonData, null, 2);

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
