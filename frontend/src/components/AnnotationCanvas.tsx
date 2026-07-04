"use client";

import { useEffect, useState, useRef } from 'react';
import { Stage, Layer, Image as KonvaImage, Line, Circle } from 'react-konva';
import { ImageType, PolygonType } from '@/types';
import api from '@/lib/axios';
import { Trash2 } from 'lucide-react';

// Custom hook to load image for Konva
const useKonvaImage = (url: string) => {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  useEffect(() => {
    const img = new window.Image();
    img.src = url;
    img.crossOrigin = 'Anonymous';
    img.onload = () => setImage(img);
  }, [url]);
  return image;
};

interface Point { x: number; y: number }

export default function AnnotationCanvas({ 
  image, 
  onPolygonsChange 
}: { 
  image: ImageType, 
  onPolygonsChange: (p: PolygonType[]) => void 
}) {
  const konvaImage = useKonvaImage(image.file);
  const [points, setPoints] = useState<Point[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });
  const [scale, setScale] = useState(1);

  useEffect(() => {
    // Responsive stage setup
    const resizeObserver = new ResizeObserver(entries => {
      if (entries.length > 0) {
        const { width, height } = entries[0].contentRect;
        setStageSize({ width, height });
        
        if (konvaImage) {
          const scaleX = width / konvaImage.width;
          const scaleY = height / konvaImage.height;
          setScale(Math.min(scaleX, scaleY, 1)); // fit within, don't upscale beyond 1x if small
        }
      }
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    return () => resizeObserver.disconnect();
  }, [konvaImage]);

  const handleStageClick = (e: any) => {
    const stage = e.target.getStage();
    const pos = stage.getPointerPosition();
    if (!pos) return;

    // Convert screen pos to image relative pos
    const relativePos = {
      x: pos.x / scale,
      y: pos.y / scale
    };

    if (!isDrawing) {
      setIsDrawing(true);
      setPoints([relativePos]);
    } else {
      setPoints([...points, relativePos]);
    }
  };

  const handleStageMouseMove = (e: any) => {
    if (!isDrawing) return;
    // We could draw a preview line here, but for simplicity, we just add points on click
  };

  const finishDrawing = async () => {
    if (points.length < 3) {
      setIsDrawing(false);
      setPoints([]);
      return; // Need at least a triangle
    }

    try {
      const res = await api.post('/annotations/polygons/', {
        image: image.id,
        points: points
      });
      onPolygonsChange([...image.polygons, res.data]);
    } catch (error) {
      console.error("Failed to save polygon", error);
    } finally {
      setIsDrawing(false);
      setPoints([]);
    }
  };

  const cancelDrawing = () => {
    setIsDrawing(false);
    setPoints([]);
  };

  const removePolygon = async (polyId: number) => {
    try {
      await api.delete(`/annotations/polygons/${polyId}/`);
      onPolygonsChange(image.polygons.filter(p => p.id !== polyId));
    } catch (error) {
      console.error("Failed to delete polygon", error);
    }
  };

  return (
    <div className="w-full h-full flex flex-col relative" ref={containerRef}>
      {/* Controls */}
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        {isDrawing && (
          <>
            <button onClick={finishDrawing} className="px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white rounded-lg text-sm font-medium shadow-lg">
              Finish Shape
            </button>
            <button onClick={cancelDrawing} className="px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg text-sm font-medium shadow-lg">
              Cancel
            </button>
          </>
        )}
      </div>

      <div className="flex-1 w-full h-full flex items-center justify-center">
        {konvaImage && stageSize.width > 0 && (
          <Stage
            width={konvaImage.width * scale}
            height={konvaImage.height * scale}
            onClick={handleStageClick}
            onMouseMove={handleStageMouseMove}
            className="cursor-crosshair shadow-2xl border border-zinc-800"
          >
            <Layer>
              <KonvaImage image={konvaImage} width={konvaImage.width * scale} height={konvaImage.height * scale} />
              
              {/* Existing Polygons */}
              {image.polygons.map((poly) => {
                const flatPoints = poly.points.flatMap(p => [p.x * scale, p.y * scale]);
                return (
                  <Line
                    key={poly.id}
                    points={flatPoints}
                    fill="rgba(99, 102, 241, 0.3)"
                    stroke="#6366f1"
                    strokeWidth={2}
                    closed
                    onClick={(e) => {
                      e.cancelBubble = true; // prevent stage click
                      removePolygon(poly.id);
                    }}
                    onMouseEnter={(e) => {
                      const container = e.target.getStage()?.container();
                      if (container) container.style.cursor = 'pointer';
                      const shape = e.target as any;
                      shape.fill('rgba(239, 68, 68, 0.4)'); // Red on hover to indicate delete
                      shape.stroke('#ef4444');
                    }}
                    onMouseLeave={(e) => {
                      const container = e.target.getStage()?.container();
                      if (container) container.style.cursor = 'crosshair';
                      const shape = e.target as any;
                      shape.fill('rgba(99, 102, 241, 0.3)');
                      shape.stroke('#6366f1');
                    }}
                  />
                );
              })}

              {/* Polygon currently being drawn */}
              {isDrawing && points.length > 0 && (
                <>
                  <Line
                    points={points.flatMap(p => [p.x * scale, p.y * scale])}
                    stroke="#a855f7"
                    strokeWidth={2}
                    dash={[5, 5]}
                    closed={false}
                  />
                  {points.map((p, i) => (
                    <Circle key={i} x={p.x * scale} y={p.y * scale} radius={4} fill="#a855f7" />
                  ))}
                </>
              )}
            </Layer>
          </Stage>
        )}
      </div>
      
      {/* Help text */}
      <div className="absolute bottom-4 left-4 bg-zinc-900/80 backdrop-blur border border-zinc-800 p-3 rounded-xl max-w-sm">
        <h3 className="text-zinc-100 font-medium mb-1 text-sm">How to annotate:</h3>
        <ul className="text-zinc-400 text-xs space-y-1 list-disc pl-4">
          <li>Click on the image to start drawing a polygon.</li>
          <li>Click to add corners.</li>
          <li>Click "Finish Shape" when done.</li>
          <li>Click on an existing polygon to <span className="text-red-400 font-medium">delete</span> it.</li>
        </ul>
      </div>
    </div>
  );
}
