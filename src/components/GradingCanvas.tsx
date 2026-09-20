import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Annotation, AnnotationPoint, FeedbackStamp } from '../types';
import { DEFAULT_FEEDBACK_STAMPS } from '../data/defaultStamps';
import {
  PenTool,
  Highlighter,
  Circle,
  Underline,
  Activity,
  Tag,
  Eraser,
  RotateCcw,
  Trash2,
  Edit3,
  Plus,
  X,
} from 'lucide-react';

interface GradingCanvasProps {
  documentImageUrl: string;
  annotations: Annotation[];
  onAnnotationsChange: (annotations: Annotation[]) => void;
  pageIndex?: number;
}

type ToolType = 'pen' | 'highlighter' | 'circle' | 'underline' | 'squiggly' | 'stamp' | 'eraser';

export const GradingCanvas: React.FC<GradingCanvasProps> = ({
  documentImageUrl,
  annotations,
  onAnnotationsChange,
  pageIndex = 0,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activeTool, setActiveTool] = useState<ToolType>('pen');
  const [activeColor, setActiveColor] = useState<string>('#dc2626'); // Red default for grading
  const [strokeWidth, setStrokeWidth] = useState<number>(3);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [currentPath, setCurrentPath] = useState<AnnotationPoint[]>([]);

  // iPad & Apple Pencil specific states
  const [palmRejection, setPalmRejection] = useState<boolean>(true);
  const [livePressure, setLivePressure] = useState<number>(0);
  const [stylusDetected, setStylusDetected] = useState<boolean>(false);

  // Stamps State
  const [stamps, setStamps] = useState<FeedbackStamp[]>(DEFAULT_FEEDBACK_STAMPS);
  const [activeStamp, setActiveStamp] = useState<FeedbackStamp>(DEFAULT_FEEDBACK_STAMPS[0]);
  const [isCreatingCustomStamp, setIsCreatingCustomStamp] = useState<boolean>(false);
  const [customCode, setCustomCode] = useState<string>('');
  const [customLabel, setCustomLabel] = useState<string>('');
  const [customColor, setCustomColor] = useState<string>('#4f46e5');

  // Color options
  const COLORS = [
    { label: 'Red (Standard)', value: '#dc2626' },
    { label: 'Blue', value: '#2563eb' },
    { label: 'Green', value: '#16a34a' },
    { label: 'Yellow (Highlighter)', value: '#facc15' },
    { label: 'Purple', value: '#9333ea' },
    { label: 'Black', value: '#0f172a' },
  ];

  // Helper to draw a squiggly line between two x coordinates
  const drawSquigglyLine = (
    ctx: CanvasRenderingContext2D,
    startX: number,
    startY: number,
    endX: number
  ) => {
    const minX = Math.min(startX, endX);
    const maxX = Math.max(startX, endX);
    const waveLength = 6;
    const waveHeight = 3.5;

    ctx.beginPath();
    ctx.moveTo(minX, startY);
    for (let x = minX; x <= maxX; x += waveLength) {
      ctx.quadraticCurveTo(
        x + waveLength / 4,
        startY - waveHeight,
        x + waveLength / 2,
        startY
      );
      ctx.quadraticCurveTo(
        x + (3 * waveLength) / 4,
        startY + waveHeight,
        x + waveLength,
        startY
      );
    }
    ctx.stroke();
  };

  // Helper to draw a teacher feedback stamp badge
  const drawStampBadge = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    code: string,
    color: string
  ) => {
    ctx.save();
    ctx.font = 'bold 12px sans-serif';
    const textWidth = ctx.measureText(code).width;
    const badgeWidth = Math.max(textWidth + 18, 48);
    const badgeHeight = 24;
    const radius = 6;

    // Draw background rounded pill
    const rx = x - 4;
    const ry = y - badgeHeight / 2;

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(rx, ry, badgeWidth, badgeHeight, radius);
    ctx.fill();

    // Subtle drop border
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Text label inside stamp
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(code, rx + badgeWidth / 2, y + 1);

    ctx.restore();
  };

  // Draw canvas contents
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw existing annotations
    const pageAnnotations = annotations.filter((a) => a.page === pageIndex);

    pageAnnotations.forEach((ann) => {
      if (ann.type === 'stamp' && ann.stampData && ann.points.length > 0) {
        drawStampBadge(
          ctx,
          ann.points[0].x,
          ann.points[0].y,
          ann.stampData.code,
          ann.stampData.color || ann.color
        );
        return;
      }

      if (ann.points.length < 2) return;

      ctx.beginPath();
      ctx.strokeStyle = ann.color;
      ctx.lineWidth = ann.strokeWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (ann.type === 'highlighter') {
        ctx.globalAlpha = 0.4;
        ctx.lineWidth = ann.strokeWidth * 3;
      } else {
        ctx.globalAlpha = 1.0;
      }

      if (ann.type === 'circle') {
        const xs = ann.points.map((p) => p.x);
        const ys = ann.points.map((p) => p.y);
        const minX = Math.min(...xs);
        const maxX = Math.max(...xs);
        const minY = Math.min(...ys);
        const maxY = Math.max(...ys);
        const cx = (minX + maxX) / 2;
        const cy = (minY + maxY) / 2;
        const rx = Math.max(15, (maxX - minX) / 2);
        const ry = Math.max(15, (maxY - minY) / 2);

        ctx.ellipse(cx, cy, rx, ry, 0, 0, 2 * Math.PI);
        ctx.stroke();
      } else if (ann.type === 'underline') {
        const start = ann.points[0];
        const end = ann.points[ann.points.length - 1];
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, start.y);
        ctx.stroke();
      } else if (ann.type === 'squiggly') {
        const start = ann.points[0];
        const end = ann.points[ann.points.length - 1];
        drawSquigglyLine(ctx, start.x, start.y, end.x);
      } else {
        // Standard freehand pen or highlighter with smooth curves
        ctx.moveTo(ann.points[0].x, ann.points[0].y);
        for (let i = 1; i < ann.points.length - 1; i++) {
          const xc = (ann.points[i].x + ann.points[i + 1].x) / 2;
          const yc = (ann.points[i].y + ann.points[i + 1].y) / 2;
          ctx.quadraticCurveTo(ann.points[i].x, ann.points[i].y, xc, yc);
        }
        if (ann.points.length > 1) {
          ctx.lineTo(ann.points[ann.points.length - 1].x, ann.points[ann.points.length - 1].y);
        }
        ctx.stroke();
      }

      ctx.globalAlpha = 1.0;
    });

    // Draw active drawing path in progress
    if (currentPath.length > 1) {
      ctx.beginPath();
      ctx.strokeStyle = activeColor;
      ctx.lineWidth = activeTool === 'highlighter' ? strokeWidth * 3 : strokeWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (activeTool === 'highlighter') {
        ctx.globalAlpha = 0.4;
      }

      if (activeTool === 'circle') {
        const xs = currentPath.map((p) => p.x);
        const ys = currentPath.map((p) => p.y);
        const minX = Math.min(...xs);
        const maxX = Math.max(...xs);
        const minY = Math.min(...ys);
        const maxY = Math.max(...ys);
        const cx = (minX + maxX) / 2;
        const cy = (minY + maxY) / 2;
        const rx = Math.max(10, (maxX - minX) / 2);
        const ry = Math.max(10, (maxY - minY) / 2);

        ctx.ellipse(cx, cy, rx, ry, 0, 0, 2 * Math.PI);
        ctx.stroke();
      } else if (activeTool === 'underline') {
        const start = currentPath[0];
        const end = currentPath[currentPath.length - 1];
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, start.y);
        ctx.stroke();
      } else if (activeTool === 'squiggly') {
        const start = currentPath[0];
        const end = currentPath[currentPath.length - 1];
        drawSquigglyLine(ctx, start.x, start.y, end.x);
      } else {
        // Freehand path with smooth interpolation
        ctx.moveTo(currentPath[0].x, currentPath[0].y);
        for (let i = 1; i < currentPath.length - 1; i++) {
          const xc = (currentPath[i].x + currentPath[i + 1].x) / 2;
          const yc = (currentPath[i].y + currentPath[i + 1].y) / 2;
          ctx.quadraticCurveTo(currentPath[i].x, currentPath[i].y, xc, yc);
        }
        ctx.lineTo(
          currentPath[currentPath.length - 1].x,
          currentPath[currentPath.length - 1].y
        );
        ctx.stroke();
      }

      ctx.globalAlpha = 1.0;
    }
  }, [annotations, pageIndex, currentPath, activeColor, activeTool, strokeWidth]);

  // Adjust canvas pixel dimensions to match display container
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      redrawCanvas();
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [redrawCanvas]);

  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  // Touch / Pointer Event Handlers for Apple Pencil & Stylus
  const getCanvasCoords = (e: React.PointerEvent<HTMLCanvasElement>): AnnotationPoint => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      pressure: e.pressure || 0.5,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    // Detect if drawing with an Apple Pencil / Stylus
    if (e.pointerType === 'pen') {
      setStylusDetected(true);
    }

    // Palm Rejection: If enabled, discard touch input (fingers/palm) so only Apple Pencil can draw
    if (palmRejection && e.pointerType === 'touch') {
      return;
    }

    e.currentTarget.setPointerCapture(e.pointerId);
    const point = getCanvasCoords(e);
    if (e.pressure > 0) {
      setLivePressure(e.pressure);
    }

    // If Stamp Tool is active, drop the selected stamp at click position
    if (activeTool === 'stamp' && activeStamp) {
      const newStampAnn: Annotation = {
        id: `stamp-${Date.now()}`,
        type: 'stamp',
        points: [point],
        color: activeStamp.color,
        strokeWidth: 2,
        stampData: {
          code: activeStamp.code,
          label: activeStamp.label,
          color: activeStamp.color,
        },
        page: pageIndex,
        timestamp: new Date().toISOString(),
      };
      onAnnotationsChange([...annotations, newStampAnn]);
      return;
    }

    if (activeTool === 'eraser') {
      // Find and remove any annotation close to clicked point
      const threshold = 25;
      const filtered = annotations.filter((ann) => {
        if (ann.page !== pageIndex) return true;
        const closePoint = ann.points.some(
          (p) => Math.hypot(p.x - point.x, p.y - point.y) < threshold
        );
        return !closePoint;
      });
      onAnnotationsChange(filtered);
      return;
    }

    setIsDrawing(true);
    setCurrentPath([point]);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    // Palm Rejection guard
    if (palmRejection && e.pointerType === 'touch') return;

    if (e.pointerType === 'pen') {
      setStylusDetected(true);
    }
    if (e.pressure > 0) {
      setLivePressure(e.pressure);
    }

    if (!isDrawing) return;
    const point = getCanvasCoords(e);
    setCurrentPath((prev) => [...prev, point]);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    setLivePressure(0);
    if (!isDrawing) return;
    setIsDrawing(false);

    if (currentPath.length > 1) {
      const newAnnotation: Annotation = {
        id: `ann-${Date.now()}`,
        type: activeTool,
        points: currentPath,
        color: activeColor,
        strokeWidth: strokeWidth,
        page: pageIndex,
        timestamp: new Date().toISOString(),
      };

      onAnnotationsChange([...annotations, newAnnotation]);
    }

    setCurrentPath([]);
  };

  const handleUndo = () => {
    if (annotations.length === 0) return;
    onAnnotationsChange(annotations.slice(0, -1));
  };

  const handleClearAll = () => {
    onAnnotationsChange(annotations.filter((a) => a.page !== pageIndex));
  };

  // Add custom stamp created by teacher
  const handleSaveCustomStamp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customCode.trim() || !customLabel.trim()) return;

    const newStamp: FeedbackStamp = {
      id: `custom-stamp-${Date.now()}`,
      code: customCode.trim(),
      label: customLabel.trim(),
      category: 'style',
      color: customColor,
      description: 'Custom teacher feedback stamp',
      isCustom: true,
    };

    setStamps((prev) => [...prev, newStamp]);
    setActiveStamp(newStamp);
    setActiveTool('stamp');
    setIsCreatingCustomStamp(false);
    setCustomCode('');
    setCustomLabel('');
  };

  return (
    <div className="flex flex-col gap-3 w-full h-full">
      
      {/* Top Teacher Toolbar */}
      <div className="flex flex-col gap-2 p-3 rounded-2xl bg-slate-900 text-white shadow-lg border border-slate-800">
        
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Main Drawing Tools */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => setActiveTool('pen')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTool === 'pen'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
              title="Apple Pencil Freehand Pen"
            >
              <PenTool className="w-3.5 h-3.5" />
              <span>Pen</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTool('highlighter');
                setActiveColor('#facc15');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTool === 'highlighter'
                  ? 'bg-yellow-500 text-slate-900 shadow-md'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
              title="Fluorescent Highlighter"
            >
              <Highlighter className="w-3.5 h-3.5" />
              <span>Highlight</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTool('circle')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTool === 'circle'
                  ? 'bg-red-600 text-white shadow-md'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
              title="Circle Key Phrase or Error"
            >
              <Circle className="w-3.5 h-3.5" />
              <span>Circle</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTool('underline')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTool === 'underline'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
              title="Straight Underline"
            >
              <Underline className="w-3.5 h-3.5" />
              <span>Underline</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTool('squiggly')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTool === 'squiggly'
                  ? 'bg-orange-600 text-white shadow-md'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
              title="Squiggly Underline (Awkward phrasing / Grammar)"
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Squiggly</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTool('stamp')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTool === 'stamp'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-purple-300 bg-purple-950/60 hover:bg-purple-900/80 border border-purple-800'
              }`}
              title="Place Quick Feedback Stamp"
            >
              <Tag className="w-3.5 h-3.5" />
              <span>Stamp Tool</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTool('eraser')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTool === 'eraser'
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
              title="Eraser (click any mark to remove)"
            >
              <Eraser className="w-3.5 h-3.5" />
              <span>Erase</span>
            </button>
          </div>

          {/* Controls: Colors, Thickness, Undo */}
          <div className="flex items-center gap-3">
            {/* Color Swatches */}
            <div className="flex items-center gap-1.5 border-l border-slate-700 pl-2">
              {COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setActiveColor(c.value)}
                  style={{ backgroundColor: c.value }}
                  className={`w-5 h-5 rounded-full transition-transform ${
                    activeColor === c.value
                      ? 'scale-125 ring-2 ring-white ring-offset-1 ring-offset-slate-900'
                      : 'hover:scale-110 opacity-80'
                  }`}
                  title={c.label}
                />
              ))}
            </div>

            {/* Stroke Width Slider */}
            <div className="flex items-center gap-2 border-l border-slate-700 pl-2">
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Width</span>
              <input
                type="range"
                min="1"
                max="8"
                value={strokeWidth}
                onChange={(e) => setStrokeWidth(Number(e.target.value))}
                className="w-16 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                title="Pen Stroke Thickness"
              />
            </div>

            {/* Undo & Clear */}
            <div className="flex items-center gap-1 border-l border-slate-700 pl-2">
              <button
                type="button"
                onClick={handleUndo}
                disabled={annotations.length === 0}
                className="p-1.5 rounded-lg text-slate-300 hover:bg-slate-800 disabled:opacity-30 transition-colors"
                title="Undo Last Mark"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleClearAll}
                className="p-1.5 rounded-lg text-rose-400 hover:bg-slate-800 transition-colors"
                title="Clear All Markings On Page"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* iPad Palm Rejection Toggle */}
            <div className="flex items-center gap-1 border-l border-slate-700 pl-2">
              <button
                type="button"
                onClick={() => setPalmRejection(!palmRejection)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  palmRejection
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
                title={
                  palmRejection
                    ? 'Palm Rejection ON: Finger/palm touches ignored so you can rest hand comfortably on iPad screen'
                    : 'Palm Rejection OFF: Both fingers and stylus can draw'
                }
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Palm Rejection</span>
                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${palmRejection ? 'bg-emerald-800 text-emerald-100' : 'bg-slate-700 text-slate-300'}`}>
                  {palmRejection ? 'ON' : 'OFF'}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* FEEDBACK STAMPS KEY TRAY (Always accessible for quick grading) */}
        <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 shrink-0">
              <Tag className="w-3.5 h-3.5 text-purple-400" />
              Stamp Key:
            </span>

            {stamps.map((stamp) => {
              const isSelected = activeTool === 'stamp' && activeStamp.id === stamp.id;
              return (
                <button
                  key={stamp.id}
                  type="button"
                  onClick={() => {
                    setActiveStamp(stamp);
                    setActiveTool('stamp');
                  }}
                  style={{
                    backgroundColor: isSelected ? stamp.color : 'transparent',
                    borderColor: stamp.color,
                    color: isSelected ? '#ffffff' : stamp.color,
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-black border transition-all shrink-0 flex items-center gap-1 ${
                    isSelected ? 'shadow-md scale-105' : 'hover:bg-slate-800'
                  }`}
                  title={`${stamp.label}: ${stamp.description}`}
                >
                  <span>{stamp.code}</span>
                  <span className="text-[10px] font-normal opacity-90 hidden md:inline">
                    ({stamp.label})
                  </span>
                </button>
              );
            })}

            {/* Custom Stamp Creator Trigger */}
            <button
              type="button"
              onClick={() => setIsCreatingCustomStamp(true)}
              className="px-2.5 py-1 rounded-lg text-xs font-bold border border-dashed border-slate-600 text-slate-400 hover:text-white hover:border-slate-400 transition-colors flex items-center gap-1 shrink-0"
              title="Add Custom Teacher Feedback Stamp"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Key Stamp</span>
            </button>
          </div>

          {activeTool === 'stamp' && (
            <span className="text-[11px] text-purple-300 font-medium animate-pulse shrink-0">
              👉 Click anywhere on document to place "{activeStamp.code}" stamp
            </span>
          )}
        </div>

      </div>

      {/* Modal: Create Custom Feedback Stamp */}
      {isCreatingCustomStamp && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Tag className="w-4 h-4 text-purple-600" />
                Create Custom Feedback Stamp Key
              </h3>
              <button
                type="button"
                onClick={() => setIsCreatingCustomStamp(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomStamp} className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Stamp Code (Short Abbreviation)
                </label>
                <input
                  type="text"
                  value={customCode}
                  onChange={(e) => setCustomCode(e.target.value.toUpperCase())}
                  placeholder="e.g. STAKEHOLDER, CIT?, LOGIC!"
                  maxLength={14}
                  required
                  className="mt-1 w-full px-3 py-2 rounded-xl text-sm font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Full Meaning / Key Description
                </label>
                <input
                  type="text"
                  value={customLabel}
                  onChange={(e) => setCustomLabel(e.target.value)}
                  placeholder="e.g. Stakeholder perspective missing from analysis"
                  required
                  className="mt-1 w-full px-3 py-2 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Stamp Badge Color
                </label>
                <div className="flex items-center gap-2 mt-1.5">
                  {['#dc2626', '#ea580c', '#16a34a', '#2563eb', '#9333ea', '#0d9488'].map((col) => (
                    <button
                      key={col}
                      type="button"
                      onClick={() => setCustomColor(col)}
                      style={{ backgroundColor: col }}
                      className={`w-7 h-7 rounded-full transition-transform ${
                        customColor === col ? 'scale-125 ring-2 ring-slate-900 dark:ring-white' : 'opacity-80'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 mt-2">
                <button
                  type="button"
                  onClick={() => setIsCreatingCustomStamp(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white shadow-md"
                >
                  Save to Stamp Key
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Interactive Drawing Container with Document Background */}
      <div
        ref={containerRef}
        className="relative w-full h-[620px] rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-inner select-none"
      >
        {/* Background Document Image / Notebook Page */}
        {documentImageUrl ? (
          <img
            src={documentImageUrl}
            alt="Student Submission Document"
            className="absolute inset-0 w-full h-full object-contain pointer-events-none"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-slate-400 font-medium">
            No document page loaded
          </div>
        )}

        {/* Apple Pencil & Stylus Touch Layer */}
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="absolute inset-0 w-full h-full cursor-crosshair touch-none"
        />

        {/* Floating Apple Pencil Connected Badge */}
        <div className="absolute bottom-3 right-3 px-3 py-2 rounded-xl bg-slate-900/90 backdrop-blur-md text-white text-xs font-semibold flex items-center gap-2.5 border border-slate-700/80 shadow-xl pointer-events-none">
          <div className="flex items-center gap-1.5">
            <Edit3 className={`w-3.5 h-3.5 ${stylusDetected ? 'text-emerald-400' : 'text-slate-300'}`} />
            <span>Apple Pencil Mode</span>
          </div>

          <div className="flex items-center gap-2 border-l border-slate-700 pl-2">
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${palmRejection ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-slate-800 text-slate-400'}`}>
              Palm Rejection: {palmRejection ? 'ACTIVE' : 'OFF'}
            </span>

            {livePressure > 0 ? (
              <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                Pressure: {Math.round(livePressure * 100)}%
              </span>
            ) : (
              <span className="text-[10px] text-slate-400">
                Pressure & Tilt Ready
              </span>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};
