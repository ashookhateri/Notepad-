import React, { useState } from 'react';
import { Download } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) return null;

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={install}
        className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium rounded bg-[#4d7c0f] hover:bg-[#3f6212] text-white transition-colors whitespace-nowrap shrink-0"
      >
        <Download className="w-3 h-3" />
        <span>Install App</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded border border-[#999999] dark:border-[#555555] hover:bg-neutral-200 dark:hover:bg-neutral-700 whitespace-nowrap shrink-0"
        >
          <Download className="w-3 h-3" />
          <span>Install</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-sm bg-white dark:bg-[#2b2b2b] border border-[#999999] dark:border-[#4b4b4b] p-5 shadow-xl text-xs text-[#1a1a1a] dark:text-[#e0e0e0]">
              <h3 className="text-sm font-semibold">Install Notepad++ on iPhone / iPad</h3>
              <p className="mt-2 leading-relaxed">
                1. Tap the <strong>Share</strong> button in Safari toolbar.<br />
                2. Scroll down and tap <strong>Add to Home Screen</strong>.
              </p>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="mt-4 w-full py-1.5 bg-[#e1e1e1] dark:bg-[#3a3a3a] border border-[#adadad] dark:border-[#555555] font-medium"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
