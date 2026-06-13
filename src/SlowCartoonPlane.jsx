// src/SlowCartoonPlane.jsx
import React, { useEffect, useRef, useState } from 'react';

export default function SlowCartoonPlane() {
  const pathRef = useRef(null);
  const planeRef = useRef(null);
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  // Animation values kept in refs for direct DOM updates at 60fps (no lag)
  const distanceRef = useRef(0);
  const speed = 1.2; // Slow, gentle cruising speed
  const smokeParticlesRef = useRef([]);

  // Loop path coordinates within a stable 1200x800 coordinate box
  // This closed figure-eight allows the plane to fly indefinitely
  const flightPathData = "M 100 400 C 100 120, 450 120, 600 400 C 750 680, 1100 680, 1100 400 C 1100 120, 750 120, 600 400 C 450 680, 100 680, 100 400";

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

      // Move along the path
      distanceRef.current = (distanceRef.current + speed) % totalLength;
      
      const currentPoint = path.getPointAtLength(distanceRef.current);
      const aheadPoint = path.getPointAtLength((distanceRef.current + 2) % totalLength);

      // Calculate heading angle
      const dy = aheadPoint.y - currentPoint.y;
      const dx = aheadPoint.x - currentPoint.x;
      const angle = Math.atan2(dy, dx) * (180 / Math.PI);

      // Direct style update for optimal performance
      plane.style.transform = `translate(${currentPoint.x - 60}px, ${currentPoint.y - 60}px) rotate(${angle}deg)`;

      // Handle Canvas smoke trails
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, 1200, 800);

      // Emit a new cartoon puff occasionally
      if (Math.random() < 0.15) {
        const rad = (angle * Math.PI) / 180;
        const tailX = currentPoint.x - Math.cos(rad) * 40;
        const tailY = currentPoint.y - Math.sin(rad) * 40;

        smokeParticlesRef.current.push({
          x: tailX,
          y: tailY,
          size: Math.random() * 5 + 8,
          alpha: 0.6,
          life: 1.0,
          decay: 0.008
        });
      }

      // Draw and fade smoke particles
      smokeParticlesRef.current.forEach((p) => {
        p.alpha -= p.decay;
        p.life -= p.decay;
        p.size += 0.08; // Expand slowly

        if (p.life > 0) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(241, 245, 249, ${p.alpha})`;
          ctx.fill();
        }
      });
      smokeParticlesRef.current = smokeParticlesRef.current.filter(p => p.life > 0);

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 w-screen h-screen pointer-events-none z-50 overflow-hidden"
    >
      <svg 
        viewBox="0 0 1200 800" 
        className="absolute inset-0 w-full h-full"
        preserveAspectRatio="xMidYMid slice"
      >
        {/* Invisible SVG path we measure for flight coordinates */}
        <path
          ref={pathRef}
          d={flightPathData}
          fill="none"
          stroke="none"
        />
      </svg>

      {/* Canvas layer for rendering the smoke trails */}
      <canvas
        ref={canvasRef}
        width={1200}
        height={800}
        className="absolute inset-0 w-full h-full opacity-60"
        style={{ objectFit: 'cover' }}
      />

      {/* The Cartoon Plane */}
      <div 
        ref={planeRef} 
        className="absolute w-[120px] h-[120px] top-0 left-0 will-change-transform"
        style={{ transformOrigin: '60px 60px' }}
      >
        <svg width="120" height="120" viewBox="0 0 200 200">
          {/* Fuselage - Main White Body */}
          <path
            d="M 30,110 C 30,90 60,70 120,70 C 160,70 185,90 185,105 C 185,115 170,135 120,135 C 60,135 30,130 30,110 Z"
            fill="url(#planeFuselage)"
            stroke="#0f172a"
            strokeWidth="5"
          />

          {/* Red Stripe */}
          <path
            d="M 32,110 C 55,100 110,95 183,105 C 183,109 178,118 170,121 C 110,110 55,115 32,115 Z"
            fill="#ef4444"
            stroke="#0f172a"
            strokeWidth="1.5"
          />

          {/* Windows */}
          <circle cx="75" cy="106" r="6" fill="#38bdf8" stroke="#0f172a" strokeWidth="3" />
          <circle cx="95" cy="106" r="6" fill="#38bdf8" stroke="#0f172a" strokeWidth="3" />
          <circle cx="115" cy="106" r="6" fill="#38bdf8" stroke="#0f172a" strokeWidth="3" />
          <circle cx="135" cy="106" r="6" fill="#38bdf8" stroke="#0f172a" strokeWidth="3" />

          {/* Vertical Tail Fin */}
          <path
            d="M 35,95 L 20,40 C 25,35 45,35 50,45 L 65,80 Z"
            fill="#3b82f6"
            stroke="#0f172a"
            strokeWidth="5"
            strokeLinejoin="round"
          />
          {/* Horizontal Tail Wing */}
          <path
            d="M 25,105 C 15,105 10,112 15,115 C 25,118 45,115 45,112 Z"
            fill="#1d4ed8"
            stroke="#0f172a"
            strokeWidth="3.5"
          />

          {/* Windshield / Happy Eyes Canopy */}
          <path
            d="M 115,72 C 120,55 160,55 170,72 C 172,78 165,88 150,88 C 130,88 118,80 115,72 Z"
            fill="#ffffff"
            stroke="#0f172a"
            strokeWidth="5"
            strokeLinejoin="round"
          />
          {/* Left Pupil */}
          <ellipse cx="138" cy="71" rx="9" ry="12" fill="#ffffff" />
          <circle cx="140" cy="72" r="4.5" fill="#000000" />
          <circle cx="138" cy="69" r="2" fill="#ffffff" />
          
          {/* Right Pupil */}
          <ellipse cx="155" cy="71" rx="9" ry="12" fill="#ffffff" />
          <circle cx="157" cy="72" r="4.5" fill="#000000" />
          <circle cx="155" cy="69" r="2" fill="#ffffff" />

          {/* Smile Mouth */}
          <path
            d="M 158,110 C 160,124 178,122 181,108"
            fill="#881337"
            stroke="#0f172a"
            strokeWidth="4"
            strokeLinecap="round"
          />
          {/* Tongue */}
          <path
            d="M 165,117 C 168,113 175,113 177,117 Z"
            fill="#fda4af"
          />

          {/* Under-Wing Engine Turbine Pod */}
          <rect x="90" y="132" width="40" height="20" rx="10" fill="#94a3b8" stroke="#0f172a" strokeWidth="4" />
          <circle cx="110" cy="142" r="6" fill="#3b82f6" stroke="#0f172a" strokeWidth="2" />
          <line x1="98" y1="142" x2="122" y2="142" stroke="#f1f5f9" strokeWidth="2.5" strokeLinecap="round" />

          <defs>
            <linearGradient id="planeFuselage" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f8fafc" />
              <stop offset="65%" stopColor="#f1f5f9" />
              <stop offset="100%" stopColor="#cbd5e1" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>
  );
}