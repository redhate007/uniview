import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { ExpansionSettings } from '../types';

interface CanvasEditorProps {
  imageSrc: string;
  settings: ExpansionSettings;
  className?: string;
}

export interface CanvasEditorHandle {
  getCanvasDataUrl: () => string;
}

const CanvasEditor = forwardRef<CanvasEditorHandle, CanvasEditorProps>(({ imageSrc, settings, className }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imageObj, setImageObj] = useState<HTMLImageElement | null>(null);

  // Load image object once
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageSrc;
    img.onload = () => {
      setImageObj(img);
    };
  }, [imageSrc]);

  // Redraw when settings or image changes
  useEffect(() => {
    if (!imageObj || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Calculate new dimensions
    // We treat settings.top/bottom/left/right as percentages of the original image dimension for responsiveness
    // OR roughly 1 unit = 1 pixel if we want pixel perfect. 
    // Let's treat the inputs as percentages for better UX (0-100%).
    
    const w = imageObj.width;
    const h = imageObj.height;

    const padLeft = Math.floor(w * (settings.left / 100));
    const padRight = Math.floor(w * (settings.right / 100));
    const padTop = Math.floor(h * (settings.top / 100));
    const padBottom = Math.floor(h * (settings.bottom / 100));

    const newWidth = w + padLeft + padRight;
    const newHeight = h + padTop + padBottom;

    // Set canvas resolution
    canvas.width = newWidth;
    canvas.height = newHeight;

    // Fill with white (as per Gemini prompting strategy for "fill the white space")
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, newWidth, newHeight);

    // Draw the original image in the correct position
    ctx.drawImage(imageObj, padLeft, padTop);

    // Optional: Draw a subtle guide line for the user interface (only if we wanted to show it, but for export we strictly want clean pixels)
    // We will handle the "guide" visualization via CSS overlay in the parent component if needed, 
    // but here we keep the canvas pure for export.

  }, [imageObj, settings]);

  useImperativeHandle(ref, () => ({
    getCanvasDataUrl: () => {
      if (canvasRef.current) {
        return canvasRef.current.toDataURL('image/png');
      }
      return '';
    }
  }));

  return (
    <div className={`relative overflow-hidden shadow-2xl rounded-lg border border-slate-700 bg-slate-800 ${className}`}>
      <div className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded backdrop-blur-sm pointer-events-none">
        Preview
      </div>
      <canvas 
        ref={canvasRef} 
        className="max-w-full h-auto max-h-[60vh] mx-auto object-contain"
      />
    </div>
  );
});

CanvasEditor.displayName = 'CanvasEditor';

export default CanvasEditor;
