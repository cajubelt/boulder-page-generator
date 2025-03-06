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
  segmentId?: string; // ID to group connected segments
  isEndSegment?: boolean; // Only the last segment in a chain gets an arrowhead
}

interface TextBox {
  id: string;
  position: Point;
  text: string;
  width: number;
  height: number;
  isDragging?: boolean;
  isEditing?: boolean;
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
  const [extendingLine, setExtendingLine] = useState(false);
  const [currentSegmentId, setCurrentSegmentId] = useState<string | null>(null);
  
  // Text box related state
  const [textBoxes, setTextBoxes] = useState<TextBox[]>([]);
  const [selectedTextBoxId, setSelectedTextBoxId] = useState<string | null>(null);
  const [isAddingTextBox, setIsAddingTextBox] = useState(false);
  const [isDraggingTextBox, setIsDraggingTextBox] = useState(false);
  const [dragOffset, setDragOffset] = useState<Point>({ x: 0, y: 0 });
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
    
    // Draw text boxes
    drawTextBoxes(ctx);
  };
  
  const drawTextBoxes = (ctx: CanvasRenderingContext2D) => {
    textBoxes.forEach(textBox => {
      const isSelected = textBox.id === selectedTextBoxId;
      
      // Draw text box background
      ctx.fillStyle = isSelected ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255, 255, 255, 0.7)';
      ctx.strokeStyle = isSelected ? '#3b82f6' : '#ff3333';
      ctx.lineWidth = isSelected ? 2 : 1;
      
      ctx.beginPath();
      ctx.rect(textBox.position.x, textBox.position.y, textBox.width, textBox.height);
      ctx.fill();
      ctx.stroke();
      
      // Draw text
      ctx.fillStyle = '#000000';
      ctx.font = '14px Arial';
      ctx.textBaseline = 'top';
      
      // Add padding for text
      const padding = 5;
      
      // Handle text wrapping
      const words = textBox.text.split(' ');
      let line = '';
      let y = textBox.position.y + padding;
      
      for (let i = 0; i < words.length; i++) {
        const testLine = line + words[i] + ' ';
        const metrics = ctx.measureText(testLine);
        const testWidth = metrics.width;
        
        if (testWidth > textBox.width - padding * 2 && i > 0) {
          ctx.fillText(line, textBox.position.x + padding, y);
          line = words[i] + ' ';
          y += 20; // Line height
        } else {
          line = testLine;
        }
      }
      
      ctx.fillText(line, textBox.position.x + padding, y);
      
      // Draw resize handle for selected text box
      if (isSelected) {
        const handleSize = 6;
        ctx.fillStyle = '#3b82f6';
        ctx.beginPath();
        ctx.rect(
          textBox.position.x + textBox.width - handleSize,
          textBox.position.y + textBox.height - handleSize,
          handleSize,
          handleSize
        );
        ctx.fill();
      }
    });
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
    
    // Only draw arrowhead if this is an end segment or not part of a connected segment
    if (!line.segmentId || line.isEndSegment) {
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
    }
    
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
    
    // Draw connection points at start and end for segments
    if (line.segmentId) {
      ctx.beginPath();
      ctx.arc(start.x, start.y, 3, 0, Math.PI * 2);
      ctx.arc(end.x, end.y, 3, 0, Math.PI * 2);
      ctx.fillStyle = isSelected ? '#3b82f6' : '#ff3333';
      ctx.fill();
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

  // Generate a unique ID for connected segments
  const generateSegmentId = () => {
    return Math.random().toString(36).substring(2, 11);
  };

  // Check if a point is close to the end point of any line
  const findLineEndPoint = (position: Point): { lineIndex: number, isStart: boolean } | null => {
    const threshold = 15; // Distance threshold for connecting
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Check if we're close to the start point
      if (distanceToPoint(position, line.start) < threshold) {
        return { lineIndex: i, isStart: true };
      }
      
      // Check if we're close to the end point
      if (distanceToPoint(position, line.end) < threshold) {
        return { lineIndex: i, isStart: false };
      }
    }
    
    return null;
  };
  
  // Check if a point is inside a text box
  const isPointInTextBox = (point: Point, textBox: TextBox): boolean => {
    return (
      point.x >= textBox.position.x &&
      point.x <= textBox.position.x + textBox.width &&
      point.y >= textBox.position.y &&
      point.y <= textBox.position.y + textBox.height
    );
  };
  
  // Check if a point is on the resize handle of a text box
  const isPointOnResizeHandle = (point: Point, textBox: TextBox): boolean => {
    const handleSize = 6;
    return (
      point.x >= textBox.position.x + textBox.width - handleSize &&
      point.x <= textBox.position.x + textBox.width &&
      point.y >= textBox.position.y + textBox.height - handleSize &&
      point.y <= textBox.position.y + textBox.height
    );
  };
  
  // Find which text box was clicked
  const findClickedTextBox = (point: Point): { textBoxId: string; isResize: boolean } | null => {
    // Check from top to bottom (last drawn is on top)
    for (let i = textBoxes.length - 1; i >= 0; i--) {
      const textBox = textBoxes[i];
      
      // Check if clicking on resize handle first
      if (isPointOnResizeHandle(point, textBox)) {
        return { textBoxId: textBox.id, isResize: true };
      }
      
      // Then check if clicking on the text box itself
      if (isPointInTextBox(point, textBox)) {
        return { textBoxId: textBox.id, isResize: false };
      }
    }
    
    return null;
  };
  
  // Create a new text box
  const createTextBox = (position: Point) => {
    const newTextBox: TextBox = {
      id: `text-${Date.now()}`,
      position,
      text: 'Double-click to edit',
      width: 150,
      height: 80,
      isEditing: false
    };
    
    setTextBoxes(prev => [...prev, newTextBox]);
    setSelectedTextBoxId(newTextBox.id);
    drawLines(); // Redraw to show the new text box
  };
  
  // Start editing a text box
  const startEditingTextBox = (id: string) => {
    setTextBoxes(prev => 
      prev.map(box => 
        box.id === id ? { ...box, isEditing: true } : { ...box, isEditing: false }
      )
    );
    setSelectedTextBoxId(id);
    
    // Create a textarea for editing
    const textBox = textBoxes.find(box => box.id === id);
    if (!textBox || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const textarea = document.createElement('textarea');
    textarea.id = 'text-editor';
    textarea.value = textBox.text;
    textarea.style.position = 'absolute';
    textarea.style.left = `${textBox.position.x}px`;
    textarea.style.top = `${textBox.position.y}px`;
    textarea.style.width = `${textBox.width}px`;
    textarea.style.height = `${textBox.height}px`;
    textarea.style.padding = '5px';
    textarea.style.border = '2px solid #3b82f6';
    textarea.style.zIndex = '1000';
    textarea.style.fontFamily = 'Arial';
    textarea.style.fontSize = '14px';
    textarea.style.resize = 'none';
    textarea.style.overflow = 'hidden';
    
    // Position the textarea relative to the canvas
    const canvasRect = canvas.getBoundingClientRect();
    const canvasContainer = canvas.parentElement;
    if (canvasContainer) {
      canvasContainer.style.position = 'relative';
      canvasContainer.appendChild(textarea);
      
      // Focus and select all text
      textarea.focus();
      textarea.select();
      
      // Handle saving the text when done editing
      const finishEditing = () => {
        const newText = textarea.value.trim() || 'Double-click to edit';
        setTextBoxes(prev => 
          prev.map(box => 
            box.id === id ? { ...box, text: newText, isEditing: false } : box
          )
        );
        if (canvasContainer.contains(textarea)) {
          canvasContainer.removeChild(textarea);
        }
        drawLines();
      };
      
      textarea.addEventListener('blur', finishEditing);
      textarea.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          finishEditing();
        }
      });
    }
  };

  const handleMouseDown = (e: MouseEvent) => {
    if (!canvasRef.current) return;
    
    const position = getScaledCoordinates(e);
    
    // Don't start drawing if we're out of bounds
    if (position.x === -1 || position.y === -1) return;
    
    // Check if we clicked on a text box first
    const clickedTextBox = findClickedTextBox(position);
    if (clickedTextBox) {
      const { textBoxId, isResize } = clickedTextBox;
      
      // Deselect any selected line
      setSelectedLineIndex(null);
      setSelectedTextBoxId(textBoxId);
      
      if (isResize) {
        // Start resizing the text box
        setTextBoxes(prev => prev.map(box => 
          box.id === textBoxId ? { ...box, isDragging: false } : box
        ));
      } else {
        // Check for double-click to edit
        const now = new Date().getTime();
        const lastClick = (window as any).lastClickTime || 0;
        (window as any).lastClickTime = now;
        
        if (now - lastClick < 300) { // Double click threshold
          // Start editing the text box
          startEditingTextBox(textBoxId);
          return;
        }
        
        // Start dragging the text box
        const textBox = textBoxes.find(box => box.id === textBoxId);
        if (textBox) {
          setDragOffset({
            x: position.x - textBox.position.x,
            y: position.y - textBox.position.y
          });
          setIsDraggingTextBox(true);
          setTextBoxes(prev => prev.map(box => 
            box.id === textBoxId ? { ...box, isDragging: true } : { ...box, isDragging: false }
          ));
        }
      }
      return;
    }
    
    // If not clicking on a text box, check if we're in text box mode
    if (isAddingTextBox) {
      // Create a new text box
      createTextBox(position);
      setIsAddingTextBox(false);
      return;
    }
    
    // Check if we're near an endpoint to extend a line
    const nearEndpoint = findLineEndPoint(position);
    
    // Check if we clicked on an existing line
    const clickedLineIndex = findClickedLine(position);
    
    // Deselect any selected text box
    setSelectedTextBoxId(null);
    
    if (nearEndpoint) {
      // We're extending a line from an endpoint
      const { lineIndex, isStart } = nearEndpoint;
      const line = lines[lineIndex];
      
      // Start drawing from the endpoint
      setIsDrawing(true);
      setExtendingLine(true);
      
      // Determine the segment ID
      let segmentId = line.segmentId;
      if (!segmentId) {
        // Create a new segment ID if this line doesn't have one
        segmentId = generateSegmentId();
        
        // Update the existing line with the segment ID
        const updatedLines = [...lines];
        updatedLines[lineIndex] = {
          ...line,
          segmentId,
          isEndSegment: isStart // If we're extending from the start, the original line becomes an end segment
        };
        setLines(updatedLines);
      }
      
      // Set the current segment ID
      setCurrentSegmentId(segmentId);
      
      // Start the new line from the endpoint
      setCurrentLine({
        start: isStart ? line.start : line.end,
        end: position,
        curvature: 0,
        segmentId,
        isEndSegment: true // New segment is initially an end segment
      });
      
      // Deselect any selected line
      setSelectedLineIndex(null);
    } else if (clickedLineIndex !== null) {
      // Select the line
      setSelectedLineIndex(clickedLineIndex);
      setIsDrawing(false);
      setExtendingLine(false);
      
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
      setExtendingLine(false);
      setCurrentSegmentId(null);
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
    if (!canvasRef.current) return;
    
    const position = getScaledCoordinates(e);
    
    // Use the last valid position if we're out of bounds
    if (position.x === -1 || position.y === -1) return;
    
    // Handle text box dragging
    if (isDraggingTextBox && selectedTextBoxId) {
      setTextBoxes(prev => prev.map(box => 
        box.id === selectedTextBoxId ? {
          ...box,
          position: {
            x: position.x - dragOffset.x,
            y: position.y - dragOffset.y
          }
        } : box
      ));
      drawLines();
      return;
    }
    
    // Handle line drawing
    if (isDrawing && currentLine) {
      setCurrentLine({
        ...currentLine,
        end: position
      });
    }
  };

  const handleMouseUp = () => {
    // Handle text box dragging
    if (isDraggingTextBox) {
      setIsDraggingTextBox(false);
      setTextBoxes(prev => prev.map(box => 
        box.id === selectedTextBoxId ? { ...box, isDragging: false } : box
      ));
      return;
    }
    
    // Handle line drawing
    if (isDrawing && currentLine) {
      // Check if we're near an endpoint to connect
      const nearEndpoint = findLineEndPoint(currentLine.end);
      
      // Prepare the new line
      let newLine = {
        ...currentLine,
        curvature: 0
      };
      
      // If extending a line and we're near another endpoint, connect to it
      if (extendingLine && nearEndpoint) {
        const { lineIndex, isStart } = nearEndpoint;
        const targetLine = lines[lineIndex];
        
        // Only connect if they're not already part of the same segment
        if (targetLine.segmentId !== currentLine.segmentId) {
          // Connect to the endpoint
          newLine.end = isStart ? targetLine.start : targetLine.end;
          
          // Update the target line to be part of this segment
          const updatedLines = [...lines];
          updatedLines[lineIndex] = {
            ...targetLine,
            segmentId: currentLine.segmentId,
            isEndSegment: true // The target line becomes an end segment
          };
          
          // The current line is no longer an end segment
          newLine.isEndSegment = false;
          
          setLines([...updatedLines, newLine]);
        } else {
          // Just add the new line
          setLines([...lines, newLine]);
        }
      } else {
        // Just add the new line
        setLines([...lines, newLine]);
      }
      
      setCurrentLine(null);
      
      // Select the newly added line
      setSelectedLineIndex(lines.length);
    }
    
    setIsDrawing(false);
    setExtendingLine(false);
    setCurrentSegmentId(null);
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
          {textBoxes.length > 0 && (
            <span className="ml-2">, {textBoxes.length} {textBoxes.length === 1 ? 'text box' : 'text boxes'}</span>
          )}
          {selectedTextBoxId && (
            <span className="ml-2 text-blue-600">(Text box selected)</span>
          )}
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => {
              setIsAddingTextBox(!isAddingTextBox);
              setSelectedLineIndex(null);
              setSelectedTextBoxId(null);
            }}
            className={`px-2 py-1 text-xs ${isAddingTextBox ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'} rounded transition-colors`}
          >
            {isAddingTextBox ? 'Cancel Text Box' : 'Add Text Box'}
          </button>
          
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
          
          {selectedTextBoxId && (
            <div className="flex items-center">
              <button
                onClick={() => {
                  // Edit the selected text box
                  startEditingTextBox(selectedTextBoxId);
                }}
                className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors mr-2"
              >
                Edit Text
              </button>
              <button
                onClick={() => {
                  // Delete the selected text box
                  setTextBoxes(prev => prev.filter(box => box.id !== selectedTextBoxId));
                  setSelectedTextBoxId(null);
                  drawLines();
                }}
                className="px-2 py-1 text-xs bg-red-100 hover:bg-red-200 text-red-700 rounded transition-colors mr-2"
              >
                Delete
              </button>
              <button
                onClick={() => {
                  // Clear selection
                  setSelectedTextBoxId(null);
                  drawLines();
                }}
                className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
              >
                Deselect
              </button>
            </div>
          )}
          
          {(lines.length > 0 || textBoxes.length > 0) && (
            <button
              onClick={() => {
                setSelectedLineIndex(null);
                setSelectedTextBoxId(null);
                setLines([]);
                setTextBoxes([]);
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
            textBoxes={textBoxes}
            imageWidth={dimensions.width || 800} 
            imageHeight={dimensions.height || 600} 
          />
        </div>
      )}
    </div>
  );
}
