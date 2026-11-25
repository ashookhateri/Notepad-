import React from 'react';

export const NppLogoIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 512 512" className={className} aria-hidden="true">
    <g transform="rotate(-7 256 256)">
      <rect x="86" y="64" width="332" height="396" rx="18" fill="#1e293b" opacity="0.2" />
      <path
        d="M80 56 h264 l68 68 v320 a16 16 0 0 1 -16 16 h-316 a16 16 0 0 1 -16 -16 v-372 a16 16 0 0 1 16 -16 z"
        fill="#ffffff"
        stroke="#475569"
        strokeWidth="12"
      />
      <path
        d="M344 56 v52 a16 16 0 0 0 16 16 h52 z"
        fill="#dbeafe"
        stroke="#475569"
        strokeWidth="10"
        strokeLinejoin="round"
      />
      <line x1="138" y1="112" x2="138" y2="446" stroke="#f87171" strokeWidth="6" />
      <line x1="94" y1="154" x2="386" y2="154" stroke="#93c5fd" strokeWidth="6" />
      <line x1="94" y1="204" x2="386" y2="204" stroke="#93c5fd" strokeWidth="6" />
      <line x1="94" y1="254" x2="386" y2="254" stroke="#93c5fd" strokeWidth="6" />
      <line x1="94" y1="304" x2="386" y2="304" stroke="#93c5fd" strokeWidth="6" />
      <line x1="94" y1="354" x2="386" y2="354" stroke="#93c5fd" strokeWidth="6" />
      <line x1="94" y1="404" x2="386" y2="404" stroke="#93c5fd" strokeWidth="6" />
    </g>
    <g transform="translate(274, 304) rotate(-40)">
      <polygon points="-140,0 -196,17 -140,34" fill="#fde68a" stroke="#14532d" strokeWidth="8" strokeLinejoin="round" />
      <polygon points="-174,10 -196,17 -174,24" fill="#1e293b" />
      <rect x="-140" y="0" width="276" height="34" rx="4" fill="#4ade80" stroke="#14532d" strokeWidth="8" />
      <rect x="136" y="1" width="20" height="32" fill="#cbd5e1" stroke="#14532d" strokeWidth="7" />
      <rect x="156" y="2" width="24" height="30" rx="6" fill="#fda4af" stroke="#14532d" strokeWidth="7" />
    </g>
    <g>
      <path
        d="M168 352 C110 370, 74 330, 88 282 C100 242, 148 244, 152 278 C156 302, 128 312, 118 296"
        fill="none"
        stroke="#14532d"
        strokeWidth="36"
        strokeLinecap="round"
      />
      <path
        d="M168 352 C110 370, 74 330, 88 282 C100 242, 148 244, 152 278 C156 302, 128 312, 118 296"
        fill="none"
        stroke="#84cc16"
        strokeWidth="22"
        strokeLinecap="round"
      />
      <path
        d="M164 348 C152 246, 224 166, 324 168 C374 169, 412 198, 418 238 C422 266, 384 282, 344 274 C308 267, 290 290, 260 322 C230 354, 186 364, 164 348 Z"
        fill="#84cc16"
        stroke="#14532d"
        strokeWidth="10"
        strokeLinejoin="round"
      />
      <path
        d="M196 314 C202 250, 250 202, 314 200"
        fill="none"
        stroke="#bef264"
        strokeWidth="15"
        strokeLinecap="round"
      />
      <circle cx="364" cy="212" r="28" fill="#ecfccb" stroke="#14532d" strokeWidth="8" />
      <circle cx="364" cy="212" r="16" fill="#fde047" stroke="#65a30d" strokeWidth="3" />
      <circle cx="368" cy="210" r="8" fill="#0f172a" />
      <circle cx="371" cy="207" r="3" fill="#ffffff" />
      <path d="M380 250 Q398 256, 412 242" fill="none" stroke="#14532d" strokeWidth="7" strokeLinecap="round" />
    </g>
  </svg>
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
