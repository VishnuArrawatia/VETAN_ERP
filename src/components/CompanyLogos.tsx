import React from 'react';

export function SakarLogo({ className = "h-12", showText = true }: { className?: string; showText?: boolean }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <svg viewBox="0 0 120 70" className={`${className} aspect-[120/70] shrink-0`} fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Sakar Orange Emblem */}
        <g>
          {/* Left arc stacked horizontal bars */}
          <rect x="10" y="24" width="18" height="4" rx="1.5" fill="#EB6E14" />
          <rect x="5" y="30" width="22" height="4" rx="1.5" fill="#EB6E14" />
          <rect x="5" y="36" width="22" height="4" rx="1.5" fill="#EB6E14" />
          <rect x="10" y="42" width="18" height="4" rx="1.5" fill="#EB6E14" />
          
          {/* Right arc stacked horizontal bars */}
          <rect x="92" y="24" width="18" height="4" rx="1.5" fill="#EB6E14" />
          <rect x="93" y="30" width="22" height="4" rx="1.5" fill="#EB6E14" />
          <rect x="93" y="36" width="22" height="4" rx="1.5" fill="#EB6E14" />
          <rect x="92" y="42" width="18" height="4" rx="1.5" fill="#EB6E14" />

          {/* Central vertical bars split in middle */}
          {/* Left-center pillar */}
          <rect x="36" y="16" width="5" height="15" rx="1.5" fill="#EB6E14" />
          <rect x="36" y="39" width="5" height="15" rx="1.5" fill="#EB6E14" />
          
          {/* Middle-left pillar */}
          <rect x="47" y="10" width="5" height="21" rx="1.5" fill="#EB6E14" />
          <rect x="47" y="39" width="5" height="21" rx="1.5" fill="#EB6E14" />

          {/* Center-left pillar */}
          <rect x="58" y="8" width="5" height="23" rx="1.5" fill="#EB6E14" />
          <rect x="58" y="39" width="5" height="23" rx="1.5" fill="#EB6E14" />

          {/* Center-right pillar */}
          <rect x="69" y="10" width="5" height="21" rx="1.5" fill="#EB6E14" />
          <rect x="69" y="39" width="5" height="21" rx="1.5" fill="#EB6E14" />

          {/* Right-center pillar */}
          <rect x="80" y="16" width="5" height="15" rx="1.5" fill="#EB6E14" />
          <rect x="80" y="39" width="5" height="15" rx="1.5" fill="#EB6E14" />
        </g>
      </svg>
      {showText && (
        <div className="flex flex-col justify-center leading-none">
          <span className="text-[11px] font-black tracking-widest text-slate-800 uppercase font-sans">
            SAKAR ELECTRICALS
          </span>
          <span className="text-[7.5px] font-bold tracking-wider text-slate-500 uppercase font-sans mt-0.5">
            &amp; ELECTRONICS PVT. LTD.
          </span>
        </div>
      )}
    </div>
  );
}

export function SvnLogo({ className = "h-12", showText = true }: { className?: string; showText?: boolean }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Swirl SVG */}
      <svg viewBox="0 0 50 50" className={`${className} aspect-square shrink-0`} fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Swirl Dots */}
        <g transform="translate(25, 25)">
          {/* Outer loop */}
          <circle cx="-16" cy="0" r="1.8" fill="#0F4C5C" />
          <circle cx="-15" cy="-7" r="2.0" fill="#EA580C" />
          <circle cx="-12" cy="-12" r="2.2" fill="#0F4C5C" />
          <circle cx="-7" cy="-15" r="2.4" fill="#EA580C" />
          <circle cx="0" cy="-16" r="2.6" fill="#0F4C5C" />
          <circle cx="7" cy="-15" r="2.8" fill="#EA580C" />
          <circle cx="12" cy="-12" r="2.6" fill="#0F4C5C" />
          <circle cx="15" cy="-7" r="2.4" fill="#EA580C" />
          <circle cx="16" cy="0" r="2.2" fill="#0F4C5C" />
          <circle cx="15" cy="7" r="2.0" fill="#EA580C" />
          <circle cx="12" cy="12" r="1.8" fill="#0F4C5C" />
          <circle cx="7" cy="15" r="1.6" fill="#EA580C" />
          <circle cx="0" cy="16" r="1.5" fill="#0F4C5C" />
          
          {/* Mid loop */}
          <circle cx="-10" cy="4" r="1.6" fill="#EA580C" />
          <circle cx="-9" cy="-2" r="1.8" fill="#0F4C5C" />
          <circle cx="-6" cy="-7" r="2.0" fill="#EA580C" />
          <circle cx="-1" cy="-10" r="2.2" fill="#0F4C5C" />
          <circle cx="4" cy="-9" r="2.0" fill="#EA580C" />
          <circle cx="8" cy="-5" r="1.8" fill="#0F4C5C" />
          <circle cx="9" cy="1" r="1.6" fill="#EA580C" />
          <circle cx="7" cy="6" r="1.5" fill="#0F4C5C" />
          <circle cx="3" cy="9" r="1.4" fill="#EA580C" />
          
          {/* Inner loop */}
          <circle cx="-4" cy="2" r="1.3" fill="#0F4C5C" />
          <circle cx="-3" cy="-2" r="1.4" fill="#EA580C" />
          <circle cx="0" cy="-4" r="1.5" fill="#0F4C5C" />
          <circle cx="3" cy="-3" r="1.4" fill="#EA580C" />
          <circle cx="4" cy="1" r="1.3" fill="#0F4C5C" />
          <circle cx="2" cy="4" r="1.2" fill="#EA580C" />
          <circle cx="-1" cy="4" r="1.1" fill="#0F4C5C" />
        </g>
      </svg>
      {showText && (
        <div className="flex items-baseline font-sans leading-none">
          <span className="text-sm font-black text-orange-600 uppercase tracking-tight">SVN</span>
          <span className="text-sm font-semibold text-slate-700 tracking-tight ml-0.5">Opto</span>
        </div>
      )}
    </div>
  );
}

export function CompanyLogo({ company, className = "h-8", showText = true }: { company: string; className?: string; showText?: boolean }) {
  const normalized = String(company || '').trim().toLowerCase();
  
  if (normalized.startsWith('sakar')) {
    return <SakarLogo className={className} showText={showText} />;
  }
  
  if (normalized.startsWith('svn')) {
    return <SvnLogo className={className} showText={showText} />;
  }

  // Combined or Group view
  return (
    <div className="flex items-center gap-4">
      <SvnLogo className={className} showText={showText} />
      <div className="h-4 w-[1px] bg-slate-200"></div>
      <SakarLogo className={className} showText={showText} />
    </div>
  );
}

export function getCompanyName(companyCode: string): string {
  const raw = String(companyCode || '').trim();
  // If caller already passed a full legal name, keep it (do not override edits)
  if (/pvt\.?\s*ltd/i.test(raw)) {
    return raw;
  }

  const normalized = raw.replace(/[-_]/g, ' ').toLowerCase();
  
  if (normalized === 'svn 1' || normalized === 'svn i' || normalized === 'svn' || normalized.startsWith('svn 1') || normalized.includes('svn opto') || normalized === 'svn-1') {
    return 'SVN Opto Electronics Pvt Ltd.';
  }
  if (normalized === 'svn ii' || normalized === 'svn-ii' || normalized.includes('svn ii') || normalized.includes('unit ii')) {
    return 'SVN Opto Electronics Pvt Ltd.(Unit II)';
  }
  if (normalized === 'sakar i' || normalized === 'sakar' || normalized === 'sakar 1' || normalized === 'sakar-i' || normalized.includes('sakar i') || normalized.includes('sakar 1') || normalized.includes('unit i')) {
    return 'Sakar Electricals & Electronics Pvt Ltd';
  }
  if (normalized === 'sakar iii' || normalized === 'sakar-iii' || normalized.includes('sakar iii') || normalized.includes('unit iii')) {
    return 'Sakar Electricals & Electronics Pvt Ltd (Unit III)';
  }
  if (normalized.includes('flare')) {
    return 'Flare Luminaires Pvt. Ltd.';
  }
  if (normalized.includes('zenivo')) {
    return 'Zenivo Systems Pvt Ltd';
  }
  
  // Specific fallback lookups
  if (raw.includes('SVN-1')) return 'SVN Opto Electronics Pvt Ltd.';
  if (raw.includes('SVN II') || raw.includes('SVN-II')) return 'SVN Opto Electronics Pvt Ltd.(Unit II)';
  if (raw.includes('Sakar I') || raw.includes('Sakar-I')) return 'Sakar Electricals & Electronics Pvt Ltd';
  if (raw.includes('Sakar III') || raw.includes('Sakar-III')) return 'Sakar Electricals & Electronics Pvt Ltd (Unit III)';
  
  return raw || 'Sakar Electricals & Electronics Pvt Ltd';
}
