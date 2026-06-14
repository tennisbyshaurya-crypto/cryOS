'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import {
  Home, History, BarChart3, Settings, Library,
  Mic, Square, Play, Pause, Plus, Trash, Trash2,
  Search, Filter, Clock, ChevronRight, Check, AlertTriangle,
  Sparkles, LogOut, BarChart2, X, Thermometer, Cpu,
  RefreshCw, Activity
} from 'lucide-react';
import logoUrl from './assets/logo.png';

const API_BASE = 'http://localhost:8000';

type BabyState = 'calm' | 'hungry' | 'pain' | 'tired' | 'discomfort' | 'uncertain';

interface CryEvent {
  id: string;
  type: 'Hungry' | 'Tired' | 'Discomfort' | 'Burping' | 'Pain';
  confidence: number;
  time: string;
  duration: string;
  intensity: 'Low' | 'Moderate' | 'High';
  recommendation: string;
  audioUrl?: string;
}

interface ToastMessage {
  id: string;
  text: string;
  type: 'success' | 'info' | 'warning';
}

const mapBackendToFrontend = (label: string): BabyState => {
  switch (label) {
    case 'hungry': return 'hungry';
    case 'tired': return 'tired';
    case 'belly_pain': return 'pain';
    case 'burping': return 'discomfort';
    case 'discomfort': return 'discomfort';
    case 'not_crying': return 'calm';
    default: return 'calm';
  }
};

const cryTypeToBabyState = (type: CryEvent['type']): BabyState => {
  switch (type) {
    case 'Hungry': return 'hungry';
    case 'Tired': return 'tired';
    case 'Pain': return 'pain';
    case 'Discomfort': return 'discomfort';
    case 'Burping': return 'discomfort';
    default: return 'calm';
  }
};

const createLogFromState = (state: BabyState, confidence: number, audioUrl?: string): CryEvent => {
  const typeMap: Record<BabyState, CryEvent['type']> = {
    calm: 'Burping', hungry: 'Hungry', pain: 'Pain',
    tired: 'Tired', discomfort: 'Discomfort', uncertain: 'Burping'
  };
  const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const intensity: 'Low' | 'Moderate' | 'High' = confidence > 80 ? 'High' : confidence > 60 ? 'Moderate' : 'Low';
  let recommendation = '';
  switch (state) {
    case 'hungry': recommendation = "Rhythmic hunger pattern detected. Feeding recommended."; break;
    case 'pain': recommendation = "Sharp cry pattern. Check for discomfort or illness."; break;
    case 'tired': recommendation = "Tired whimpers. Sleep window open."; break;
    case 'discomfort': recommendation = "Fussing due to gas or wet diaper."; break;
    default: recommendation = "Audio analyzed, no clear issue.";
  }
  return {
    id: `log-${Date.now()}`,
    type: typeMap[state],
    confidence,
    time: timeNow,
    duration: '0s',
    intensity,
    recommendation,
    audioUrl,
  };
};

const STATE_RECORDS: Record<BabyState, {
  label: string;
  accent: string;
  headlinePrefix: string;
  pillBg: string;
  pillText: string;
  headlineColor: string;
  recommendation: string;
  subtitle: string;
  colorHex: string;
}> = {
  calm: {
    label: 'Calm & Content',
    accent: 'resting peacefully',
    headlinePrefix: 'Mila is',
    pillBg: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
    pillText: 'text-emerald-600',
    headlineColor: 'text-emerald-600',
    recommendation: "Audio is steady and room noise is in a healthy range. She slept for 42 minutes earlier and is currently in a state of tranquil rest. You're set to take a well-deserved break.",
    subtitle: 'Nursery is quiet · Ambient monitoring',
    colorHex: '#3B82C4'
  },
  hungry: {
    label: 'Crying · Hunger Alert',
    accent: 'ready for milk',
    headlinePrefix: 'Mila is likely',
    pillBg: 'bg-rose-50 text-rose-600 border border-rose-100',
    pillText: 'text-rose-600',
    headlineColor: 'text-rose-600',
    recommendation: "A predictable, rhythmic hunger cry was analyzed. Since her last bottle was fed 3 hours and 15 minutes ago, we recommend preparing a feed of 120ml warm formula.",
    subtitle: 'Rhythmic hunger pattern · Recommended: Feeding',
    colorHex: '#E9879F'
  },
  pain: {
    label: 'Crying · Needs attention',
    accent: 'crying and may need you',
    headlinePrefix: 'Mila is',
    pillBg: 'bg-orange-50 text-orange-600 border border-orange-100',
    pillText: 'text-orange-500',
    headlineColor: 'text-orange-500',
    recommendation: "A more intense crying pattern came through. It's worth checking in when you can — common causes are trapped wind, a tight swaddle, or a diaper change. A few gentle belly circles often help.",
    subtitle: 'Stronger cry detected · A check-in is recommended',
    colorHex: '#EF8E5C'
  },
  tired: {
    label: 'Fussy · Sleep Window Open',
    accent: 'growing sleepy & tired',
    headlinePrefix: 'Mila is rapidly',
    pillBg: 'bg-purple-50 text-purple-600 border border-purple-100',
    pillText: 'text-purple-600',
    headlineColor: 'text-purple-600',
    recommendation: "Slow whimper patterns and vocal sighs indicate tiredness. We recommend closing the blinds, keeping the sound machine at low white-noise, and rocking her to aid transition.",
    subtitle: 'Heavy vocal sigh signals · Recommended: Naptime',
    colorHex: '#8E7BC9'
  },
  discomfort: {
    label: 'Fussy · Restless Discomfort',
    accent: 'fussy & uncomfortable',
    headlinePrefix: 'Mila is feeling',
    pillBg: 'bg-amber-50 text-amber-600 border border-amber-100',
    pillText: 'text-amber-500',
    headlineColor: 'text-amber-600',
    recommendation: "Persistent low-level whining and shifting movements match gastric discomfort or a wet diaper. We advise a quick check of the moisture indicators on her swaddle suit.",
    subtitle: 'Nervous ambient noise · Recommended: Swaddle / Diaper inspect',
    colorHex: '#E5A23C'
  },
  uncertain: {
    label: 'Analyzing Sound Signature',
    accent: 'making unclear sounds',
    headlinePrefix: 'Acoustic pattern is',
    pillBg: 'bg-slate-100 text-slate-500 border border-slate-200',
    pillText: 'text-slate-500',
    headlineColor: 'text-slate-400',
    recommendation: "The sound level exceeded idle noise, but confidence is below our 60% system threshold. The AI filter is keeping passive watch to avoid triggering a false alarm.",
    subtitle: 'Low-confidence signal · Noise filtration active',
    colorHex: '#94A3B8'
  }
};

const INITIAL_CRYES: CryEvent[] = [
  {
    id: 'log-1', type: 'Hungry', confidence: 91, time: '6:42 PM', duration: '45s', intensity: 'Moderate',
    recommendation: "Rhythmic cry with low frequency followed by standard pause. Preparing 120ml bottle solved this."
  },
  {
    id: 'log-2', type: 'Tired', confidence: 84, time: '5:18 PM', duration: '1m 20s', intensity: 'Low',
    recommendation: "Gradual crying with yawns in between. Swaddled and put to crib; fell asleep in 10 minutes."
  },
  {
    id: 'log-3', type: 'Discomfort', confidence: 72, time: '4:05 PM', duration: '2m 15s', intensity: 'Low',
    recommendation: "Fussy whimper with squirming. Changed diaper (wet) and rearranged sleeping blanket."
  },
  {
    id: 'log-4', type: 'Hungry', confidence: 88, time: '2:30 PM', duration: '50s', intensity: 'Moderate',
    recommendation: "Acoustic hunger pattern detected. Baby fed on schedule."
  },
  {
    id: 'log-5', type: 'Burping', confidence: 76, time: '1:12 PM', duration: '1m 05s', intensity: 'Moderate',
    recommendation: "Spastic burping sound. Held shoulder-high with gentle pats. Relieved gas immediately."
  },
  {
    id: 'log-6', type: 'Tired', confidence: 81, time: '12:48 PM', duration: '1m 30s', intensity: 'Low',
    recommendation: "Tired whimpers. Soft hum and stroke on her forehead encouraged transition to sleep."
  },
  {
    id: 'log-7', type: 'Pain', confidence: 94, time: '10:15 AM', duration: '2m 45s', intensity: 'High',
    recommendation: "Sharp scream from tummy ache. Walked around holding her in 'football hold' style; gas passed."
  }
];

// ============================================================================
// LOGO FIX
// ============================================================================
const CryOSLogo = ({ className = "h-9" }: { className?: string }) => (
  <img src={logoUrl} alt="CryOS Logo" className={`${className} object-contain`} />
);

// ============================================================================
// BABY FACE COMPONENT
// ============================================================================
interface BabyFaceProps {
  state: BabyState;
  palette: typeof GIRL_PALETTE;
  isBoy: boolean;
  isHovered: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  svgRef: React.RefObject<SVGSVGElement | null>;
}

const GIRL_PALETTE = {
  skinLight: '#FFEAEF', skinMid: '#FBD0DA', skinDeep: '#F4AEBF',
  outline: '#E9879F', outlineSoft: '#F6B6C4', cheek: '#FB7185',
  nose: '#E48FA3', accent: '#D26F88', accentSoft: '#C9758B',
  brow: '#B65C72', hairA: '#FBBF24', hairB: '#D97706'
};

const BOY_PALETTE = {
  skinLight: '#EEF5FF', skinMid: '#DCE9FB', skinDeep: '#C3D8F5',
  outline: '#3B82C4', outlineSoft: '#7FB0E0', cheek: '#5FA5E6',
  nose: '#5B92D4', accent: '#2A6BA8', accentSoft: '#3E78AE',
  brow: '#2A6BA8', hairA: '#5B92D4', hairB: '#2A6BA8'
};

function BabyFace({ state, palette, isBoy, isHovered, onMouseEnter, onMouseLeave, svgRef }: BabyFaceProps) {
  const [pupilOffset, setPupilOffset] = useState({ x: 0, y: 0 });
  const eyesOpen = state === 'calm' || state === 'hungry';

  useEffect(() => {
    if (!eyesOpen) {
      setPupilOffset({ x: 0, y: 0 });
      return;
    }
    const handleMouseMove = (e: MouseEvent) => {
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const maxDist = Math.max(rect.width, rect.height) * 0.5;
      const factor = Math.min(dist / maxDist, 1);
      const maxOffset = 2.8;
      setPupilOffset({
        x: (dx / dist || 0) * factor * maxOffset,
        y: (dy / dist || 0) * factor * maxOffset,
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [eyesOpen, svgRef]);

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 200 200"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`w-full h-full drop-shadow-xl select-none transition-all duration-500 ${isHovered ? 'scale-[1.03]' : ''}`}
    >
      <defs>
        <radialGradient id="skinGrad" cx="35%" cy="35%" r="65%">
          <stop offset="0%" stopColor={palette.skinLight} />
          <stop offset="85%" stopColor={palette.skinMid} />
          <stop offset="100%" stopColor={palette.skinDeep} />
        </radialGradient>
        <radialGradient id="cheekGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={palette.cheek} stopOpacity="0.55" />
          <stop offset="100%" stopColor={palette.cheek} stopOpacity="0" />
        </radialGradient>
        <radialGradient id="hairGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={palette.hairA} />
          <stop offset="100%" stopColor={palette.hairB} />
        </radialGradient>
        <radialGradient id="pupilGrad" cx="30%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#334155" />
          <stop offset="100%" stopColor="#0f172a" />
        </radialGradient>
      </defs>

      <circle cx="31" cy="105" r="15" fill="url(#skinGrad)" stroke={palette.outlineSoft} strokeWidth="1.2" />
      <circle cx="169" cy="105" r="15" fill="url(#skinGrad)" stroke={palette.outlineSoft} strokeWidth="1.2" />
      <circle cx="100" cy="105" r="66" fill="url(#skinGrad)" stroke={palette.outline} strokeWidth="1.5" />

      <path d="M 98 43 Q 103 27 113 37 Q 106 43 100 45" fill="url(#hairGrad)" />
      <path d="M 89 48 Q 93 34 101 42 Q 95 46 90 49" fill="url(#hairGrad)" opacity="0.75" />

      {!isBoy && (
        <g>
          <path d="M 130 50 C 120 42, 117 60, 132 62 Z" fill="#FB7185" stroke="#E11D48" strokeWidth="0.9" />
          <path d="M 150 50 C 160 42, 163 60, 148 62 Z" fill="#FB7185" stroke="#E11D48" strokeWidth="0.9" />
          <circle cx="140" cy="56" r="4.5" fill="#E11D48" />
          <circle cx="140" cy="56" r="1.6" fill="#FFE4E6" />
        </g>
      )}
      {isBoy && (
        <g>
          <path d="M 44 70 Q 100 22 156 70 Q 140 52 100 50 Q 60 52 44 70 Z" fill="#2A6BA8" />
          <circle cx="100" cy="34" r="6" fill="#5FA5E6" stroke="#2A6BA8" strokeWidth="1" />
        </g>
      )}

      <ellipse cx="62" cy="119" rx="12" ry="8" fill="url(#cheekGrad)" />
      <ellipse cx="138" cy="119" rx="12" ry="8" fill="url(#cheekGrad)" />

      {state === 'calm' && (
        <>
          <path d="M 56 80 Q 68 76 80 80" fill="none" stroke={palette.brow} strokeWidth="3" strokeLinecap="round" />
          <path d="M 120 80 Q 132 76 144 80" fill="none" stroke={palette.brow} strokeWidth="3" strokeLinecap="round" />
          <ellipse cx="68" cy="95" rx="11" ry="9" fill="white" />
          <ellipse cx="132" cy="95" rx="11" ry="9" fill="white" />
          <circle cx={68 + pupilOffset.x} cy={95 + pupilOffset.y} r="5.5" fill="url(#pupilGrad)" />
          <circle cx={68 + pupilOffset.x + 2} cy={95 + pupilOffset.y - 2} r="1.8" fill="white" opacity="0.8" />
          <circle cx={132 + pupilOffset.x} cy={95 + pupilOffset.y} r="5.5" fill="url(#pupilGrad)" />
          <circle cx={132 + pupilOffset.x + 2} cy={95 + pupilOffset.y - 2} r="1.8" fill="white" opacity="0.8" />
        </>
      )}

      {state === 'hungry' && (
        <>
          <path d="M 56 82 Q 68 77 80 80" fill="none" stroke={palette.brow} strokeWidth="3" strokeLinecap="round" />
          <path d="M 120 80 Q 132 77 144 82" fill="none" stroke={palette.brow} strokeWidth="3" strokeLinecap="round" />
          <ellipse cx="68" cy="95" rx="11.5" ry="10" fill="white" />
          <ellipse cx="132" cy="95" rx="11.5" ry="10" fill="white" />
          <circle cx={68 + pupilOffset.x} cy={95 + pupilOffset.y} r="6" fill="url(#pupilGrad)" />
          <circle cx={68 + pupilOffset.x + 2} cy={95 + pupilOffset.y - 2} r="2" fill="white" opacity="0.8" />
          <circle cx={132 + pupilOffset.x} cy={95 + pupilOffset.y} r="6" fill="url(#pupilGrad)" />
          <circle cx={132 + pupilOffset.x + 2} cy={95 + pupilOffset.y - 2} r="2" fill="white" opacity="0.8" />
        </>
      )}

      {state === 'pain' && (
        <>
          <path d="M 56 80 L 80 85" fill="none" stroke="#EF8E5C" strokeWidth="3" strokeLinecap="round" />
          <path d="M 144 80 L 120 85" fill="none" stroke="#EF8E5C" strokeWidth="3" strokeLinecap="round" />
          <path d="M 56 93 Q 68 99 80 93" fill="none" stroke="#1E293B" strokeWidth="3.6" strokeLinecap="round" />
          <path d="M 120 93 Q 132 99 144 93" fill="none" stroke="#1E293B" strokeWidth="3.6" strokeLinecap="round" />
        </>
      )}

      {state === 'tired' && (
        <>
          <path d="M 56 80 Q 68 79 80 81" fill="none" stroke={palette.brow} strokeWidth="3" strokeLinecap="round" />
          <path d="M 120 81 Q 132 79 144 80" fill="none" stroke={palette.brow} strokeWidth="3" strokeLinecap="round" />
          <path d="M 56 94 Q 68 99 80 94" fill="none" stroke="#1E293B" strokeWidth="3.5" strokeLinecap="round" />
          <path d="M 120 94 Q 132 99 144 94" fill="none" stroke="#1E293B" strokeWidth="3.5" strokeLinecap="round" />
        </>
      )}

      {state === 'discomfort' && (
        <>
          <path d="M 56 82 Q 68 78 80 79" fill="none" stroke="#E5A23C" strokeWidth="3" strokeLinecap="round" />
          <path d="M 120 79 Q 132 78 144 82" fill="none" stroke="#E5A23C" strokeWidth="3" strokeLinecap="round" />
          <path d="M 58 95 Q 68 92 78 95" fill="none" stroke="#1E293B" strokeWidth="4" strokeLinecap="round" />
          <circle cx="68" cy="97" r="3.5" fill="#1E293B" />
          <path d="M 122 95 Q 132 92 142 95" fill="none" stroke="#1E293B" strokeWidth="4" strokeLinecap="round" />
          <circle cx="132" cy="97" r="3.5" fill="#1E293B" />
        </>
      )}

      {state === 'uncertain' && (
        <>
          <path d="M 56 82 L 80 82" fill="none" stroke="#94A3B8" strokeWidth="3" strokeLinecap="round" />
          <path d="M 120 79 Q 132 73 144 77" fill="none" stroke="#94A3B8" strokeWidth="3" strokeLinecap="round" />
          <circle cx="68" cy="96" r="5.5" fill="#64748B" />
          <circle cx="132" cy="96" r="5.5" fill="#64748B" />
        </>
      )}

      <path d="M 97 113 Q 100 116 103 113" fill="none" stroke={palette.nose} strokeWidth="2.5" strokeLinecap="round" />

      {state === 'calm' && <path d="M 87 127 Q 100 137 113 127" fill="none" stroke={palette.accent} strokeWidth="4.5" strokeLinecap="round" />}
      {state === 'hungry' && (
        <>
          <ellipse cx="100" cy="132" rx="9" ry="12" fill="#7A2436" stroke={palette.accentSoft} strokeWidth="2.5" />
          <path d="M 94 138 Q 100 129 106 138 Z" fill="#F6A8BD" />
        </>
      )}
      {state === 'pain' && (
        <>
          <ellipse cx="100" cy="137" rx="11" ry="12" fill="#9E3B3B" stroke="#EF8E5C" strokeWidth="2.5" />
          <path d="M 92 143 Q 100 137 108 143 Q 100 149 92 143 Z" fill="#F2A0A0" />
        </>
      )}
      {state === 'tired' && <ellipse cx="100" cy="133" rx="7" ry="10" fill="#3A1E5C" stroke={palette.accentSoft} strokeWidth="2" />}
      {state === 'discomfort' && <path d="M 84 132 Q 91 126 98 132 Q 105 138 112 132" fill="none" stroke="#E5A23C" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />}
      {state === 'uncertain' && <line x1="89" y1="131" x2="111" y2="131" stroke="#64748B" strokeWidth="4.5" strokeLinecap="round" />}
    </svg>
  );
}

// ============================================================================
// MAIN DASHBOARD COMPONENT
// ============================================================================
interface DashboardProps {
  onLogout: () => void;
}

export default function Dashboard({ onLogout }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<'now' | 'history' | 'insights' | 'settings' | 'recordings'>('now');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const triggerToast = (text: string, type: 'success' | 'info' | 'warning' = 'info') => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, text, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  };

  const [currentBabyState, setCurrentBabyState] = useState<BabyState>('calm');
  const [confidence, setConfidence] = useState<number>(98);
  const [lastKnownActualState, setLastKnownActualState] = useState<BabyState>('calm');

  const [isHovered, setIsHovered] = useState<boolean>(false);
  const babySvgRef = useRef<SVGSVGElement | null>(null);
  const faceWrapRef = useRef<HTMLDivElement>(null);

  const [isMeasuring, setIsMeasuring] = useState<boolean>(false);
  const [measuringProgress, setMeasuringProgress] = useState<number>(0);
  const [measuringText, setMeasuringText] = useState<string>('');

  const [uploading, setUploading] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const audioPlayerRef = useRef<HTMLAudioElement>(null);
  const [currentAudioUrl, setCurrentAudioUrl] = useState<string | null>(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState<boolean>(false);

  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordSeconds, setRecordSeconds] = useState<number>(0);
  const [isClassifyingRecording, setIsClassifyingRecording] = useState<boolean>(false);
  const recordTimerRef = useRef<number | undefined>(undefined);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const recordStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Float32Array[]>([]);
  const recordingStartTimeRef = useRef<number>(0);

  const [insightMode, setInsightMode] = useState<'hourly' | 'type'>('hourly');
  const [hoverBar, setHoverBar] = useState<number | null>(null);

  const [liveGraphEnabled, setLiveGraphEnabled] = useState<boolean>(true);
  const [graphData, setGraphData] = useState<number[]>(() =>
    Array.from({ length: 40 }, () => Math.floor(Math.random() * 30 + 10))
  );

  const mainContentRef = useRef<HTMLDivElement>(null);

  const scrollToTop = () => {
    if (mainContentRef.current) mainContentRef.current.scrollTop = 0;
    else window.scrollTo(0, 0);
  };

  useEffect(() => {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    scrollToTop();
  }, []);

  useEffect(() => { scrollToTop(); }, [activeTab]);

  useEffect(() => {
    if (!liveGraphEnabled) return;
    const stateToBase: Record<BabyState, number> = {
      calm: 15, tired: 30, hungry: 55, discomfort: 45, pain: 75, uncertain: 20
    };
    const base = stateToBase[currentBabyState];
    const interval = setInterval(() => {
      setGraphData(prev => {
        const newVal = Math.max(5, Math.min(100, base + (Math.random() - 0.5) * 25));
        return [...prev.slice(1), Math.round(newVal)];
      });
    }, 800);
    return () => clearInterval(interval);
  }, [liveGraphEnabled, currentBabyState]);

  const writeString = (view: DataView, offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };

  const createWavBlob = (samples: Int16Array, sampleRate: number, numChannels: number): Blob => {
    const buffer = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buffer);
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + samples.length * 2, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numChannels * 2, true);
    view.setUint16(32, numChannels * 2, true);
    view.setUint16(34, 16, true);
    writeString(view, 36, 'data');
    view.setUint32(40, samples.length * 2, true);
    for (let i = 0; i < samples.length; i++) view.setInt16(44 + i * 2, samples[i], true);
    return new Blob([buffer], { type: 'audio/wav' });
  };

  const startRecording = async () => {
    if (isRecording || isClassifyingRecording) return;
    if (!navigator.mediaDevices) { triggerToast('Microphone not supported', 'warning'); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recordStreamRef.current = stream;
      const audioContext = new AudioContext({ sampleRate: 16000 });
      audioContextRef.current = audioContext;
      const source = audioContext.createMediaStreamSource(stream);
      mediaStreamSourceRef.current = source;
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;
      audioChunksRef.current = [];
      processor.onaudioprocess = (event) => {
        audioChunksRef.current.push(new Float32Array(event.inputBuffer.getChannelData(0)));
      };
      source.connect(processor);
      processor.connect(audioContext.destination);
      await audioContext.resume();
      recordingStartTimeRef.current = Date.now();
      setIsRecording(true);
      setRecordSeconds(0);
      if (recordTimerRef.current) clearInterval(recordTimerRef.current);
      recordTimerRef.current = window.setInterval(() => setRecordSeconds(s => s + 1), 1000);
      triggerToast('Recording started — capturing nursery audio.', 'info');
    } catch (err) {
      console.error(err);
      triggerToast('Microphone access denied.', 'warning');
    }
  };

  const stopRecording = async () => {
    if (recordTimerRef.current) clearInterval(recordTimerRef.current);
    if (processorRef.current) { processorRef.current.disconnect(); processorRef.current = null; }
    if (mediaStreamSourceRef.current) { mediaStreamSourceRef.current.disconnect(); mediaStreamSourceRef.current = null; }
    if (audioContextRef.current) { await audioContextRef.current.close(); audioContextRef.current = null; }
    if (recordStreamRef.current) { recordStreamRef.current.getTracks().forEach(t => t.stop()); recordStreamRef.current = null; }

    const chunks = audioChunksRef.current;
    if (chunks.length === 0) { triggerToast('No audio captured.', 'warning'); setIsRecording(false); return; }
    const totalLength = chunks.reduce((sum, arr) => sum + arr.length, 0);
    const combined = new Float32Array(totalLength);
    let offset = 0;
    for (const arr of chunks) { combined.set(arr, offset); offset += arr.length; }
    const int16Array = new Int16Array(combined.length);
    for (let i = 0; i < combined.length; i++) {
      const s = Math.max(-1, Math.min(1, combined[i]));
      int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    const wavBlob = createWavBlob(int16Array, 16000, 1);
    const url = URL.createObjectURL(wavBlob);
    const secs = Math.max(1, Math.round((Date.now() - recordingStartTimeRef.current) / 1000));
    const mm = Math.floor(secs / 60), ss = secs % 60;
    const dur = mm > 0 ? `${mm}m ${String(ss).padStart(2, '0')}s` : `${ss}s`;

    setIsClassifyingRecording(true);
    triggerToast('Sending recording to AI for analysis...', 'info');

    const formData = new FormData();
    formData.append('file', new File([wavBlob], 'recording.wav', { type: 'audio/wav' }));

    try {
      const res = await fetch(`${API_BASE}/classify`, { method: 'POST', body: formData });
      if (!res.ok) throw new Error(`Server responded with ${res.status}`);
      const data = await res.json();

      let newState: BabyState = 'uncertain';
      let newConfidence = 0;
      let logType: CryEvent['type'] = 'Burping';

      if (data.status === 'certain') {
        newState = mapBackendToFrontend(data.label);
        newConfidence = Math.round(data.confidence * 100);
        logType = createLogFromState(newState, newConfidence).type;
        setCurrentBabyState(newState);
        setLastKnownActualState(newState);
        setConfidence(newConfidence);
        triggerToast(`AI analysis: ${data.label} detected with ${newConfidence}% confidence.`, 'success');
      } else if (data.status === 'uncertain') {
        newState = 'uncertain';
        newConfidence = 48;
        setCurrentBabyState('uncertain');
        setConfidence(48);
        triggerToast('Acoustic pattern uncertain – confidence below threshold.', 'warning');
      } else {
        throw new Error(data.message || 'Unknown error');
      }

      const newLog: CryEvent = {
        id: `voice-${Date.now()}`,
        type: logType,
        confidence: newConfidence,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        duration: dur,
        intensity: newConfidence > 80 ? 'High' : newConfidence > 60 ? 'Moderate' : 'Low',
        recommendation: `AI classified as ${newState}. ${STATE_RECORDS[newState]?.recommendation || 'Check on baby.'}`,
        audioUrl: url,
      };
      setCryEvents(prev => [newLog, ...prev]);
      setSelectedEventDetails(newLog);
      setCurrentAudioUrl(url);
      if (audioPlayerRef.current) { audioPlayerRef.current.src = url; audioPlayerRef.current.load(); }
    } catch (err) {
      console.error('AI error:', err);
      triggerToast(`AI failed: ${(err as Error).message}. Saving to library.`, 'warning');
      const fallbackLog: CryEvent = {
        id: `voice-${Date.now()}`,
        type: 'Burping',
        confidence: 0,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        duration: dur,
        intensity: 'Moderate',
        recommendation: `Manual voice capture (AI offline). Saved to recording library.`,
        audioUrl: url,
      };
      setCryEvents(prev => [fallbackLog, ...prev]);
      setSelectedEventDetails(fallbackLog);
      setCurrentAudioUrl(url);
      if (audioPlayerRef.current) { audioPlayerRef.current.src = url; audioPlayerRef.current.load(); }
    } finally {
      setIsClassifyingRecording(false);
      setIsRecording(false);
    }
  };

  const toggleAudioPlayback = () => {
    if (!audioPlayerRef.current || !currentAudioUrl) return;
    if (isAudioPlaying) {
      audioPlayerRef.current.pause();
      setIsAudioPlaying(false);
    } else {
      audioPlayerRef.current.play().catch(() => triggerToast('Failed to play audio', 'warning'));
      setIsAudioPlaying(true);
    }
  };

  const handleAudioUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);
    try {
      const res = await fetch(`${API_BASE}/classify`, { method: 'POST', body: formData });
      const data = await res.json();
      const audioBlobUrl = URL.createObjectURL(selectedFile);
      if (data.status === 'certain') {
        const newState = mapBackendToFrontend(data.label);
        const newConf = Math.round(data.confidence * 100);
        setCurrentBabyState(newState);
        setLastKnownActualState(newState);
        setConfidence(newConf);
        const newLog = createLogFromState(newState, newConf, audioBlobUrl);
        setCryEvents(prev => [newLog, ...prev]);
        setSelectedEventDetails(newLog);
        setCurrentAudioUrl(audioBlobUrl);
        if (audioPlayerRef.current) { audioPlayerRef.current.src = audioBlobUrl; audioPlayerRef.current.load(); }
        triggerToast(`Analysis: ${data.label} detected with ${newConf}% confidence.`, 'success');
      } else if (data.status === 'uncertain') {
        setCurrentBabyState('uncertain');
        setConfidence(48);
        const uncertainLog = createLogFromState('uncertain', 48, audioBlobUrl);
        setCryEvents(prev => [uncertainLog, ...prev]);
        setSelectedEventDetails(uncertainLog);
        setCurrentAudioUrl(audioBlobUrl);
        if (audioPlayerRef.current) { audioPlayerRef.current.src = audioBlobUrl; audioPlayerRef.current.load(); }
        triggerToast('Acoustic pattern uncertain – confidence below threshold.', 'warning');
      } else {
        triggerToast('Classification error: ' + (data.message || 'unknown'), 'warning');
      }
    } catch (err) {
      console.error(err);
      triggerToast('Failed to reach cryOS backend.', 'warning');
    } finally {
      setUploading(false);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const triggerMeasurement = () => {
    setIsMeasuring(true);
    setMeasuringProgress(0);
    setMeasuringText('Calibrating nursery acoustic level sensors...');
    triggerToast('Calibration active. Please keep nursery quiet!', 'info');
    let prog = 0;
    const interval = setInterval(() => {
      prog += 10;
      setMeasuringProgress(prog);
      if (prog === 30) setMeasuringText('Detecting background noise floors & ventilation echoes...');
      else if (prog === 60) setMeasuringText('Assessing current room volume levels...');
      else if (prog === 80) setMeasuringText('Parsing baby sound signature components...');
      else if (prog >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          setIsMeasuring(false);
          const restored = lastKnownActualState === 'uncertain' ? 'calm' : lastKnownActualState;
          setCurrentBabyState(restored);
          setConfidence(98);
          triggerToast('Continuous nursery surveillance restored.', 'success');
        }, 500);
      }
    }, 250);
  };

  useEffect(() => {
    let raf = 0;
    let curX = 0, curY = 0, tgtX = 0, tgtY = 0;
    const MAX_X = 6, MAX_Y = 4;
    const onMove = (e: MouseEvent) => {
      const el = faceWrapRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      const nx = Math.max(-1, Math.min(1, (e.clientX - cx) / (window.innerWidth / 2)));
      const ny = Math.max(-1, Math.min(1, (e.clientY - cy) / (window.innerHeight / 2)));
      tgtX = nx * MAX_X; tgtY = ny * MAX_Y;
    };
    const loop = () => {
      curX += (tgtX - curX) * 0.08; curY += (tgtY - curY) * 0.08;
      const el = faceWrapRef.current;
      if (el) el.style.transform = `translate(${curX.toFixed(2)}px, ${curY.toFixed(2)}px)`;
      raf = requestAnimationFrame(loop);
    };
    window.addEventListener('mousemove', onMove);
    raf = requestAnimationFrame(loop);
    return () => { window.removeEventListener('mousemove', onMove); cancelAnimationFrame(raf); };
  }, []);

  useEffect(() => {
    if (confidence < 60) {
      if (currentBabyState !== 'uncertain') {
        setLastKnownActualState(currentBabyState);
        setCurrentBabyState('uncertain');
        triggerToast('System: Confidence below 60%. Switching to Uncertain State.', 'warning');
      }
    } else {
      if (currentBabyState === 'uncertain') {
        setCurrentBabyState(lastKnownActualState === 'uncertain' ? 'calm' : lastKnownActualState);
        triggerToast(`System: High confidence restored to ${confidence}%.`, 'success');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [confidence]);

  const [piConnected, setPiConnected] = useState<boolean>(true);

  type BabyRecord = {
    id: string;
    name: string;
    gender: 'girl' | 'boy';
    ageMonth: number;
    sleepGoal: number;
    weightLbs: number;
    notificationEnabled: boolean;
  };

  const [babies, setBabies] = useState<BabyRecord[]>([]);
  const [activeBabyId, setActiveBabyId] = useState<string | null>(null);

  const [babyProfile, setBabyProfile] = useState({
    name: '', gender: 'girl' as 'girl' | 'boy',
    ageMonth: 0, sleepGoal: 14, weightLbs: 0, notificationEnabled: true
  });

  const [editProfile, setEditProfile] = useState({
    name: '', gender: 'girl' as 'girl' | 'boy',
    ageMonth: 0, sleepGoal: 14, weightLbs: 0, notificationEnabled: true
  });

  const switchBaby = (id: string) => {
    const b = babies.find((x) => x.id === id);
    if (!b) return;
    setActiveBabyId(id);
    const { id: _omit, ...profile } = b;
    setBabyProfile({ ...profile });
    setEditProfile({ ...profile });
    setCurrentBabyState('calm');
    setConfidence(98);
    setLastKnownActualState('calm');
    scrollToTop();
    triggerToast(`Now monitoring ${b.name}'s nursery.`, 'info');
  };

  const addBaby = () => {
    const id = `baby-${Date.now()}`;
    const newBaby: BabyRecord = {
      id, name: `Baby ${babies.length + 1}`, gender: 'girl',
      ageMonth: 1, sleepGoal: 15, weightLbs: 8, notificationEnabled: true,
    };
    setBabies((prev) => [...prev, newBaby]);
    setActiveBabyId(id);
    const { id: _omit, ...profile } = newBaby;
    setBabyProfile({ ...profile });
    setEditProfile({ ...profile });
    setCurrentBabyState('calm');
    setConfidence(98);
    scrollToTop();
    triggerToast(`Added ${newBaby.name}. Edit details in Settings.`, 'success');
  };

  const removeBaby = (id: string) => {
    const b = babies.find(x => x.id === id);
    const remaining = babies.filter(x => x.id !== id);
    setBabies(remaining);
    if (activeBabyId === id) {
      if (remaining.length > 0) {
        switchBaby(remaining[0].id);
      } else {
        setActiveBabyId(null);
        setBabyProfile({ name: '', gender: 'girl', ageMonth: 0, sleepGoal: 14, weightLbs: 0, notificationEnabled: true });
        setEditProfile({ name: '', gender: 'girl', ageMonth: 0, sleepGoal: 14, weightLbs: 0, notificationEnabled: true });
      }
    }
    triggerToast(`Removed ${b?.name || 'baby'} from profiles.`, 'warning');
  };

  const getDynamicRecord = (stateKey: BabyState) => {
    const record = STATE_RECORDS[stateKey];
    const name = babyProfile.name || 'Baby';
    const isBoy = babyProfile.gender === 'boy';
    const subName = (str: string) => str
      .replace(/Mila/g, name)
      .replace(/\bShe slept\b/g, isBoy ? 'He slept' : 'She slept')
      .replace(/\bshe slept\b/g, isBoy ? 'he slept' : 'she slept')
      .replace(/\bShe\b/g, isBoy ? 'He' : 'She')
      .replace(/\bshe\b/g, isBoy ? 'he' : 'she')
      .replace(/\bher\b/g, isBoy ? 'his' : 'her')
      .replace(/\bHer\b/g, isBoy ? 'His' : 'Her');

    let pillBg = record.pillBg;
    if (stateKey === 'calm') pillBg = 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30';
    else if (stateKey === 'hungry') pillBg = 'bg-pink-500/10 text-pink-400 border border-pink-500/30';
    else if (stateKey === 'pain') pillBg = 'bg-orange-500/10 text-orange-400 border border-orange-500/30';
    else if (stateKey === 'tired') pillBg = 'bg-purple-500/10 text-purple-400 border border-purple-500/30';
    else if (stateKey === 'discomfort') pillBg = 'bg-amber-500/10 text-amber-400 border border-amber-500/30';
    else pillBg = 'bg-slate-800 text-slate-400 border border-slate-700';

    return {
      ...record,
      label: subName(record.label),
      accent: subName(record.accent),
      headlinePrefix: subName(record.headlinePrefix),
      recommendation: subName(record.recommendation),
      subtitle: subName(record.subtitle),
      pillBg,
    };
  };

  const currentRecord = getDynamicRecord(currentBabyState);

  const [cryEvents, setCryEvents] = useState<CryEvent[]>(INITIAL_CRYES);
  const [selectedEventDetails, setSelectedEventDetails] = useState<CryEvent | null>(INITIAL_CRYES[0]);
  const [historySearchQuery, setHistorySearchQuery] = useState<string>('');
  const [historyFilterType, setHistoryFilterType] = useState<string>('All');
  const [showLogCreatorModal, setShowLogCreatorModal] = useState<boolean>(false);
  const [newLogType, setNewLogType] = useState<'Hungry' | 'Tired' | 'Discomfort' | 'Burping' | 'Pain'>('Hungry');
  const [newLogIntensity, setNewLogIntensity] = useState<'Low' | 'Moderate' | 'High'>('Moderate');
  const [newLogConfidence, setNewLogConfidence] = useState<number>(85);

  const saveBabyProfileSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setBabyProfile({ ...editProfile });
    setBabies((prev) => prev.map((b) => (b.id === activeBabyId ? { ...b, ...editProfile } : b)));
    triggerToast('Profile successfully saved.', 'success');
  };

  const handleCreateCustomEvent = (e: React.FormEvent) => {
    e.preventDefault();
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const recsMap = {
      Hungry: "Interactive Log: Rhythmic sound analysis says baby needs a feed.",
      Tired: "Interactive Log: Sleep window is ready. Recommended dimming lights.",
      Discomfort: "Interactive Log: High humidity or diaper change required.",
      Burping: "Interactive Log: Pat on shoulder to facilitate gas relieve.",
      Pain: "Interactive Log: Check immediately for severe discomfort factors."
    };
    const newCry: CryEvent = {
      id: `custom-log-${Date.now()}`,
      type: newLogType,
      confidence: newLogConfidence,
      time: timeNow,
      duration: '1m 15s',
      intensity: newLogIntensity,
      recommendation: recsMap[newLogType]
    };
    setCryEvents(prev => [newCry, ...prev]);
    setShowLogCreatorModal(false);
    triggerToast(`Added custom event: ${newLogType} Cry`, 'success');
    setSelectedEventDetails(newCry);
  };

  const dashboardStats = useMemo(() => {
    const totalCount = cryEvents.length;
    const frequencies: Record<string, number> = {};
    cryEvents.forEach(e => { frequencies[e.type] = (frequencies[e.type] || 0) + 1; });
    let mostCommon = 'Hungry';
    let maxFreq = 0;
    Object.keys(frequencies).forEach(k => { if (frequencies[k] > maxFreq) { maxFreq = frequencies[k]; mostCommon = k; } });
    const newestCry = cryEvents[0];
    const lastCryText = newestCry ? `${newestCry.type} · ${newestCry.time}` : 'None detected today';
    return { totalCount, mostCommon, lastCryText };
  }, [cryEvents]);

  const TYPE_META: Record<CryEvent['type'], { color: string; label: string }> = {
    Hungry: { color: '#E9879F', label: 'Hunger' },
    Tired: { color: '#8E7BC9', label: 'Fatigue' },
    Discomfort: { color: '#E5A23C', label: 'Discomfort' },
    Burping: { color: '#3B82C4', label: 'Burping' },
    Pain: { color: '#E25C5C', label: 'Distress' },
  };

  const insightData = useMemo(() => {
    const order: CryEvent['type'][] = ['Hungry', 'Tired', 'Discomfort', 'Burping', 'Pain'];
    const total = cryEvents.length || 1;
    const byType = order.map((t) => {
      const count = cryEvents.filter((e) => e.type === t).length;
      return { key: t, label: TYPE_META[t].label, color: TYPE_META[t].color, count, pct: Math.round((count / total) * 100) };
    });
    const hourly = [
      { label: '12 AM', count: 1 }, { label: '4 AM', count: 2 }, { label: '8 AM', count: 3 },
      { label: '12 PM', count: 6 }, { label: '4 PM', count: 9 }, { label: '8 PM', count: 4 }, { label: '11 PM', count: 2 },
    ];
    const bars = insightMode === 'hourly'
      ? hourly.map((h) => ({ label: h.label, count: h.count, color: '#3B82C4' }))
      : byType.map((b) => ({ label: b.label, count: b.count, color: b.color }));
    const maxCount = Math.max(1, ...bars.map((b) => b.count));
    return { byType, bars, maxCount, total: cryEvents.length };
  }, [cryEvents, insightMode]);

  const filteredEventsForHistory = useMemo(() => {
    return cryEvents.filter(e => {
      const matchSearch = e.type.toLowerCase().includes(historySearchQuery.toLowerCase()) ||
        e.recommendation.toLowerCase().includes(historySearchQuery.toLowerCase());
      const matchFilter = historyFilterType === 'All' || e.type === historyFilterType;
      return matchSearch && matchFilter;
    });
  }, [cryEvents, historySearchQuery, historyFilterType]);

  const recordingsWithAudio = useMemo(() => cryEvents.filter(e => e.audioUrl), [cryEvents]);

  const isBoyFace = babyProfile.gender === 'boy';
  const facePalette = isBoyFace ? BOY_PALETTE : GIRL_PALETTE;

  useEffect(() => {
    return () => {
      cryEvents.forEach(evt => {
        if (evt.audioUrl && evt.audioUrl.startsWith('blob:')) URL.revokeObjectURL(evt.audioUrl);
      });
    };
  }, []);

  const handleLogout = () => { scrollToTop(); onLogout(); };
  const activeBabyName = babyProfile.name || 'No baby selected';

  const graphColor = {
    calm: '#10b981', tired: '#8E7BC9', hungry: '#E9879F',
    discomfort: '#E5A23C', pain: '#E25C5C', uncertain: '#94A3B8'
  }[currentBabyState];

  return (
    <div className="flex flex-col md:grid md:grid-cols-1 lg:grid-cols-[300px_1fr] min-h-screen w-full max-w-[1600px] mx-auto p-3 md:p-4 lg:p-5 gap-4 lg:gap-5 select-none relative bg-[#1C2839] text-slate-200">

      {/* TOAST SYSTEM */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
        {toasts.map((toast) => (
          <div key={toast.id} className={`flex items-center gap-3 p-3.5 rounded-xl shadow-xl border text-sm font-medium transition-all duration-300 pointer-events-auto bg-[#26344A]/95 border-[#3E5071] ${toast.type === 'success' ? 'text-emerald-400' :
            toast.type === 'warning' ? 'text-amber-400' : 'text-sky-400'
            }`}>
            {toast.type === 'success' && <Check className="w-4 h-4 text-emerald-500 shrink-0" />}
            {toast.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />}
            {toast.type === 'info' && <Sparkles className="w-4 h-4 text-blue-500 shrink-0" />}
            <span>{toast.text}</span>
          </div>
        ))}
      </div>

      {/* SIDEBAR */}
      <aside className="w-full lg:w-auto border rounded-2xl p-6 flex flex-col justify-between shadow-sm shrink-0 bg-[#26344A] border-[#3E5071] shadow-black/40">
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between border-b pb-4 border-[#3E5071]">
            <CryOSLogo className="h-24 w-auto scale-[1.5] origin-left ml-4" />
            <div className={`w-3 h-3 rounded-full ${piConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-400'}`}
              title={piConnected ? 'Pi Online' : 'Pi Offline'}></div>
          </div>

          <nav className="flex flex-row overflow-x-auto lg:overflow-x-visible lg:flex-col gap-2">
            {[
              { key: 'now', icon: Home, label: 'Now' },
              { key: 'history', icon: History, label: 'History', badge: cryEvents.length },
              { key: 'recordings', icon: Library, label: 'Recordings', badge: recordingsWithAudio.length },
              { key: 'insights', icon: BarChart3, label: 'Insights' },
              { key: 'settings', icon: Settings, label: 'Settings' },
            ].map(({ key, icon: Icon, label, badge }) => (
              <button key={key} onClick={() => setActiveTab(key as 'now' | 'history' | 'insights' | 'settings' | 'recordings')}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all shrink-0 cursor-pointer ${activeTab === key
                  ? 'bg-[#3b82c4]/15 text-[#5fa5e6] border border-[#3b82c4]/20'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-[#2E3E56]'
                  }`}>
                <Icon className={`w-4 h-4 ${activeTab === key ? 'text-[#3B82C4]' : 'text-slate-400'}`} />
                <span>{label}</span>
                {badge !== undefined && (
                  <span className={`ml-auto text-[10px] px-1.5 py-0.5 rounded-full font-bold ${activeTab === key ? 'bg-[#3B82C4] text-white' : 'bg-slate-800 text-slate-500'
                    }`}>{badge}</span>
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="hidden lg:flex flex-col gap-3 border-t pt-4 mt-4 border-[#3E5071]">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 px-1 mb-0.5">Your Babies</span>
          {babies.length === 0 && (
            <p className="text-[11px] text-slate-500 px-2 py-1 italic">No babies added yet.</p>
          )}
          {babies.map((b) => {
            const active = b.id === activeBabyId;
            return (
              <div key={b.id} className="flex items-center gap-1">
                <button onClick={() => switchBaby(b.id)}
                  className={`flex items-center gap-2.5 px-2 py-1.5 rounded-xl transition-all cursor-pointer flex-1 ${active ? 'bg-[#3b82c4]/15 border border-[#3b82c4]/25' : 'border border-transparent hover:bg-[#2E3E56]'
                    }`}>
                  <div className={`w-7 h-7 rounded-full text-white font-bold text-xs flex items-center justify-center shrink-0 ${b.gender === 'boy' ? 'bg-gradient-to-tr from-[#2A6BA8] to-[#5FA5E6]' : 'bg-gradient-to-tr from-[#D26F88] to-[#FB7185]'
                    }`}>{b.name.charAt(0)}</div>
                  <div className="flex-1 min-w-0 text-left">
                    <div className={`text-xs font-bold leading-tight truncate ${active ? 'text-[#5fa5e6]' : 'text-slate-200'}`}>{b.name}</div>
                    <div className="text-[10px] font-semibold text-slate-500">{b.gender === 'girl' ? 'Daughter' : 'Son'} • {b.ageMonth}M</div>
                  </div>
                  {active && <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0"></div>}
                </button>
                <button onClick={() => removeBaby(b.id)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all" title="Remove baby">
                  <Trash className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
          <button onClick={addBaby}
            className="flex items-center gap-2.5 px-2 py-1.5 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-[#2E3E56] transition-all cursor-pointer">
            <div className="w-7 h-7 rounded-full border border-dashed border-slate-600 flex items-center justify-center shrink-0">
              <Plus className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-bold">Add baby</span>
          </button>
        </div>

        <div className="hidden lg:flex items-center gap-4 border-t pt-4 mt-4 border-[#3E5071]">
          <div className={`w-9 h-9 rounded-full text-white font-bold text-sm flex items-center justify-center shadow-inner ${babyProfile.gender === 'boy' ? 'bg-gradient-to-tr from-[#2A6BA8] to-[#5FA5E6]' : 'bg-gradient-to-tr from-[#E9879F] to-[#3B82C4]'
            }`}>
            {(babyProfile.name || 'B').charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-bold leading-tight truncate text-slate-200">{activeBabyName}</h4>
            <span className="text-[10px] font-semibold text-slate-500">{babies.length} profile{babies.length !== 1 ? 's' : ''}</span>
          </div>
          <button onClick={handleLogout}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-all cursor-pointer" title="Logout">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* MAIN PANEL */}
      <main className="flex-1 border rounded-2xl flex flex-col overflow-hidden shadow-sm bg-[#26344A] border-[#3E5071]">
        <header className="px-8 py-6 border-b flex items-center justify-between flex-shrink-0 z-10 bg-[#26344A] border-[#3E5071]">
          <div className="flex flex-col">
            <h2 className="text-base font-bold capitalize leading-tight text-slate-100">
              {activeTab === 'now' ? 'Nursery Monitor Hub' : activeTab === 'recordings' ? 'Recording Library' : `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Pane`}
            </h2>
            <p className="text-[11px] font-medium text-slate-400">
              {activeTab === 'now' && `Live acoustic streams${babyProfile.name ? ` for ${babyProfile.name}'s Room` : ''}`}
              {activeTab === 'history' && 'Audit trail of cry frequencies & intensity states'}
              {activeTab === 'insights' && 'Smart trends analytics'}
              {activeTab === 'settings' && 'Configure acoustic parameters & profile rules'}
              {activeTab === 'recordings' && 'All saved voice captures from nursery sessions'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className={`px-2.5 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1.5 ${piConnected ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
              }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${piConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></span>
              <span>{piConnected ? 'Listening' : 'Offline'}</span>
            </div>
            <input type="file" accept="audio/*" ref={fileInputRef} onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} className="hidden" id="audio-upload" />
            <label htmlFor="audio-upload" className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${uploading ? 'opacity-50 cursor-wait' : 'hover:bg-[#3b82c4]/20'
              } bg-[#3b82c4]/10 border border-[#3b82c4]/30 text-[#5fa5e6]`}>
              {uploading ? 'Analyzing...' : 'Upload Audio'}
            </label>
            {selectedFile && !uploading && (
              <button onClick={handleAudioUpload}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 transition-all">
                Send to AI
              </button>
            )}
          </div>
        </header>

        <div ref={mainContentRef} className="flex-1 overflow-y-auto bg-[#1C2839] flex flex-col">

          {/* TAB: NOW */}
          {activeTab === 'now' && (
            <div className="flex flex-col">
              {babies.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 px-6 text-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-[#3B82C4]/10 flex items-center justify-center text-3xl">👶</div>
                  <h3 className="text-lg font-bold text-slate-200">No baby profile yet</h3>
                  <p className="text-sm text-slate-400 max-w-xs">Add a baby profile to start monitoring your nursery.</p>
                  <button onClick={addBaby}
                    className="flex items-center gap-2 px-5 py-2.5 bg-[#3B82C4] hover:bg-[#2A6BA8] text-white rounded-xl text-sm font-bold transition-all">
                    <Plus className="w-4 h-4" /> Add your first baby
                  </button>
                </div>
              )}

              {babies.length > 0 && (
                <>
                  <div className="px-8 py-8 grid grid-cols-1 md:grid-cols-[1fr_280px] lg:grid-cols-[1fr_300px] gap-8 items-center border-b bg-[#26344A] border-[#3E5071] relative overflow-hidden">
                    <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full blur-[100px] opacity-15 pointer-events-none transition-all duration-800"
                      style={{ backgroundColor: currentRecord.colorHex }}></div>

                    <div className="flex flex-col gap-5 relative z-10">
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className={`px-3 py-1 rounded-full text-xs font-bold ${currentRecord.pillBg}`}>{currentRecord.label}</div>
                        <div className="text-xs text-slate-400 font-bold">{confidence}% confidence</div>
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-[10px] font-bold text-slate-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                          Sensor-locked
                        </div>
                      </div>

                      <h1 className="text-4xl md:text-5xl lg:text-5xl font-extrabold tracking-tight leading-[1.08] text-slate-100">
                        {currentRecord.headlinePrefix}{' '}
                        <span style={{ color: currentRecord.colorHex }} className="transition-colors duration-500">
                          {currentRecord.accent}
                        </span>
                      </h1>

                      <p className="text-base leading-relaxed max-w-lg text-slate-300">{currentRecord.recommendation}</p>

                      {currentBabyState === 'uncertain' && (
                        <div className="p-5 border rounded-xl max-w-lg bg-[#2E3E56] border-[#3E5071]">
                          {!isMeasuring ? (
                            <div className="flex flex-col gap-2">
                              <p className="text-xs font-medium text-slate-300">Nursery acoustics are in an unclassified zone. Conduct a microphone scan to auto-calibrate.</p>
                              <button onClick={triggerMeasurement}
                                className="w-full sm:w-auto self-start bg-[#3B82C4] hover:bg-[#2A6BA8] text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2">
                                <RefreshCw className="w-3.5 h-3.5" /> Measure Sound Levels
                              </button>
                            </div>
                          ) : (
                            <div className="flex flex-col gap-2">
                              <div className="flex items-center justify-between text-xs font-bold text-slate-200">
                                <span className="flex items-center gap-1.5">
                                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping"></span>
                                  <span className="truncate">{measuringText}</span>
                                </span>
                                <span>{measuringProgress}%</span>
                              </div>
                              <div className="w-full h-1.5 rounded-full overflow-hidden bg-slate-800">
                                <div className="h-full bg-gradient-to-r from-[#3B82C4] to-[#E9879F] transition-all duration-300 rounded-full"
                                  style={{ width: `${measuringProgress}%` }}></div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {currentBabyState === 'pain' && (
                        <div className="p-5 border rounded-xl max-w-lg bg-[#EF8E5C]/5 border-[#EF8E5C]/20">
                          <div className="flex flex-col gap-2">
                            <p className="text-xs text-orange-400 font-bold flex items-center gap-1.5">💛 {babyProfile.name} could use a check-in</p>
                            <button onClick={() => { setCurrentBabyState('calm'); setConfidence(98); setLastKnownActualState('calm'); triggerToast(`All settled — ${babyProfile.name} is calm again.`, 'success'); }}
                              className="w-full sm:w-auto self-start bg-[#3B82C4] hover:bg-[#2A6BA8] text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2">
                              🍼 Mark as resolved
                            </button>
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-3 gap-6 pt-6 border-t max-w-md border-[#3E5071]">
                        <div className="flex flex-col leading-tight">
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Last Cry</span>
                          <span className="text-sm font-bold mt-2 text-slate-200">{dashboardStats.lastCryText}</span>
                        </div>
                        <div className="flex flex-col leading-tight">
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Total Cries</span>
                          <span className="text-sm font-bold mt-2 text-slate-200">{dashboardStats.totalCount} events</span>
                        </div>
                        <div className="flex flex-col leading-tight">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Most Frequent</span>
                          <span className="text-xs font-bold text-[#E9879F] mt-1">{dashboardStats.mostCommon}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-center justify-center">
                      <div className="w-56 h-56 relative">
                        <div className="absolute inset-0 rounded-full opacity-20 transition-all duration-500"
                          style={{ backgroundColor: currentRecord.colorHex, filter: 'blur(36px)' }}></div>
                        <div ref={faceWrapRef} className="w-full h-full relative z-10 will-change-transform">
                          <BabyFace
                            state={currentBabyState}
                            palette={facePalette}
                            isBoy={isBoyFace}
                            isHovered={isHovered}
                            onMouseEnter={() => setIsHovered(true)}
                            onMouseLeave={() => setIsHovered(false)}
                            svgRef={babySvgRef}
                          />
                        </div>
                        {currentBabyState === 'tired' && (
                          <div className="absolute top-6 right-4 pointer-events-none z-20 font-extrabold text-[#8E7BC9] select-none">
                            <span className="text-xl absolute animate-bounce" style={{ animationDelay: '0ms' }}>Z</span>
                            <span className="text-base absolute ml-4 mt-3 animate-bounce" style={{ animationDelay: '300ms' }}>Z</span>
                            <span className="text-sm absolute ml-8 mt-6 animate-bounce" style={{ animationDelay: '600ms' }}>z</span>
                          </div>
                        )}
                      </div>
                      <span className="text-[11px] font-bold tracking-wider uppercase mt-3 text-center text-slate-500">
                        {currentBabyState === 'calm' && `${babyProfile.name} is resting soundly`}
                        {currentBabyState === 'hungry' && `Nursery Alert · ${babyProfile.name} needs a feed`}
                        {currentBabyState === 'pain' && `Needs check-in · ${babyProfile.name} is crying`}
                        {currentBabyState === 'tired' && `Sleep window open · ${babyProfile.name} is settling`}
                        {currentBabyState === 'discomfort' && `Check swaddle · ${babyProfile.name} is fussy`}
                        {currentBabyState === 'uncertain' && '⚠️ Baseline Pending · Upload audio to analyze'}
                      </span>
                    </div>
                  </div>

                  <div className="px-8 pt-5">
                    <div className="border rounded-2xl p-6 shadow-sm bg-[#2E3E56] border-[#3E5071]">
                      <div className="flex items-center justify-between border-b border-[#3E5071] pb-4">
                        <div className="flex items-center gap-2">
                          <Mic className="w-5 h-5 text-[#E9879F]" />
                          <span className="text-sm font-bold text-slate-200 uppercase tracking-wider">Voice Capture</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-[11px] font-bold text-slate-400 whitespace-nowrap">
                            {isRecording ? 'Recording live' : isClassifyingRecording ? 'AI analyzing...' : 'Mic standby'}
                          </span>
                          <button onClick={() => setActiveTab('recordings')}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#3b82c4]/10 border border-[#3b82c4]/30 text-[#5fa5e6] text-[11px] font-bold hover:bg-[#3b82c4]/20 transition-all">
                            <Library className="w-4 h-4" />
                            Access Recordings
                            {recordingsWithAudio.length > 0 && (
                              <span className="bg-[#3B82C4] text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold">{recordingsWithAudio.length}</span>
                            )}
                          </button>
                        </div>
                      </div>
                      <p className="text-[12px] text-slate-400 mt-3 mb-4">Record a clip — saved as WAV (16kHz mono) and sent to AI for cry analysis.</p>
                      <div className="flex items-center gap-5">
                        <button
                          onClick={isRecording ? stopRecording : startRecording}
                          disabled={isClassifyingRecording}
                          className={`w-14 h-14 rounded-full flex items-center justify-center text-white shrink-0 transition-all cursor-pointer shadow-md ${isRecording ? 'bg-[#E9879F]' : 'bg-[#3B82C4] hover:bg-[#2A6BA8]'
                            } ${isClassifyingRecording ? 'opacity-50 cursor-not-allowed' : ''}`}>
                          {isRecording ? <Square className="w-4 h-4 fill-white" /> : <Mic className="w-5 h-5" />}
                        </button>
                        <div className="flex-1 flex items-center gap-4">
                          <div className="flex flex-col leading-none">
                            <span className="text-2xl font-extrabold text-slate-100 tabular-nums">
                              {`${Math.floor(recordSeconds / 60)}:${String(recordSeconds % 60).padStart(2, '0')}`}
                            </span>
                            <span className="text-[11px] font-semibold text-slate-400 mt-1.5">
                              {isRecording ? 'Tap stop when done' : 'Tap mic to start'}
                            </span>
                          </div>
                          <div className="flex items-end gap-0.5 h-7 ml-1">
                            {[3, 5, 2, 6, 4, 7, 3, 5].map((h, i) => (
                              <span key={i} className={`w-1 rounded-full ${isRecording ? 'bg-[#E9879F]' : 'bg-slate-600 opacity-50'}`}
                                style={{ height: `${(isRecording ? h : 2) * 3}px`, ...(isRecording ? { animation: `bounce 0.8s ease-in-out infinite`, animationDelay: `${i * 70}ms` } : {}) }}></span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="px-8 py-5 grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="border p-6 rounded-2xl shadow-sm flex flex-col justify-between bg-[#2E3E56] border-[#3E5071]">
                      <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Latest Nursery Logs</span>
                          <button onClick={() => setActiveTab('history')} className="text-[11px] text-[#3B82C4] font-bold hover:underline cursor-pointer">See history</button>
                        </div>
                        <div className="flex flex-col gap-2">
                          {cryEvents.slice(0, 3).map(evt => (
                            <div key={evt.id} className="flex items-center justify-between p-2 rounded-xl border bg-slate-800/40 border-slate-700/30">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: evt.type === 'Hungry' ? '#E9879F' : evt.type === 'Tired' ? '#8E7BC9' : '#3B82C4' }}></div>
                                <span className="text-xs font-bold text-slate-300">{evt.type} Cry</span>
                              </div>
                              <span className="text-[10px] text-slate-400 font-semibold">{evt.time}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-[#3E5071] text-[11px] font-medium text-slate-400">
                        <span>{cryEvents.length} total logs</span>
                        <button onClick={() => setShowLogCreatorModal(true)} className="flex items-center gap-1 text-[11px] text-[#E9879F] font-bold cursor-pointer">
                          <Plus className="w-3 h-3" /> Add Log
                        </button>
                      </div>
                    </div>

                    <div className="border p-5 rounded-2xl shadow-sm flex flex-col justify-between bg-gradient-to-br from-[#3B82C4]/10 to-[#2E3E56] border-[#3E5071]">
                      <div className="flex flex-col gap-2">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Room Temperature</span>
                        <p className="text-[11px] text-slate-400">Real-time ambient temperature in {babyProfile.name || "the"}&apos;s nursery.</p>
                        <div className="flex items-baseline gap-3 mt-2">
                          <span className="text-4xl font-extrabold tracking-tight text-slate-100">21.4°C</span>
                          <span className="text-xs font-bold px-2 py-0.5 rounded-lg border text-emerald-400 bg-emerald-500/10 border-emerald-500/30">Ideal Range</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[#3E5071] text-[11px] font-medium text-slate-400">
                        <Thermometer className="w-4 h-4 text-[#3B82C4]" />
                        <span>Ambient Comfort Shield is ACTIVE</span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB: RECORDINGS */}
          {activeTab === 'recordings' && (
            <div className="p-8 flex flex-col gap-6 flex-1">
              <div>
                <h3 className="text-base font-bold text-slate-200">All Recordings</h3>
                <p className="text-[12px] text-slate-400 mt-1">{recordingsWithAudio.length} audio capture{recordingsWithAudio.length !== 1 ? 's' : ''} saved</p>
              </div>

              {recordingsWithAudio.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center gap-4 bg-[#26344A] rounded-2xl border border-[#3E5071] flex-1">
                  <div className="w-16 h-16 rounded-2xl bg-[#3b82c4]/10 flex items-center justify-center">
                    <Mic className="w-6 h-6 text-[#3B82C4]" />
                  </div>
                  <h4 className="text-base font-bold text-slate-300">No recordings yet</h4>
                  <p className="text-sm text-slate-400 max-w-xs">Use the Voice Capture section on the Now tab to record nursery audio.</p>
                  <button onClick={() => setActiveTab('now')}
                    className="mt-3 px-5 py-2.5 bg-[#3B82C4] hover:bg-[#2A6BA8] text-white rounded-xl text-sm font-bold transition-all">
                    Go to Voice Capture
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {recordingsWithAudio.map((evt) => (
                    <div key={evt.id} className="p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center gap-5 transition-all bg-[#26344A] border-[#3E5071] hover:border-[#4a6080]">
                      <div className="flex items-center gap-5 flex-1 min-w-0">
                        <button
                          onClick={() => {
                            if (currentAudioUrl === evt.audioUrl && isAudioPlaying) {
                              audioPlayerRef.current?.pause();
                              setIsAudioPlaying(false);
                            } else {
                              setCurrentAudioUrl(evt.audioUrl!);
                              if (audioPlayerRef.current) {
                                audioPlayerRef.current.src = evt.audioUrl!;
                                audioPlayerRef.current.load();
                                audioPlayerRef.current.play().catch(() => triggerToast('Playback failed', 'warning'));
                                setIsAudioPlaying(true);
                              }
                            }
                          }}
                          className={`w-12 h-12 rounded-full flex items-center justify-center text-white shrink-0 transition-all ${currentAudioUrl === evt.audioUrl && isAudioPlaying ? 'bg-[#E9879F]' : 'bg-[#3B82C4] hover:bg-[#2A6BA8]'
                            }`}>
                          {currentAudioUrl === evt.audioUrl && isAudioPlaying
                            ? <Pause className="w-4 h-4 fill-white" />
                            : <Play className="w-4 h-4 fill-white translate-x-0.5" />}
                        </button>
                        <div className="flex flex-col leading-tight min-w-0">
                          <span className="text-base font-bold text-slate-200">{evt.type} Recording</span>
                          <span className="text-[11px] text-slate-400 font-semibold mt-1">{evt.time} · {evt.duration} · {evt.confidence}% confidence</span>
                          <p className="text-[12px] text-slate-400 mt-2 truncate max-w-xs">{evt.recommendation}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${evt.intensity === 'High' ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' :
                          evt.intensity === 'Moderate' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                            'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          }`}>{evt.intensity}</span>
                        {currentAudioUrl === evt.audioUrl && isAudioPlaying && (
                          <div className="flex items-end gap-0.5 h-5">
                            {[3, 5, 2, 4, 3].map((h, i) => (
                              <span key={i} className="w-1 rounded-full bg-[#E9879F]"
                                style={{ height: `${h * 3}px`, animation: 'bounce 0.8s ease-in-out infinite', animationDelay: `${i * 80}ms` }}></span>
                            ))}
                          </div>
                        )}
                        <button onClick={() => {
                          if (currentAudioUrl === evt.audioUrl) { setCurrentAudioUrl(null); audioPlayerRef.current?.pause(); setIsAudioPlaying(false); }
                          setCryEvents(prev => prev.filter(e => e.id !== evt.id));
                          triggerToast('Recording deleted.', 'warning');
                        }} className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all" title="Delete recording">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB: HISTORY */}
          {activeTab === 'history' && (
            <div className="p-8 flex flex-col gap-6">
              {liveGraphEnabled && (
                <div className="bg-[#26344A] p-6 rounded-2xl border border-[#3E5071] shadow-sm flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4" style={{ color: graphColor }} />
                      <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">Live Baby Monitor</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                        Live 24/7
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-semibold">Higher = worse · Lower = calm</span>
                  </div>
                  <div className="relative h-32 w-full overflow-hidden rounded-xl bg-[#1C2839] border border-[#3E5071]">
                    <svg viewBox={`0 0 ${graphData.length * 10} 100`} preserveAspectRatio="none" className="w-full h-full">
                      <defs>
                        <linearGradient id="graphFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={graphColor} stopOpacity="0.4" />
                          <stop offset="100%" stopColor={graphColor} stopOpacity="0.02" />
                        </linearGradient>
                      </defs>
                      <path
                        d={`M0,100 ${graphData.map((v, i) => `L${i * 10},${100 - v}`).join(' ')} L${(graphData.length - 1) * 10},100 Z`}
                        fill="url(#graphFill)"
                      />
                      <polyline
                        points={graphData.map((v, i) => `${i * 10},${100 - v}`).join(' ')}
                        fill="none" stroke={graphColor} strokeWidth="2"
                        strokeLinejoin="round" strokeLinecap="round"
                      />
                      <circle cx={(graphData.length - 1) * 10} cy={100 - graphData[graphData.length - 1]} r="3" fill={graphColor} />
                    </svg>
                    <div className="absolute right-2 top-1 flex flex-col justify-between h-full text-[9px] text-slate-500 font-bold pointer-events-none py-1">
                      <span>100</span><span>50</span><span>0</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-semibold">
                    <span>Current: <span className="font-bold" style={{ color: graphColor }}>{graphData[graphData.length - 1]}</span></span>
                    <span>State: <span className="font-bold text-slate-300 capitalize">{currentBabyState}</span></span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
                <div className="flex flex-col gap-4">
                  <div className="bg-[#26344A] p-5 rounded-2xl border border-[#3E5071] shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="w-full md:w-72 relative">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input type="text" placeholder="Search cry history records..." value={historySearchQuery}
                        onChange={(e) => setHistorySearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-1.5 bg-[#2E3E56] border border-[#3E5071] rounded-xl text-xs font-medium text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#3B82C4]" />
                    </div>
                    <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
                      <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0 hidden sm:block" />
                      {['All', 'Hungry', 'Tired', 'Discomfort', 'Pain', 'Burping'].map((typ) => (
                        <button key={typ} onClick={() => setHistoryFilterType(typ)}
                          className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all ${historyFilterType === typ ? 'bg-[#3B82C4] text-white border-[#3B82C4]' : 'bg-[#2E3E56] text-slate-400 border-[#3E5071] hover:bg-[#26344A]'
                            }`}>{typ}</button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-400 px-1">
                      <span>EVENT LOG</span>
                      <span>{filteredEventsForHistory.length} logs</span>
                    </div>
                    {filteredEventsForHistory.length > 0 ? filteredEventsForHistory.map((evt) => (
                      <div key={evt.id} onClick={() => {
                        setSelectedEventDetails(evt);
                        if (audioPlayerRef.current) { audioPlayerRef.current.pause(); setIsAudioPlaying(false); }
                        if (evt.audioUrl) {
                          setCurrentAudioUrl(evt.audioUrl);
                          if (audioPlayerRef.current) { audioPlayerRef.current.src = evt.audioUrl; audioPlayerRef.current.load(); }
                        } else {
                          setCurrentAudioUrl(null);
                          if (audioPlayerRef.current) audioPlayerRef.current.src = '';
                        }
                        const mappedType = cryTypeToBabyState(evt.type);
                        setCurrentBabyState(mappedType); setConfidence(evt.confidence); setLastKnownActualState(mappedType);
                        triggerToast(`Viewing ${evt.type} event playback`, 'info');
                      }} className={`w-full text-left p-4 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${selectedEventDetails?.id === evt.id
                        ? 'bg-blue-500/10 border-blue-500/40 shadow-sm text-slate-100'
                        : 'bg-[#26344A] border-[#3E5071] hover:border-[#384a6c] text-slate-300'
                        }`}>
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                            style={{
                              backgroundColor: evt.type === 'Hungry' ? '#3D1A22' : evt.type === 'Tired' ? '#221A35' : evt.type === 'Pain' ? '#3D1A1A' : evt.type === 'Discomfort' ? '#3D2E0E' : '#1A2A3D',
                              color: evt.type === 'Hungry' ? '#E9879F' : evt.type === 'Tired' ? '#8E7BC9' : evt.type === 'Pain' ? '#E25C5C' : evt.type === 'Discomfort' ? '#E5A23C' : '#3B82C4'
                            }}>
                            <Clock className="w-4 h-4" />
                          </div>
                          <div className="flex flex-col leading-tight truncate">
                            <span className="text-sm font-bold text-slate-200">{evt.type} Cry</span>
                            <span className="text-[10px] text-[#E9879F] font-bold mt-0.5">{evt.confidence}% · {evt.intensity} intensity</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="flex flex-col items-end leading-none">
                            <span className="text-xs font-bold text-slate-200">{evt.time}</span>
                            <span className="text-[10px] text-slate-400 font-semibold mt-1">{evt.duration}</span>
                          </div>
                          <ChevronRight className={`w-4 h-4 transition-transform ${selectedEventDetails?.id === evt.id ? 'text-[#3B82C4] translate-x-1' : 'text-slate-500'}`} />
                        </div>
                      </div>
                    )) : (
                      <div className="bg-[#26344A] rounded-2xl border border-[#3E5071] p-12 text-center flex flex-col items-center justify-center gap-2">
                        <Clock className="w-8 h-8 text-slate-500" />
                        <h4 className="text-sm font-bold text-slate-300">No match found</h4>
                      </div>
                    )}
                  </div>
                </div>

                {selectedEventDetails && (
                  <div className="bg-[#26344A] p-5 rounded-2xl border border-[#3E5071] shadow-sm flex flex-col gap-4 h-fit lg:sticky lg:top-4">
                    <div className="flex items-center justify-between border-b border-[#3E5071] pb-3">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Acoustic Playback</span>
                      <button onClick={() => {
                        setCryEvents(prev => prev.filter(e => e.id !== selectedEventDetails.id));
                        triggerToast('Log deleted.', 'warning');
                        setSelectedEventDetails(null);
                      }} className="text-slate-400 hover:text-rose-500 font-bold text-xs p-1 rounded hover:bg-rose-950/25 transition-all flex items-center gap-1">
                        <Trash2 className="w-3.5 h-3.5" /> delete
                      </button>
                    </div>
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#3B82C4]/10 text-[#3B82C4] flex items-center justify-center font-bold">{selectedEventDetails.type.charAt(0)}</div>
                        <div className="flex flex-col leading-tight">
                          <h3 className="text-base font-bold text-slate-100">{selectedEventDetails.type} Event</h3>
                          <span className="text-[10px] font-bold text-slate-400">{selectedEventDetails.time} · {selectedEventDetails.duration}</span>
                        </div>
                      </div>
                      <div className="bg-[#2E3E56] rounded-xl p-3.5 border border-[#3E5071] flex items-center justify-between gap-4">
                        <button onClick={toggleAudioPlayback} disabled={!currentAudioUrl}
                          className={`w-9 h-9 rounded-full flex items-center justify-center text-white transition-all ${!currentAudioUrl ? 'opacity-50 cursor-not-allowed bg-slate-600' : isAudioPlaying ? 'bg-[#E9879F]' : 'bg-[#3B82C4]'
                            }`}>
                          {isAudioPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white translate-x-0.5" />}
                        </button>
                        <div className="flex-1 flex flex-col">
                          <span className="text-xs font-bold text-slate-200">Recorded Audio</span>
                          <span className="text-[10px] text-slate-400 font-semibold mt-1">
                            {currentAudioUrl ? (isAudioPlaying ? 'Playing...' : 'Ready') : 'No audio attached'}
                          </span>
                        </div>
                        {selectedEventDetails.audioUrl && (
                          <button onClick={() => setActiveTab('recordings')}
                            className="text-[10px] text-[#5fa5e6] font-bold hover:underline flex items-center gap-1">
                            <Library className="w-3.5 h-3.5" /> Library
                          </button>
                        )}
                      </div>
                      <div className="flex flex-col gap-3 pt-3 border-t border-[#3E5071]">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="flex flex-col bg-[#2E3E56] p-2.5 rounded-xl border border-[#3E5071]">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Intensity</span>
                            <span className="text-xs font-bold text-slate-200 mt-1.5">{selectedEventDetails.intensity}</span>
                          </div>
                          <div className="flex flex-col bg-[#2E3E56] p-2.5 rounded-xl border border-[#3E5071]">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Confidence</span>
                            <span className="text-xs font-bold text-slate-200 mt-1.5">{selectedEventDetails.confidence}%</span>
                          </div>
                        </div>
                        <div className="flex flex-col leading-tight">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">AI Analysis</span>
                          <p className="text-xs text-slate-300 leading-relaxed mt-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">{selectedEventDetails.recommendation}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: INSIGHTS */}
          {activeTab === 'insights' && (
            <div className="p-8 flex flex-col gap-6 flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 flex-1">
                <div className="bg-[#26344A] p-6 rounded-2xl border border-[#3E5071] shadow-sm flex flex-col col-span-1 md:col-span-2">
                  <div className="flex items-center justify-between border-b border-[#3E5071] pb-4 gap-3 flex-wrap">
                    <div className="flex items-center gap-2">
                      <BarChart2 className="w-4 h-4 text-[#3B82C4]" />
                      <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                        {insightMode === 'hourly' ? 'Cry Density · 24 Hours' : 'Cry Breakdown · By Type'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 bg-[#2E3E56] border border-[#3E5071] rounded-lg p-0.5">
                      {(['hourly', 'type'] as const).map((m) => (
                        <button key={m} onClick={() => { setInsightMode(m); setHoverBar(null); }}
                          className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide transition-all cursor-pointer ${insightMode === m ? 'bg-[#3B82C4] text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                            }`}>{m === 'hourly' ? 'Hourly' : 'By type'}</button>
                      ))}
                    </div>
                  </div>
                  <div className="w-full mt-4 relative">
                    <div className="absolute left-0 right-0 top-0 h-64 flex flex-col justify-between pointer-events-none">
                      {Array(4).fill(0).map((_, g) => <div key={g} className="w-full border-t border-dashed border-[#3E5071]/40"></div>)}
                    </div>
                    <div className="relative h-64 flex items-end justify-between gap-2">
                      {insightData.bars.map((b, idx) => {
                        const pct = Math.max((b.count / insightData.maxCount) * 100, b.count > 0 ? 5 : 1.5);
                        const active = hoverBar === idx;
                        return (
                          <div key={idx} className="relative flex-1 h-full flex items-end justify-center cursor-pointer"
                            onMouseEnter={() => setHoverBar(idx)} onMouseLeave={() => setHoverBar(c => c === idx ? null : c)}>
                            <div className={`absolute left-1/2 -translate-x-1/2 bottom-full mb-2 bg-slate-900 border border-[#3E5071] text-white text-[10px] font-bold px-2 py-1 rounded-lg shadow-lg whitespace-nowrap z-20 transition-all duration-150 ${active ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1 pointer-events-none'}`}>
                              {b.label} · {b.count}
                            </div>
                            <div className="w-full max-w-[44px] rounded-t-lg transition-all duration-300"
                              style={{ height: `${pct}%`, backgroundColor: b.color, opacity: hoverBar === null || active ? 1 : 0.4, boxShadow: active ? `0 -2px 12px ${b.color}66` : 'none' }}></div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex justify-between gap-2 mt-2">
                      {insightData.bars.map((b, idx) => (
                        <span key={idx} className={`flex-1 text-center text-[10px] font-bold truncate transition-colors ${hoverBar === idx ? 'text-slate-100' : 'text-slate-400'}`}>{b.label}</span>
                      ))}
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#3E5071] text-[10px] font-bold text-slate-400">
                      <span>Peak: {insightData.maxCount}</span>
                      <span>{insightData.total} total logs</span>
                    </div>
                  </div>
                </div>

                <div className="bg-[#26344A] p-5 rounded-2xl border border-[#3E5071] shadow-sm flex flex-col">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none border-b border-[#3E5071] pb-3">Percentage Split</span>
                  <div className="flex flex-col gap-4 mt-4">
                    {insightData.byType.map(row => (
                      <div key={row.key} className="flex flex-col gap-1.5 leading-none group cursor-default">
                        <div className="flex justify-between text-xs font-bold text-slate-300">
                          <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: row.color }}></span>
                            {row.label}
                          </span>
                          <span>{row.pct}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-[#2E3E56] rounded-full overflow-hidden border border-[#3E5071]">
                          <div className="h-full rounded-full transition-all duration-700 group-hover:brightness-125"
                            style={{ width: `${row.pct}%`, backgroundColor: row.color }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: SETTINGS */}
          {activeTab === 'settings' && (
            <div className="p-8 flex flex-col gap-6 flex-1">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1">
                {activeBabyId ? (
                  <form onSubmit={saveBabyProfileSettings} className="p-6 rounded-2xl border shadow-sm flex flex-col gap-5 bg-[#2E3E56] border-[#3E5071]">
                    <span className="text-sm font-bold uppercase tracking-widest border-b pb-4 text-slate-400 border-[#3E5071]\">Baby Profile</span>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-2">
                        <label className="text-sm font-bold text-slate-500\">First Name</label>
                        <input type="text" value={editProfile.name} onChange={(e) => setEditProfile({ ...editProfile, name: e.target.value })}
                          className="px-4 py-2 border rounded-xl text-sm font-bold focus:outline-none focus:border-[#3B82C4] bg-[#3E5071]/40 border-slate-700 text-slate-100" required />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-sm font-bold text-slate-500\">Age (Months)</label>
                        <input type="number" value={editProfile.ageMonth || ''} placeholder="0" onChange={(e) => setEditProfile({ ...editProfile, ageMonth: Number(e.target.value) })}
                          className="px-4 py-2 border rounded-xl text-sm font-bold focus:outline-none focus:border-[#3B82C4] bg-[#3E5071]/40 border-slate-700 text-slate-100" required />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-2">
                        <label className="text-sm font-bold text-slate-500">Weight (Lbs)</label>
                        <input type="number" step="0.1" value={editProfile.weightLbs || ''} placeholder="0" onChange={(e) => setEditProfile({ ...editProfile, weightLbs: Number(e.target.value) })}
                          className="px-4 py-2 border rounded-xl text-sm font-bold focus:outline-none focus:border-[#3B82C4] bg-[#3E5071]/40 border-slate-700 text-slate-100" required />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-sm font-bold text-slate-500">Sleep Goal (hrs)</label>
                        <input type="number" value={editProfile.sleepGoal || ''} placeholder="14" onChange={(e) => setEditProfile({ ...editProfile, sleepGoal: Number(e.target.value) })}
                          className="px-4 py-2 border rounded-xl text-sm font-bold focus:outline-none focus:border-[#3B82C4] bg-[#3E5071]/40 border-slate-700 text-slate-100" required />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-500">Gender</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button type="button" onClick={() => { setEditProfile({ ...editProfile, gender: 'girl' }); setBabyProfile(p => ({ ...p, gender: 'girl' })); setBabies(prev => prev.map(b => b.id === activeBabyId ? { ...b, gender: 'girl' } : b)); }}
                          className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${editProfile.gender === 'girl' ? 'bg-pink-500/10 border-pink-500 text-pink-400' : 'bg-[#2E3E56] border-slate-700 text-slate-400 hover:text-slate-100'}`}>
                          🌸 Daughter
                        </button>
                        <button type="button" onClick={() => { setEditProfile({ ...editProfile, gender: 'boy' }); setBabyProfile(p => ({ ...p, gender: 'boy' })); setBabies(prev => prev.map(b => b.id === activeBabyId ? { ...b, gender: 'boy' } : b)); }}
                          className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${editProfile.gender === 'boy' ? 'bg-blue-500/10 border-blue-500 text-blue-400' : 'bg-[#2E3E56] border-slate-700 text-slate-400 hover:text-slate-100'}`}>
                          🧢 Son
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3.5 rounded-xl border bg-slate-800/20 border-slate-700">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-300">Push Notifications</span>
                        <span className="text-[10px] text-slate-400 font-semibold mt-0.5">Alert on critical cry events</span>
                      </div>
                      <button type="button" onClick={() => setEditProfile({ ...editProfile, notificationEnabled: !editProfile.notificationEnabled })}
                        className={`w-10 h-6 rounded-full flex items-center p-0.5 transition-colors ${editProfile.notificationEnabled ? 'bg-[#3B82C4]' : 'bg-slate-600'}`}>
                        <span className={`w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform ${editProfile.notificationEnabled ? 'translate-x-4' : 'translate-x-0'}`}></span>
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <button type="submit" className="flex-1 bg-[#3B82C4] hover:bg-[#2A6BA8] text-white py-2.5 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer">Save Profile</button>
                      <button type="button" onClick={() => { if (confirm(`Remove ${babyProfile.name}? This cannot be undone.`)) removeBaby(activeBabyId!); }}
                        className="px-4 py-2.5 rounded-xl text-xs font-bold border border-rose-500/40 text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer">
                        Remove Baby
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="p-5 rounded-2xl border bg-[#2E3E56] border-[#3E5071] flex flex-col items-center justify-center gap-3 py-12">
                    <p className="text-sm text-slate-400">No baby selected</p>
                    <button onClick={addBaby} className="flex items-center gap-2 px-4 py-2 bg-[#3B82C4] hover:bg-[#2A6BA8] text-white rounded-xl text-xs font-bold transition-all">
                      <Plus className="w-4 h-4" /> Add a baby
                    </button>
                  </div>
                )}

                <div className="p-5 rounded-2xl border shadow-sm flex flex-col gap-4 bg-[#2E3E56] border-[#3E5071]">
                  <span className="text-xs font-bold uppercase tracking-widest border-b pb-3 text-slate-400 border-[#3E5071]">Hardware & Monitoring</span>
                  <div className="flex flex-col gap-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Cpu className="w-4 h-4 text-slate-400" />
                        <span className="text-xs font-bold text-slate-300">Nursery Sound Link</span>
                      </div>
                      <button type="button" onClick={() => { setPiConnected(!piConnected); triggerToast(piConnected ? 'Sound link offline' : 'Sound telemetry established', piConnected ? 'warning' : 'success'); }}
                        className={`w-10 h-6 rounded-full flex items-center p-0.5 transition-colors ${piConnected ? 'bg-[#3B82C4]' : 'bg-slate-600'}`}>
                        <span className={`w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform ${piConnected ? 'translate-x-4' : 'translate-x-0'}`}></span>
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-slate-400" />
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-300">Live Baby Monitor Graph</span>
                          <span className="text-[10px] text-slate-500 font-semibold">24/7 activity graph on History tab</span>
                        </div>
                      </div>
                      <button type="button" onClick={() => { setLiveGraphEnabled(!liveGraphEnabled); triggerToast(liveGraphEnabled ? 'Live graph disabled' : 'Live graph enabled', 'info'); }}
                        className={`w-10 h-6 rounded-full flex items-center p-0.5 transition-colors ${liveGraphEnabled ? 'bg-emerald-500' : 'bg-slate-600'}`}>
                        <span className={`w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform ${liveGraphEnabled ? 'translate-x-4' : 'translate-x-0'}`}></span>
                      </button>
                    </div>

                    <div className="p-3 rounded-xl border text-[10px] font-bold text-slate-400 flex justify-between gap-4 bg-slate-800/20 border-slate-700">
                      <span>Battery: 84%</span>
                      <span>Telemetry: 6.4 KB/s</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* FOOTER */}
          <footer className="mt-auto px-6 py-4 border-t border-[#3E5071] flex flex-col sm:flex-row items-center justify-between gap-2">
            <span className="text-[11px] font-bold text-slate-500">© 2026 cryOS</span>
            <div className="flex items-center gap-4 text-[11px] font-semibold text-slate-500">
              <button className="hover:text-slate-300 transition-colors cursor-pointer">Privacy</button>
              <button className="hover:text-slate-300 transition-colors cursor-pointer">Terms</button>
              <button className="hover:text-slate-300 transition-colors cursor-pointer">Support</button>
              <span className="text-slate-600">v0.1</span>
            </div>
          </footer>
        </div>
      </main>

      <audio ref={audioPlayerRef} onEnded={() => setIsAudioPlaying(false)} />

      {showLogCreatorModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#26344A] rounded-2xl border border-[#3E5071] shadow-xl max-w-sm w-full p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-[#3E5071] pb-3">
              <span className="text-sm font-bold text-slate-100">Add Log Entry</span>
              <button onClick={() => setShowLogCreatorModal(false)} className="p-1 rounded-lg text-slate-400 hover:bg-[#2E3E56] transition-all cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateCustomEvent} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cry Type</label>
                <select value={newLogType} onChange={(e) => setNewLogType(e.target.value as CryEvent['type'])}
                  className="px-3 py-1.5 border border-[#3E5071] bg-[#2E3E56] rounded-xl text-xs font-bold outline-none text-slate-200">
                  <option value="Hungry">Hungry</option>
                  <option value="Tired">Tired</option>
                  <option value="Discomfort">Discomfort</option>
                  <option value="Burping">Burping</option>
                  <option value="Pain">Pain</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Intensity</label>
                <select value={newLogIntensity} onChange={(e) => setNewLogIntensity(e.target.value as 'Low' | 'Moderate' | 'High')}
                  className="px-3 py-1.5 border border-[#3E5071] bg-[#2E3E56] rounded-xl text-xs font-bold outline-none text-slate-200">
                  <option value="Low">Low</option>
                  <option value="Moderate">Moderate</option>
                  <option value="High">High</option>
                </select>
              </div>
              <div className="flex flex-col gap-2 pt-1">
                <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  <span>Confidence</span><span>{newLogConfidence}%</span>
                </div>
                <input type="range" min="60" max="100" value={newLogConfidence} onChange={(e) => setNewLogConfidence(Number(e.target.value))}
                  className="w-full h-1 bg-[#3E5071] cursor-pointer accent-[#E9879F]" />
              </div>
              <button type="submit" className="w-full bg-[#E9879F] text-white py-2 rounded-xl text-xs font-bold tracking-wide transition-all shadow-md cursor-pointer mt-2">
                Add to Log
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}