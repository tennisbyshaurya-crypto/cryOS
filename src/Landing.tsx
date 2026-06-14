import React, { useState, useEffect, useRef } from 'react';
import { Heart, ArrowDown, ArrowUp, Volume2, Clock, ShieldCheck, CheckCircle2, TrendingUp, Thermometer, Mic } from 'lucide-react';
import FlyingPlane from './FlyingPlane';
import logoImg from './assets/logo.png';
import titleImg from './assets/title.png';

interface LandingProps {
  onLogin: () => void;
}

interface FloatingHeart {
  id: number;
  left: number;
  top: number;
  delay: number;
  duration: number;
}

// Cheerful greeting messages
const loginGreetings = [
  "So glad you're back! 💙",
  "Welcome home, parent! 🏠",
  "Ready for another great day? ☀️",
  "Nice to see you again! 😊",
  "Your baby missed you! 👶",
  "Let's check on your little one 🎈",
];

const signupGreetings = [
  "Yay! You're joining the family! 🎉",
  "Welcome to cryOS! 🍼",
  "Let's get you set up – it's easy! ✨",
  "So excited to have you! 💕",
  "Start your peaceful journey 🌈",
  "Hello, new parent hero! 🦸",
];

export default function Landing({ onLogin }: LandingProps) {
  const [authTab, setAuthTab] = useState<'signup' | 'login'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [demoLoggedIn, setDemoLoggedIn] = useState(false);
  const [hearts, setHearts] = useState<FloatingHeart[]>([]);
  const heartIconRef = useRef<SVGSVGElement>(null);
  const [showBackToTop, setShowBackToTop] = useState(false);
  
  const [loginGreeting, setLoginGreeting] = useState(loginGreetings[0]);
  const [signupGreeting, setSignupGreeting] = useState(signupGreetings[0]);

  useEffect(() => {
    const randomLogin = loginGreetings[Math.floor(Math.random() * loginGreetings.length)];
    const randomSignup = signupGreetings[Math.floor(Math.random() * signupGreetings.length)];
    setLoginGreeting(randomLogin);
    setSignupGreeting(randomSignup);
  }, [authTab]);

  useEffect(() => {
    setLoginGreeting(loginGreetings[Math.floor(Math.random() * loginGreetings.length)]);
    setSignupGreeting(signupGreetings[Math.floor(Math.random() * signupGreetings.length)]);
  }, []);

  useEffect(() => {
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
    window.scrollTo(0, 0);
    requestAnimationFrame(() => {
      window.scrollTo(0, 0);
    });
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setDemoLoggedIn(true);
      setTimeout(() => {
        onLogin();
      }, 1500);
    }
  };

  const scrollToFeatures = () => {
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleHeartClick = (e: React.MouseEvent) => {
    if (heartIconRef.current) {
      const rect = heartIconRef.current.getBoundingClientRect();
      const topCenterX = rect.left + rect.width / 2 - 50;
      const topY = rect.top - 50;
      
      const newHearts: FloatingHeart[] = Array.from({ length: 14 }, (_, i) => ({
        id: Date.now() + i,
        left: topCenterX + (Math.random() - 0.5) * 24,
        top: topY + (Math.random() - 0.5) * 10,
        delay: Math.random() * 0.3,
        duration: 0.8 + Math.random() * 0.7,
      }));
      
      setHearts(prev => [...prev, ...newHearts]);
      setTimeout(() => {
        setHearts(prev => prev.filter(heart => !newHearts.some(h => h.id === heart.id)));
      }, 1500);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#090d16] overflow-x-hidden text-slate-100 flex flex-col z-0">
      {hearts.map(heart => (
        <div
          key={heart.id}
          className="fixed pointer-events-none z-50 text-2xl animate-float-heart"
          style={{
            left: heart.left,
            top: heart.top,
            animationDelay: `${heart.delay}s`,
            animationDuration: `${heart.duration}s`,
          }}
        >
          ❤️
        </div>
      ))}

      <div className="absolute inset-0 bg-glow-radial pointer-events-none z-0" />
      <div className="absolute inset-0 bg-glow-pink pointer-events-none z-0" />

      {/* Drifting clouds (unchanged) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-10 opacity-30">
        <div className="absolute text-slate-700/25 animate-drift-slow" style={{ top: '8%', width: '130px', animation: 'cloudDrift 110s linear infinite', animationDelay: '-15s' }}>
          <svg viewBox="0 0 100 40" fill="currentColor"><path d="M10 30 Q10 20 20 20 Q25 10 40 10 Q55 10 60 20 Q70 20 70 30 Q75 35 70 40 L10 40 Z" /></svg>
        </div>
        <div className="absolute text-slate-700/20 animate-drift-medium" style={{ top: '22%', width: '160px', animation: 'cloudDrift 75s linear infinite', animationDelay: '-40s' }}>
          <svg viewBox="0 0 100 40" fill="currentColor"><path d="M10 30 Q10 15 25 15 Q35 5 50 5 Q70 5 75 20 Q90 20 90 30 L10 30 Z" /></svg>
        </div>
        <div className="absolute text-slate-700/35 animate-drift-fast" style={{ top: '35%', width: '110px', animation: 'cloudDrift 42s linear infinite', animationDelay: '-5s' }}>
          <svg viewBox="0 0 100 40" fill="currentColor"><path d="M10 25 Q15 15 30 15 Q40 5 55 5 Q70 10 70 20 L10 20 Z" /></svg>
        </div>
        <div className="absolute text-slate-700/15 animate-drift-slow" style={{ top: '48%', width: '150px', animation: 'cloudDrift 95s linear infinite', animationDelay: '-65s' }}>
          <svg viewBox="0 0 100 40" fill="currentColor"><path d="M10 30 Q10 20 20 20 Q25 10 40 10 Q55 10 60 20 Q70 20 70 30 Q75 35 70 40 L10 40 Z" /></svg>
        </div>
        <div className="absolute text-slate-700/20 animate-drift-medium" style={{ top: '62%', width: '120px', animation: 'cloudDrift 68s linear infinite', animationDelay: '-25s' }}>
          <svg viewBox="0 0 100 40" fill="currentColor"><path d="M10 30 Q10 15 25 15 Q35 5 50 5 Q70 5 75 20 Q90 20 90 30 L10 30 Z" /></svg>
        </div>
        <div className="absolute text-slate-700/30 animate-drift-fast" style={{ top: '75%', width: '100px', animation: 'cloudDrift 38s linear infinite', animationDelay: '-12s' }}>
          <svg viewBox="0 0 100 40" fill="currentColor"><path d="M10 25 Q15 15 30 15 Q40 5 55 5 Q70 10 70 20 L10 20 Z" /></svg>
        </div>
        <div className="absolute text-slate-700/15 animate-drift-slow" style={{ top: '88%', width: '140px', animation: 'cloudDrift 115s linear infinite', animationDelay: '-80s' }}>
          <svg viewBox="0 0 100 40" fill="currentColor"><path d="M10 30 Q10 20 20 20 Q25 10 40 10 Q55 10 60 20 Q70 20 70 30 Q75 35 70 40 L10 40 Z" /></svg>
        </div>
        <div className="absolute text-slate-700/25 animate-drift-medium" style={{ top: '15%', width: '125px', animation: 'cloudDrift 55s linear infinite', animationDelay: '-50s' }}>
          <svg viewBox="0 0 100 40" fill="currentColor"><path d="M10 30 Q10 15 25 15 Q35 5 50 5 Q70 5 75 20 Q90 20 90 30 L10 30 Z" /></svg>
        </div>
      </div>

      <FlyingPlane />

      {/* Header: 25px from top, 50px from left, no right button */}
      <header className="relative z-30 w-full flex items-center justify-start" style={{ paddingTop: '25px', paddingLeft: '50px' }}>
        <div className="flex items-center">
          <img 
            src={logoImg} 
            alt="Logo" 
            className="w-56 h-auto max-h-40 object-contain transition-all duration-300 hover:scale-105" 
          />
        </div>
      </header>

      {/* Hero section - centered vertically */}
      <section className="relative z-30 flex-1 flex items-center justify-center px-6" style={{ minHeight: 'calc(100vh - 80px)' }}>
        <div className="max-w-7xl mx-auto w-full flex flex-col items-center text-center -translate-y-[6.25rem]">
          {/* Clickable heart pill */}
          <div 
            onClick={handleHeartClick}
            className="group inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/30 px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold text-indigo-300 backdrop-blur-md select-none cursor-pointer transition-all hover:scale-105 active:scale-95"
          >
            <Heart 
              ref={heartIconRef}
              className="w-4 h-4 text-pink-400 group-hover:scale-125 group-hover:fill-pink-400 transition-all duration-300 ease-in-out" 
            />
            Decode Every Cry. Protect Everyone's peace.
          </div>

          {/* "Introducing..." moved down further (mt-9) */}
          <p className="text-sm sm:text-base font-semibold tracking-widest text-indigo-400/80 uppercase select-none mt-9">
            Introducing...
          </p>

          {/* Center logo */}
          <div className="my-6">
            <img
              src={titleImg}
              alt="cryOS"
              className="h-36 sm:h-44 md:h-52 w-auto object-contain drop-shadow-[0_0_35px_rgba(99,102,241,0.4)] mx-auto"
            />
          </div>

          {/* SVG Doodle – moved up */}
          <div className="w-full max-w-4xl h-[380px] pointer-events-none mx-auto opacity-90 -mt-8">
            <svg viewBox="0 0 800 400" className="w-full h-full select-none">
              <path d="M 50,320 L 750,320" stroke="#4ade80" strokeWidth="4" fill="none" className="doodle-stroke" style={{ animationDelay: '0.2s', animationDuration: '2.0s' }} />
              <path d="M 70,320 L 65,308 M 70,320 L 75,310" stroke="#4ade80" strokeWidth="2.5" className="doodle-stroke" style={{ animationDelay: '0.4s', animationDuration: '0.6s' }} />
              <path d="M 680,320 L 675,310 M 680,320 L 685,308" stroke="#4ade80" strokeWidth="2.5" className="doodle-stroke" style={{ animationDelay: '0.8s', animationDuration: '0.6s' }} />
              <circle cx="120" cy="100" r="22" stroke="#eab308" strokeWidth="3.5" fill="none" className="doodle-stroke" style={{ animationDelay: '1.0s', animationDuration: '0.6s' }} />
              <path d="M 120,68 L 120,58 M 120,132 L 120,142 M 88,100 L 78,100 M 152,100 L 162,100 M 97,77 L 90,70 M 143,123 L 150,130 M 97,123 L 90,130 M 143,77 L 150,70" stroke="#eab308" strokeWidth="2.5" className="doodle-stroke" style={{ animationDelay: '1.2s', animationDuration: '0.5s' }} />
              <path d="M 320,110 C 330,100 350,100 360,110 C 370,105 385,115 380,125 C 375,135 340,135 330,135 C 315,130 315,120 320,110 Z" stroke="#38bdf8" strokeWidth="2.5" fill="none" className="doodle-stroke" style={{ animationDelay: '1.4s', animationDuration: '0.6s' }} />
              <path d="M 690,320 L 690,215" stroke="#d97706" strokeWidth="7" fill="none" className="doodle-stroke" style={{ animationDelay: '1.6s', animationDuration: '0.6s' }} />
              <path d="M 690,215 C 650,215 620,185 620,155 C 620,120 655,90 690,100 C 710,90 760,110 760,155 C 760,185 730,215 690,215 Z" stroke="#22c55e" strokeWidth="3.5" fill="none" className="doodle-stroke" style={{ animationDelay: '1.8s', animationDuration: '0.6s' }} />
              <path d="M 690,215 C 650,215 620,185 620,155 C 620,120 655,90 690,100 C 710,90 760,110 760,155 C 760,185 730,215 690,215 Z" fill="#22c55e" className="doodle-fill" style={{ animationDelay: '2.0s' }} />
              <path d="M 240,185 L 205,320" stroke="#94a3b8" strokeWidth="3" fill="none" className="doodle-stroke" style={{ animationDelay: '2.2s', animationDuration: '0.6s' }} />
              <path d="M 230,220 L 220,222 M 223,250 L 213,252 M 216,280 L 206,282" stroke="#94a3b8" strokeWidth="3" className="doodle-stroke" style={{ animationDelay: '2.4s', animationDuration: '0.6s' }} />
              <path d="M 240,185 C 310,185 360,250 405,320" stroke="#3b82f6" strokeWidth="4" fill="none" className="doodle-stroke" style={{ animationDelay: '2.6s', animationDuration: '0.6s' }} />
              <path d="M 345,245 L 345,320" stroke="#94a3b8" strokeWidth="3" fill="none" className="doodle-stroke" style={{ animationDelay: '2.8s', animationDuration: '0.6s' }} />
              <circle cx="130" cy="212" r="11" stroke="#f1f5f9" strokeWidth="3" fill="none" className="doodle-stroke" style={{ animationDelay: '3.0s', animationDuration: '0.6s' }} />
              <path d="M 130,223 L 130,270" stroke="#f1f5f9" strokeWidth="3" className="doodle-stroke" style={{ animationDelay: '3.2s', animationDuration: '0.6s' }} />
              <path d="M 130,270 L 120,320 M 130,270 L 140,320" stroke="#f1f5f9" strokeWidth="3" className="doodle-stroke" style={{ animationDelay: '3.4s', animationDuration: '0.6s' }} />
              <path d="M 130,238 Q 155,248 175,265 L 188,275 M 188,275 L 235,275 Q 240,250 215,250 L 188,250 Z" stroke="#f1f5f9" strokeWidth="3" fill="none" className="doodle-stroke" style={{ animationDelay: '3.6s', animationDuration: '0.6s' }} />
              <path d="M 210,250 C 210,222 238,222 238,250 Z" stroke="#60a5fa" strokeWidth="3" fill="none" className="doodle-stroke" style={{ animationDelay: '3.8s', animationDuration: '0.6s' }} />
              <path d="M 210,250 C 210,222 238,222 238,250 Z" fill="#3b82f6" className="doodle-fill" style={{ animationDelay: '4.0s' }} />
              <circle cx="195" cy="310" r="10" stroke="#f1f5f9" strokeWidth="3" fill="none" className="doodle-stroke" style={{ animationDelay: '4.2s', animationDuration: '0.6s' }} />
              <circle cx="225" cy="310" r="10" stroke="#f1f5f9" strokeWidth="3" fill="none" className="doodle-stroke" style={{ animationDelay: '4.4s', animationDuration: '0.6s' }} />
              <path d="M 195,275 L 195,310 M 225,275 L 225,310" stroke="#f1f5f9" strokeWidth="2.5" className="doodle-stroke" style={{ animationDelay: '4.6s', animationDuration: '0.6s' }} />
            </svg>
          </div>

          {/* Action buttons moved extremely close to SVG */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 -mt-4 pb-24">
            <button
              onClick={scrollToFeatures}
              className="btn-3d-pink bg-pink-600 hover:bg-pink-500 text-white font-extrabold px-8 py-3 rounded-xl border border-pink-400 flex items-center gap-2"
            >
              Learn More <ArrowDown className="w-4 h-4 animate-bounce" />
            </button>
            <button
              onClick={() => {
                setAuthTab('login');
                setTimeout(() => {
                  document.getElementById('auth')?.scrollIntoView({ behavior: 'smooth' });
                }, 50);
              }}
              className="btn-3d-blue bg-blue-600 hover:bg-blue-500 text-white font-extrabold px-8 py-3 rounded-xl border border-blue-400 flex items-center gap-2"
            >
              Access Dashboard
            </button>
          </div>
        </div>
      </section>

      {/* Features section – two rows, full height */}
      <section id="features" className="relative z-30 bg-[#0b0f19] border-t border-slate-900 w-full min-h-screen flex items-center">
        <div className="max-w-7xl mx-auto px-6 py-16 md:py-24 w-full">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-4xl font-extrabold text-white tracking-tight mb-4">cryOS Features</h2>
            <p className="text-slate-400 max-w-xl mx-auto text-sm leading-relaxed">
              Designed explicitly around acoustic analysis, predictive health modeling, and ambient climate controls.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 mb-8 lg:mb-12">
            <div className="bg-[#111827] rounded-xl p-6 border border-slate-800 flex flex-col gap-4">
              <div className="w-12 h-12 rounded-lg bg-pink-500/10 border border-pink-500/30 flex items-center justify-center">
                <Volume2 className="w-6 h-6 text-pink-400" />
              </div>
              <h3 className="text-lg font-bold text-white">Cry Acoustics Engine</h3>
              <p className="text-xs text-slate-400 leading-relaxed">Our artificial neural system isolates whimpers, yawning, and fussing frequencies from typical nursery white noise to decode precise needs.</p>
            </div>
            <div className="bg-[#111827] rounded-xl p-6 border border-slate-800 flex flex-col gap-4">
              <div className="w-12 h-12 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center">
                <Clock className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-lg font-bold text-white">Sleep Window Mapping</h3>
              <p className="text-xs text-slate-400 leading-relaxed">By modeling tiredness indexes and ambient lighting conditions, cryOS predicts exactly when your baby's sleep window is opening.</p>
            </div>
            <div className="bg-[#111827] rounded-xl p-6 border border-slate-800 flex flex-col gap-4">
              <div className="w-12 h-12 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-lg font-bold text-white">Secure Local Feed</h3>
              <p className="text-xs text-slate-400 leading-relaxed">Privacy-first hardware orientation. Your audio streams are processed and evaluated completely locally on the home monitor device.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            <div className="bg-[#111827] rounded-xl p-6 border border-slate-800 flex flex-col gap-4">
              <div className="w-12 h-12 rounded-lg bg-green-500/10 border border-green-500/30 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-400" />
              </div>
              <h3 className="text-lg font-bold text-white">Trend & Pattern Graphs</h3>
              <p className="text-xs text-slate-400 leading-relaxed">Visualize sleep quality, crying frequency, and feeding patterns over days and weeks. Identify trends to anticipate your baby's evolving routine.</p>
            </div>
            <div className="bg-[#111827] rounded-xl p-6 border border-slate-800 flex flex-col gap-4">
              <div className="w-12 h-12 rounded-lg bg-orange-500/10 border border-orange-500/30 flex items-center justify-center">
                <Thermometer className="w-6 h-6 text-orange-400" />
              </div>
              <h3 className="text-lg font-bold text-white">Temperature Sensing</h3>
              <p className="text-xs text-slate-400 leading-relaxed">Real-time room temperature and humidity monitoring. Get alerts when conditions fall outside your baby's comfort zone for optimal sleep safety.</p>
            </div>
            <div className="bg-[#111827] rounded-xl p-6 border border-slate-800 flex flex-col gap-4">
              <div className="w-12 h-12 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
                <Mic className="w-6 h-6 text-cyan-400" />
              </div>
              <h3 className="text-lg font-bold text-white">Live Monitoring & Recording</h3>
              <p className="text-xs text-slate-400 leading-relaxed">Stream live audio with 24/7 cloud recording (optional). Revisit previous cries, identify changes, and share insights with your pediatrician.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Auth section – full screen, cheerful headers */}
      <section id="auth" className="relative z-30 bg-[#090d16] border-t border-slate-900/60 w-full min-h-screen flex items-center justify-center py-12">
        <div className="max-w-md mx-auto px-6 w-full">
          <div className="bg-[#111827] rounded-2xl border border-slate-800 shadow-2xl overflow-hidden p-6 sm:p-8">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-white">
                {authTab === 'login' ? loginGreeting : signupGreeting}
              </h3>
              <p className="text-sm text-slate-300 mt-1">
                {authTab === 'login' 
                  ? "Access your cryOS control panel" 
                  : "Set up your baby monitor hub in seconds"}
              </p>
            </div>

            <div className="flex gap-4 p-1 bg-slate-950 rounded-xl mb-6">
              <button type="button" onClick={() => setAuthTab('signup')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${authTab === 'signup' ? 'bg-pink-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}>
                Create Account
              </button>
              <button type="button" onClick={() => setAuthTab('login')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${authTab === 'login' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}>
                Control Sign In
              </button>
            </div>

            {demoLoggedIn ? (
              <div className="text-center py-10 flex flex-col items-center gap-3">
                <CheckCircle2 className="w-12 h-12 text-green-400 animate-bounce" />
                <h4 className="text-lg font-bold text-white">Initialization Successful</h4>
                <p className="text-xs text-slate-400 max-w-[240px] mx-auto leading-relaxed">Connecting to cryOS local monitor. Preparing live decoders...</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-xs">
                {authTab === 'signup' && (
                  <div>
                    <label className="block text-slate-400 font-bold uppercase tracking-wider mb-1">Parent Name</label>
                    <input type="text" placeholder="e.g. Sarah" className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-pink-500 transition-colors" required />
                  </div>
                )}
                <div>
                  <label className="block text-slate-400 font-bold uppercase tracking-wider mb-1">Email Address</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="sarah@cryos.local" className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-pink-500 transition-colors" required />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold uppercase tracking-wider mb-1">Hardware Pin / Key</label>
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-pink-500 transition-colors" required />
                </div>
                <button type="submit" className={`btn-3d-${authTab === 'signup' ? 'pink' : 'blue'} w-full ${authTab === 'signup' ? 'bg-pink-600 hover:bg-pink-500' : 'bg-blue-600 hover:bg-blue-500'} text-white font-extrabold py-3 rounded-xl border ${authTab === 'signup' ? 'border-pink-400' : 'border-blue-400'} mt-2 text-sm`}>
                  {authTab === 'signup' ? 'Register Local Hub' : 'Log In to Control Panel'}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      <footer className="relative z-30 bg-[#090d16] border-t border-slate-900 py-8 text-center text-xs text-slate-600">
        <p>© {new Date().getFullYear()} cryOS.</p>
      </footer>

      {/* Back to Top Button */}
      {showBackToTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-40 bg-indigo-600 hover:bg-indigo-500 text-white p-3 rounded-full shadow-lg transition-all duration-300 hover:scale-110 focus:outline-none"
          aria-label="Back to top"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}

      <style>{`
        @keyframes cloudDrift {
          0% { transform: translateX(-20%); }
          100% { transform: translateX(100%); }
        }
        .animate-drift-slow { animation: cloudDrift 110s linear infinite; }
        .animate-drift-medium { animation: cloudDrift 75s linear infinite; }
        .animate-drift-fast { animation: cloudDrift 42s linear infinite; }
        
        @keyframes floatHeart {
          0% { transform: translateY(0) scale(1); opacity: 1; }
          100% { transform: translateY(-100px) scale(0.5); opacity: 0; }
        }
        .animate-float-heart {
          position: fixed;
          animation: floatHeart 1s ease-out forwards;
          pointer-events: none;
          font-size: 1.5rem;
          filter: drop-shadow(0 0 4px rgba(236, 72, 153, 0.5));
        }
        
        .doodle-stroke, .doodle-fill {
          stroke-dasharray: 1000;
          stroke-dashoffset: 1000;
          animation: draw 0.6s ease forwards;
        }
        @keyframes draw {
          0% { stroke-dashoffset: 1000; opacity: 0; }
          100% { stroke-dashoffset: 0; opacity: 1; }
        }
        .doodle-fill {
          fill-opacity: 0;
          animation: fillIn 0.3s ease forwards;
          animation-delay: 0.3s;
        }
        @keyframes fillIn {
          0% { fill-opacity: 0; }
          100% { fill-opacity: 1; }
        }
        
        .btn-3d-pink, .btn-3d-blue {
          transition: all 0.2s ease;
          box-shadow: 0 4px 0 rgba(0, 0, 0, 0.2);
        }
        .btn-3d-pink:active, .btn-3d-blue:active {
          transform: translateY(2px);
          box-shadow: 0 2px 0 rgba(0, 0, 0, 0.2);
        }
        
        .bg-glow-radial {
          background: radial-gradient(circle at 20% 30%, rgba(59,130,246,0.08) 0%, transparent 60%);
        }
        .bg-glow-pink {
          background: radial-gradient(circle at 80% 70%, rgba(236,72,153,0.08) 0%, transparent 60%);
        }
        
        html {
          scroll-behavior: smooth;
        }
      `}</style>
    </div>
  );
}