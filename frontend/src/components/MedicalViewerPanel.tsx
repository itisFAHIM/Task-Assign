"use client";

import { useEffect, useState, useRef, useCallback } from 'react';
import { Stage, Layer, Image as KonvaImage, Line, Circle } from 'react-konva';
import { ImageType, PolygonType } from '@/types';
import api from '@/lib/axios';
import {
  ChevronLeft, ChevronRight, Pencil, ZoomIn, ZoomOut,
  Hand, RotateCcw, Undo2, Redo2, Sun, Upload, Loader2, ImageIcon, Trash2
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
type Tool = 'draw' | 'pan' | 'zoom-in' | 'zoom-out';

const CLASS_OPTIONS = [
  { label: 'Tumor',      color: '#ef4444', fill: 'rgba(239,68,68,0.25)' },
  { label: 'Lesion',     color: '#f59e0b', fill: 'rgba(245,158,11,0.25)' },
  { label: 'Organ',      color: '#22c55e', fill: 'rgba(34,197,94,0.25)' },
  { label: 'Background', color: '#6366f1', fill: 'rgba(99,102,241,0.25)' },
];

// ─── Hook: load image for Konva ───────────────────────────────────────────────
const useKonvaImage = (url: string) => {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  useEffect(() => {
    if (!url) return;
    const img = new window.Image();
    img.src = url;
    img.crossOrigin = 'Anonymous';
    img.onload = () => setImage(img);
  }, [url]);
  return image;
};

// ─── ToolButton helper ────────────────────────────────────────────────────────
function ToolBtn({
  icon, label, active, onClick, disabled,
}: {
  icon: React.ReactNode; label: string; active?: boolean;
  onClick: () => void; disabled?: boolean;
}) {
  return (
    <button
      title={label}
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center justify-center w-9 h-9 rounded-lg transition-all text-sm
        ${active
          ? 'bg-blue-600 text-white shadow-[0_0_10px_rgba(59,130,246,0.5)]'
          : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'}
        ${disabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      {icon}
    </button>
  );
}

// ─── Single image canvas ──────────────────────────────────────────────────────
function ImageCanvas({
  image,
  polygons,
  onPolygonsChange,
  activeTool,
  activeClass,
  showAnnotations,
  brightness,
}: {
  image: ImageType;
  polygons: PolygonType[];
  onPolygonsChange: (p: PolygonType[], action: 'add' | 'remove') => void;
  activeTool: Tool;
  activeClass: typeof CLASS_OPTIONS[0];
  showAnnotations: boolean;
  brightness: number;
}) {
  const konvaImage = useKonvaImage(image.file);
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<any>(null);

  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [drawPoints, setDrawPoints] = useState<{ x: number; y: number }[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [saving, setSaving] = useState(false);

  // ── resize observer ──
  useEffect(() => {
    const obs = new ResizeObserver(entries => {
      if (!entries[0]) return;
      const { width, height } = entries[0].contentRect;
      setStageSize({ width, height });
      if (konvaImage) {
        const s = Math.min(width / konvaImage.width, height / konvaImage.height, 1);
        setScale(s);
        setOffset({
          x: (width - konvaImage.width * s) / 2,
          y: (height - konvaImage.height * s) / 2,
        });
      }
    });
    if (containerRef.current) obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, [konvaImage]);

  // ── mouse wheel zoom ──
  const handleWheel = (e: any) => {
    e.evt.preventDefault();
    const delta = e.evt.deltaY < 0 ? 1.1 : 0.9;
    setScale(s => Math.min(Math.max(s * delta, 0.1), 10));
  };

  // ── cursor style ──
  const cursorStyle =
    activeTool === 'draw' ? 'crosshair' :
    activeTool === 'pan' ? (isPanning ? 'grabbing' : 'grab') :
    activeTool === 'zoom-in' ? 'zoom-in' : 'zoom-out';

  // ── canvas click ──
  const handleStageClick = (e: any) => {
    if (activeTool === 'zoom-in') {
      setScale(s => Math.min(s * 1.2, 10));
      return;
    }
    if (activeTool === 'zoom-out') {
      setScale(s => Math.max(s * 0.8, 0.1));
      return;
    }
    if (activeTool !== 'draw') return;

    const stage = e.target.getStage();
    const pos = stage.getPointerPosition();
    if (!pos) return;
    const pt = { x: (pos.x - offset.x) / scale, y: (pos.y - offset.y) / scale };

    if (!isDrawing) {
      setIsDrawing(true);
      setDrawPoints([pt]);
    } else {
      // Close polygon if clicking near first point
      const first = drawPoints[0];
      const dist = Math.hypot(pt.x - first.x, pt.y - first.y);
      if (drawPoints.length >= 3 && dist < 10 / scale) {
        finishDrawing();
      } else {
        setDrawPoints(prev => [...prev, pt]);
      }
    }
  };

  const handleMouseMove = (e: any) => {
    if (activeTool === 'pan' && isPanning) {
      const pos = e.target.getStage().getPointerPosition();
      if (!pos) return;
      setOffset(prev => ({
        x: prev.x + (pos.x - panStart.x),
        y: prev.y + (pos.y - panStart.y),
      }));
      setPanStart(pos);
      return;
    }
    if (activeTool === 'draw' && isDrawing) {
      const stage = e.target.getStage();
      const pos = stage.getPointerPosition();
      if (pos) setMousePos({ x: (pos.x - offset.x) / scale, y: (pos.y - offset.y) / scale });
    }
  };

  const handleMouseDown = (e: any) => {
    if (activeTool === 'pan') {
      setIsPanning(true);
      const pos = e.target.getStage().getPointerPosition();
      if (pos) setPanStart(pos);
    }
  };

  const handleMouseUp = () => {
    if (activeTool === 'pan') setIsPanning(false);
  };

  const finishDrawing = async () => {
    if (drawPoints.length < 3) { cancelDrawing(); return; }
    setSaving(true);
    try {
      const res = await api.post('/annotations/polygons/', {
        image: image.id,
        points: drawPoints,
        label: activeClass.label,
      });
      onPolygonsChange([...polygons, res.data], 'add');
    } catch (err) {
      console.error('Save polygon failed', err);
    } finally {
      setSaving(false);
      setIsDrawing(false);
      setDrawPoints([]);
      setMousePos(null);
    }
  };

  const cancelDrawing = () => {
    setIsDrawing(false);
    setDrawPoints([]);
    setMousePos(null);
  };

  const removePolygon = async (polyId: number) => {
    try {
      await api.delete(`/annotations/polygons/${polyId}/`);
      onPolygonsChange(polygons.filter(p => p.id !== polyId), 'remove');
    } catch (err) {
      console.error('Delete polygon failed', err);
    }
  };

  // brightness filter style on wrapping div
  const brightnessStyle = { filter: `brightness(${brightness}%)` };

  const livePoints = mousePos && isDrawing ? [...drawPoints, mousePos] : drawPoints;
  const flatLive = livePoints.flatMap(p => [p.x * scale + offset.x, p.y * scale + offset.y]);

  return (
    <div ref={containerRef} className="w-full h-full relative overflow-hidden bg-black">
      {konvaImage && stageSize.width > 0 ? (
        <div style={brightnessStyle} className="w-full h-full">
          <Stage
            ref={stageRef}
            width={stageSize.width}
            height={stageSize.height}
            onClick={handleStageClick}
            onMouseMove={handleMouseMove}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onWheel={handleWheel}
            style={{ cursor: cursorStyle }}
          >
            <Layer>
              {/* Image */}
              <KonvaImage
                image={konvaImage}
                x={offset.x}
                y={offset.y}
                width={konvaImage.width * scale}
                height={konvaImage.height * scale}
              />

              {/* Saved polygons */}
              {showAnnotations && polygons.map(poly => {
                const cls = CLASS_OPTIONS.find(c => c.label === poly.label) ?? CLASS_OPTIONS[3];
                const flat = poly.points.flatMap(p => [p.x * scale + offset.x, p.y * scale + offset.y]);
                return (
                  <Line
                    key={poly.id}
                    points={flat}
                    fill={cls.fill}
                    stroke={cls.color}
                    strokeWidth={2}
                    closed
                    onClick={e => { e.cancelBubble = true; removePolygon(poly.id); }}
                    onMouseEnter={e => {
                      const sh = e.target as any;
                      sh.fill('rgba(239,68,68,0.4)'); sh.stroke('#ef4444');
                      e.target.getStage()!.container().style.cursor = 'pointer';
                    }}
                    onMouseLeave={e => {
                      const sh = e.target as any;
                      sh.fill(cls.fill); sh.stroke(cls.color);
                      e.target.getStage()!.container().style.cursor = cursorStyle;
                    }}
                  />
                );
              })}

              {/* Live drawing */}
              {isDrawing && livePoints.length > 0 && (
                <>
                  <Line points={flatLive} stroke={activeClass.color} strokeWidth={2} dash={[6, 4]} closed={false} />
                  {drawPoints.map((p, i) => (
                    <Circle
                      key={i}
                      x={p.x * scale + offset.x}
                      y={p.y * scale + offset.y}
                      radius={i === 0 ? 6 : 4}
                      fill={activeClass.color}
                      stroke="#fff"
                      strokeWidth={1}
                    />
                  ))}
                </>
              )}
            </Layer>
          </Stage>
        </div>
      ) : (
        <div className="flex items-center justify-center h-full text-zinc-500">
          <Loader2 className="animate-spin mr-2" size={20} /> Loading image…
        </div>
      )}

      {/* Drawing controls overlay */}
      {isDrawing && (
        <div className="absolute top-2 right-2 flex gap-2 z-20">
          <button
            onClick={finishDrawing}
            disabled={saving || drawPoints.length < 3}
            className="px-3 py-1 bg-green-600 hover:bg-green-500 disabled:opacity-40 text-white rounded-lg text-xs font-semibold"
          >
            {saving ? 'Saving…' : 'Close & Save'}
          </button>
          <button onClick={cancelDrawing} className="px-3 py-1 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg text-xs font-semibold">
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main Panel ───────────────────────────────────────────────────────────────
interface PanelProps {
  title: string;         // e.g. "Axial"
  images: ImageType[];
  uploading: boolean;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDelete?: (imageId: number) => void;
}

export default function MedicalViewerPanel({ title, images, uploading, onUpload, onDelete }: PanelProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeTool, setActiveTool] = useState<Tool>('draw');
  const [activeClassIdx, setActiveClassIdx] = useState(0);
  const [showAnnotations, setShowAnnotations] = useState(true);
  const [showReview, setShowReview] = useState(true);
  const [applyCTWindow, setApplyCTWindow] = useState(false);
  const [brightness, setBrightness] = useState(100);
  const [history, setHistory] = useState<PolygonType[][]>([]);
  const [future, setFuture] = useState<PolygonType[][]>([]);
  const [polygons, setPolygons] = useState<PolygonType[]>([]);

  const currentImage = images[currentIndex];
  const total = images.length;
  const activeClass = CLASS_OPTIONS[activeClassIdx];

  // Sync polygons from image when index changes
  useEffect(() => {
    if (currentImage) {
      setPolygons(currentImage.polygons ?? []);
      setHistory([]);
      setFuture([]);
    }
  }, [currentIndex, currentImage]);

  // Jump to newly added image or adjust index on delete
  const prevTotal = useRef(total);
  useEffect(() => {
    if (total > prevTotal.current) {
      setCurrentIndex(total - 1);
    } else if (currentIndex >= total && total > 0) {
      setCurrentIndex(total - 1);
    } else if (total === 0) {
      setCurrentIndex(0);
    }
    prevTotal.current = total;
  }, [total, currentIndex]);

  const handlePolygonsChange = useCallback((newPolygons: PolygonType[], action: 'add' | 'remove') => {
    setHistory(prev => [...prev, polygons]);
    setFuture([]);
    setPolygons(newPolygons);
  }, [polygons]);

  const undo = () => {
    if (!history.length) return;
    const prev = history[history.length - 1];
    setFuture(f => [polygons, ...f]);
    setHistory(h => h.slice(0, -1));
    setPolygons(prev);
  };

  const redo = () => {
    if (!future.length) return;
    const next = future[0];
    setHistory(h => [...h, polygons]);
    setFuture(f => f.slice(1));
    setPolygons(next);
  };

  const reset = () => {
    setHistory(h => [...h, polygons]);
    setFuture([]);
    setPolygons([]);
  };

  const zoomIn  = () => {};  // handled inside ImageCanvas via tool
  const zoomOut = () => {};

  return (
    <div className="flex flex-col h-full bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden">

      {/* ── Slice Nav Header ── */}
      <div className="flex items-center justify-between px-3 py-2 bg-zinc-900 border-b border-zinc-800 shrink-0">
        <button
          onClick={() => setCurrentIndex(i => Math.max(0, i - 1))}
          disabled={currentIndex === 0}
          className="p-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-30 text-white transition-all"
        >
          <ChevronLeft size={16} />
        </button>

        <span className="text-zinc-100 font-semibold text-sm tracking-wide">
          {title} ({total === 0 ? '0/0' : `${currentIndex + 1}/${total}`})
        </span>

        <button
          onClick={() => setCurrentIndex(i => Math.min(total - 1, i + 1))}
          disabled={currentIndex >= total - 1}
          className="p-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-30 text-white transition-all"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* ── Controls Bar ── */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-3 py-2 bg-zinc-900/60 border-b border-zinc-800 shrink-0 text-xs text-zinc-300">
        {/* Class selector */}
        <div className="flex items-center gap-2">
          <span className="text-zinc-500">Select Class:</span>
          <select
            value={activeClassIdx}
            onChange={e => setActiveClassIdx(Number(e.target.value))}
            className="bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-md px-2 py-1 text-xs focus:outline-none focus:border-blue-500"
          >
            {CLASS_OPTIONS.map((c, i) => (
              <option key={c.label} value={i}>{c.label}</option>
            ))}
          </select>
          <span
            className="w-3 h-3 rounded-full border border-white/20"
            style={{ background: activeClass.color }}
          />
        </div>

        {/* Hide Annotations */}
        <label className="flex items-center gap-1.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={!showAnnotations}
            onChange={e => setShowAnnotations(!e.target.checked)}
            className="accent-blue-500 w-3.5 h-3.5"
          />
          Hide Annotations
        </label>

        {/* Hide Review */}
        <label className="flex items-center gap-1.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={!showReview}
            onChange={e => setShowReview(!e.target.checked)}
            className="accent-blue-500 w-3.5 h-3.5"
          />
          Hide Review
        </label>

        {/* CT Window */}
        <label className="flex items-center gap-1.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={applyCTWindow}
            onChange={e => {
              setApplyCTWindow(e.target.checked);
              setBrightness(e.target.checked ? 140 : 100);
            }}
            className="accent-blue-500 w-3.5 h-3.5"
          />
          Apply CT Window
        </label>

        {/* Upload for this panel */}
        <div className="ml-auto flex items-center gap-2">
          {total > 0 && onDelete && (
            <button
              onClick={() => onDelete(currentImage.id)}
              className="flex items-center justify-center p-1.5 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-md transition-colors"
              title="Delete Current Image"
            >
              <Trash2 size={16} />
            </button>
          )}
          <label className="flex items-center gap-1.5 bg-blue-700 hover:bg-blue-600 text-white px-2.5 py-1 rounded-md cursor-pointer transition-colors font-medium">
            {uploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
            Add Image
            <input type="file" accept="image/*" onChange={onUpload} className="hidden" disabled={uploading} />
          </label>
        </div>
      </div>

      {/* ── Canvas Area ── */}
      <div className="flex-1 min-h-0 relative">
        {total === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-600 gap-3">
            <ImageIcon size={48} className="opacity-40" />
            <p className="text-sm">No images uploaded</p>
            <p className="text-xs">Use "Add Image" above to upload</p>
          </div>
        ) : (
          currentImage && (
            <ImageCanvas
              image={currentImage}
              polygons={polygons}
              onPolygonsChange={handlePolygonsChange}
              activeTool={activeTool}
              activeClass={activeClass}
              showAnnotations={showAnnotations}
              brightness={brightness}
            />
          )
        )}
      </div>

      {/* ── Toolbar ── */}
      <div className="flex items-center justify-center gap-2 px-3 py-2 bg-zinc-900 border-t border-zinc-800 shrink-0">
        <ToolBtn icon={<Pencil size={15} />}  label="Draw Polygon"  active={activeTool === 'draw'}     onClick={() => setActiveTool('draw')} />
        <ToolBtn icon={<ZoomIn size={15} />}  label="Zoom In"       active={activeTool === 'zoom-in'}  onClick={() => setActiveTool('zoom-in')} />
        <ToolBtn icon={<ZoomOut size={15} />} label="Zoom Out"      active={activeTool === 'zoom-out'} onClick={() => setActiveTool('zoom-out')} />
        <ToolBtn icon={<Hand size={15} />}    label="Pan / Move"    active={activeTool === 'pan'}      onClick={() => setActiveTool('pan')} />

        <div className="w-px h-6 bg-zinc-700 mx-1" />

        <ToolBtn icon={<Undo2 size={15} />}    label="Undo"          onClick={undo}  disabled={history.length === 0} />
        <ToolBtn icon={<Redo2 size={15} />}    label="Redo"          onClick={redo}  disabled={future.length === 0} />
        <ToolBtn icon={<RotateCcw size={15} />} label="Reset Canvas" onClick={reset} disabled={polygons.length === 0} />

        <div className="w-px h-6 bg-zinc-700 mx-1" />

        {/* Brightness slider */}
        <Sun size={14} className="text-zinc-400" />
        <input
          type="range" min={50} max={200} value={brightness}
          onChange={e => setBrightness(Number(e.target.value))}
          className="w-20 h-1.5 accent-blue-500 cursor-pointer"
          title={`Brightness: ${brightness}%`}
        />
      </div>

      {/* ── Series Review Label ── */}
      <div className="px-3 py-1.5 bg-zinc-900/80 border-t border-zinc-800 text-zinc-400 text-xs font-medium shrink-0">
        Series Review: {title}
      </div>
    </div>
  );
}
