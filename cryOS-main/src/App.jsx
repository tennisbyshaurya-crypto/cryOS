// src/App.jsx
import React, { useEffect, useRef, useState } from 'react';
import DashboardApp from './App.tsx';
import { 
  Volume2, 
  Clock, 
  Settings, 
  Lock, 
  ArrowDown, 
  Moon, 
  Smile, 
  Heart,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';

// Flying Plane Component (z-20 layer, behind foreground cards but in front of clouds and playground)
function FlyingPlane() {
  const pathRef = useRef(null);
  const planeRef = useRef(null);
  const canvasRef = useRef(null);
  const distanceRef = useRef(0);
  
  const speed = 1.1; // Gentle, slow speed
  const smokeParticles = useRef([]);

  const flightPath = "M 100 250 C 300 100, 400 450, 600 300 C 800 150, 950 450, 1100 250 C 1220 180, 1220 420, 1100 350 C 900 200, 750 500, 600 350 C 450 200, 300 500, 100 350 C -20 420, -20 180, 100 250";

  useEffect(() => {
    let animId;

    const tick = () => {
      const path = pathRef.current;
      const plane = planeRef.current;
      const canvas = canvasRef.current;

      if (!path || !plane || !canvas) {
        animId = requestAnimationFrame(tick);
        return;
      }

      const totalLength = path.getTotalLength();
      if (totalLength === 0) {
        animId = requestAnimationFrame(tick);
        return;
      }

      distanceRef.current = (distanceRef.current + speed) % totalLength;

      const currentPoint = path.getPointAtLength(distanceRef.current);
      const aheadPoint = path.getPointAtLength((distanceRef.current + 2) % totalLength);

      const dx = aheadPoint.x - currentPoint.x;
      const dy = aheadPoint.y - currentPoint.y;

      const facingRight = dx >= 0;

      const pitchRad = Math.atan2(dy, Math.abs(dx));
      const pitchDeg = pitchRad * (180 / Math.PI);
      const scaleX = facingRight ? 1 : -1;

      plane.style.transform = `translate(${currentPoint.x - 60}px, ${currentPoint.y - 60}px) scaleX(${scaleX}) rotate(${pitchDeg}deg)`;

      // Render smoke cloud puffs behind tail
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, 1200, 600);

      if (Math.random() < 0.15) {
        const rad = (pitchDeg * Math.PI) / 180;
        const tailX = currentPoint.x - (facingRight ? 1 : -1) * Math.cos(rad) * 40;
        const tailY = currentPoint.y - Math.sin(rad) * 40;

        smokeParticles.current.push({
          x: tailX,
          y: tailY,
          size: Math.random() * 4 + 7,
          alpha: 0.45,
          life: 1.0,
          decay: 0.007
        });
      }

      smokeParticles.current.forEach((p) => {
        p.alpha -= p.decay;
        p.life -= p.decay;
        p.size += 0.07;

        if (p.life > 0) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(168, 85, 247, ${p.alpha * 0.45})`;
          ctx.fill();
        }
      });
      smokeParticles.current = smokeParticles.current.filter(p => p.life > 0);

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div className="fixed inset-0 w-screen h-screen pointer-events-none z-20 overflow-hidden">
      <svg 
        viewBox="0 0 1200 600" 
        className="absolute inset-0 w-full h-full"
        preserveAspectRatio="xMidYMid slice"
      >
        <path
          ref={pathRef}
          d={flightPath}
          fill="none"
          stroke="none"
        />
      </svg>

      <canvas
        ref={canvasRef}
        width={1200}
        height={600}
        className="absolute inset-0 w-full h-full opacity-60"
        style={{ objectFit: 'cover' }}
      />

      <div 
        ref={planeRef} 
        className="absolute w-[120px] h-[120px] top-0 left-0 will-change-transform"
        style={{ transformOrigin: '60px 60px' }}
      >
        <svg width="120" height="120" viewBox="0 0 200 200">
          <path
            d="M 30,110 C 30,90 60,70 120,70 C 160,70 185,90 185,105 C 185,115 170,135 120,135 C 60,135 30,130 30,110 Z"
            fill="url(#fuselageGrad)"
            stroke="#0f172a"
            strokeWidth="5"
          />
          <path
            d="M 32,110 C 55,100 110,95 183,105 C 183,109 178,118 170,121 C 110,110 55,115 32,115 Z"
            fill="#ec4899"
            stroke="#0f172a"
            strokeWidth="1.5"
          />
          <circle cx="75" cy="106" r="6" fill="#38bdf8" stroke="#0f172a" strokeWidth="2.5" />
          <circle cx="95" cy="106" r="6" fill="#38bdf8" stroke="#0f172a" strokeWidth="2.5" />
          <circle cx="115" cy="106" r="6" fill="#38bdf8" stroke="#0f172a" strokeWidth="2.5" />
          <circle cx="135" cy="106" r="6" fill="#38bdf8" stroke="#0f172a" strokeWidth="2.5" />
          <path
            d="M 35,95 L 20,40 C 25,35 45,35 50,45 L 65,80 Z"
            fill="#3b82f6"
            stroke="#0f172a"
            strokeWidth="5"
            strokeLinejoin="round"
          />
          <path
            d="M 25,105 C 15,105 10,112 15,115 C 25,118 45,115 45,112 Z"
            fill="#1d4ed8"
            stroke="#0f172a"
            strokeWidth="3.5"
          />
          <path
            d="M 115,72 C 120,55 160,55 170,72 C 172,78 165,88 150,88 C 130,88 118,80 115,72 Z"
            fill="#ffffff"
            stroke="#0f172a"
            strokeWidth="5"
          />
          <ellipse cx="138" cy="71" rx="9" ry="12" fill="#ffffff" />
          <circle cx="140" cy="72" r="4.5" fill="#000000" />
          <circle cx="138" cy="69" r="2" fill="#ffffff" />
          <ellipse cx="155" cy="71" rx="9" ry="12" fill="#ffffff" />
          <circle cx="157" cy="72" r="4.5" fill="#000000" />
          <circle cx="155" cy="69" r="2" fill="#ffffff" />
          <path
            d="M 158,110 C 160,124 178,122 181,108"
            fill="#881337"
            stroke="#0f172a"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <path
            d="M 165,117 C 168,113 175,113 177,117 Z"
            fill="#fda4af"
          />
          <rect x="90" y="132" width="40" height="20" rx="10" fill="#94a3b8" stroke="#0f172a" strokeWidth="4" />
          <circle cx="110" cy="142" r="6" fill="#3b82f6" stroke="#0f172a" strokeWidth="2" />
          <defs>
            <linearGradient id="fuselageGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f8fafc" />
              <stop offset="100%" stopColor="#cbd5e1" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>
  );
}

export default function App() {
  const [authTab, setAuthTab] = useState('signup');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loggedIn, setLoggedIn] = useState(false);

  const handleDemoSubmit = (e) => {
    e.preventDefault();
    if (loginEmail) {
      setLoggedIn(true);
    }
  };

  if (loggedIn) {
    return <DashboardApp />;
  }

  return (
    <div className="relative min-h-screen bg-[#090d16] overflow-x-hidden text-slate-100 flex flex-col z-0">
      
      {/* Background gradients */}
      <div className="absolute inset-0 bg-glow-radial pointer-events-none z-0" />
      <div className="absolute inset-0 bg-glow-pink pointer-events-none z-0" />

      {/* RE-DESIGNED CONSTANT STREAM OF DRIFTING CLOUDS (8 layered, active clouds in background) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-10 opacity-30">
        
        {/* Cloud 1 */}
        <div className="absolute text-slate-700/25 animate-drift-slow" style={{ top: '8%', width: '130px', animation: 'cloudDrift 110s linear infinite', animationDelay: '-15s' }}>
          <svg viewBox="0 0 100 40" fill="currentColor"><path d="M10 30 Q10 20 20 20 Q25 10 40 10 Q55 10 60 20 Q70 20 70 30 Q75 35 70 40 L10 40 Z" /></svg>
        </div>

        {/* Cloud 2 */}
        <div className="absolute text-slate-700/20 animate-drift-medium" style={{ top: '22%', width: '160px', animation: 'cloudDrift 75s linear infinite', animationDelay: '-40s' }}>
          <svg viewBox="0 0 100 40" fill="currentColor"><path d="M10 30 Q10 15 25 15 Q35 5 50 5 Q70 5 75 20 Q90 20 90 30 L10 30 Z" /></svg>
        </div>

        {/* Cloud 3 */}
        <div className="absolute text-slate-700/35 animate-drift-fast" style={{ top: '35%', width: '110px', animation: 'cloudDrift 42s linear infinite', animationDelay: '-5s' }}>
          <svg viewBox="0 0 100 40" fill="currentColor"><path d="M10 25 Q15 15 30 15 Q40 5 55 5 Q70 10 70 20 L10 20 Z" /></svg>
        </div>

        {/* Cloud 4 */}
        <div className="absolute text-slate-700/15 animate-drift-slow" style={{ top: '48%', width: '150px', animation: 'cloudDrift 95s linear infinite', animationDelay: '-65s' }}>
          <svg viewBox="0 0 100 40" fill="currentColor"><path d="M10 30 Q10 20 20 20 Q25 10 40 10 Q55 10 60 20 Q70 20 70 30 Q75 35 70 40 L10 40 Z" /></svg>
        </div>

        {/* Cloud 5 */}
        <div className="absolute text-slate-700/20 animate-drift-medium" style={{ top: '62%', width: '120px', animation: 'cloudDrift 68s linear infinite', animationDelay: '-25s' }}>
          <svg viewBox="0 0 100 40" fill="currentColor"><path d="M10 30 Q10 15 25 15 Q35 5 50 5 Q70 5 75 20 Q90 20 90 30 L10 30 Z" /></svg>
        </div>

        {/* Cloud 6 */}
        <div className="absolute text-slate-700/30 animate-drift-fast" style={{ top: '75%', width: '100px', animation: 'cloudDrift 38s linear infinite', animationDelay: '-12s' }}>
          <svg viewBox="0 0 100 40" fill="currentColor"><path d="M10 25 Q15 15 30 15 Q40 5 55 5 Q70 10 70 20 L10 20 Z" /></svg>
        </div>

        {/* Cloud 7 */}
        <div className="absolute text-slate-700/15 animate-drift-slow" style={{ top: '88%', width: '140px', animation: 'cloudDrift 115s linear infinite', animationDelay: '-80s' }}>
          <svg viewBox="0 0 100 40" fill="currentColor"><path d="M10 30 Q10 20 20 20 Q25 10 40 10 Q55 10 60 20 Q70 20 70 30 Q75 35 70 40 L10 40 Z" /></svg>
        </div>

        {/* Cloud 8 */}
        <div className="absolute text-slate-700/25 animate-drift-medium" style={{ top: '15%', width: '125px', animation: 'cloudDrift 55s linear infinite', animationDelay: '-50s' }}>
          <svg viewBox="0 0 100 40" fill="currentColor"><path d="M10 30 Q10 15 25 15 Q35 5 50 5 Q70 5 75 20 Q90 20 90 30 L10 30 Z" /></svg>
        </div>

      </div>

      {/* FLYING CARTOON PLANE LAYER */}
      <FlyingPlane />

      {/* HEADER SECTION (z-30 layer) */}
      <header className="relative z-30 max-w-7xl mx-auto w-full px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-400 flex items-center justify-center shadow-lg border border-purple-400/40 relative group">
            <Smile className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
            <div className="absolute -bottom-1 w-1.5 h-1.5 bg-indigo-300 rounded-full"></div>
          </div>
          <div>
            <span className="text-lg font-black tracking-tight text-white font-sans">
              cry<span className="text-pink-400">OS</span>
            </span>
            <span className="block text-[9px] uppercase tracking-widest text-indigo-400 font-bold -mt-1"></span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <a 
            href="#auth" 
            className="text-xs font-semibold text-slate-400 hover:text-white transition"
          >
            
          </a>
          <a 
            href="#auth" 
            className="btn-3d-blue bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2 rounded-lg border border-blue-400/30"
          >
            Sign In
          </a>
        </div>
      </header>

      {/* HERO HERO CONTAINER (z-30 for foreground text) */}
      <main className="relative z-30 max-w-7xl mx-auto w-full px-6 flex-1 flex flex-col items-center justify-center text-center pt-16 pb-20">
        
        {/* Title Badge */}
        <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/30 px-3 py-1 rounded-full text-xs font-semibold text-indigo-300 mb-6 backdrop-blur-md">
          <Heart className="w-3.5 h-3.5 text-pink-400 animate-pulse" /> Decode every cry. Protect everyone's peace. 
        </div>

        {/* Centered "cryOS" title with custom padding layout */}
        <h1 className="text-6xl sm:text-8xl font-black tracking-tighter mb-4 select-none leading-normal py-2 px-20">
          <span className="inline-block bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-300 to-pink-400 pr-6">
            cryOS
          </span>
        </h1>

       

        {/* LIVE SEQUENTIAL PLAYGROUND DOODLE (z-10 background layer, behind plane and cards) */}
        <div className="w-full max-w-3xl h-[330px] pointer-events-none z-10 flex items-center justify-center overflow-hidden mx-auto my-6 opacity-90 relative">
          <svg 
            viewBox="0 0 800 400" 
            className="w-full h-full select-none"
          >
            {/* Ground structure (0.2s - 2.2s) */}
            <path 
              d="M 50,320 L 750,320" 
              stroke="#4ade80" 
              strokeWidth="4" 
              fill="none" 
              className="doodle-stroke" 
              style={{ animationDelay: '0.2s', animationDuration: '2.0s' }}
            />
            {/* Ground Grass left (2.2s - 2.8s) */}
            <path 
              d="M 70,320 L 65,308 M 70,320 L 75,310" 
              stroke="#4ade80" 
              strokeWidth="2.5" 
              className="doodle-stroke" 
              style={{ animationDelay: '0.4s', animationDuration: '0.6s' }}
            />
            {/* Ground Grass right (2.8s - 3.4s) */}
            <path 
              d="M 680,320 L 675,310 M 680,320 L 685,308" 
              stroke="#4ade80" 
              strokeWidth="2.5" 
              className="doodle-stroke" 
              style={{ animationDelay: '0.8s', animationDuration: '0.6s' }}
            />

            {/* Sun circle (3.4s - 4.9s) */}
            <circle 
              cx="120" 
              cy="100" 
              r="22" 
              stroke="#eab308" 
              strokeWidth="3.5" 
              fill="none" 
              className="doodle-stroke" 
              style={{ animationDelay: '1.0s', animationDuration: '0.6s' }}
            />
            {/* Sun Rays (4.9s - 6.1s) */}
            <path 
              d="M 120,68 L 120,58 M 120,132 L 120,142 M 88,100 L 78,100 M 152,100 L 162,100 M 97,77 L 90,70 M 143,123 L 150,130 M 97,123 L 90,130 M 143,77 L 150,70" 
              stroke="#eab308" 
              strokeWidth="2.5" 
              className="doodle-stroke" 
              style={{ animationDelay: '1.2s', animationDuration: '0.5s' }}
            />

            {/* Cloud 1 (6.1s - 7.6s) */}
            <path 
              d="M 320,110 C 330,100 350,100 360,110 C 370,105 385,115 380,125 C 375,135 340,135 330,135 C 315,130 315,120 320,110 Z" 
              stroke="#38bdf8" 
              strokeWidth="2.5" 
              fill="none" 
              className="doodle-stroke" 
              style={{ animationDelay: '1.4s', animationDuration: '0.6s' }}
           
            />

            {/* Tree Trunk (9.1s - 10.1s) */}
            <path 
              d="M 690,320 L 690,215" 
              stroke="#d97706" 
              strokeWidth="7" 
              fill="none" 
              className="doodle-stroke" 
              style={{ animationDelay: '1.6s', animationDuration: '0.6s' }}
            />
            {/* Tree Leaves Canopy (10.1s - 12.1s) */}
            <path 
              d="M 690,215 C 650,215 620,185 620,155 C 620,120 655,90 690,100 C 710,90 760,110 760,155 C 760,185 730,215 690,215 Z" 
              stroke="#22c55e" 
              strokeWidth="3.5" 
              fill="none" 
              className="doodle-stroke" 
              style={{ animationDelay: '1.8s', animationDuration: '0.6s' }}
            />
            {/* Tree Leaf Fill Fade */}
            <path 
              d="M 690,215 C 650,215 620,185 620,155 C 620,120 655,90 690,100 C 710,90 760,110 760,155 C 760,185 730,215 690,215 Z" 
              fill="#22c55e" 
              className="doodle-fill" 
              style={{ animationDelay: '2.0s' }}
            />

            {/* Slide ladder leg (12.1s - 13.6s) */}
            <path 
              d="M 240,185 L 205,320" 
              stroke="#94a3b8" 
              strokeWidth="3" 
              fill="none" 
              className="doodle-stroke" 
              style={{ animationDelay: '2.2s', animationDuration: '0.6s' }}
            />
            {/* Ladder rungs (13.6s - 14.6s) */}
            <path 
              d="M 230,220 L 220,222 M 223,250 L 213,252 M 216,280 L 206,282" 
              stroke="#94a3b8" 
              strokeWidth="3" 
              className="doodle-stroke" 
              style={{ animationDelay: '2.4s', animationDuration: '0.6s' }}
            />
            {/* Slide blue loop chute curve (14.6s - 16.4s) */}
            <path 
              d="M 240,185 C 310,185 360,250 405,320" 
              stroke="#3b82f6" 
              strokeWidth="4" 
              fill="none" 
              className="doodle-stroke" 
              style={{ animationDelay: '2.6s', animationDuration: '0.6s' }}
            />
            {/* Slide support brace leg (16.4s - 17.2s) */}
            <path 
              d="M 345,245 L 345,320" 
              stroke="#94a3b8" 
              strokeWidth="3" 
              fill="none" 
              className="doodle-stroke" 
              style={{ animationDelay: '2.8s', animationDuration: '0.6s' }}
            />

            {/* Stick Parent figure body & legs (17.2s - 18.7s) */}
            <circle 
              cx="130" 
              cy="212" 
              r="11" 
              stroke="#f1f5f9" 
              strokeWidth="3" 
              fill="none" 
              className="doodle-stroke" 
              style={{ animationDelay: '3.0s', animationDuration: '0.6s' }}
            />
            <path 
              d="M 130,223 L 130,270" 
              stroke="#f1f5f9" 
              strokeWidth="3" 
              className="doodle-stroke" 
              style={{ animationDelay: '3.2s', animationDuration: '0.6s' }}
            />
            <path 
              d="M 130,270 L 120,320 M 130,270 L 140,320" 
              stroke="#f1f5f9" 
              strokeWidth="3" 
              className="doodle-stroke" 
              style={{ animationDelay: '3.4s', animationDuration: '0.6s' }}
            />

            {/* Stroller pram push bar & handle carriage chassis (18.7s - 20.5s) */}
            <path 
              d="M 130,238 Q 155,248 175,265 L 188,275 M 188,275 L 235,275 Q 240,250 215,250 L 188,250 Z" 
              stroke="#f1f5f9" 
              strokeWidth="3" 
              fill="none" 
              className="doodle-stroke" 
              style={{ animationDelay: '3.6s', animationDuration: '0.6s' }}
            />
            {/* Stroller rounded pram dome cover (20.5s - 21.5s) */}
            <path 
              d="M 210,250 C 210,222 238,222 238,250 Z" 
              stroke="#60a5fa" 
              strokeWidth="3" 
              fill="none" 
              className="doodle-stroke" 
              style={{ animationDelay: '3.8s', animationDuration: '0.6s' }}
            />
            <path 
              d="M 210,250 C 210,222 238,222 238,250 Z" 
              fill="#3b82f6" 
              className="doodle-fill" 
              style={{ animationDelay: '4.0s' }}
            />
            {/* Stroller axles & wheel hubs (21.5s - 22.7s) */}
            <circle 
              cx="195" 
              cy="310" 
              r="10" 
              stroke="#f1f5f9" 
              strokeWidth="3" 
              fill="none" 
              className="doodle-stroke" 
              style={{ animationDelay: '4.2s', animationDuration: '0.6s' }}
            />
            <circle 
              cx="225" 
              cy="310" 
              r="10" 
              stroke="#f1f5f9" 
              strokeWidth="3" 
              fill="none" 
              className="doodle-stroke" 
              style={{ animationDelay: '4.4s', animationDuration: '0.6s' }}
            />
            <path 
              d="M 195,275 L 195,310 M 225,275 L 225,310" 
              stroke="#f1f5f9" 
              strokeWidth="2.5" 
              className="doodle-stroke" 
              style={{ animationDelay: '4.6s', animationDuration: '0.6s' }}
            />

            {/* Child 1 (running / playing) (22.7s - 24.5s) */}
            <circle 
              cx="490" 
              cy="225" 
              r="9" 
              stroke="#f1f5f9" 
              strokeWidth="3" 
              fill="none" 
              className="doodle-stroke" 
              style={{ animationDelay: '4.8s', animationDuration: '0.6s' }}
            />
            <path 
              d="M 490,234 L 490,265" 
              stroke="#f1f5f9" 
              strokeWidth="3" 
              className="doodle-stroke" 
              style={{ animationDelay: '5.0s', animationDuration: '0.6s' }}
            />
            <path 
              d="M 490,265 Q 475,275 465,305 M 490,265 Q 505,285 520,295" 
              stroke="#f1f5f9" 
              strokeWidth="3" 
              fill="none" 
              className="doodle-stroke" 
              style={{ animationDelay: '5.2s', animationDuration: '0.6s' }}
            />
            <path 
              d="M 490,242 Q 470,235 460,250 M 490,242 Q 510,255 525,250" 
              stroke="#f1f5f9" 
              strokeWidth="3" 
              fill="none" 
              className="doodle-stroke" 
              style={{ animationDelay: '5.4s', animationDuration: '0.6s' }}
            />

            {/* Child 2 (happy / arms raised) (24.5s - 26.0s) */}
            <circle 
              cx="580" 
              cy="238" 
              r="7" 
              stroke="#f1f5f9" 
              strokeWidth="3" 
              fill="none" 
              className="doodle-stroke" 
              style={{ animationDelay: '5.6s', animationDuration: '0.6s' }}
            />
            <path 
              d="M 580,245 L 580,272" 
              stroke="#f1f5f9" 
              strokeWidth="3" 
              className="doodle-stroke" 
              style={{ animationDelay: '5.8s', animationDuration: '0.6s' }}
            />
            <path 
              d="M 580,272 L 570,305 M 580,272 L 590,305" 
              stroke="#f1f5f9" 
              strokeWidth="3" 
              className="doodle-stroke" 
              style={{ animationDelay: '6.0s', animationDuration: '0.6s' }}
            />
            <path 
              d="M 580,255 L 565,242 M 580,255 L 595,242" 
              stroke="#f1f5f9" 
              strokeWidth="3" 
              className="doodle-stroke" 
              style={{ animationDelay: '6.2s', animationDuration: '0.6s' }}
            />
          </svg>
        </div>

        {/* 3D Tactile Action Buttons (Elevated to z-30 foreground) */}
        <div className="relative z-30 flex flex-col sm:flex-row items-center justify-center gap-6 mb-4">
          <a href="#features">
            <button className="btn-3d-pink bg-pink-600 hover:bg-pink-500 text-white font-extrabold px-8 py-3 rounded-xl border border-pink-400 flex items-center gap-2">
              Learn More <ArrowDown className="w-4 h-4 animate-bounce" />
            </button>
          </a>
          <a href="#auth">
            <button className="btn-3d-blue bg-blue-600 hover:bg-blue-500 text-white font-extrabold px-8 py-3 rounded-xl border border-blue-400 flex items-center gap-2">
              Access Dashboard
            </button>
          </a>
        </div>

      </main>

      {/* CORE FEATURES SECTION (Strictly aligned 3-columns side-by-side horizontally) */}
      <section id="features" className="relative z-30 bg-[#0b0f19] border-t border-slate-900 py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold text-white tracking-tight mb-4">cryOS Features</h2>
            <p className="text-slate-400 max-w-xl mx-auto text-sm leading-relaxed">
              Designed explicitly around acoustic analysis, predictive health modeling, and ambient climate controls.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            
            {/* Box 1 */}
            <div className="bg-[#111827] rounded-xl p-6 border border-slate-800 flex flex-col gap-4">
              <div className="w-12 h-12 rounded-lg bg-pink-500/10 border border-pink-500/30 flex items-center justify-center">
                <Volume2 className="w-6 h-6 text-pink-400" />
              </div>
              <h3 className="text-lg font-bold text-white">Cry Acoustics Engine</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Our artificial neural system isolates whimpers, yawning, and fussing frequencies from typical nursery white noise to decode precise needs.
              </p>
            </div>

            {/* Box 2 */}
            <div className="bg-[#111827] rounded-xl p-6 border border-slate-800 flex flex-col gap-4">
              <div className="w-12 h-12 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center">
                <Clock className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-lg font-bold text-white">Sleep Window Mapping</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                By modeling tiredness indexes and ambient lighting conditions, cryOS predicts exactly when your baby's sleep window is opening.
              </p>
            </div>

            {/* Box 3 */}
            <div className="bg-[#111827] rounded-xl p-6 border border-slate-800 flex flex-col gap-4">
              <div className="w-12 h-12 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-lg font-bold text-white">Secure Local Feed</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Privacy-first hardware orientation. Your audio streams are processed and evaluated completely locally on the home monitor device.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* AUTH CONTAINER SECTION (z-30 layer) */}
      <section id="auth" className="relative z-30 py-24 bg-[#090d16] border-t border-slate-900/60">
        <div className="max-w-md mx-auto px-6">
          <div className="bg-[#111827] rounded-2xl border border-slate-800 shadow-2xl overflow-hidden p-6 sm:p-8">
            
            <div className="flex gap-4 p-1 bg-slate-950 rounded-xl mb-6">
              <button
                onClick={() => setAuthTab('signup')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${authTab === 'signup' ? 'bg-pink-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
              >
                Create Account
              </button>
              <button
                onClick={() => setAuthTab('login')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${authTab === 'login' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
              >
                Control Sign In
              </button>
            </div>

            <form onSubmit={handleDemoSubmit} className="flex flex-col gap-4 text-xs">
                
                {authTab === 'signup' && (
                  <div>
                    <label className="block text-slate-400 font-bold uppercase tracking-wider mb-1">Parent Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Sarah"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-pink-500 transition-colors" 
                      required
                    />
                  </div>
                )}

                <div>
                  <label className="block text-slate-400 font-bold uppercase tracking-wider mb-1">Email Address</label>
                  <input 
                    type="email" 
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="sarah@cryos.local"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-pink-500 transition-colors" 
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold uppercase tracking-wider mb-1">Hardware Pin / Key</label>
                  <input 
                    type="password" 
                    value={loginPass}
                    onChange={(e) => setLoginPass(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-pink-500 transition-colors" 
                    required
                  />
                </div>

                {authTab === 'signup' ? (
                  <button 
                    type="submit" 
                    className="btn-3d-pink w-full bg-pink-600 hover:bg-pink-500 text-white font-extrabold py-3 rounded-xl border border-pink-400 mt-2 text-sm"
                  >
                    Register Local Hub
                  </button>
                ) : (
                  <button 
                    type="submit" 
                    className="btn-3d-blue w-full bg-blue-600 hover:bg-blue-500 text-white font-extrabold py-3 rounded-xl border border-blue-400 mt-2 text-sm"
                  >
                    Log In to Control Panel
                  </button>
                )}

              </form>

          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="relative z-30 bg-[#090d16] border-t border-slate-900 py-8 text-center text-xs text-slate-600">
        <p>© {new Date().getFullYear()} cryOS.</p>
      </footer>
    </div>
  );
}