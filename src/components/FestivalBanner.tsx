import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Zap, Play, X } from 'lucide-react';
import { SakarLogo, SvnLogo } from './CompanyLogos';

interface FestivalSettings {
  message: string;
  isActive: boolean;
  displayDuration: number;
}

// Company Units with their real factory photo paths
const COMPANY_UNITS = [
  { id: 'SAKAR-I', name: 'Sakar Unit I (Factory)', img: '/src/assets/images/sakar_i_factory_1784275477727.jpg', color: 'border-amber-400' },
  { id: 'SAKAR-III', name: 'Sakar Unit III (Factory)', img: '/src/assets/images/sakar_iii_factory_1784275525132.jpg', color: 'border-orange-500' },
  { id: 'SVN-I', name: 'SVN Opto Unit I (Factory)', img: '/src/assets/images/svn_i_factory_1784275461192.jpg', color: 'border-emerald-400' },
  { id: 'SVN-II', name: 'SVN Opto Unit II (Factory)', img: '/src/assets/images/svn_ii_factory_1784278017538.jpg', color: 'border-sky-400' },
  { id: 'FLARE', name: 'Flare Luminaires (Factory)', img: '/src/assets/images/flare_factory_1784275493334.jpg', color: 'border-purple-400' },
  { id: 'ZENIVO', name: 'Zenivo Systems (Factory)', img: '/src/assets/images/zenivo_factory_1784275508025.jpg', color: 'border-pink-500' }
];

// Inline SVGs for beautiful colorful celebration rain
function RenderRainShape({ type }: { type: string }) {
  switch (type) {
    case 'flower':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
          <path d="M12 2.5c.78 0 1.48.33 1.97.85.24-.13.52-.2.81-.2a2.22 2.22 0 0 1 2.22 2.22c0 .29-.07.57-.2.81.52.49.85 1.19.85 1.97 0 .78-.33 1.48-.85 1.97.13.24.2.52.2.81a2.22 2.22 0 0 1-2.22 2.22c-.29 0-.57-.07-.81-.2-.49.52-1.19.85-1.97.85-.78 0-1.48-.33-1.97-.85-.24.13-.52.2-.81.2A2.22 2.22 0 0 1 7.2 11c0-.29.07-.57.2-.81-.52-.49-.85-1.19-.85-1.97 0-.78.33-1.48.85-1.97-.13-.24-.2-.52-.2-.81a2.22 2.22 0 0 1 2.22-2.22c.29 0 .57.07.81.2.49-.52 1.19-.85 1.97-.85zM12 12c.55 0 1-.45 1-1s-.45-1-1-1-1 .45-1 1 .45 1 1 1z" />
          <path d="M12 13.5c.78 0 1.48.33 1.97.85.24-.13.52-.2.81-.2a2.22 2.22 0 0 1 2.22 2.22c0 .29-.07.57-.2.81.52.49.85 1.19.85 1.97 0 .78-.33 1.48-.85 1.97.13.24.2.52.2.81a2.22 2.22 0 0 1-2.22 2.22c-.29 0-.57-.07-.81-.2-.49.52-1.19.85-1.97.85-.78 0-1.48-.33-1.97-.85-.24.13-.52.2-.81.2a2.22 2.22 0 0 1-2.22-2.22c0-.29.07-.57.2-.81-.52-.49-.85-1.19-.85-1.97 0-.78.33-1.48.85-1.97-.13-.24-.2-.52-.2-.81a2.22 2.22 0 0 1 2.22-2.22c.29 0 .57.07.81.2.49-.52 1.19-.85 1.97-.85zM12 23c.55 0 1-.45 1-1s-.45-1-1-1-1 .45-1 1 .45 1 1 1z" opacity="0.8" />
        </svg>
      );
    case 'star':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
          <path d="M12 1.5l3.09 6.3 6.91.95-5 4.86 1.18 6.89-6.18-3.25-6.18 3.25 1.18-6.89-5-4.86 6.91-.95z" />
        </svg>
      );
    case 'leaf':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
          <path d="M17 8C8 10 7 20 7 20s10-1 12-10c1.5-6.5-2-2-2-2z" />
        </svg>
      );
    case 'petal':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
          <path d="M12 21a9 9 0 0 1-9-9c0-6 9-11 9-11s9 5 9 11a9 9 0 0 1-9 9z" />
        </svg>
      );
    case 'sparkle':
    default:
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
          <path d="M12 2s.5 4.5 4.5 4.5S22 7 22 7s-4.5.5-4.5 4.5S12 12 12 12s-.5-4.5-4.5-4.5S2 7 2 7s4.5-.5 4.5-4.5S12 2 12 2z" />
        </svg>
      );
  }
}

// Moving Company Photos Slideshow Track
function UnitSlideshowTrack({ speedClass = "animate-marquee", opacity = "opacity-35" }: { speedClass?: string; opacity?: string }) {
  const repeatedUnits = [...COMPANY_UNITS, ...COMPANY_UNITS, ...COMPANY_UNITS, ...COMPANY_UNITS];
  return (
    <div className={`whitespace-nowrap flex ${speedClass} gap-8 ${opacity} py-2 select-none pointer-events-none`}>
      {repeatedUnits.map((unit, idx) => (
        <div 
          key={idx} 
          className="inline-block relative w-72 h-44 rounded-2xl overflow-hidden border-2 border-slate-700/55 shadow-2xl flex-shrink-0"
        >
          <img 
            src={unit.img} 
            alt={unit.name} 
            className="w-full h-full object-cover filter brightness-110 contrast-125 saturate-125 bg-slate-900"
            referrerPolicy="no-referrer"
          />
          {/* Neon side borders */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-900/30 to-transparent" />
          
          {/* Caption Tag */}
          <div className="absolute bottom-3 left-4 text-left">
            <span className="text-[10px] font-black tracking-widest uppercase text-white bg-slate-950/90 px-3 py-1 rounded-lg border border-amber-400/30 shadow-[0_2px_10px_rgba(245,158,11,0.2)]">
              {unit.name}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function FestivalBanner() {
  const [settings, setSettings] = useState<FestivalSettings | null>(null);
  const [showInitial, setShowInitial] = useState(false);
  const [showIdleMarquee, setShowIdleMarquee] = useState(false);
  const [initialCountdown, setInitialCountdown] = useState(0);
  
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Generate stabilized rain particles with multiple sizes, speed, colors, and delay
  const rainParticles = React.useMemo(() => {
    const types = ['flower', 'star', 'leaf', 'petal', 'sparkle'];
    const colors = [
      'text-rose-400 drop-shadow-[0_0_12px_rgba(244,63,94,0.95)]', 
      'text-amber-300 drop-shadow-[0_0_12px_rgba(251,191,36,0.95)]', 
      'text-emerald-300 drop-shadow-[0_0_12px_rgba(52,211,153,0.95)]', 
      'text-sky-300 drop-shadow-[0_0_12px_rgba(56,189,248,0.95)]', 
      'text-purple-300 drop-shadow-[0_0_12px_rgba(192,132,252,0.95)]', 
      'text-pink-400 drop-shadow-[0_0_12px_rgba(236,72,153,0.95)]', 
      'text-yellow-200 drop-shadow-[0_0_12px_rgba(253,224,71,0.95)]', 
      'text-orange-400 drop-shadow-[0_0_12px_rgba(249,115,22,0.95)]',
      'text-teal-300 drop-shadow-[0_0_12px_rgba(20,184,166,0.95)]',
      'text-red-400 drop-shadow-[0_0_12px_rgba(239,68,68,0.95)]'
    ];
    return Array.from({ length: 110 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100, // random start horizontal %
      delay: Math.random() * 12, // random delay seconds
      duration: 5 + Math.random() * 8, // random fall duration seconds
      size: 14 + Math.random() * 26, // random size in px
      colorClass: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      type: types[Math.floor(Math.random() * types.length)],
      drift: -60 + Math.random() * 120, // drift amount in px
    }));
  }, []);

  // Fetch settings from server
  const fetchSettings = async (isManualPreview = false) => {
    try {
      const res = await fetch('/api/festival-message');
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
        
        // If active and has a message, trigger initial show
        if (data.isActive && data.message.trim().length > 0) {
          const alreadyShown = sessionStorage.getItem('festival-banner-shown');
          // Only show automatically on first load in this session, unless manual test triggers it
          if (!alreadyShown || isManualPreview) {
            setShowInitial(true);
            setInitialCountdown(Math.max(15, data.displayDuration || 15));
          }
        } else {
          setShowInitial(false);
          setShowIdleMarquee(false);
        }
      }
    } catch (e) {
      console.error('Failed to load festival banner settings:', e);
    }
  };

  const handleSkipAndProceed = () => {
    setShowInitial(false);
    sessionStorage.setItem('festival-banner-shown', 'true');
  };

  // Handle Initial Show Countdown
  useEffect(() => {
    if (showInitial && initialCountdown > 0) {
      countdownIntervalRef.current = setInterval(() => {
        setInitialCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownIntervalRef.current!);
            setShowInitial(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (!showInitial) {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    }

    return () => {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [showInitial, initialCountdown]);

  // Handle Idle/Activity Detection (30 Seconds)
  useEffect(() => {
    if (!settings || !settings.isActive || settings.message.trim().length === 0) {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      return;
    }

    // Don't start idle detection while initial display is running
    if (showInitial) {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      return;
    }

    const resetIdleTimer = () => {
      // If idle marquee is active, hide it on activity
      if (showIdleMarquee) {
        setShowIdleMarquee(false);
      }

      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);

      // Set timer to trigger idle marquee after 30 seconds
      idleTimerRef.current = setTimeout(() => {
        if (settings.isActive && settings.message.trim().length > 0) {
          setShowIdleMarquee(true);
        }
      }, 30000); // 30 seconds of inactivity
    };

    // Attach event listeners for any user interaction
    const events = ['mousemove', 'mousedown', 'keypress', 'scroll', 'touchstart'];
    events.forEach((event) => {
      window.addEventListener(event, resetIdleTimer);
    });

    // Start initial timer
    resetIdleTimer();

    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      events.forEach((event) => {
        window.removeEventListener(event, resetIdleTimer);
      });
    };
  }, [settings, showInitial, showIdleMarquee]);

  // Listen for admin changes & previews on same system (NO SETTINGS IN DEP ARRAY - PREVENT INFINITE FETCHES)
  useEffect(() => {
    fetchSettings(false);

    const handleUpdate = () => {
      fetchSettings(false);
    };

    const handlePreview = (e: Event) => {
      const customEvent = e as CustomEvent;
      const detail = customEvent.detail || {};
      const msg = detail.message || 'Wishing all our HR Teams and Employees of Sakar I, III, SVN I, II a very Happy Celebration! 🇮🇳✨';
      const dur = Math.max(15, detail.duration || 15);
      
      setSettings({
        message: msg,
        isActive: true,
        displayDuration: dur
      });
      setShowInitial(true);
      setInitialCountdown(dur);
    };

    window.addEventListener('festival-settings-updated', handleUpdate);
    window.addEventListener('festival-preview-trigger', handlePreview);
    
    return () => {
      window.removeEventListener('festival-settings-updated', handleUpdate);
      window.removeEventListener('festival-preview-trigger', handlePreview);
    };
  }, []); // Run ONCE on mount

  if (!settings || !settings.isActive || settings.message.trim().length === 0) {
    return null;
  }

  return (
    <AnimatePresence>
      {/* 1. Initial Launch Overlay Block (Blocks interaction for displayDuration seconds, or has an exit button) */}
      {showInitial && (
        <motion.div
          id="festival-initial-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] bg-slate-950/95 backdrop-blur-md flex flex-col justify-center items-center p-6 text-center select-none bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-950/95 via-slate-950/95 to-slate-950"
        >
          {/* Beautiful Company Photos Background Slideshow scrolling left & right (Light Colors with opacity-30) */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0 opacity-30 flex flex-col justify-between py-10">
            {/* Track 1: Moving Left */}
            <div className="w-full scale-100 flex items-center">
              <UnitSlideshowTrack speedClass="animate-marquee" opacity="opacity-35" />
            </div>

            {/* Track 2: Moving Right */}
            <div className="w-full scale-100 flex items-center">
              <UnitSlideshowTrack speedClass="animate-marquee-reverse" opacity="opacity-35" />
            </div>
          </div>

          {/* Falling Rain of Multi-colored Flowers, Stars & Leaves */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
            {rainParticles.map((p) => (
              <motion.div
                key={p.id}
                initial={{ y: '-10vh', x: `${p.x}%`, rotate: p.rotation, opacity: 0 }}
                animate={{ 
                  y: '110vh', 
                  x: [`${p.x}%`, `${p.x + (p.drift / 5)}%`, `${p.x - (p.drift / 10)}%`, `${p.x + (p.drift / 12)}%`],
                  rotate: p.rotation + 360 * (p.duration > 8 ? 2 : 1),
                  opacity: [0, 0.95, 0.95, 0]
                }}
                transition={{
                  duration: p.duration,
                  repeat: Infinity,
                  delay: p.delay,
                  ease: 'linear',
                }}
                className={`absolute ${p.colorClass}`}
                style={{
                  width: `${p.size}px`,
                  height: `${p.size}px`,
                }}
              >
                <RenderRainShape type={p.type} />
              </motion.div>
            ))}
          </div>

          {/* High contrast custom Dismiss Button */}
          <div className="absolute top-8 right-8 z-50">
            <button
              onClick={handleSkipAndProceed}
              className="p-3.5 rounded-full bg-rose-600 hover:bg-gradient-to-r hover:from-rose-500 hover:to-orange-500 text-white transition-all duration-300 flex items-center justify-center cursor-pointer shadow-[0_0_20px_rgba(244,63,94,0.5)] border border-white/30 hover:scale-110 active:scale-95"
              title="Skip & Start Work"
            >
              <X size={24} className="stroke-[3]" />
            </button>
          </div>

          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            className="max-w-4xl space-y-10 px-4 z-20 relative"
          >
            <div className="flex flex-col items-center gap-2">
              <div className="flex justify-center items-center gap-2.5 text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-amber-300 via-emerald-300 to-sky-400 font-display font-black tracking-widest text-sm uppercase">
                <Sparkles size={24} className="animate-spin text-amber-300" />
                <span>Sakar & SVN Celebration Announcement</span>
                <Sparkles size={24} className="animate-spin text-amber-300" />
              </div>
              <div className="h-2 w-48 bg-gradient-to-r from-pink-500 via-amber-400 via-emerald-400 to-sky-500 rounded-full animate-pulse mt-2 shadow-[0_0_15px_rgba(251,191,36,0.6)]" />
            </div>

            {/* Scrolling Text Panel with Rainbow Shifting Gradient Background */}
            <div className="relative w-full overflow-hidden bg-slate-900/90 backdrop-blur-sm py-14 px-16 border-2 border-transparent bg-origin-border bg-gradient-to-r from-red-500 via-amber-400 via-emerald-400 via-sky-400 via-pink-500 to-red-500 p-[2.5px] rounded-3xl shadow-[0_0_60px_rgba(245,158,11,0.3)]">
              <div className="absolute inset-0 bg-slate-950/98 -z-10 rounded-[22px]" />
              <div className="whitespace-nowrap flex animate-marquee">
                <span className="text-4xl md:text-6xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-amber-200 via-emerald-300 via-sky-200 to-purple-400 pr-16 font-display">
                  ✨ {settings.message} ✨
                </span>
                <span className="text-4xl md:text-6xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-amber-200 via-emerald-300 via-sky-200 to-purple-400 pr-16 font-display">
                  ✨ {settings.message} ✨
                </span>
              </div>
            </div>

            <p className="text-white text-lg font-black italic max-w-xl mx-auto leading-relaxed drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)]">
              &ldquo;Work hard, celebrate together. Empowering Sakar Electricals & SVN Units.&rdquo;
            </p>

            {/* Countdown or Proceed Indicator */}
            <div className="flex flex-col items-center gap-4 pt-4">
              <div className="px-8 py-2.5 rounded-full bg-gradient-to-r from-red-500/30 via-amber-500/30 to-emerald-500/30 border-2 border-amber-400/40 text-amber-200 font-mono text-xs font-black uppercase tracking-wider animate-pulse shadow-[0_0_20px_rgba(245,158,11,0.3)]">
                Entering ERP in {initialCountdown}s
              </div>
              <button
                onClick={handleSkipAndProceed}
                className="mt-2 px-12 py-4.5 bg-gradient-to-r from-red-500 via-amber-500 via-emerald-500 to-sky-500 bg-[length:200%_auto] animate-gradient-x text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-[0_10px_40px_rgba(245,158,11,0.5)] flex items-center gap-4 cursor-pointer border-2 border-white/30"
              >
                <span>Proceed to ERP Instantly</span>
                <Play size={16} fill="currentColor" />
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* 2. Screensaver Idle Overlay Marquee (Triggers after 30s inactivity) */}
      {showIdleMarquee && !showInitial && (
        <motion.div
          id="festival-screensaver-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9998] bg-slate-950/95 backdrop-blur-lg flex flex-col justify-center items-center text-center select-none cursor-pointer bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-950/95 via-slate-950/95 to-slate-950"
          onClick={() => setShowIdleMarquee(false)}
        >
          {/* Beautiful Company Photos Background Slideshow scrolling left & right (Light Colors with opacity-30) */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0 opacity-25 flex flex-col justify-between py-10">
            {/* Track 1: Moving Left */}
            <div className="w-full scale-100 flex items-center">
              <UnitSlideshowTrack speedClass="animate-marquee" opacity="opacity-35" />
            </div>

            {/* Track 2: Moving Right */}
            <div className="w-full scale-100 flex items-center">
              <UnitSlideshowTrack speedClass="animate-marquee-reverse" opacity="opacity-35" />
            </div>
          </div>

          {/* Falling Rain of Multi-colored Flowers, Stars & Leaves */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
            {rainParticles.map((p) => (
              <motion.div
                key={p.id}
                initial={{ y: '-10vh', x: `${p.x}%`, rotate: p.rotation, opacity: 0 }}
                animate={{ 
                  y: '110vh', 
                  x: [`${p.x}%`, `${p.x + (p.drift / 5)}%`, `${p.x - (p.drift / 10)}%`, `${p.x + (p.drift / 12)}%`],
                  rotate: p.rotation + 360 * (p.duration > 8 ? 2 : 1),
                  opacity: [0, 0.95, 0.95, 0]
                }}
                transition={{
                  duration: p.duration,
                  repeat: Infinity,
                  delay: p.delay,
                  ease: 'linear',
                }}
                className={`absolute ${p.colorClass}`}
                style={{
                  width: `${p.size}px`,
                  height: `${p.size}px`,
                }}
              >
                <RenderRainShape type={p.type} />
              </motion.div>
            ))}
          </div>

          <div className="absolute top-10 left-1/2 -translate-x-1/2 flex items-center gap-2 text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-pink-400 to-sky-400 font-mono text-[11px] tracking-widest uppercase bg-slate-900/90 px-6 py-2.5 rounded-full border border-slate-800 animate-pulse z-30">
            <Zap size={12} className="text-amber-400 animate-bounce" />
            <span className="font-bold">Celebration Screensaver Active • Move Mouse, Touch or Click to Close</span>
          </div>

          <div className="w-full space-y-12 z-20 relative">
            {/* Huge scrolling message 1: Right-to-Left */}
            <div className="w-full overflow-hidden bg-slate-900/80 py-12 border-y-2 border-transparent bg-origin-border bg-gradient-to-r from-red-500/20 via-amber-400/20 to-emerald-500/20">
              <div className="whitespace-nowrap flex animate-marquee">
                <span className="text-5xl md:text-8xl font-black uppercase tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-rose-300 via-teal-300 to-sky-300 drop-shadow-[0_0_20px_rgba(245,158,11,0.2)] pr-16 font-display">
                  {settings.message} • ✨
                </span>
                <span className="text-5xl md:text-8xl font-black uppercase tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-rose-300 via-teal-300 to-sky-300 drop-shadow-[0_0_20px_rgba(245,158,11,0.2)] pr-16 font-display">
                  {settings.message} • ✨
                </span>
              </div>
            </div>

            {/* Huge scrolling message 2: Left-to-Right */}
            <div className="w-full overflow-hidden bg-slate-900/60 py-12 border-b-2 border-transparent bg-origin-border bg-gradient-to-r from-red-500/10 via-amber-400/10 to-emerald-500/10">
              <div className="whitespace-nowrap flex animate-marquee-reverse">
                <span className="text-4xl md:text-7xl font-black uppercase tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-red-400/90 via-amber-300/90 via-emerald-400/90 via-sky-300/90 to-purple-400/90 drop-shadow-[0_0_15px_rgba(239,68,68,0.15)] pr-16 font-display">
                  ✨ SAKAR ELECTRICALS • SVN GROUP • SAKAR I, III • SVN I, II • COOPERATIVE HARMONY • ✨
                </span>
                <span className="text-4xl md:text-7xl font-black uppercase tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-red-400/90 via-amber-300/90 via-emerald-400/90 via-sky-300/90 to-purple-400/90 drop-shadow-[0_0_15px_rgba(239,68,68,0.15)] pr-16 font-display">
                  ✨ SAKAR ELECTRICALS • SVN GROUP • SAKAR I, III • SVN I, II • COOPERATIVE HARMONY • ✨
                </span>
              </div>
            </div>
          </div>

          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 text-center space-y-1.5 opacity-80 z-30 bg-slate-950/90 px-8 py-3 rounded-2xl border border-slate-800">
            <p className="text-amber-400 text-xs font-bold uppercase tracking-widest font-mono">Vetan Multi-Unit ERP System</p>
            <p className="text-slate-300 text-[10px] font-medium">Active Units: Sakar I, Sakar III, SVN I, SVN II</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
