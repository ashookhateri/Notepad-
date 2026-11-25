import React, { useRef } from 'react';
import { X } from 'lucide-react';

interface DocumentMapProps {
  content: string;
  scrollTopRatio: number;
  visibleRatio: number;
  isDark: boolean;
  onScrollToRatio: (ratio: number) => void;
  onClose: () => void;
}

export const DocumentMap: React.FC<DocumentMapProps> = ({
  content,
  scrollTopRatio,
  visibleRatio,
  isDark,
  onScrollToRatio,
  onClose,
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);

  const handlePointer = (clientY: number) => {
    if (!mapRef.current) return;
    const rect = mapRef.current.getBoundingClientRect();
    const ratio = (clientY - rect.top) / Math.max(1, rect.height);
    onScrollToRatio(Math.max(0, Math.min(1, ratio)));
  };

  const lines = content.split('\n').slice(0, 600);
  const thumbHeightPct = Math.max(8, Math.min(100, visibleRatio * 100));
  const thumbTopPct = Math.max(0, Math.min(100 - thumbHeightPct, scrollTopRatio * (100 - thumbHeightPct)));

  return (
    <aside className="w-28 sm:w-32 shrink-0 flex flex-col bg-[#f6f6f6] dark:bg-[#252526] border-l border-[#d0d0d0] dark:border-[#3c3c3c] select-none npp-no-print">
      <div className="flex items-center justify-between px-2 py-1.5 bg-[#eaeaea] dark:bg-[#2d2d2d] border-b border-[#d0d0d0] dark:border-[#3c3c3c] text-[11px] font-semibold text-[#1a1a1a] dark:text-[#d4d4d4]">
        <span className="truncate">Document Map</span>
        <button
          type="button"
          onClick={onClose}
          title="Close Document Map"
          className="p-0.5 rounded hover:bg-[#d5d5d5] dark:hover:bg-[#3c3c3c]"
        >
          <X className="w-3 h-3" />
        </button>
      </div>

      <div
        ref={mapRef}
        onMouseDown={(e) => {
          draggingRef.current = true;
          handlePointer(e.clientY);
        }}
        onMouseMove={(e) => {
          if (draggingRef.current) handlePointer(e.clientY);
        }}
        onMouseUp={() => {
          draggingRef.current = false;
        }}
        onMouseLeave={() => {
          draggingRef.current = false;
        }}
        onTouchStart={(e) => {
          if (e.touches[0]) handlePointer(e.touches[0].clientY);
        }}
        onTouchMove={(e) => {
          if (e.touches[0]) handlePointer(e.touches[0].clientY);
        }}
        className={`relative flex-1 overflow-hidden cursor-pointer ${
          isDark ? 'bg-[#1e1e1e] text-[#9cdcfe]' : 'bg-white text-[#334155]'
        }`}
      >
        <pre className="p-1.5 text-[3px] leading-[4.5px] font-mono whitespace-pre overflow-hidden pointer-events-none opacity-80">
          {lines.join('\n')}
        </pre>

        {/* Scintilla Orange/Blue Translucent Viewport Box */}
        <div
          style={{
            top: `${thumbTopPct}%`,
            height: `${thumbHeightPct}%`,
          }}
          className="absolute left-0 right-0 bg-amber-500/20 border-y border-amber-500/70 pointer-events-none"
        />
      </div>
    </aside>
  );
};
