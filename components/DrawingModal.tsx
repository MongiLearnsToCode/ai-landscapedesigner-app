
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { X, Undo, Trash2, Milestone, Car } from 'lucide-react';

interface DrawingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (overlayImageUrl: string) => void;
  backgroundImageUrl: string;
}

const DRIVEWAY_COLOR = 'rgba(82, 82, 91, 0.6)'; // zinc-600
const PATHWAY_COLOR = 'rgba(120, 113, 108, 0.6)'; // stone-500

type Path = {
  points: { x: number; y: number }[];
  color: string;
  size: number;
};

interface CursorProps {
  x: number;
  y: number;
  size: number;
}

export const DrawingModal: React.FC<DrawingModalProps> = ({ isOpen, onClose, onSave, backgroundImageUrl }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushSize, setBrushSize] = useState(40);
  const [brushColor, setBrushColor] = useState(DRIVEWAY_COLOR);
  const [paths, setPaths] = useState<Path[]>([]);
  const [canvasSize, setCanvasSize] = useState({ width: 16, height: 9 });
  const [cursorProps, setCursorProps] = useState<CursorProps | null>(null);

  useFocusTrap(modalRef);

  const drawAllPaths = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    paths.forEach(path => {
      if (path.points.length < 1) {
        return;
      }
  
      ctx.strokeStyle = path.color;
      ctx.lineWidth = path.size;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
  
      if (path.points.length === 1) {
        // Draw a dot for a single point
        ctx.fillStyle = path.color;
        ctx.arc(path.points[0].x, path.points[0].y, path.size / 2, 0, Math.PI * 2);
        ctx.fill();
        return;
      }
  
      ctx.moveTo(path.points[0].x, path.points[0].y);
  
      for (let i = 1; i < path.points.length - 2; i++) {
        const xc = (path.points[i].x + path.points[i + 1].x) / 2;
        const yc = (path.points[i].y + path.points[i + 1].y) / 2;
        ctx.quadraticCurveTo(path.points[i].x, path.points[i].y, xc, yc);
      }
  
      if (path.points.length > 2) {
        ctx.quadraticCurveTo(
          path.points[path.points.length - 2].x,
          path.points[path.points.length - 2].y,
          path.points[path.points.length - 1].x,
          path.points[path.points.length - 1].y
        );
      } else {
        ctx.lineTo(path.points[1].x, path.points[1].y);
      }
  
      ctx.stroke();
    });
  }, [paths]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !backgroundImageUrl) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      setCanvasSize({ width: img.naturalWidth, height: img.naturalHeight });
      setPaths([]);
    };
    img.src = backgroundImageUrl;
  }, [backgroundImageUrl, isOpen]);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if(!canvas) return;
    const ctx = canvas.getContext('2d');
    if(!ctx) return;
    drawAllPaths(ctx);
  }, [paths, drawAllPaths]);

  const getCanvasCoords = (e: React.MouseEvent | React.TouchEvent, target: HTMLElement) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = target.getBoundingClientRect();
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsDrawing(true);
    const { x, y } = getCanvasCoords(e, e.currentTarget as HTMLElement);
    const newPath: Path = { points: [{ x, y }], color: brushColor, size: brushSize };
    setPaths(prev => [...prev, newPath]);
  };

  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const { x, y } = getCanvasCoords(e, e.currentTarget as HTMLElement);
    setPaths(prev => {
        const newPaths = [...prev];
        if (newPaths.length > 0) {
            newPaths[newPaths.length - 1].points.push({x, y});
        }
        return newPaths;
    });
  }, [isDrawing]);

  const stopDrawing = () => {
    setIsDrawing(false);
  };
  
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const canvasRect = canvas.getBoundingClientRect();

    const scale = canvasRect.width / canvas.width;
    const size = brushSize * scale;

    setCursorProps({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        size: size,
    });
    
    if (isDrawing) {
        draw(e);
    }
  };

  const handleUndo = () => {
    setPaths(prev => prev.slice(0, -1));
  };
  
  const handleClear = () => {
    setPaths([]);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (canvas && paths.length > 0) {
      onSave(canvas.toDataURL('image/png'));
    }
    onClose();
  };
  
  if (!isOpen) return null;

  const ToolButton = ({ label, icon, color }: { label: string, icon: React.ReactNode, color: string }) => (
    <button
        onClick={() => setBrushColor(color)}
        className={`w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
            brushColor === color ? `bg-slate-800 text-white border-transparent` : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
        }`}
    >
        {icon} {label}
    </button>
  );

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex justify-center items-center p-4" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="drawing-modal-title">
      <div ref={modalRef} className="relative bg-white rounded-2xl shadow-xl w-full max-w-7xl max-h-[calc(100vh-4rem)] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <header className="flex-shrink-0 flex justify-between items-center p-4 border-b border-slate-200/80">
          <h2 id="drawing-modal-title" className="text-xl font-bold text-slate-800">Plan Layout</h2>
          <button onClick={onClose} className="text-slate-500 rounded-full h-8 w-8 flex items-center justify-center hover:bg-slate-100/80" aria-label="Close drawing tool">
            <X className="w-5 h-5" />
          </button>
        </header>

        <div className="flex-grow flex flex-col md:flex-row overflow-y-auto min-h-0">
          <div className="w-full md:w-72 md:flex-shrink-0 p-4 border-b md:border-b-0 md:border-r border-slate-200/80 space-y-6">
            <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-2">Tool</h3>
                <div className="grid grid-cols-2 gap-2">
                    <ToolButton label="Driveway" icon={<Car size={16}/>} color={DRIVEWAY_COLOR} />
                    <ToolButton label="Pathway" icon={<Milestone size={16}/>} color={PATHWAY_COLOR} />
                </div>
                <div className="mt-2 text-xs text-slate-500 text-center">Click to select a tool to draw with.</div>
            </div>
            <div>
                <label htmlFor="brushSize" className="block text-sm font-semibold text-slate-700 mb-2">Brush Size</label>
                <div className="flex items-center gap-3">
                    <input id="brushSize" type="range" min="10" max="120" value={brushSize} onChange={e => setBrushSize(Number(e.target.value))} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-800"/>
                    <span className="text-sm w-8 text-center">{brushSize}</span>
                </div>
            </div>
            <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-2">Actions</h3>
                <div className="grid grid-cols-2 gap-2">
                    <button onClick={handleUndo} disabled={paths.length === 0} className="flex items-center justify-center gap-2 w-full bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 px-3 py-2 text-sm font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed">
                        <Undo size={16}/> Undo
                    </button>
                    <button onClick={handleClear} disabled={paths.length === 0} className="flex items-center justify-center gap-2 w-full bg-white text-red-600 border border-red-300 hover:bg-red-50 px-3 py-2 text-sm font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed">
                        <Trash2 size={16}/> Clear
                    </button>
                </div>
            </div>
          </div>
          <div className="flex-grow bg-slate-100 flex items-center justify-center p-4 relative min-h-0 min-w-0">
            <div
              className="relative max-w-full max-h-full touch-none"
              style={{ aspectRatio: `${canvasSize.width} / ${canvasSize.height}` }}
              onMouseDown={startDrawing}
              onMouseMove={handleMouseMove}
              onMouseUp={stopDrawing}
              onMouseLeave={() => { stopDrawing(); setCursorProps(null); }}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
            >
                <img src={backgroundImageUrl} alt="Background for drawing" className="block w-full h-full pointer-events-none select-none rounded-md" />
                <canvas
                    ref={canvasRef}
                    className="absolute inset-0 w-full h-full"
                />
                 {cursorProps && (
                  <div
                    className="absolute pointer-events-none rounded-full bg-black/30 border-2 border-white/80"
                    style={{
                      left: `${cursorProps.x}px`,
                      top: `${cursorProps.y}px`,
                      width: `${cursorProps.size}px`,
                      height: `${cursorProps.size}px`,
                      transform: 'translate(-50%, -50%)',
                    }}
                  />
                )}
            </div>
          </div>
        </div>
        <footer className="flex-shrink-0 flex justify-end items-center p-4 border-t border-slate-200/80 space-x-3">
          <button onClick={onClose} className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold py-2 px-4 rounded-lg">Cancel</button>
          <button onClick={handleSave} className="bg-slate-800 hover:bg-slate-900 text-white font-semibold py-2 px-4 rounded-lg">
            {paths.length > 0 ? 'Save Layout' : 'Close'}
          </button>
        </footer>
      </div>
       <style>{`
        .touch-none {
          touch-action: none;
        }
        .touch-none:hover {
          cursor: none;
        }
      `}</style>
    </div>
  );
};
