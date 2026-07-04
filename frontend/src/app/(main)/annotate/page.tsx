"use client";

import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { ImageType } from '@/types';
import MedicalViewerPanel from '@/components/MedicalViewerPanel';
import { Loader2, Download } from 'lucide-react';

export default function AnnotatePage() {
  // Each panel has its own independent image list
  const [axialImages,    setAxialImages]    = useState<ImageType[]>([]);
  const [sagittalImages, setSagittalImages] = useState<ImageType[]>([]);
  const [coronalImages,  setCoronalImages]  = useState<ImageType[]>([]);
  const [loading,        setLoading]        = useState(true);
  const [uploadingAxial,    setUploadingAxial]    = useState(false);
  const [uploadingSagittal, setUploadingSagittal] = useState(false);
  const [uploadingCoronal,  setUploadingCoronal]  = useState(false);
  const [exporting,         setExporting]         = useState(false);

  useEffect(() => {
    fetchAllImages();
  }, []);

  const fetchAllImages = async () => {
    setLoading(true);
    try {
      const res = await api.get('/annotations/images/');
      const all: ImageType[] = res.data;
      // Distribute images round-robin across 3 panels
      setAxialImages(   all.filter((_, i) => i % 3 === 0));
      setSagittalImages(all.filter((_, i) => i % 3 === 1));
      setCoronalImages( all.filter((_, i) => i % 3 === 2));
    } catch (err) {
      console.error('Failed to fetch images', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    panel: 'axial' | 'sagittal' | 'coronal'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const setters = {
      axial:    { setUploading: setUploadingAxial,    setImages: setAxialImages },
      sagittal: { setUploading: setUploadingSagittal, setImages: setSagittalImages },
      coronal:  { setUploading: setUploadingCoronal,  setImages: setCoronalImages },
    };
    const { setUploading, setImages } = setters[panel];

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post('/annotations/images/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setImages(prev => [...prev, res.data]);
    } catch (err) {
      console.error('Upload failed', err);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDelete = async (imageId: number, panel: 'axial' | 'sagittal' | 'coronal') => {
    try {
      await api.delete(`/annotations/images/${imageId}/`);
      if (panel === 'axial') setAxialImages(prev => prev.filter(img => img.id !== imageId));
      if (panel === 'sagittal') setSagittalImages(prev => prev.filter(img => img.id !== imageId));
      if (panel === 'coronal') setCoronalImages(prev => prev.filter(img => img.id !== imageId));
    } catch (err) {
      console.error('Delete failed', err);
    }
  };

  // ── Export all annotations as JSON ──────────────────────────────────────────
  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await api.get('/annotations/images/');
      const allImages: ImageType[] = res.data;

      const exportData = {
        exported_at: new Date().toISOString(),
        total_images: allImages.length,
        total_polygons: allImages.reduce((sum, img) => sum + (img.polygons?.length ?? 0), 0),
        images: allImages.map(img => ({
          id: img.id,
          file: img.file,
          polygons: img.polygons.map(poly => ({
            id: poly.id,
            label: poly.label ?? 'Background',
            points: poly.points,
          })),
        })),
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `annotations_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed', err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="p-4 h-screen flex flex-col gap-3 bg-zinc-950 overflow-hidden">

      {/* ── Page Header ── */}
      <header className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent tracking-tight">
            Medical Image Annotation
          </h1>
          <p className="text-zinc-500 text-xs mt-0.5">
            Multi-view polygon annotation · Draw · Zoom · Pan · Undo/Redo · 3 independent views
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Export button */}
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-2 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors shadow-lg"
          >
            {exporting
              ? <Loader2 size={15} className="animate-spin" />
              : <Download size={15} />}
            Export JSON
          </button>

          <div className="flex items-center gap-2 text-xs text-zinc-500 bg-zinc-900 border border-zinc-800 px-3 py-2 rounded-lg">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Live · Auto-saves to server
          </div>
        </div>
      </header>

      {/* ── Triple Panel Layout ── */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center text-zinc-500">
          <Loader2 className="animate-spin mr-2" size={24} /> Loading images…
        </div>
      ) : (
        <div className="flex-1 grid grid-cols-3 gap-3 min-h-0">
          {/* Axial Panel */}
          <MedicalViewerPanel
            title="Axial"
            images={axialImages}
            uploading={uploadingAxial}
            onUpload={e => handleUpload(e, 'axial')}
            onDelete={id => handleDelete(id, 'axial')}
          />

          {/* Sagittal Panel */}
          <MedicalViewerPanel
            title="Sagittal"
            images={sagittalImages}
            uploading={uploadingSagittal}
            onUpload={e => handleUpload(e, 'sagittal')}
            onDelete={id => handleDelete(id, 'sagittal')}
          />

          {/* Coronal Panel */}
          <MedicalViewerPanel
            title="Coronal"
            images={coronalImages}
            uploading={uploadingCoronal}
            onUpload={e => handleUpload(e, 'coronal')}
            onDelete={id => handleDelete(id, 'coronal')}
          />
        </div>
      )}
    </div>
  );
}
