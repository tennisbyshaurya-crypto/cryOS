import React, { useEffect, useRef } from 'react';

export default function FlyingPlane() {
  const pathRef = useRef<SVGPathElement>(null);
  const planeRef = useRef<HTMLDivElement>(null);
  const distanceRef = useRef(0);
  const speed = 1.1;

  const flightPath = "M 100 250 C 300 100, 400 450, 600 300 C 800 150, 950 450, 1100 250 C 1220 180, 1220 420, 1100 350 C 900 200, 750 500, 600 350 C 450 200, 300 500, 100 350 C -20 420, -20 180, 100 250";

  useEffect(() => {
    let animId: number;
    const tick = () => {
      const path = pathRef.current;
      const plane = planeRef.current;
      if (!path || !plane) {
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

      animId = requestAnimationFrame(tick);
    };
    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div className="fixed inset-0 w-screen h-screen pointer-events-none z-20 overflow-hidden">
      <svg viewBox="0 0 1200 600" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice">
        <path ref={pathRef} d={flightPath} fill="none" stroke="none" />
      </svg>
      <div ref={planeRef} className="absolute w-[120px] h-[120px] top-0 left-0 will-change-transform" style={{ transformOrigin: '60px 60px' }}>
        <svg width="120" height="120" viewBox="0 0 200 200">
          <defs>
            <linearGradient id="fuselageGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f8fafc" />
              <stop offset="100%" stopColor="#cbd5e1" />
            </linearGradient>
          </defs>
          <path d="M 30,110 C 30,90 60,70 120,70 C 160,70 185,90 185,105 C 185,115 170,135 120,135 C 60,135 30,130 30,110 Z" fill="url(#fuselageGrad)" stroke="#0f172a" strokeWidth="5" />
          <path d="M 32,110 C 55,100 110,95 183,105 C 183,109 178,118 170,121 C 110,110 55,115 32,115 Z" fill="#ec4899" stroke="#0f172a" strokeWidth="1.5" />
          <circle cx="75" cy="106" r="6" fill="#38bdf8" stroke="#0f172a" strokeWidth="2.5" />
          <circle cx="95" cy="106" r="6" fill="#38bdf8" stroke="#0f172a" strokeWidth="2.5" />
          <circle cx="115" cy="106" r="6" fill="#38bdf8" stroke="#0f172a" strokeWidth="2.5" />
          <circle cx="135" cy="106" r="6" fill="#38bdf8" stroke="#0f172a" strokeWidth="2.5" />
          <path d="M 35,95 L 20,40 C 25,35 45,35 50,45 L 65,80 Z" fill="#3b82f6" stroke="#0f172a" strokeWidth="5" strokeLinejoin="round" />
          <path d="M 25,105 C 15,105 10,112 15,115 C 25,118 45,115 45,112 Z" fill="#1d4ed8" stroke="#0f172a" strokeWidth="3.5" />
          <path d="M 115,72 C 120,55 160,55 170,72 C 172,78 165,88 150,88 C 130,88 118,80 115,72 Z" fill="#ffffff" stroke="#0f172a" strokeWidth="5" />
          <ellipse cx="138" cy="71" rx="9" ry="12" fill="#ffffff" />
          <circle cx="140" cy="72" r="4.5" fill="#000000" />
          <circle cx="138" cy="69" r="2" fill="#ffffff" />
          <ellipse cx="155" cy="71" rx="9" ry="12" fill="#ffffff" />
          <circle cx="157" cy="72" r="4.5" fill="#000000" />
          <circle cx="155" cy="69" r="2" fill="#ffffff" />
          <path d="M 158,110 C 160,124 178,122 181,108" fill="#881337" stroke="#0f172a" strokeWidth="4" strokeLinecap="round" />
          <path d="M 165,117 C 168,113 175,113 177,117 Z" fill="#fda4af" />
          <rect x="90" y="132" width="40" height="20" rx="10" fill="#94a3b8" stroke="#0f172a" strokeWidth="4" />
          <circle cx="110" cy="142" r="6" fill="#3b82f6" stroke="#0f172a" strokeWidth="2" />
        </svg>
      </div>
    </div>
  );
}