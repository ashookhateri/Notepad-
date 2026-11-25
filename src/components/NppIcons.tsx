import React from 'react';

export const NppLogoIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <img
    src="/assets/aistudio/images__2__7295971b.png"
    alt="Notepad++"
    referrerPolicy="no-referrer"
    className={`${className} object-contain select-none`}
  />
);

export const FloppySavedIcon: React.FC<{ className?: string }> = ({ className = 'w-3.5 h-3.5' }) => (
  <svg viewBox="0 0 16 16" className={className} aria-hidden="true">
    <path
      d="M2 1.5 h9.5 l2.5 2.5 v10 a1 1 0 0 1 -1 1 h-11 a1 1 0 0 1 -1 -1 v-11.5 a1 1 0 0 1 1 -1 z"
      fill="#2563eb"
      stroke="#1e40af"
      strokeWidth="1"
    />
    <rect x="4" y="2" width="6" height="4" fill="#e2e8f0" />
    <rect x="7.5" y="2.5" width="1.5" height="3" fill="#475569" />
    <rect x="3.5" y="8.5" width="9" height="5" rx="0.5" fill="#ffffff" />
    <line x1="5" y1="10.5" x2="11" y2="10.5" stroke="#94a3b8" strokeWidth="1" />
    <line x1="5" y1="12.2" x2="9.5" y2="12.2" stroke="#94a3b8" strokeWidth="1" />
  </svg>
);

export const FloppyUnsavedIcon: React.FC<{ className?: string }> = ({ className = 'w-3.5 h-3.5' }) => (
  <svg viewBox="0 0 16 16" className={className} aria-hidden="true">
    <path
      d="M2 1.5 h9.5 l2.5 2.5 v10 a1 1 0 0 1 -1 1 h-11 a1 1 0 0 1 -1 -1 v-11.5 a1 1 0 0 1 1 -1 z"
      fill="#dc2626"
      stroke="#991b1b"
      strokeWidth="1"
    />
    <rect x="4" y="2" width="6" height="4" fill="#fee2e2" />
    <rect x="7.5" y="2.5" width="1.5" height="3" fill="#7f1d1d" />
    <rect x="3.5" y="8.5" width="9" height="5" rx="0.5" fill="#ffffff" />
    <line x1="5" y1="10.5" x2="11" y2="10.5" stroke="#fca5a5" strokeWidth="1" />
    <line x1="5" y1="12.2" x2="9.5" y2="12.2" stroke="#fca5a5" strokeWidth="1" />
  </svg>
);

export const FloppyReadOnlyIcon: React.FC<{ className?: string }> = ({ className = 'w-3.5 h-3.5' }) => (
  <svg viewBox="0 0 16 16" className={className} aria-hidden="true">
    <path
      d="M2 1.5 h9.5 l2.5 2.5 v10 a1 1 0 0 1 -1 1 h-11 a1 1 0 0 1 -1 -1 v-11.5 a1 1 0 0 1 1 -1 z"
      fill="#6b7280"
      stroke="#374151"
      strokeWidth="1"
    />
    <rect x="4" y="2" width="6" height="4" fill="#e5e7eb" />
    <rect x="3.5" y="8.5" width="9" height="5" rx="0.5" fill="#f3f4f6" />
    <circle cx="8" cy="11" r="1.5" fill="#374151" />
  </svg>
);
