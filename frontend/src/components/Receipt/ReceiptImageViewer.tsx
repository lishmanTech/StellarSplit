import { useRef, useState } from 'react';
import { ZoomIn, ZoomOut } from 'lucide-react';

interface Region {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ReceiptImageViewerProps {
  imageUrl: string;
  highlightRegion?: Region | null;
  onRegionClick?: (region: Region) => void;
}

export const ReceiptImageViewer = ({
  imageUrl,
  highlightRegion,
  onRegionClick,
}: ReceiptImageViewerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);

  const handleZoom = (direction: 'in' | 'out') => {
    setZoom((prev) => {
      const newZoom = direction === 'in' ? prev + 0.2 : prev - 0.2;
      return Math.max(1, Math.min(3, newZoom));
    });
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-3 bg-white border-b border-gray-200">
        <h3 className="font-semibold text-gray-700">Receipt Image</h3>
        <div className="flex gap-2">
          <button
            onClick={() => handleZoom('out')}
            disabled={zoom <= 1}
            className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Zoom out"
          >
            <ZoomOut size={18} />
          </button>
          <span className="text-sm font-medium text-gray-600 w-12 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => handleZoom('in')}
            disabled={zoom >= 3}
            className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Zoom in"
          >
            <ZoomIn size={18} />
          </button>
        </div>
      </div>

      {/* Image Container */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto relative bg-gray-100 flex items-center justify-center"
      >
        <div className="relative" style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}>
          <img
            src={imageUrl}
            alt="Receipt"
            className="max-w-full h-auto cursor-pointer"
            onClick={(e) => {
              if (!onRegionClick) return;
              const rect = (e.currentTarget as HTMLImageElement).getBoundingClientRect();
              const containerRect = containerRef.current?.getBoundingClientRect();
              if (!containerRect) return;

              const x = (e.clientX - containerRect.left) / zoom / (rect.width / 100);
              const y = (e.clientY - containerRect.top) / zoom / (rect.height / 100);
              onRegionClick({ x, y, width: 10, height: 10 });
            }}
          />

          {/* Highlight Overlay */}
          {highlightRegion && (
            <div
              className="absolute border-2 border-blue-500 bg-blue-100 opacity-30 pointer-events-none transition-all duration-200"
              style={{
                left: `${highlightRegion.x}%`,
                top: `${highlightRegion.y}%`,
                width: `${highlightRegion.width}%`,
                height: `${highlightRegion.height}%`,
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};
