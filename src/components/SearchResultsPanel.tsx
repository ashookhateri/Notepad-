import React, { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, X } from 'lucide-react';
import { SearchHit } from '../types/editor';

interface SearchResultsPanelProps {
  query: string;
  hits: SearchHit[];
  onSelectHit: (hit: SearchHit) => void;
  onClose: () => void;
}

export const SearchResultsPanel: React.FC<SearchResultsPanelProps> = ({
  query,
  hits,
  onSelectHit,
  onClose,
}) => {
  const [collapsedDocs, setCollapsedDocs] = useState<Record<string, boolean>>({});

  const grouped = useMemo(() => {
    const map = new Map<string, { docTitle: string; docPath: string; items: SearchHit[] }>();
    for (const h of hits) {
      if (!map.has(h.docId)) {
        map.set(h.docId, { docTitle: h.docTitle, docPath: h.docPath, items: [] });
      }
      map.get(h.docId)!.items.push(h);
    }
    return Array.from(map.entries());
  }, [hits]);

  return (
    <section className="h-44 sm:h-48 shrink-0 flex flex-col bg-white dark:bg-[#1e1e1e] border-t-2 border-[#b8b8b8] dark:border-[#3c3c3c] text-xs npp-no-print">
      <div className="flex items-center justify-between px-2.5 py-1 bg-[#eaeaea] dark:bg-[#2d2d2d] border-b border-[#d0d0d0] dark:border-[#3c3c3c] text-[#1a1a1a] dark:text-[#e0e0e0] select-none">
        <span className="font-semibold truncate">
          Search results — Search "{query}" ({hits.length} hits in {grouped.length} file{grouped.length === 1 ? '' : 's'})
        </span>
        <button
          type="button"
          onClick={onClose}
          title="Close Search Results"
          className="p-0.5 rounded hover:bg-[#d5d5d5] dark:hover:bg-[#3c3c3c]"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto npp-scroll font-mono text-[12px] p-1">
        {hits.length === 0 ? (
          <div className="p-3 text-neutral-500 dark:text-neutral-400">No matches found.</div>
        ) : (
          grouped.map(([docId, group]) => {
            const isCollapsed = !!collapsedDocs[docId];
            return (
              <div key={docId} className="mb-1">
                <button
                  type="button"
                  onClick={() => setCollapsedDocs((p) => ({ ...p, [docId]: !p[docId] }))}
                  className="w-full flex items-center gap-1 px-1.5 py-0.5 text-left font-semibold bg-[#e8f5e9] dark:bg-[#1e3a29] text-[#1b5e20] dark:text-[#86efac] hover:opacity-90"
                >
                  {isCollapsed ? <ChevronRight className="w-3.5 h-3.5 shrink-0" /> : <ChevronDown className="w-3.5 h-3.5 shrink-0" />}
                  <span className="truncate">
                    {group.docPath} ({group.items.length} hit{group.items.length === 1 ? '' : 's'})
                  </span>
                </button>

                {!isCollapsed &&
                  group.items.map((hit, idx) => {
                    const idxInLine = hit.col - 1;
                    const before = hit.lineText.slice(0, idxInLine);
                    const matched = hit.lineText.slice(idxInLine, idxInLine + hit.matchText.length);
                    const after = hit.lineText.slice(idxInLine + hit.matchText.length);
                    return (
                      <button
                        key={`${hit.docId}-${hit.from}-${idx}`}
                        type="button"
                        onClick={() => onSelectHit(hit)}
                        className="w-full flex items-baseline gap-2 pl-6 pr-2 py-0.5 text-left hover:bg-[#e5f3ff] dark:hover:bg-[#094771] whitespace-pre overflow-hidden"
                      >
                        <span className="text-blue-700 dark:text-sky-400 tabular-nums shrink-0">
                          Line {hit.line}:
                        </span>
                        <span className="truncate text-neutral-800 dark:text-neutral-200">
                          {before}
                          <mark className="bg-amber-200 dark:bg-amber-700/70 text-red-700 dark:text-amber-100 font-semibold px-0.5">
                            {matched}
                          </mark>
                          {after}
                        </span>
                      </button>
                    );
                  })}
              </div>
            );
          })
        )}
      </div>
    </section>
  );
};
