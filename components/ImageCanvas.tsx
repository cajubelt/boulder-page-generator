'use client';

import { useState, useRef, useEffect, MouseEvent } from 'react';
import CoordinatesOutput from './CoordinatesOutput';

interface Point {
  x: number;
  y: number;
}

interface Line {
  start: Point;
  end: Point;
  controlPoint?: Point; // Optional control point for curved lines
  curvature: number; // Curvature factor (0 = straight line, positive/negative = curve direction)
}

interface ImageCanvasProps {
  imageUrl: string | null;
}

export default function ImageCanvas({ imageUrl }: ImageCanvasProps) {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [lines, setLines] = useState<Line[]>([]);
  const [selectedLineIndex, setSelectedLineIndex] = useState<number | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentLine, setCurrentLine] = useState<Line | null>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (imageUrl && imageRef.current) {
      const img = new window.Image();
      img.onload = () => {
        setDimensions({
          width: img.naturalWidth,
          height: img.naturalHeight
        });
        // Reset lines when a new image is loaded
        setLines([]);
      };
      img.src = imageUrl;
    }
  }, [imageUrl]);
  
  // Resize canvas when dimensions change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas && dimensions.width && dimensions.height) {
      canvas.width = dimensions.width;
      canvas.height = dimensions.height;
      drawLines();
    }
  }, [dimensions]);

  // Redraw whenever any of these dependencies change
  useEffect(() => {
    if (canvasRef.current) {
      drawLines();
    }
  }, [lines, currentLine, selectedLineIndex]);
  
  // Force redraw on any selection change
  useEffect(() => {
    if (canvasRef.current) {
      // Use requestAnimationFrame to ensure the redraw happens at the right time
      requestAnimationFrame(() => {
        if (canvasRef.current) {
          const ctx = canvasRef.current.getContext('2d');
          if (ctx) {
            ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            drawLines();
          }
        }
      });
    }
  }, [selectedLineIndex]);

  const drawLines = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Validate selectedLineIndex is within bounds
    const validSelection = selectedLineIndex !== null && selectedLineIndex >= 0 && selectedLineIndex < lines.length;
    
    // Draw all saved lines
    ctx.strokeStyle = '#ff3333';
    ctx.lineWidth = 2;
    
    // Draw completed lines
    lines.forEach((line, index) => {
      const isSelected = validSelection && index === selectedLineIndex;
      if (isSelected) {
        // Highlight selected line
        ctx.strokeStyle = '#3b82f6'; // Blue for selected
        ctx.lineWidth = 3;
      } else {
        ctx.strokeStyle = '#ff3333'; // Red for others
        ctx.lineWidth = 2;
      }
      
      drawArrow(ctx, line, isSelected);
    });
    
    // Reset to default for current drawing line
    ctx.strokeStyle = '#ff3333';
    ctx.lineWidth = 2;
    
    // Draw the current line being drawn
    if (currentLine) {
      drawArrow(ctx, { ...currentLine, curvature: 0 });
    }
  };

  const calculateControlPoint = (start: Point, end: Point, curvature: number): Point => {
    // Calculate the midpoint of the line
    const midX = (start.x + end.x) / 2;
    const midY = (start.y + end.y) / 2;
    
    // Calculate the perpendicular vector to the line
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    
    // Normalize and rotate 90 degrees
    const perpX = -dy / length;
    const perpY = dx / length;
    
    // Calculate the control point by moving perpendicular to the line
    // The distance is determined by the curvature factor and line length
    const controlX = midX + perpX * curvature * length / 2;
    const controlY = midY + perpY * curvature * length / 2;
    
    return { x: controlX, y: controlY };
  };

  const drawArrow = (ctx: CanvasRenderingContext2D, line: Line, isSelected: boolean = false) => {
    const { start, end, curvature } = line;
    
    // Calculate control point based on curvature
    const controlPoint = calculateControlPoint(start, end, curvature);
    
    // Save the control point for later use
    if (isSelected) {
      line.controlPoint = controlPoint;
    }
    
    // Draw the line (straight or curved)
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    
    if (curvature !== 0) {
      // Draw curved line
      ctx.quadraticCurveTo(controlPoint.x, controlPoint.y, end.x, end.y);
    } else {
      // Draw straight line
      ctx.lineTo(end.x, end.y);
    }
    
    ctx.stroke();
    
    // For curved lines, calculate the angle at the end point
    let angle;
    if (curvature !== 0) {
      // For curved lines, calculate the tangent at the end point
      const t = 1; // Parameter at end point
      const dx = 2 * (1 - t) * (controlPoint.x - start.x) + 2 * t * (end.x - controlPoint.x);
      const dy = 2 * (1 - t) * (controlPoint.y - start.y) + 2 * t * (end.y - controlPoint.y);
      angle = Math.atan2(dy, dx);
    } else {
      // For straight lines, use the direct angle
      angle = Math.atan2(end.y - start.y, end.x - start.x);
    }
    
    // Draw the arrowhead
    const headLength = 10;
    ctx.beginPath();
    ctx.moveTo(end.x, end.y);
    ctx.lineTo(
      end.x - headLength * Math.cos(angle - Math.PI / 6),
      end.y - headLength * Math.sin(angle - Math.PI / 6)
    );
    ctx.moveTo(end.x, end.y);
    ctx.lineTo(
      end.x - headLength * Math.cos(angle + Math.PI / 6),
      end.y - headLength * Math.sin(angle + Math.PI / 6)
    );
    ctx.stroke();
    
    // If selected, draw the control point
    if (isSelected && curvature !== 0) {
      ctx.fillStyle = '#3b82f6'; // Blue control point
      ctx.beginPath();
      ctx.arc(controlPoint.x, controlPoint.y, 5, 0, Math.PI * 2);
      ctx.fill();
      
      // Draw lines from control point to start and end
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(controlPoint.x, controlPoint.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  };

  const getScaledCoordinates = (e: MouseEvent) => {
    if (!canvasRef.current || !imageRef.current || !dimensions.width) return { x: 0, y: 0 };
    
    const canvas = canvasRef.current;
    const img = imageRef.current;
    const rect = canvas.getBoundingClientRect();
    
    // Get the displayed dimensions of the image
    const displayedWidth = img.clientWidth;
    const displayedHeight = img.clientHeight;
    
    // Calculate the scaling factors between the displayed image and the actual image dimensions
    const scaleX = dimensions.width / displayedWidth;
    const scaleY = dimensions.height / displayedHeight;
    
    // Calculate the position in the displayed image
    // Account for any offset if the image is centered
    const offsetX = (rect.width - displayedWidth) / 2;
    const offsetY = (rect.height - displayedHeight) / 2;
    
    const displayX = e.clientX - rect.left - offsetX;
    const displayY = e.clientY - rect.top - offsetY;
    
    // Ensure we're within the image bounds
    if (displayX < 0 || displayX > displayedWidth || displayY < 0 || displayY > displayedHeight) {
      return { x: -1, y: -1 }; // Out of bounds
    }
    
    // Convert to the actual image coordinates
    const x = displayX * scaleX;
    const y = displayY * scaleY;
    
    return { x, y };
  };

  const handleMouseDown = (e: MouseEvent) => {
    if (!canvasRef.current) return;
    
    const position = getScaledCoordinates(e);
    
    // Don't start drawing if we're out of bounds
    if (position.x === -1 || position.y === -1) return;
    
    // Check if we clicked on an existing line
    const clickedLineIndex = findClickedLine(position);
    
    if (clickedLineIndex !== null) {
      // Select the line
      setSelectedLineIndex(clickedLineIndex);
      setIsDrawing(false);
      
      // Force immediate redraw to update colors
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Immediately highlight the selected line
          lines.forEach((line, index) => {
            if (index === clickedLineIndex) {
              ctx.strokeStyle = '#3b82f6'; // Blue for selected
              ctx.lineWidth = 3;
              drawArrow(ctx, line, true);
            }
          });
        }
      }
    } else {
      // Deselect any selected line
      setSelectedLineIndex(null);
      
      // Start drawing a new line
      setIsDrawing(true);
      setCurrentLine({
        start: position,
        end: position,
        curvature: 0
      });
    }
  };
  
  const findClickedLine = (position: Point): number | null => {
    // Check each line to see if the click is near it
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i];
      
      // For curved lines, check distance to the quadratic curve
      if (line.curvature !== 0 && line.controlPoint) {
        // Simple approximation - check distance to control point and endpoints
        const distToControl = distanceToPoint(position, line.controlPoint);
        const distToStart = distanceToPoint(position, line.start);
        const distToEnd = distanceToPoint(position, line.end);
        
        if (distToControl < 10 || distToStart < 10 || distToEnd < 10) {
          return i;
        }
        
        // More complex check - sample points along the curve
        for (let t = 0.1; t < 1; t += 0.1) {
          const pointOnCurve = {
            x: Math.pow(1-t, 2) * line.start.x + 2 * (1-t) * t * line.controlPoint.x + Math.pow(t, 2) * line.end.x,
            y: Math.pow(1-t, 2) * line.start.y + 2 * (1-t) * t * line.controlPoint.y + Math.pow(t, 2) * line.end.y
          };
          
          if (distanceToPoint(position, pointOnCurve) < 10) {
            return i;
          }
        }
      } else {
        // For straight lines, check distance to the line segment
        if (distanceToLineSegment(position, line.start, line.end) < 10) {
          return i;
        }
      }
    }
    
    return null;
  };
  
  const distanceToPoint = (p1: Point, p2: Point): number => {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.sqrt(dx * dx + dy * dy);
  };
  
  const distanceToLineSegment = (p: Point, start: Point, end: Point): number => {
    const A = p.x - start.x;
    const B = p.y - start.y;
    const C = end.x - start.x;
    const D = end.y - start.y;
    
    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;
    
    if (lenSq !== 0) {
      param = dot / lenSq;
    }
    
    let xx, yy;
    
    if (param < 0) {
      xx = start.x;
      yy = start.y;
    } else if (param > 1) {
      xx = end.x;
      yy = end.y;
    } else {
      xx = start.x + param * C;
      yy = start.y + param * D;
    }
    
    const dx = p.x - xx;
    const dy = p.y - yy;
    
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDrawing || !currentLine || !canvasRef.current) return;
    
    const position = getScaledCoordinates(e);
    
    // Use the last valid position if we're out of bounds
    if (position.x === -1 || position.y === -1) return;
    
    setCurrentLine({
      ...currentLine,
      end: position
    });
  };

  const handleMouseUp = () => {
    if (isDrawing && currentLine) {
      // Add the new line with default curvature of 0 (straight line)
      const newLine = {
        ...currentLine,
        curvature: 0
      };
      setLines([...lines, newLine]);
      setCurrentLine(null);
      
      // Select the newly added line
      setSelectedLineIndex(lines.length);
    }
    setIsDrawing(false);
  };

  const handleMouseLeave = () => {
    if (isDrawing && currentLine) {
      setLines([...lines, currentLine]);
      setCurrentLine(null);
    }
    setIsDrawing(false);
  };

  if (!imageUrl) {
    return (
      <div className="w-full h-64 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center">
        <p className="text-gray-600">No image selected</p>
      </div>
    );
  }

  return (
    <div className="relative border border-gray-200 rounded-lg overflow-hidden">
      <div 
        className="relative flex justify-center items-center" 
        style={{ width: '100%', height: 'auto', maxHeight: '500px' }}
      >
        <div className="relative" style={{ display: 'inline-block' }}>
          <img
            ref={imageRef}
            src={imageUrl}
            alt="Uploaded image"
            className="max-w-full max-h-[500px] object-contain"
            style={{ display: 'block' }}
          />
          <canvas
            ref={canvasRef}
            width={dimensions.width || 800}
            height={dimensions.height || 600}
            className="absolute top-0 left-0 w-full h-full pointer-events-auto"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            style={{ cursor: 'crosshair' }}
          />
        </div>
      </div>
      <div className="mt-2 flex justify-between items-center">
        <div className="text-sm text-gray-700">
          {lines.length} {lines.length === 1 ? 'arrow' : 'arrows'} drawn
          {selectedLineIndex !== null && (
            <span className="ml-2 text-blue-600">(Arrow {selectedLineIndex + 1} selected)</span>
          )}
        </div>
        <div className="flex space-x-2">
          {selectedLineIndex !== null && (
            <div className="flex items-center">
              <label htmlFor="curvature" className="text-xs mr-2">Curvature:</label>
              <input
                id="curvature"
                type="range"
                min="-0.5"
                max="0.5"
                step="0.01"
                value={selectedLineIndex !== null && selectedLineIndex < lines.length ? lines[selectedLineIndex]?.curvature || 0 : 0}
                onChange={(e) => {
                  const newCurvature = parseFloat(e.target.value);
                  setLines(lines.map((line, i) => 
                    i === selectedLineIndex ? { ...line, curvature: newCurvature } : line
                  ));
                }}
                className="w-24 h-4"
              />
              <button
                onClick={() => {
                  // Clear selection and force redraw
                  setSelectedLineIndex(null);
                  
                  // Ensure the canvas is redrawn completely
                  requestAnimationFrame(() => {
                    if (canvasRef.current) {
                      const ctx = canvasRef.current.getContext('2d');
                      if (ctx) {
                        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                        drawLines();
                      }
                    }
                  });
                }}
                className="ml-2 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
              >
                Deselect
              </button>
            </div>
          )}
          {lines.length > 0 && (
            <button
              onClick={() => {
                setSelectedLineIndex(null);
                setLines([]);
                // Force complete redraw
                requestAnimationFrame(() => {
                  if (canvasRef.current) {
                    const ctx = canvasRef.current.getContext('2d');
                    if (ctx) {
                      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                      drawLines();
                    }
                  }
                });
              }}
              className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
            >
              Clear All
            </button>
          )}
        </div>
      </div>
      
      {lines.length > 0 && (
        <div className="mt-4">
          <h3 className="text-md font-medium mb-2">Arrow Coordinates</h3>
          <CoordinatesOutput 
            lines={lines} 
            imageWidth={dimensions.width || 800} 
            imageHeight={dimensions.height || 600} 
          />
        </div>
      )}
    </div>
  );
}
