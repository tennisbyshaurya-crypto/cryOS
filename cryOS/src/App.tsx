import React, { useState, useEffect, useMemo } from 'react';
import {
  Home, History, BarChart3, Settings, LogOut, Thermometer, Cpu, Volume2,
  Sliders, Battery, Clock, Sparkles, Database, Plus, Search, Filter,
  Play, Pause, Info, Bell, Check, Trash2, Heart, RefreshCw, AlertTriangle, ChevronRight, X
} from 'lucide-react';

// ============================================================================
// TYPE DECLARATIONS
// ============================================================================
type BabyState = 'calm' | 'hungry' | 'pain' | 'tired' | 'discomfort' | 'uncertain';

interface CryEvent {
  id: string;
  type: 'Hungry' | 'Tired' | 'Discomfort' | 'Burping' | 'Pain';
  confidence: number;
  time: string;
  duration: string; // e.g. "45s", "2m 10s"
  intensity: 'Low' | 'Moderate' | 'High';
  recommendation: string;
}

interface ToastMessage {
  id: string;
  text: string;
  type: 'success' | 'info' | 'warning';
}

// ============================================================================
// CONSTANT DATA DICTIONARIES
// ============================================================================
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
    id: 'log-1',
    type: 'Hungry',
    confidence: 91,
    time: '6:42 PM',
    duration: '45s',
    intensity: 'Moderate',
    recommendation: "Rhythmic cry with low frequency followed by standard pause. Preparing 120ml bottle solved this."
  },
  {
    id: 'log-2',
    type: 'Tired',
    confidence: 84,
    time: '5:18 PM',
    duration: '1m 20s',
    intensity: 'Low',
    recommendation: "Gradual crying with yawns in between. Swaddled and put to crib; fell asleep in 10 minutes."
  },
  {
    id: 'log-3',
    type: 'Discomfort',
    confidence: 72,
    time: '4:05 PM',
    duration: '2m 15s',
    intensity: 'Low',
    recommendation: "Fussy whimper with squirming. Changed diaper (wet) and rearranged sleeping blanket."
  },
  {
    id: 'log-4',
    type: 'Hungry',
    confidence: 88,
    time: '2:30 PM',
    duration: '50s',
    intensity: 'Moderate',
    recommendation: "Eacoustic hunger pattern detected. Baby fed on schedule."
  },
  {
    id: 'log-5',
    type: 'Burping',
    confidence: 76,
    time: '1:12 PM',
    duration: '1m 05s',
    intensity: 'Moderate',
    recommendation: "Spastic burping sound. Held shoulder-high with gentle pats. Relieved gas immediately."
  },
  {
    id: 'log-6',
    type: 'Tired',
    confidence: 81,
    time: '12:48 PM',
    duration: '1m 30s',
    intensity: 'Low',
    recommendation: "Tired whimpers. Soft hum and stroke on her forehead encouraged transition to sleep."
  },
  {
    id: 'log-7',
    type: 'Pain',
    confidence: 94,
    time: '10:15 AM',
    duration: '2m 45s',
    intensity: 'High',
    recommendation: "Sharp scream from tummy ache. Walked around holding her in 'football hold' style; gas passed."
  }
];

// ============================================================================
// MAIN APPLICATION COMPONENT
// ============================================================================
export default function App() {
  // Navigation & Shell states
  const [activeTab, setActiveTab] = useState<'now' | 'history' | 'insights' | 'settings'>('now');
  
  // Custom Toasts for instant interactions feedback
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const triggerToast = (text: string, type: 'success' | 'info' | 'warning' = 'info') => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, text, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  };

  // State core metrics
  const [currentBabyState, setCurrentBabyState] = useState<BabyState>('calm');
  const [confidence, setConfidence] = useState<number>(98);
  
  // Keep memory of previous non-uncertain state to revert to when slider is set over 60
  const [lastKnownActualState, setLastKnownActualState] = useState<BabyState>('calm');

  // Interactive Baby Face States
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [clickFx, setClickFx] = useState<BabyState | null>(null);
  const [particles, setParticles] = useState<{ id: string; emoji: string; x: number; y: number; rot: number }[]>([]);

  // Sound Levels Calibration procedure
  const [isMeasuring, setIsMeasuring] = useState<boolean>(false);
  const [measuringProgress, setMeasuringProgress] = useState<number>(0);
  const [measuringText, setMeasuringText] = useState<string>('');

  const triggerMeasurement = () => {
    setIsMeasuring(true);
    setMeasuringProgress(0);
    setMeasuringText('Calibrating nursery acoustic level sensors...');
    triggerToast('Calibration active. Please keep nursery quiet!', 'info');

    let prog = 0;
    const interval = setInterval(() => {
      prog += 10;
      setMeasuringProgress(prog);
      if (prog === 30) {
        setMeasuringText('Detecting background noise floors & ventilation echoes...');
      } else if (prog === 60) {
        setMeasuringText('Assessing current room volume levels...');
      } else if (prog === 80) {
        setMeasuringText('Parsing baby sound signature components...');
      } else if (prog >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          setIsMeasuring(false);
          // Restore back to last known clean state
          const restored = lastKnownActualState === 'uncertain' ? 'calm' : lastKnownActualState;
          setCurrentBabyState(restored);
          setConfidence(98);
          triggerToast('Continuous nursery surveillance restored.', 'success');
        }, 500);
      }
    }, 250);
  };

  const handleFaceClick = () => {
    if (isMeasuring) return;
    if (currentBabyState === 'uncertain') {
      triggerMeasurement();
      return;
    }

    // Each emotion gets a DISTINCT reaction: different particles, spawn pattern,
    // motion and toast. The face also plays a state-specific reaction animation.
    const FX: Record<BabyState, {
      emojis: string[];
      toast: string;
      tone: 'success' | 'info' | 'warning';
      pattern: 'burst' | 'rise' | 'shake' | 'drift' | 'jitter';
    }> = {
      calm:       { emojis: ['💙', '✨', '🫧'],      toast: `${babyProfile.name} coos happily — peaceful and content.`, tone: 'success', pattern: 'burst' },
      hungry:     { emojis: ['🍼', '🥛'],            toast: `${babyProfile.name} smacks lips, rooting for a feed.`,     tone: 'info',    pattern: 'rise' },
      pain:       { emojis: ['💢', '💧'],            toast: `${babyProfile.name} wails sharply — please check in now.`, tone: 'warning', pattern: 'shake' },
      tired:      { emojis: ['💤', '🌙', '😴'],      toast: `${babyProfile.name} yawns and drifts toward sleep.`,       tone: 'info',    pattern: 'drift' },
      discomfort: { emojis: ['😣', '💦'],            toast: `${babyProfile.name} squirms — fussy and unsettled.`,        tone: 'info',    pattern: 'jitter' },
      uncertain:  { emojis: ['❓'],                  toast: '',                                                          tone: 'info',    pattern: 'burst' },
    };

    const fx = FX[currentBabyState] || FX.calm;
    triggerToast(fx.toast, fx.tone);

    // play a face reaction animation for this state
    setClickFx(currentBabyState);
    setTimeout(() => setClickFx(null), 700);

    // particle spawn geometry differs per pattern
    const count = fx.pattern === 'shake' ? 10 : fx.pattern === 'drift' ? 5 : 8;
    const newParticles = Array.from({ length: count }).map((_, i) => {
      let x = 0, y = 0, rot = 0;
      if (fx.pattern === 'burst') {            // even radial pop (calm)
        const a = (Math.PI * 2 * i) / count;
        x = Math.cos(a) * 70; y = Math.sin(a) * 70; rot = Math.random() * 60 - 30;
      } else if (fx.pattern === 'rise') {      // float gently upward (hungry)
        x = (Math.random() - 0.5) * 60; y = -60 - Math.random() * 50; rot = Math.random() * 30 - 15;
      } else if (fx.pattern === 'shake') {     // explosive wide scatter (pain)
        const a = (Math.PI * 2 * i) / count + Math.random();
        const d = 70 + Math.random() * 60; x = Math.cos(a) * d; y = Math.sin(a) * d; rot = Math.random() * 180 - 90;
      } else if (fx.pattern === 'drift') {     // slow lazy drift up-right (tired)
        x = 30 + i * 14 + Math.random() * 10; y = -30 - i * 22; rot = Math.random() * 20 - 10;
      } else {                                  // jitter — tight nervous cluster (discomfort)
        x = (Math.random() - 0.5) * 50; y = (Math.random() - 0.5) * 50 - 10; rot = Math.random() * 120 - 60;
      }
      return {
        id: `p-${Date.now()}-${i}`,
        emoji: fx.emojis[Math.floor(Math.random() * fx.emojis.length)],
        x, y, rot,
      };
    });
    setParticles(newParticles);

    setTimeout(() => { setParticles([]); }, 1400);
  };

  // Trigger automatic "uncertain" state when confidence falls below 60%
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
  }, [confidence]);

  // Handle custom state changes from Simulators
  const changeBabyStateDirectly = (newState: BabyState) => {
    if (newState === 'uncertain') {
      setCurrentBabyState('uncertain');
      setConfidence(48); // trigger auto-loop correctly
    } else {
      setCurrentBabyState(newState);
      setLastKnownActualState(newState);
      if (confidence < 60) {
        setConfidence(92);
      }
    }
    triggerToast(`Simulation: ${babyProfile.name} transitioned to ${newState.toUpperCase()}`, 'info');
  };

  // Audio sensitivity / hardware levels
  const [audioSensitivity, setAudioSensitivity] = useState<number>(75);
  const [ledBrightness, setLedBrightness] = useState<number>(90);
  const [piConnected, setPiConnected] = useState<boolean>(true);
  const [activeSpeaker, setActiveSpeaker] = useState<boolean>(true);
  const [isLvdSphereMode, setIsLvdSphereMode] = useState<boolean>(false); // default to false (Baby Face mode!)

  // Locked strictly to beautiful midnight dark mode per user instructions
  const isDarkMode = true;

  // Profile data — `babyProfile` is always the ACTIVE baby.
  // `babies` is the full roster; switching loads a baby into babyProfile/editProfile.
  type BabyRecord = {
    id: string;
    name: string;
    gender: 'girl' | 'boy';
    ageMonth: number;
    sleepGoal: number;
    weightLbs: number;
    notificationEnabled: boolean;
  };

  const [babies, setBabies] = useState<BabyRecord[]>([
    { id: 'mila', name: 'Mila', gender: 'girl', ageMonth: 4, sleepGoal: 14, weightLbs: 13.8, notificationEnabled: true },
    { id: 'noah', name: 'Noah', gender: 'boy', ageMonth: 9, sleepGoal: 13, weightLbs: 19.2, notificationEnabled: true },
  ]);
  const [activeBabyId, setActiveBabyId] = useState<string>('mila');

  const [babyProfile, setBabyProfile] = useState({
    name: 'Mila',
    gender: 'girl' as 'girl' | 'boy',
    ageMonth: 4,
    sleepGoal: 14,
    weightLbs: 13.8,
    notificationEnabled: true
  });

  const [editProfile, setEditProfile] = useState({
    name: 'Mila',
    gender: 'girl' as 'girl' | 'boy',
    ageMonth: 4,
    sleepGoal: 14,
    weightLbs: 13.8,
    notificationEnabled: true
  });

  // Switch which baby is being monitored
  const switchBaby = (id: string) => {
    const b = babies.find((x) => x.id === id);
    if (!b) return;
    setActiveBabyId(id);
    const { id: _omit, ...profile } = b;
    setBabyProfile({ ...profile });
    setEditProfile({ ...profile });
    setCurrentBabyState('calm');
    setConfidence(98);
    triggerToast(`Now monitoring ${b.name}'s nursery.`, 'info');
  };

  // Add a new baby to the roster and switch to it
  const addBaby = () => {
    const id = `baby-${Date.now()}`;
    const newBaby: BabyRecord = {
      id,
      name: `Baby ${babies.length + 1}`,
      gender: 'girl',
      ageMonth: 1,
      sleepGoal: 15,
      weightLbs: 8,
      notificationEnabled: true,
    };
    setBabies((prev) => [...prev, newBaby]);
    setActiveBabyId(id);
    const { id: _omit, ...profile } = newBaby;
    setBabyProfile({ ...profile });
    setEditProfile({ ...profile });
    setCurrentBabyState('calm');
    setConfidence(98);
    triggerToast(`Added ${newBaby.name}. Edit details in Settings.`, 'success');
  };

  const getDynamicRecord = (stateKey: BabyState) => {
    const record = STATE_RECORDS[stateKey];
    const name = babyProfile.name;
    const isBoy = babyProfile.gender === 'boy';
    const subName = (str: string) => {
      return str
        .replace(/Mila/g, name)
        .replace(/\bShe slept\b/g, isBoy ? 'He slept' : 'She slept')
        .replace(/\bshe slept\b/g, isBoy ? 'he slept' : 'she slept')
        .replace(/\bShe\b/g, isBoy ? 'He' : 'She')
        .replace(/\bshe\b/g, isBoy ? 'he' : 'she')
        .replace(/\bher\b/g, isBoy ? 'his' : 'her')
        .replace(/\bHer\b/g, isBoy ? 'His' : 'Her');
    };

    // Dynamically adjust pill background styles if in dark mode
    let pillBg = record.pillBg;
    if (isDarkMode) {
      if (stateKey === 'calm') pillBg = 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30';
      else if (stateKey === 'hungry') pillBg = 'bg-pink-500/10 text-pink-400 border border-pink-500/30';
      else if (stateKey === 'pain') pillBg = 'bg-orange-500/10 text-orange-400 border border-orange-500/30';
      else if (stateKey === 'tired') pillBg = 'bg-purple-500/10 text-purple-400 border border-purple-500/30';
      else if (stateKey === 'discomfort') pillBg = 'bg-amber-500/10 text-amber-400 border border-[#f59e0b]/30';
      else pillBg = 'bg-slate-800 text-slate-400 border border-slate-700';
    }

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

  // Event Log and Add new log interaction
  const [cryEvents, setCryEvents] = useState<CryEvent[]>(INITIAL_CRYES);
  const [selectedEventDetails, setSelectedEventDetails] = useState<CryEvent | null>(INITIAL_CRYES[0]);
  const [isAudioPlaying, setIsAudioPlaying] = useState<boolean>(false);
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
    triggerToast('Profile successfully saved & updated on Pi core memory.', 'success');
  };

  // Handle addition of simulated log
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

  // Compute stats on fly
  const dashboardStats = useMemo(() => {
    const totalCount = cryEvents.length;
    // count by type
    const frequencies: Record<string, number> = {};
    cryEvents.forEach(e => {
      frequencies[e.type] = (frequencies[e.type] || 0) + 1;
    });
    
    // find most common
    let mostCommon = 'Hungry';
    let maxFreq = 0;
    Object.keys(frequencies).forEach(k => {
      if (frequencies[k] > maxFreq) {
        maxFreq = frequencies[k];
        mostCommon = k;
      }
    });

    // last cry label
    const newestCry = cryEvents[0];
    const lastCryText = newestCry ? `${newestCry.type} · ${newestCry.time}` : 'None detected today';

    return {
      totalCount,
      mostCommon,
      lastCryText,
      frequencies
    };
  }, [cryEvents]);

  // Filter and search on historical events
  const filteredEventsForHistory = useMemo(() => {
    return cryEvents.filter(e => {
      const matchSearch = e.type.toLowerCase().includes(historySearchQuery.toLowerCase()) || 
                          e.recommendation.toLowerCase().includes(historySearchQuery.toLowerCase());
      const matchFilter = historyFilterType === 'All' || e.type === historyFilterType;
      return matchSearch && matchFilter;
    });
  }, [cryEvents, historySearchQuery, historyFilterType]);

  // ===========================================================
  // GENDER PALETTES — fully distinct. Boy = cool blue, Girl = warm pink.
  // Drives skin tint, cheeks, outlines, accents and feature strokes.
  // ===========================================================
  const isBoyFace = babyProfile.gender === 'boy';
  const facePalette = isBoyFace
    ? {
        skinLight: '#EEF5FF',
        skinMid:   '#DCE9FB',
        skinDeep:  '#C3D8F5',
        outline:   '#3B82C4',
        outlineSoft: '#7FB0E0',
        cheek:     '#5FA5E6',
        nose:      '#5B92D4',
        accent:    '#2A6BA8',
        accentSoft:'#3E78AE',
        brow:      '#2A6BA8',
        hairA:     '#5B92D4',
        hairB:     '#2A6BA8',
      }
    : {
        skinLight: '#FFEAEF',
        skinMid:   '#FBD0DA',
        skinDeep:  '#F4AEBF',
        outline:   '#E9879F',
        outlineSoft: '#F6B6C4',
        cheek:     '#FB7185',
        nose:      '#E48FA3',
        accent:    '#D26F88',
        accentSoft:'#C9758B',
        brow:      '#B65C72',
        hairA:     '#FBBF24',
        hairB:     '#D97706',
      };

  const headOutlineColor = facePalette.outline;
  const earsOutlineColor = facePalette.outlineSoft;
  const cheeksColor = facePalette.cheek;
  const noseOutlineColor = facePalette.nose;

  return (
    <div className={`flex flex-col md:grid md:grid-columns-1 lg:grid-cols-[250px_1fr] min-h-screen p-2 md:p-3 lg:p-4 gap-3 lg:gap-4 select-none relative transition-colors duration-300 ${isDarkMode ? 'bg-[#1C2839] text-slate-200' : 'bg-[#F4F5F7] text-slate-800'}`}>
      
      {/* TOAST SYSTEM CONTAINER */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-center gap-3 p-3.5 rounded-xl shadow-xl border text-sm font-medium transition-all duration-300 animate-fade-up pointer-events-auto ${
              isDarkMode
                ? 'bg-[#26344A]/90 border-[#3E5071] text-slate-200'
                : 'bg-white text-slate-850'
            } ${
              toast.type === 'success'
                ? (isDarkMode ? 'border-emerald-550/30 text-emerald-400 bg-emerald-950/20' : 'border-emerald-100 text-emerald-800 bg-emerald-50/90')
                : toast.type === 'warning'
                ? (isDarkMode ? 'border-amber-550/30 text-amber-400 bg-amber-950/20' : 'border-amber-100 text-amber-800 bg-amber-50/90')
                : (isDarkMode ? 'border-blue-550/30 text-sky-400 bg-sky-950/20' : 'border-blue-100 text-blue-800 bg-blue-50/90')
            }`}
          >
            {toast.type === 'success' && <Check className="w-4 h-4 text-emerald-500 shrink-0" />}
            {toast.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />}
            {toast.type === 'info' && <Sparkles className="w-4 h-4 text-blue-500 shrink-0" />}
            <span>{toast.text}</span>
          </div>
        ))}
      </div>

      {/* =======================================================================
          SIDEBAR / BRAND CONTROLS
          ======================================================================= */}
      <aside className={`w-full lg:w-auto border rounded-2xl p-4 flex flex-col justify-between shadow-sm shrink-0 transition-all duration-350 ${isDarkMode ? 'bg-[#26344A] border-[#3E5071] shadow-black/40' : 'bg-white border-slate-100'}`}>
        <div className="flex flex-col gap-5">
          {/* Brand header */}
          <div className={`flex items-center justify-between border-b pb-4 ${isDarkMode ? 'border-[#3E5071]' : 'border-slate-100'}`}>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#3B82C4] to-[#E9879F] flex items-center justify-center shadow-md shadow-blue-100/10 text-white">
                <Heart className="w-4.5 h-4.5 stroke-[2.5]" />
              </div>
              <div className="flex flex-col leading-tight">
                <span className={`text-base font-extrabold tracking-tight ${isDarkMode ? 'text-slate-105' : 'text-slate-800'}`}>
                  cry<span className="text-[#3B82C4]">OS</span>
                </span>
                <span className={`text-[10px] font-semibold uppercase tracking-widest leading-none mt-0.5 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                  Nursery Intel
                </span>
              </div>
            </div>

            {/* Micro display of Raspberry Pi state */}
            <div className={`w-2 h-2 rounded-full ${piConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-400'}`} title={piConnected ? "Pi Online" : "Pi Offline"}></div>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-row overflow-x-auto lg:overflow-x-visible lg:flex-col gap-1 pb-2 lg:pb-0 scrollbar-none">
            <button
              onClick={() => setActiveTab('now')}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all shrink-0 cursor-pointer ${
                activeTab === 'now'
                  ? (isDarkMode ? 'bg-[#3b82c4]/15 text-[#5fa5e6] border border-[#3b82c4]/20' : 'bg-blue-50/80 text-[#3B82C4]')
                  : (isDarkMode ? 'text-slate-400 hover:text-slate-100 hover:bg-[#2E3E56]' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50')
              }`}
            >
              <Home className={`w-4.5 h-4.5 ${activeTab === 'now' ? 'text-[#3B82C4]' : 'text-slate-400'}`} />
              <span>Now</span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all shrink-0 cursor-pointer ${
                activeTab === 'history'
                  ? (isDarkMode ? 'bg-[#3b82c4]/15 text-[#5fa5e6] border border-[#3b82c4]/20' : 'bg-blue-50/80 text-[#3B82C4]')
                  : (isDarkMode ? 'text-slate-400 hover:text-slate-100 hover:bg-[#2E3E56]' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50')
              }`}
            >
              <History className={`w-4.5 h-4.5 ${activeTab === 'history' ? 'text-[#3B82C4]' : 'text-slate-400'}`} />
              <span>History</span>
              <span className={`ml-auto text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                activeTab === 'history'
                  ? 'bg-[#3B82C4] text-white'
                  : (isDarkMode ? 'bg-slate-800 text-slate-500' : 'bg-slate-100 text-slate-400')
              }`}>
                {cryEvents.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('insights')}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all shrink-0 cursor-pointer ${
                activeTab === 'insights'
                  ? (isDarkMode ? 'bg-[#3b82c4]/15 text-[#5fa5e6] border border-[#3b82c4]/20' : 'bg-blue-50/80 text-[#3B82C4]')
                  : (isDarkMode ? 'text-slate-400 hover:text-slate-100 hover:bg-[#2E3E56]' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50')
              }`}
            >
              <BarChart3 className={`w-4.5 h-4.5 ${activeTab === 'insights' ? 'text-[#3B82C4]' : 'text-slate-400'}`} />
              <span>Insights</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all shrink-0 cursor-pointer ${
                activeTab === 'settings'
                  ? (isDarkMode ? 'bg-[#3b82c4]/15 text-[#5fa5e6] border border-[#3b82c4]/20' : 'bg-blue-50/80 text-[#3B82C4]')
                  : (isDarkMode ? 'text-slate-400 hover:text-slate-100 hover:bg-[#2E3E56]' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50')
              }`}
            >
              <Settings className={`w-4.5 h-4.5 ${activeTab === 'settings' ? 'text-[#3B82C4]' : 'text-slate-400'}`} />
              <span>Settings</span>
            </button>
          </nav>
        </div>

        {/* ===== MULTI-BABY SWITCHER ===== */}
        <div className={`hidden lg:flex flex-col gap-1.5 border-t pt-3 mt-4 ${isDarkMode ? 'border-[#3E5071]' : 'border-slate-100'}`}>
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 px-1 mb-0.5">Your Babies</span>
          {babies.map((b) => {
            const active = b.id === activeBabyId;
            return (
              <button
                key={b.id}
                id={`btn-baby-${b.id}`}
                onClick={() => switchBaby(b.id)}
                className={`flex items-center gap-2.5 px-2 py-1.5 rounded-xl transition-all cursor-pointer ${
                  active ? 'bg-[#3b82c4]/15 border border-[#3b82c4]/25' : 'border border-transparent hover:bg-[#2E3E56]'
                }`}
              >
                <div className={`w-7 h-7 rounded-full text-white font-bold text-xs flex items-center justify-center shrink-0 ${
                  b.gender === 'boy' ? 'bg-gradient-to-tr from-[#2A6BA8] to-[#5FA5E6]' : 'bg-gradient-to-tr from-[#D26F88] to-[#FB7185]'
                }`}>
                  {b.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <div className={`text-xs font-bold leading-tight truncate ${active ? 'text-[#5fa5e6]' : 'text-slate-200'}`}>{b.name}</div>
                  <div className="text-[10px] font-semibold text-slate-500">{b.gender === 'girl' ? 'Daughter' : 'Son'} • {b.ageMonth}M</div>
                </div>
                {active && <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0"></div>}
              </button>
            );
          })}
          <button
            id="btn-add-baby"
            onClick={addBaby}
            className="flex items-center gap-2.5 px-2 py-1.5 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-[#2E3E56] transition-all cursor-pointer"
          >
            <div className="w-7 h-7 rounded-full border border-dashed border-slate-600 flex items-center justify-center shrink-0">
              <Plus className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-bold">Add baby</span>
          </button>
        </div>

        {/* Baby profile capsule */}
        <div className={`hidden lg:flex items-center gap-3 border-t pt-4 mt-4 ${isDarkMode ? 'border-[#3E5071]' : 'border-slate-100'}`}>
          <div className={`w-9 h-9 rounded-full text-white font-bold text-sm flex items-center justify-center shadow-inner ${
            babyProfile.gender === 'boy' ? 'bg-gradient-to-tr from-[#2A6BA8] to-[#5FA5E6]' : 'bg-gradient-to-tr from-[#E9879F] to-[#3B82C4]'
          }`}>
            {babyProfile.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className={`text-xs font-bold leading-tight truncate ${isDarkMode ? 'text-slate-205' : 'text-slate-800'}`}>Baby {babyProfile.name}</h4>
            <span className={`text-[10px] font-semibold ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
              {babyProfile.gender === 'girl' ? '👧 Daughter' : '👦 Son'} • {babyProfile.ageMonth}M
            </span>
          </div>

          <button
            onClick={() => {
              triggerToast('Account logged out successfully.', 'warning');
              console.log('Logout Clicked');
            }}
            className="p-1.5 rounded-lg text-slate-305 hover:text-rose-500 hover:bg-rose-50/80 transition-all cursor-pointer"
            title="Disconnect"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* =======================================================================
          MAIN DISPLAY PANEL
          ======================================================================= */}
      <main className={`flex-1 border rounded-2xl flex flex-col overflow-hidden shadow-sm transition-all duration-300 ${isDarkMode ? 'bg-[#26344A] border-[#3E5071]' : 'bg-white border-[#f1f3f7]'}`}>
        
        {/* Topbar navigation status */}
        <header className={`px-6 py-4 border-b flex items-center justify-between flex-shrink-0 z-10 transition-all duration-300 ${isDarkMode ? 'bg-[#26344A] border-[#3E5071]' : 'bg-white border-slate-100'}`}>
          <div className="flex flex-col">
            <h2 className={`text-base font-bold capitalize leading-tight ${isDarkMode ? 'text-slate-100' : 'text-slate-800'}`}>
              {activeTab === 'now' ? 'Nursery Monitor Hub' : `${activeTab} Pane`}
            </h2>
            <p className={`text-[11px] font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-400'}`}>
              {activeTab === 'now' && `Live acoustic streams for ${babyProfile.name}'s Room`}
              {activeTab === 'history' && 'Audit trail of cry frequencies & intensity states'}
              {activeTab === 'insights' && 'Digital parent-assistant smart trends analytics'}
              {activeTab === 'settings' && 'Configure acoustic parameters & profile rules'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Listening online pill */}
            <div className={`px-2.5 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1.5 transition-all ${
              piConnected
                ? (isDarkMode ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-emerald-50 text-emerald-600')
                : (isDarkMode ? 'bg-rose-500/10 text-rose-450 border border-rose-500/20' : 'bg-rose-50 text-rose-600')
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${piConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></span>
              <span>{piConnected ? 'Listening' : 'Offline'}</span>
            </div>

            {/* Design elements aligned, no toggles needed */}
          </div>
        </header>

        {/* Scrollable pane contents */}
        <div className={`flex-1 overflow-y-auto transition-all duration-300 ${isDarkMode ? 'bg-[#1C2839]' : 'bg-slate-50/40'}`}>

          {/* ===================================================================
              TAB 1: NOW (ACTIVE LIVE MONITOR)
              =================================================================== */}
          {activeTab === 'now' && (
            <div className="flex flex-col animate-fade-up">
              
              {/* HERO DISPLAY FIELD WITH THE INTERACTIVE FACE */}
              <div className={`px-6 py-8 md:py-12 grid grid-cols-1 md:grid-cols-[1fr_280px] lg:grid-cols-[1fr_320px] gap-8 items-center border-b relative overflow-hidden transition-all duration-350 ${
                isDarkMode ? 'bg-[#26344A] border-[#3E5071]' : 'bg-white border-slate-100'
              }`}>
                
                {/* Visual back glow reflecting the emotional status */}
                <div
                  className="absolute -right-20 -top-20 w-80 h-80 rounded-full blur-[100px] opacity-15 pointer-events-none transition-all duration-800"
                  style={{
                    backgroundColor: currentRecord.colorHex
                  }}
                ></div>

                {/* Left metrics info */}
                <div className="flex flex-col gap-4 relative z-10">
                  <div className="flex items-center gap-2.5">
                    {/* State pill */}
                    <div className={`px-3 py-1 rounded-full text-xs font-bold ${currentRecord.pillBg}`}>
                      {currentRecord.label}
                    </div>

                    {/* Confidence score */}
                    <div className="text-xs text-slate-400 font-bold tracking-tight">
                      {confidence}% confidence
                    </div>
                  </div>

                  {/* Dynamic big caption */}
                  <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight leading-[1.08] transition-colors duration-300 text-slate-100">
                    {currentRecord.headlinePrefix}{' '}
                    <span
                      style={{ color: currentRecord.colorHex }}
                      className="transition-colors duration-500"
                    >
                      {currentRecord.accent}
                    </span>
                  </h1>

                  {/* AI Recommendation text */}
                  <div className="flex flex-col gap-3">
                    <p className="text-sm md:text-base leading-relaxed max-w-lg mt-1 transition-colors duration-300 text-slate-300">
                      {currentRecord.recommendation}
                    </p>

                    {/* DYNAMIC MEASUREMENT CALIBRATION SECTION (ONLY FOR UNCERTAIN STATE) */}
                    {currentBabyState === 'uncertain' && (
                      <div className={`mt-2 p-4 border rounded-xl max-w-lg transition-all duration-300 ${isDarkMode ? 'bg-[#2E3E56] border-[#3E5071]' : 'bg-slate-50 border-slate-100'}`}>
                        {!isMeasuring ? (
                          <div className="flex flex-col gap-2">
                            <p className={`text-xs font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-500'}`}>
                              Nursery acoustics are currently within an unclassified zone. Conduct an immediate microphone scan to auto-calibrate the nursery telemetry.
                            </p>
                            <button
                              id="btn-calibrate-sound-uncertain"
                              onClick={triggerMeasurement}
                              className="w-full sm:w-auto self-start mt-1 bg-[#3B82C4] hover:bg-[#2A6BA8] text-white px-4 py-2 rounded-xl text-xs font-bold tracking-wide shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                            >
                              <RefreshCw className="w-3.5 h-3.5 animate-spin-delayed" />
                              <span>Measure Sound Levels</span>
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-2.5">
                            <div className={`flex items-center justify-between text-xs font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-600'}`}>
                              <span className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping"></span>
                                <span className="truncate">{measuringText}</span>
                              </span>
                              <span>{measuringProgress}%</span>
                            </div>
                            
                            {/* Simple animated progress bar */}
                            <div className={`w-full h-1.5 rounded-full overflow-hidden ${isDarkMode ? 'bg-slate-800' : 'bg-slate-200/60'}`}>
                              <div
                                className="h-full bg-gradient-to-r from-[#3B82C4] to-[#E9879F] transition-all duration-300 rounded-full"
                                style={{ width: `${measuringProgress}%` }}
                              ></div>
                            </div>

                            <p className="text-[10px] text-slate-400 italic">
                              Mic input level analyzed in real-time... keep nursery noise floor below -40dBFS.
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* GENTLE CHECK-IN PROMPT (ONLY FOR PAIN STATE) */}
                    {currentBabyState === 'pain' && (
                      <div className="mt-2 p-4 border rounded-xl max-w-lg transition-all duration-300 bg-[#EF8E5C]/5 border-[#EF8E5C]/20">
                        <div className="flex flex-col gap-2">
                          <p className="text-xs text-orange-400 font-bold flex items-center gap-1.5">
                            💛 {babyProfile.name} could use a check-in
                          </p>
                          <p className="text-[11px] font-medium leading-relaxed text-slate-300">
                            We've flagged a stronger cry and are keeping watch. Pop in when you can — once you've settled {babyProfile.name}, mark it resolved to clear the flag.
                          </p>
                          <button
                            id="btn-resolve-distress-emergency"
                            onClick={() => {
                              setCurrentBabyState('calm');
                              setConfidence(98);
                              setLastKnownActualState('calm');
                              triggerToast(`All settled — ${babyProfile.name} is calm again.`, 'success');
                            }}
                            className="w-full sm:w-auto self-start mt-1 bg-[#3B82C4] hover:bg-[#2A6BA8] text-white px-4 py-2.5 rounded-xl text-xs font-bold tracking-wide shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                          >
                            <span>🍼 Mark as resolved</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Micro dashboard stats underneath */}
                  <div className={`grid grid-cols-3 gap-6 pt-6 border-t max-w-md mt-2 transition-colors duration-300 ${isDarkMode ? 'border-[#3E5071]' : 'border-slate-100'}`}>
                    <div className="flex flex-col leading-tight">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Last Cry Detected
                      </span>
                      <span className={`text-xs font-bold mt-1 transition-colors ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                        {dashboardStats.lastCryText}
                      </span>
                    </div>
                    <div className="flex flex-col leading-tight">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Total cries
                      </span>
                      <span className={`text-xs font-bold mt-1 transition-colors ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                        {dashboardStats.totalCount} events today
                      </span>
                    </div>
                    <div className="flex flex-col leading-tight">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Most Frequent
                      </span>
                      <span className="text-xs font-bold text-[#E9879F] underline decoration-pink-300/30 mt-1">
                        {dashboardStats.mostCommon} Issue
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Area: Interactive Baby Face Illustration with click floating particles */}
                <div className="flex flex-col items-center justify-center">
                  <div className="w-64 h-64 relative group">
                    
                    {/* Ring glow ripple animations behind Baby Face */}
                    <div
                      className={`absolute inset-0 rounded-full transition-all duration-500 ${
                        currentBabyState === 'calm' ? 'animate-led-ripple bg-[#3B82C4]/5 border-[#3B82C4]/20' :
                        currentBabyState === 'hungry' ? 'animate-led-ripple bg-[#E9879F]/5 border-[#E9879F]/20' :
                        currentBabyState === 'pain' ? 'animate-led-ripple bg-orange-500/8 border-orange-500/15' :
                        currentBabyState === 'tired' ? 'animate-led-ripple bg-purple-500/5' :
                        currentBabyState === 'discomfort' ? 'animate-led-ripple bg-amber-500/5' : ''
                      }`}
                    ></div>
                    <div
                      className={`absolute inset-0 rounded-full transition-all duration-500 ${
                        currentBabyState === 'calm' ? 'animate-led-ripple-delayed bg-[#3B82C4]/5 border-[#3B82C4]/20' :
                        currentBabyState === 'hungry' ? 'animate-led-ripple-delayed bg-[#E9879F]/5 border-[#E9879F]/20' :
                        currentBabyState === 'pain' ? 'animate-led-ripple-delayed bg-orange-500/8 border-orange-500/15' :
                        currentBabyState === 'tired' ? 'animate-led-ripple-delayed bg-purple-500/5' :
                        currentBabyState === 'discomfort' ? 'animate-led-ripple-delayed bg-amber-500/5' : ''
                      }`}
                    ></div>

                    {/* SPAWNED FLOATING PARTICLES RENDER GRID */}
                    {particles.map((p) => (
                      <div
                        key={p.id}
                        className="absolute pointer-events-none text-2xl z-30 select-none animate-particle"
                        style={{
                          left: '50%',
                          top: '50%',
                          '--x': `${p.x}px`,
                          '--y': `${p.y}px`,
                          '--rot': `${p.rot}deg`,
                          marginTop: '-16px',
                          marginLeft: '-16px',
                        } as React.CSSProperties}
                      >
                        {p.emoji}
                      </div>
                    ))}

                    {/* HIGH-FIDELITY VECTOR INTERACTIVE BABY FACE ILLUSTRATION */}
                    <svg
                      id="svg-interactive-baby-face"
                      viewBox="0 0 200 200"
                      onClick={handleFaceClick}
                      onMouseEnter={() => setIsHovered(true)}
                      onMouseLeave={() => setIsHovered(false)}
                      className={`w-full h-full relative z-10 drop-shadow-xl cursor-pointer select-none transition-all duration-500 transform ${
                        isHovered ? 'scale-[1.04] rotate-1' : ''
                      } ${
                        clickFx === 'calm' ? 'animate-react-calm' :
                        clickFx === 'hungry' ? 'animate-react-hungry' :
                        clickFx === 'pain' ? 'animate-react-pain' :
                        clickFx === 'tired' ? 'animate-react-tired' :
                        clickFx === 'discomfort' ? 'animate-react-discomfort' :
                        currentBabyState === 'calm' ? 'animate-deep-breathe' :
                        currentBabyState === 'hungry' ? 'animate-hungry-pulse' :
                        currentBabyState === 'pain' ? 'animate-shimmer-pain' :
                        currentBabyState === 'tired' ? 'animate-sleepy-drift' :
                        currentBabyState === 'discomfort' ? 'animate-wobble-discomfort' :
                        'animate-deep-breathe'
                      }`}
                    >
                      <defs>
                        {/* Gender-aware skin & cheek radial gradients */}
                        <radialGradient id="skinGrad" cx="35%" cy="35%" r="65%">
                          <stop offset="0%" stopColor={facePalette.skinLight} />
                          <stop offset="85%" stopColor={facePalette.skinMid} />
                          <stop offset="100%" stopColor={facePalette.skinDeep} />
                        </radialGradient>

                        <radialGradient id="cheekGrad" cx="50%" cy="50%" r="50%">
                          <stop offset="0%" stopColor={facePalette.cheek} stopOpacity="0.55" />
                          <stop offset="100%" stopColor={facePalette.cheek} stopOpacity="0" />
                        </radialGradient>

                        <radialGradient id="hairGrad" cx="50%" cy="50%" r="50%">
                          <stop offset="0%" stopColor={facePalette.hairA} />
                          <stop offset="100%" stopColor={facePalette.hairB} />
                        </radialGradient>

                        <radialGradient id="shadingShadow" cx="50%" cy="50%" r="50%">
                          <stop offset="85%" stopColor="#000000" stopOpacity="0" />
                          <stop offset="100%" stopColor={facePalette.outline} stopOpacity="0.08" />
                        </radialGradient>
                      </defs>

                      /* =========================================================
                         VIBRANT VECTOR DESIGN: DETAILED CUDDLY BABY FACE
                         ========================================================= */
                      <g id="cuddly-baby-face-content">
                        {/* Head drop-shadow */}
                        <circle cx="100" cy="103" r="70" fill="#000000" fillOpacity="0.05" className="translate-y-2" />

                        {/* Cuddly Baby Ears */}
                        <circle cx="31" cy="105" r="15" fill="url(#skinGrad)" stroke={earsOutlineColor} strokeWidth="1.2" />
                        <circle cx="31" cy="105" r="9" fill="#FFF2EB" opacity="0.6" />
                        <circle cx="169" cy="105" r="15" fill="url(#skinGrad)" stroke={earsOutlineColor} strokeWidth="1.2" />
                        <circle cx="169" cy="105" r="9" fill="#FFF2EB" opacity="0.6" />

                        {/* MAIN BABY HEAD CHUBBY OUTLINE */}
                        <circle cx="100" cy="105" r="66" fill="url(#skinGrad)" stroke={headOutlineColor} strokeWidth="1.5" />
                        <circle cx="100" cy="105" r="66" fill="url(#shadingShadow)" />

                        {/* Soft baby curls (gender-tinted) */}
                        <path d="M 98 43 Q 103 27 113 37 Q 106 43 100 45" fill="url(#hairGrad)" />
                        <path d="M 89 48 Q 93 34 101 42 Q 95 46 90 49" fill="url(#hairGrad)" opacity="0.75" />

                        {/* GENDER ACCENT: GIRL — pink head bow */}
                        {!isBoyFace && currentBabyState !== 'uncertain' && (
                          <g id="girl-bow" className="transition-all duration-300">
                            <path d="M 130 50 C 120 42, 117 60, 132 62 Z" fill="#FB7185" stroke="#E11D48" strokeWidth="0.9" />
                            <path d="M 150 50 C 160 42, 163 60, 148 62 Z" fill="#FB7185" stroke="#E11D48" strokeWidth="0.9" />
                            <circle cx="140" cy="56" r="4.5" fill="#E11D48" />
                            <circle cx="140" cy="56" r="1.6" fill="#FFE4E6" />
                          </g>
                        )}

                        {/* GENDER ACCENT: BOY — blue beanie */}
                        {isBoyFace && currentBabyState !== 'uncertain' && (
                          <g id="boy-beanie" className="transition-all duration-300">
                            {/* Beanie dome hugging the top of the head */}
                            <path d="M 44 70 Q 100 22 156 70 Q 140 52 100 50 Q 60 52 44 70 Z" fill="#2A6BA8" />
                            <path d="M 44 70 Q 100 56 156 70" fill="none" stroke="#1E4E7A" strokeWidth="2.5" />
                            {/* Pom-pom */}
                            <circle cx="100" cy="34" r="6" fill="#5FA5E6" stroke="#2A6BA8" strokeWidth="1" />
                          </g>
                        )}

                        {/* ROSY GLOW CHUBBY CHEEKS */}
                        <ellipse
                          cx="62"
                          cy="119"
                          rx="12"
                          ry="8"
                          fill="url(#cheekGrad)"
                          className={`transition-all duration-500 ${
                            currentBabyState === 'calm' ? 'opacity-80 scale-[1.05]' : 'opacity-60'
                          }`}
                        />
                        <ellipse
                          cx="138"
                          cy="119"
                          rx="12"
                          ry="8"
                          fill="url(#cheekGrad)"
                          className={`transition-all duration-500 ${
                            currentBabyState === 'calm' ? 'opacity-80 scale-[1.05]' : 'opacity-60'
                          }`}
                        />

                        {/* ============================================================
                            EYES + BROWS — clean, mirror-symmetric, one logical
                            expression per state. Brows pivot about x=100.
                            ============================================================ */}
                        <g id="baby-eyes-group">
                          {currentBabyState === 'calm' && (
                            <>
                              {/* relaxed soft brows */}
                              <path d="M 56 80 Q 68 76 80 80" fill="none" stroke={facePalette.brow} strokeWidth="3" strokeLinecap="round" />
                              <path d="M 120 80 Q 132 76 144 80" fill="none" stroke={facePalette.brow} strokeWidth="3" strokeLinecap="round" />
                              {/* happy closed eyes */}
                              <path d="M 56 96 Q 68 88 80 96" fill="none" stroke={facePalette.accent} strokeWidth="4.5" strokeLinecap="round" />
                              <path d="M 120 96 Q 132 88 144 96" fill="none" stroke={facePalette.accent} strokeWidth="4.5" strokeLinecap="round" />
                            </>
                          )}

                          {currentBabyState === 'hungry' && (
                            <>
                              {/* pleading brows raised at inner corners */}
                              <path d="M 56 82 Q 68 77 80 80" fill="none" stroke={facePalette.brow} strokeWidth="3" strokeLinecap="round" />
                              <path d="M 120 80 Q 132 77 144 82" fill="none" stroke={facePalette.brow} strokeWidth="3" strokeLinecap="round" />
                              {/* big hopeful round eyes */}
                              <circle cx="68" cy="96" r={isHovered ? 10 : 9} fill="#1E293B" />
                              <circle cx="71" cy="92" r="3.2" fill="#FFFFFF" />
                              <circle cx="65" cy="99" r="1.6" fill="#FFFFFF" />
                              <circle cx="132" cy="96" r={isHovered ? 10 : 9} fill="#1E293B" />
                              <circle cx="135" cy="92" r="3.2" fill="#FFFFFF" />
                              <circle cx="129" cy="99" r="1.6" fill="#FFFFFF" />
                            </>
                          )}

                          {currentBabyState === 'pain' && (
                            <>
                              {/* concerned brows — angled but gentle, warm coral not alarm-red */}
                              <path d="M 56 80 L 80 85" fill="none" stroke="#EF8E5C" strokeWidth="3" strokeLinecap="round" />
                              <path d="M 144 80 L 120 85" fill="none" stroke="#EF8E5C" strokeWidth="3" strokeLinecap="round" />
                              {/* crying eyes — softly shut */}
                              <path d="M 56 93 Q 68 99 80 93" fill="none" stroke="#1E293B" strokeWidth="3.6" strokeLinecap="round" />
                              <path d="M 120 93 Q 132 99 144 93" fill="none" stroke="#1E293B" strokeWidth="3.6" strokeLinecap="round" />
                              {/* a single gentle tear each side */}
                              <path d="M 63 100 Q 60 110 64 115 Q 68 110 65 100 Z" fill="#7FB0E0" opacity="0.85" />
                              <path d="M 137 100 Q 134 110 138 115 Q 142 110 139 100 Z" fill="#7FB0E0" opacity="0.85" />
                            </>
                          )}

                          {currentBabyState === 'tired' && (
                            <>
                              {/* relaxed flat brows */}
                              <path d="M 56 80 Q 68 79 80 81" fill="none" stroke={facePalette.brow} strokeWidth="3" strokeLinecap="round" />
                              <path d="M 120 81 Q 132 79 144 80" fill="none" stroke={facePalette.brow} strokeWidth="3" strokeLinecap="round" />
                              {/* heavy droopy half-closed lids */}
                              <path d="M 56 94 Q 68 99 80 94" fill="none" stroke="#1E293B" strokeWidth="3.5" strokeLinecap="round" />
                              <path d="M 120 94 Q 132 99 144 94" fill="none" stroke="#1E293B" strokeWidth="3.5" strokeLinecap="round" />
                              {/* under-eye tired lines */}
                              <path d="M 60 101 Q 68 103 76 101" fill="none" stroke={facePalette.accentSoft} strokeWidth="1.6" strokeLinecap="round" opacity="0.6" />
                              <path d="M 124 101 Q 132 103 140 101" fill="none" stroke={facePalette.accentSoft} strokeWidth="1.6" strokeLinecap="round" opacity="0.6" />
                            </>
                          )}

                          {currentBabyState === 'discomfort' && (
                            <>
                              {/* symmetric worried brows — inner ends up & together */}
                              <path d="M 56 82 Q 68 78 80 79" fill="none" stroke="#E5A23C" strokeWidth="3" strokeLinecap="round" />
                              <path d="M 120 79 Q 132 78 144 82" fill="none" stroke="#E5A23C" strokeWidth="3" strokeLinecap="round" />
                              {/* uneasy squinting eyes */}
                              <path d="M 58 95 Q 68 92 78 95" fill="none" stroke="#1E293B" strokeWidth="4" strokeLinecap="round" />
                              <circle cx="68" cy="97" r="3.5" fill="#1E293B" />
                              <path d="M 122 95 Q 132 92 142 95" fill="none" stroke="#1E293B" strokeWidth="4" strokeLinecap="round" />
                              <circle cx="132" cy="97" r="3.5" fill="#1E293B" />
                            </>
                          )}

                          {currentBabyState === 'uncertain' && (
                            <>
                              {/* one flat brow + one raised — confused "huh?" */}
                              <path d="M 56 82 L 80 82" fill="none" stroke="#94A3B8" strokeWidth="3" strokeLinecap="round" />
                              <path d="M 120 79 Q 132 73 144 77" fill="none" stroke="#94A3B8" strokeWidth="3" strokeLinecap="round" />
                              {/* neutral blank eyes */}
                              <circle cx="68" cy="96" r="5.5" fill="#64748B" />
                              <circle cx="69" cy="94" r="1.6" fill="#FFFFFF" />
                              <circle cx="132" cy="96" r="5.5" fill="#64748B" />
                              <circle cx="133" cy="94" r="1.6" fill="#FFFFFF" />
                            </>
                          )}
                        </g>

                        {/* Sweet Baby Nose */}
                        <path d="M 97 113 Q 100 116 103 113" fill="none" stroke={noseOutlineColor} strokeWidth="2.5" strokeLinecap="round" />

                        {/* BABY MOUTH IN DESCRIPTIVE STATES */}
                        <g>
                          {/* Each state keeps its OWN mouth. No happy-smile override.
                              Hover intensifies the same emotion (Vegas Sphere style). */}
                          {currentBabyState === 'calm' && (
                            <path d="M 87 127 Q 100 137 113 127" fill="none" stroke={facePalette.accent} strokeWidth="4.5" strokeLinecap="round" />
                          )}

                          {currentBabyState === 'hungry' && (
                            <g>
                              {/* Suckling / rooting open O-mouth */}
                              <ellipse cx="100" cy="132" rx={isHovered ? 10 : 9} ry={isHovered ? 14 : 12} fill="#7A2436" stroke={facePalette.accentSoft} strokeWidth="2.5" />
                              <path d="M 94 138 Q 100 129 106 138 Z" fill="#F6A8BD" />
                            </g>
                          )}

                          {currentBabyState === 'pain' && (
                            <g>
                              {/* crying open mouth — smaller and softer than before, warm tone */}
                              <ellipse cx="100" cy={isHovered ? 138 : 137} rx="11" ry={isHovered ? 14 : 12} fill="#9E3B3B" stroke="#EF8E5C" strokeWidth="2.5" />
                              <path d="M 92 143 Q 100 137 108 143 Q 100 149 92 143 Z" fill="#F2A0A0" />
                            </g>
                          )}

                          {currentBabyState === 'tired' && (
                            <>
                              {/* Small yawning oval */}
                              <ellipse cx="100" cy="133" rx="7" ry={isHovered ? 13 : 10} fill="#3A1E5C" stroke={facePalette.accentSoft} strokeWidth="2" />
                            </>
                          )}

                          {currentBabyState === 'discomfort' && (
                            /* Uneasy wavy squiggle — unsettled, not smiling, not frowning */
                            <path d="M 84 132 Q 91 126 98 132 Q 105 138 112 132" fill="none" stroke="#E5A23C" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
                          )}

                          {currentBabyState === 'uncertain' && (
                            /* Flat neutral line — no read either way */
                            <line x1="89" y1="131" x2="111" y2="131" stroke="#64748B" strokeWidth="4.5" strokeLinecap="round" />
                          )}
                        </g>
                      </g>
                    </svg>

                    {/* Sleepy Floating Z-Z-Z Letters (only visible for Tired state) */}
                    {currentBabyState === 'tired' && (
                      <div className="absolute top-8 right-6 pointer-events-none z-20 flex flex-col font-extrabold text-[#8E7BC9] select-none text-opacity-80">
                        <span className="text-xl animate-floating-z-1 absolute">Z</span>
                        <span className="text-base animate-floating-z-2 absolute ml-4 mt-2">Z</span>
                        <span className="text-sm animate-floating-z-3 absolute ml-8 mt-5">z</span>
                      </div>
                    )}
                  </div>

                  {/* Under Face dynamic words describing status */}
                  {currentBabyState === 'uncertain' ? (
                    <button
                      id="txt-measure-uncertain-trigger"
                      onClick={triggerMeasurement}
                      className="text-[11px] font-extrabold tracking-wider uppercase mt-4 text-center text-[#3B82C4] hover:text-[#2A6BA8] hover:underline animate-pulse cursor-pointer"
                    >
                      ⚠️ Baseline Pending · Click to Measure & Calm ⚠️
                    </button>
                  ) : (
                    <span className="text-[11px] font-bold tracking-wider uppercase mt-4 text-center text-slate-500">
                      {currentBabyState === 'calm' && `${babyProfile.name} is resting soundly · Tap face to play`}
                      {currentBabyState === 'hungry' && `Nursery Alert · ${babyProfile.name} is awaiting feed`}
                      {currentBabyState === 'pain' && `Needs a check-in · ${babyProfile.name} is crying`}
                      {currentBabyState === 'tired' && `Sleep window open · ${babyProfile.name} is settling down`}
                      {currentBabyState === 'discomfort' && `Check swaddle · ${babyProfile.name} shows signs of discomfort`}
                    </span>
                  )}
                </div>

              </div>

              {/* ACOUSTIC SIGNATURE SIMULATOR DECK */}
              <div className={`mx-6 mt-6 p-4 rounded-2xl border transition-all duration-300 ${isDarkMode ? 'bg-[#2E3E56] border-[#3E5071]' : 'bg-white border-slate-100'} shadow-sm`}>
                <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3 mb-3 ${isDarkMode ? 'border-[#3E5071]' : 'border-slate-150'}`}>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-lg bg-[#E9879F]/10 text-[#E9879F] flex items-center justify-center font-bold text-xs">🎙️</div>
                    <div className="flex flex-col">
                      <span className={`text-xs font-bold ${isDarkMode ? 'text-slate-100' : 'text-slate-800'}`}>Acoustic Signature Simulator</span>
                      <span className="text-[10px] text-slate-400 font-semibold">Simulate real-time raw mic signals to preview the baby's interactive face gestures & expressions</span>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${isDarkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-50 text-slate-500'}`}>Pi Feed simulation</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                  {(['calm', 'hungry', 'pain', 'tired', 'discomfort', 'uncertain'] as BabyState[]).map((st) => {
                    const info = STATE_RECORDS[st];
                    const isActive = currentBabyState === st;
                    return (
                      <button
                        key={st}
                        id={`btn-sim-state-${st}`}
                        type="button"
                        onClick={() => {
                          if (currentBabyState === 'pain' && st !== 'pain') {
                            triggerToast(`${babyProfile.name} still needs a check-in — mark it resolved first.`, 'warning');
                            return;
                          }
                          changeBabyStateDirectly(st);
                        }}
                        className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all relative flex flex-col items-center justify-center gap-1 cursor-pointer overflow-hidden ${
                          isActive
                            ? 'shadow-sm border-current ring-1 ring-offset-0'
                            : isDarkMode
                            ? 'bg-slate-800/20 border-slate-700/60 text-slate-400 hover:bg-slate-850 hover:text-slate-200'
                            : 'bg-slate-50/50 border-slate-100 text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                        }`}
                        style={{
                          borderColor: isActive ? info.colorHex : undefined,
                          color: isActive ? info.colorHex : undefined,
                          backgroundColor: isActive ? `${info.colorHex}0c` : undefined,
                        }}
                      >
                        <span className="text-base">
                          {st === 'calm' && '😊'}
                          {st === 'hungry' && '🍼'}
                          {st === 'pain' && '😢'}
                          {st === 'tired' && '💤'}
                          {st === 'discomfort' && '🥺'}
                          {st === 'uncertain' && '❓'}
                        </span>
                        <span className="text-[10.5px] uppercase tracking-wider truncate max-w-full font-bold">
                          {st === 'calm' ? 'Calm' : st}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* TWO REFINED STATS / CONTROLLER CARDS */}
              <div className="px-6 py-8 grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* RECENT ACTIVITY PREVIEW CARD */}
                <div className={`border p-5 rounded-2xl shadow-sm flex flex-col justify-between transition-all duration-300 ${
                  isDarkMode ? 'bg-[#2E3E56] border-[#3E5071]' : 'bg-white border-slate-100'
                }`}>
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none">
                        Latest nursery logs
                      </span>
                      <button
                        onClick={() => setActiveTab('history')}
                        className="text-[11px] text-[#3B82C4] font-bold hover:underline cursor-pointer"
                      >
                        See history
                      </button>
                    </div>

                    <div className="flex flex-col gap-2 mt-1">
                      {cryEvents.slice(0, 2).map((evt) => (
                        <div key={evt.id} className={`flex items-center justify-between p-2 rounded-xl border ${
                          isDarkMode ? 'bg-slate-800/40 border-slate-700/30' : 'bg-slate-50 border-slate-100/50'
                        }`}>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: evt.type === 'Hungry' ? '#E9879F' : evt.type === 'Tired' ? '#8E7BC9' : '#3B82C4' }}></div>
                            <span className={`text-xs font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>{evt.type} Cry</span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-semibold">{evt.time}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className={`flex items-center justify-between gap-2 mt-4 pt-4 border-t text-[11px] font-medium text-slate-400 ${
                    isDarkMode ? 'border-[#3E5071]' : 'border-slate-50'
                  }`}>
                    <span className="truncate">Sensory events: {cryEvents.length} logs</span>
                    <button
                      onClick={() => setShowLogCreatorModal(true)}
                      className="flex items-center gap-1 text-[11px] text-[#E9879F] font-bold cursor-pointer"
                    >
                      <Plus className="w-3 h-3" /> Add Dummy
                    </button>
                  </div>
                </div>

                {/* 3. ROOM TEMPERATURE STRIP ENVIRONMENTAL CARD */}
                <div className={`border p-5 rounded-2xl shadow-sm flex flex-col justify-between transition-all duration-300 ${
                  isDarkMode 
                    ? 'bg-gradient-to-br from-[#3B82C4]/10 to-[#2E3E56] border-[#3E5071]' 
                    : 'bg-gradient-to-br from-[#3B82C4]/5 to-transparent border-slate-100'
                }`}>
                  <div className="flex flex-col gap-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none">
                      Room Temperature
                    </span>
                    <p className="text-[11px] text-slate-400">
                      Real-time ambient room temperature in {babyProfile.name}'s nursery room.
                    </p>

                    <div className="flex items-baseline gap-3 mt-3">
                      <span className={`text-4xl font-extrabold tracking-tight ${isDarkMode ? 'text-slate-100' : 'text-slate-800'}`}>
                        21.4°C
                      </span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-lg border ${
                        isDarkMode 
                          ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' 
                          : 'text-emerald-600 bg-emerald-50 border-emerald-100'
                      }`}>
                        Ideal Range
                      </span>
                    </div>
                  </div>

                  <div className={`flex items-center gap-2 mt-4 pt-4 border-t text-[11px] font-medium text-slate-400 ${
                    isDarkMode ? 'border-[#3E5071]' : 'border-slate-100'
                  }`}>
                    <Thermometer className="w-4 h-4 text-[#3B82C4]" />
                    <span>Nursery Ambient Comfort Shield is ACTIVE</span>
                  </div>
                </div>

              </div>
              
            </div>
          )}

          {/* ===================================================================
              TAB 2: HISTORY (AUDIT TRAIL OF LOGS)
              =================================================================== */}
          {activeTab === 'history' && (
            <div className="p-6 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 animate-fade-up">
              
              {/* Left timeline explorer */}
              <div className="flex flex-col gap-4">
                
                {/* Search & filters controls */}
                <div className="bg-[#26344A] p-4 rounded-2xl border border-[#3E5071] shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
                  <div className="w-full md:w-72 relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search cry history records..."
                      value={historySearchQuery}
                      onChange={(e) => setHistorySearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-1.5 bg-[#2E3E56] border border-[#3E5071] rounded-xl text-xs font-medium text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#3B82C4]"
                    />
                  </div>

                  <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto scrollbar-none pb-1 md:pb-0">
                    <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0 hidden sm:block" />
                    {['All', 'Hungry', 'Tired', 'Discomfort', 'Pain', 'Burping'].map((typ) => (
                      <button
                        key={typ}
                        onClick={() => setHistoryFilterType(typ)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all ${
                          historyFilterType === typ
                            ? 'bg-[#3B82C4] text-white border-[#3B82C4]'
                            : 'bg-[#2E3E56] text-slate-400 border-[#3E5071] hover:bg-[#26344A]'
                        }`}
                      >
                        {typ}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Event list rows */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-400 px-1">
                    <span>TIMELINE EVENT DETAILS</span>
                    <span>{filteredEventsForHistory.length} logs matching</span>
                  </div>

                  {filteredEventsForHistory.length > 0 ? (
                    filteredEventsForHistory.map((evt) => (
                      <div
                        key={evt.id}
                        onClick={() => {
                          if (currentBabyState === 'pain') {
                            triggerToast('Distress trigger is active! Action blocked. Clear alarm on the Active Monitor tab first.', 'warning');
                            return;
                          }
                          setSelectedEventDetails(evt);
                          setIsAudioPlaying(false);
                          
                          // Synergistically set the main nursery status so parents can auditorily preview
                          const mappedType = evt.type.toLowerCase() as BabyState;
                          setCurrentBabyState(mappedType);
                          setConfidence(evt.confidence);
                          setLastKnownActualState(mappedType);
                          triggerToast(`Nursery stream set to historical ${evt.type} event playback mode`, 'info');
                        }}
                        className={`w-full text-left p-4 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                          selectedEventDetails?.id === evt.id
                            ? 'bg-blue-500/10 border-blue-500/40 shadow-sm text-slate-100'
                            : 'bg-[#26344A] border-[#3E5071] hover:border-[#384a6c] text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                            style={{
                              backgroundColor:
                                evt.type === 'Hungry' ? '#FBEDF1' :
                                evt.type === 'Tired' ? '#F1EDF8' :
                                evt.type === 'Pain' ? '#FCEAEA' :
                                evt.type === 'Discomfort' ? '#FBF1DF' : '#EAF2FA',
                              color:
                                evt.type === 'Hungry' ? '#D26F88' :
                                evt.type === 'Tired' ? '#8E7BC9' :
                                evt.type === 'Pain' ? '#E25C5C' :
                                evt.type === 'Discomfort' ? '#E5A23C' : '#3B82C4'
                            }}
                          >
                            <Clock className="w-4 h-4" />
                          </div>
                          <div className="flex flex-col leading-tight truncate">
                            <span className="text-sm font-bold text-slate-200">
                              {evt.type} Cry Detect
                            </span>
                            <span className="text-[10px] text-[#E9879F] font-bold mt-0.5">
                              {evt.confidence}% Confidence • Severity: {evt.intensity}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <div className="flex flex-col items-end leading-none">
                            <span className="text-xs font-bold text-slate-200">{evt.time}</span>
                            <span className="text-[10px] text-slate-400 font-semibold mt-1">Dur: {evt.duration}</span>
                          </div>
                          <ChevronRight className={`w-4 h-4 transition-transform ${selectedEventDetails?.id === evt.id ? 'text-[#3B82C4] translate-x-1' : 'text-slate-300'}`} />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="bg-[#26344A] rounded-2xl border border-[#3E5071] p-12 text-center flex flex-col items-center justify-center gap-2">
                      <Clock className="w-8 h-8 text-slate-500" />
                      <h4 className="text-sm font-bold text-slate-300">No match found</h4>
                      <p className="text-xs text-slate-400">Try broadening your filter parameters.</p>
                    </div>
                  )}
                </div>

              </div>

              {/* Right Side active event detail panel */}
              {selectedEventDetails && (
                <div className="bg-[#26344A] p-5 rounded-2xl border border-[#3E5071] shadow-sm flex flex-col gap-5 h-fit lg:sticky lg:top-4">
                  <div className="flex items-center justify-between border-b border-[#3E5071] pb-3">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none">
                      Acoustic Playback Analyst
                    </span>
                    <button
                      onClick={() => {
                        setCryEvents(prev => prev.filter(e => e.id !== selectedEventDetails.id));
                        triggerToast('Deleted log from audit trail memory.', 'warning');
                        setSelectedEventDetails(null);
                      }}
                      className="text-slate-400 hover:text-rose-500 font-bold text-xs p-1 rounded hover:bg-rose-950/25 transition-all flex items-center gap-1"
                      title="Erase Log"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> delete
                    </button>
                  </div>

                  <div className="flex flex-col gap-3">
                    {/* Header info */}
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#3B82C4]/10 text-[#3B82C4] flex items-center justify-center font-bold">
                        {selectedEventDetails.type.charAt(0)}
                      </div>
                      <div className="flex flex-col leading-tight">
                        <h3 className="text-base font-bold text-slate-100">{selectedEventDetails.type} Event</h3>
                        <span className="text-[10px] font-bold text-slate-400">ID: {selectedEventDetails.id.toUpperCase()}</span>
                      </div>
                    </div>

                    {/* Simulator Audio controller */}
                    <div className="bg-[#2E3E56] rounded-xl p-3.5 border border-[#3E5071] flex items-center justify-between gap-4 mt-1">
                      <button
                        onClick={() => {
                          setIsAudioPlaying(!isAudioPlaying);
                          triggerToast(isAudioPlaying ? 'Paused playback' : `Playing recorded audio for ${selectedEventDetails.type} incident`, 'info');
                        }}
                        className={`w-9 h-9 rounded-full flex items-center justify-center text-white transition-all ${isAudioPlaying ? 'bg-[#E9879F]' : 'bg-[#3B82C4]'}`}
                      >
                        {isAudioPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white translate-x-0.5" />}
                      </button>

                      <div className="flex-1 flex flex-col leading-none">
                        <span className="text-xs font-bold text-slate-200">Audio Recorded Feed</span>
                        <span className="text-[10px] text-slate-400 font-semibold mt-1">{isAudioPlaying ? 'Playing raw wav...' : '16-bit Mono (0:45)'}</span>
                      </div>

                      {/* Fake live animated wave if active */}
                      {isAudioPlaying ? (
                        <div className="flex items-end gap-0.5 h-6 shrink-0">
                          <span className="w-1 h-3 bg-[#E9879F] rounded-full animate-bounce"></span>
                          <span className="w-1 h-5 bg-[#E9879F] rounded-full animate-bounce delay-75"></span>
                          <span className="w-1 h-2 bg-[#E9879F] rounded-full animate-bounce delay-150"></span>
                          <span className="w-1 h-4 bg-[#E9879F] rounded-full animate-bounce delay-300"></span>
                        </div>
                      ) : (
                        <div className="flex items-end gap-0.5 h-6 shrink-0 opacity-40">
                          <span className="w-1 h-2 bg-slate-600 rounded-full"></span>
                          <span className="w-1 h-2 bg-slate-600 rounded-full"></span>
                          <span className="w-1 h-2 bg-slate-600 rounded-full"></span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-3.5 pt-4 border-t border-[#3E5071]">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col leading-none bg-[#2E3E56] p-2.5 rounded-xl border border-[#3E5071]">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Acoustic Intensity</span>
                        <span className="text-xs font-bold text-slate-200 mt-1.5">{selectedEventDetails.intensity}</span>
                      </div>
                      <div className="flex flex-col leading-none bg-[#2E3E56] p-2.5 rounded-xl border border-[#3E5071]">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Event Time</span>
                        <span className="text-xs font-bold text-slate-200 mt-1.5">{selectedEventDetails.time}</span>
                      </div>
                    </div>

                    <div className="flex flex-col leading-tight pt-2">
                       <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">AI Copilot Analysis Plan</span>
                      <p className="text-xs text-slate-300 leading-relaxed mt-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                        {selectedEventDetails.recommendation}
                      </p>
                    </div>

                    <div className="bg-emerald-950/10 p-3.5 rounded-xl border border-emerald-950/30 flex items-start gap-2.5 mt-2">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <div className="flex flex-col leading-tight">
                        <span className="text-xs font-bold text-emerald-400">Resolution Checked</span>
                        <p className="text-[10px] text-emerald-500/80 mt-1">This log incident has been catalogued in baby {babyProfile.name}'s profile as resolved.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* ===================================================================
              TAB 3: INSIGHTS (DIGITAL PARENT-ASSISTANT TRENDS)
              =================================================================== */}
          {activeTab === 'insights' && (
            <div className="p-6 flex flex-col gap-6 animate-fade-up">

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                
                {/* 1. MOST COMMON TIME CHART PIE/BAR GRAPH */}
                <div className="bg-[#26344A] p-5 rounded-2xl border border-[#3E5071] shadow-sm flex flex-col col-span-1 md:col-span-2">
                  <div className="flex items-center justify-between border-b border-[#3E5071] pb-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4.5 h-4.5 text-[#3B82C4]" />
                      <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                        Estimated Hourly Cry Densities (Today)
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-bold whitespace-nowrap">Tabular Numerals</span>
                  </div>

                  <p className="text-xs text-slate-400 mt-2">
                    Acoustics frequency density peak points sorted across 24 hours. Perfect for predicting sleep cycle bottlenecks.
                  </p>

                  {/* Responsive custom drawn SVG Bar Graph */}
                  <div className="w-full h-48 mt-5 flex items-end justify-between relative px-2">
                    
                    {/* Fake guide bars */}
                    <div className="absolute left-0 bottom-0 top-0 right-0 border-b border-dashed border-[#3E5071] flex flex-col justify-between pointer-events-none">
                      <div className="border-b border-[#3E5071]/40 w-full h-0.5"></div>
                      <div className="border-b border-[#3E5071]/40 w-full h-0.5"></div>
                      <div className="border-b border-[#3E5071]/40 w-full h-0.5"></div>
                    </div>

                    {/* Dynamic Bar elements with mouse interaction */}
                    {[
                      { h: '12 AM', v: 4, count: 1 },
                      { h: '4 AM', v: 8, count: 2 },
                      { h: '8 AM', v: 12, count: 3 },
                      { h: '12 PM', v: 24, count: 6 },
                      { h: '4 PM', v: 38, count: 9 },
                      { h: '8 PM', v: 18, count: 4 },
                      { h: '11 PM', v: 10, count: 2 }
                    ].map((item, idx) => (
                      <div
                        key={idx}
                        className="flex flex-col items-center justify-end w-12 group cursor-pointer relative z-10"
                        onClick={() => triggerToast(`Acoustic density at ${item.h}: ${item.count} alerts parsed`, 'info')}
                      >
                        {/* Hover tooltip */}
                        <div className="absolute -top-10 scale-0 group-hover:scale-100 transition-all bg-slate-800 text-white text-[9px] font-bold px-2 py-1 rounded shadow-md pointer-events-none z-20 whitespace-nowrap">
                          {item.count} cry instances
                        </div>

                        {/* Visual block */}
                        <div
                          className="w-7 rounded-t-lg bg-gradient-to-t from-[#3B82C4]/80 to-[#E9879F] group-hover:from-[#3B82C4] group-hover:to-pink-400 transition-all cursor-pointer shadow-sm"
                          style={{ height: `${item.v * 3}px` }}
                        ></div>

                        {/* Bottom key Label */}
                        <span className="text-[10px] font-bold text-slate-400 mt-2 truncate max-w-full">
                          {item.h}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. DYNAMIC SUMMARY CHART BAR LIST */}
                <div className="bg-[#26344A] p-5 rounded-2xl border border-[#3E5071] shadow-sm flex flex-col">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none border-b border-[#3E5071] pb-3">
                    Percentage Split Today
                  </span>

                  <p className="text-xs text-slate-400 mt-2">
                    Acoustic patterns catalogued across total logs today.
                  </p>

                  <div className="flex flex-col gap-4 mt-6">
                    {[
                      { label: 'Hunger Signals', val: 43, color: '#E9879F' },
                      { label: 'Fatigue Signs', val: 29, color: '#8E7BC9' },
                      { label: 'Indigestion/Fussing', val: 14, color: '#E5A23C' },
                      { label: 'Burp Telemetry', val: 9, color: '#3B82C4' },
                      { label: 'Distress Alarms', val: 5, color: '#E25C5C' }
                    ].map((row, idx) => (
                      <div key={idx} className="flex flex-col gap-1.5 leading-none">
                        <div className="flex justify-between text-xs font-bold text-slate-300">
                          <span>{row.label}</span>
                          <span>{row.val}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-[#2E3E56] rounded-full overflow-hidden border border-[#3E5071]">
                          <div
                            className="h-full rounded-full transition-all duration-1000"
                            style={{
                              width: `${row.val}%`,
                              backgroundColor: row.color
                            }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* ===================================================================
              TAB 4: SETTINGS (PROFILES & DEVICE INTERACTION)
              =================================================================== */}
          {activeTab === 'settings' && (
            <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-up">

              {/* 1. INTERACTIVE BABY PROFILE FORM */}
              <form onSubmit={saveBabyProfileSettings} className={`p-5 rounded-2xl border shadow-sm flex flex-col gap-4 transition-all duration-300 ${
                isDarkMode ? 'bg-[#2E3E56] border-[#3E5071]' : 'bg-white border-slate-100'
              }`}>
                <span className={`text-xs font-bold uppercase tracking-widest border-b pb-3 ${
                  isDarkMode ? 'text-slate-400 border-[#3E5071]' : 'text-slate-400 border-slate-50'
                }`}>
                  Infant Demographics Config
                </span>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-500">First Name</label>
                    <input
                      type="text"
                      value={editProfile.name}
                      onChange={(e) => setEditProfile({ ...editProfile, name: e.target.value })}
                      className={`px-3.5 py-1.5 border rounded-xl text-xs font-bold placeholder-slate-350 focus:outline-none focus:border-[#3B82C4] ${
                        isDarkMode ? 'bg-[#3E5071] border-slate-800 text-slate-100' : 'bg-white border-slate-100 text-slate-800'
                      }`}
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-500">Age (Months)</label>
                    <input
                      type="number"
                      value={editProfile.ageMonth === 0 ? '' : editProfile.ageMonth}
                      placeholder="0"
                      onChange={(e) => {
                        const v = e.target.value;
                        setEditProfile({ ...editProfile, ageMonth: v === '' ? 0 : Number(v) });
                      }}
                      className={`px-3.5 py-1.5 border rounded-xl text-xs font-bold placeholder-slate-350 focus:outline-none focus:border-[#3B82C4] ${
                        isDarkMode ? 'bg-[#3E5071] border-slate-800 text-slate-100' : 'bg-white border-slate-100 text-slate-800'
                      }`}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-1">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-500">Weight (Lbs)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={editProfile.weightLbs === 0 ? '' : editProfile.weightLbs}
                      placeholder="0"
                      onChange={(e) => {
                        const v = e.target.value;
                        setEditProfile({ ...editProfile, weightLbs: v === '' ? 0 : Number(v) });
                      }}
                      className={`px-3.5 py-1.5 border rounded-xl text-xs font-bold placeholder-slate-350 focus:outline-none focus:border-[#3B82C4] ${
                        isDarkMode ? 'bg-[#3E5071] border-slate-800 text-slate-100' : 'bg-white border-slate-100 text-slate-800'
                      }`}
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-500">Target Sleep Hour goal</label>
                    <input
                      type="number"
                      value={editProfile.sleepGoal === 0 ? '' : editProfile.sleepGoal}
                      placeholder="0"
                      onChange={(e) => {
                        const v = e.target.value;
                        setEditProfile({ ...editProfile, sleepGoal: v === '' ? 0 : Number(v) });
                      }}
                      className={`px-3.5 py-1.5 border rounded-xl text-xs font-bold placeholder-slate-350 focus:outline-none focus:border-[#3B82C4] ${
                        isDarkMode ? 'bg-[#3E5071] border-slate-800 text-slate-100' : 'bg-white border-slate-100 text-slate-800'
                      }`}
                      required
                    />
                  </div>
                </div>

                {/* GENDER CONFIG FIELD */}
                <div className="flex flex-col gap-1.5 mt-1">
                  <label className="text-xs font-bold text-slate-500">Gender (Interactive Face Style)</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      id="btn-gender-girl-select"
                      onClick={() => {
                        setEditProfile({ ...editProfile, gender: 'girl' });
                        setBabyProfile((prev) => ({ ...prev, gender: 'girl' }));
                        setBabies((prev) => prev.map((b) => (b.id === activeBabyId ? { ...b, gender: 'girl' } : b)));
                      }}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        editProfile.gender === 'girl'
                          ? 'bg-pink-500/10 border-pink-500 text-pink-500 shadow-sm'
                          : isDarkMode
                          ? 'bg-[#2E3E56] border-slate-800 text-slate-400 hover:text-slate-100'
                          : 'bg-slate-50/50 border-slate-100 text-slate-500 hover:bg-slate-100'
                      }`}
                    >
                      <span>🌸 Daughter (Girl)</span>
                    </button>
                    <button
                      type="button"
                      id="btn-gender-boy-select"
                      onClick={() => {
                        setEditProfile({ ...editProfile, gender: 'boy' });
                        setBabyProfile((prev) => ({ ...prev, gender: 'boy' }));
                        setBabies((prev) => prev.map((b) => (b.id === activeBabyId ? { ...b, gender: 'boy' } : b)));
                      }}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        editProfile.gender === 'boy'
                          ? 'bg-blue-500/10 border-blue-500 text-blue-500 shadow-sm'
                          : isDarkMode
                          ? 'bg-[#2E3E56] border-slate-800 text-slate-400 hover:text-slate-100'
                          : 'bg-slate-50/50 border-slate-100 text-slate-500 hover:bg-slate-100'
                      }`}
                    >
                      <span>🧢 Son (Boy)</span>
                    </button>
                  </div>
                </div>

                <div className={`flex items-center justify-between p-3.5 rounded-xl border mt-2 ${
                  isDarkMode ? 'bg-slate-850/40 border-slate-800' : 'bg-slate-50 border-slate-100'
                }`}>
                  <div className="flex flex-col leading-tight">
                    <span className={`text-xs font-bold ${isDarkMode ? 'text-slate-350' : 'text-slate-700'}`}>Receive Push Notifications</span>
                    <span className="text-[10px] text-slate-400 font-semibold mt-0.5">Critical alert sound loops automatically</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setEditProfile({ ...editProfile, notificationEnabled: !editProfile.notificationEnabled });
                      triggerToast(editProfile.notificationEnabled ? 'Muted push alerting' : 'Acoustic push alerts enabled', 'info');
                    }}
                    className={`w-10 h-6 rounded-full flex items-center p-0.5 transition-colors ${
                      editProfile.notificationEnabled ? 'bg-[#3B82C4]' : 'bg-slate-200'
                    }`}
                  >
                    <span className={`w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform ${
                      editProfile.notificationEnabled ? 'translate-x-[18px]' : 'translate-x-0'
                    }`}></span>
                  </button>
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#3B82C4] hover:bg-[#2A6BA8] text-white py-2.5 rounded-xl text-xs font-bold tracking-wide transition-all shadow-md shadow-blue-500/10 mt-2 cursor-pointer"
                >
                  Save Demographics
                </button>
              </form>

              {/* 2. NURSERY HARDWARE CORE CONFIG PANEL */}
              <div className={`p-5 rounded-2xl border shadow-sm flex flex-col gap-4 transition-all duration-300 ${
                isDarkMode ? 'bg-[#2E3E56] border-[#3E5071]' : 'bg-white border-slate-100'
              }`}>
                <span className={`text-xs font-bold uppercase tracking-widest border-b pb-3 ${
                  isDarkMode ? 'text-slate-400 border-[#3E5071]' : 'text-slate-400 border-slate-50'
                }`}>
                  Hardware Hub Settings
                </span>

                <div className="flex flex-col gap-4">
                  {/* Master Nursery link connection status */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-slate-400" />
                      <span className={`text-xs font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>Enable Nursery Sound Link</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setPiConnected(!piConnected);
                        triggerToast(piConnected ? 'Nursery sound link turned offline' : 'Continuous secure sound telemetry link established', piConnected ? 'warning' : 'success');
                      }}
                      className={`w-10 h-6 rounded-full flex items-center p-0.5 transition-colors ${
                        piConnected ? 'bg-[#3B82C4]' : 'bg-slate-200'
                      }`}
                    >
                      <span className={`w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform ${
                        piConnected ? 'translate-x-[18px]' : 'translate-x-0'
                      }`}></span>
                    </button>
                  </div>

                  {/* Speaker control status */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Volume2 className="w-4 h-4 text-slate-400" />
                      <span className={`text-xs font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>Digital White-Noise Speaker</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setActiveSpeaker(!activeSpeaker);
                        triggerToast(activeSpeaker ? 'Sound machine speaker turned off' : 'White noise ready', 'info');
                      }}
                      className={`w-10 h-6 rounded-full flex items-center p-0.5 transition-colors ${
                        activeSpeaker ? 'bg-[#E9879F]' : 'bg-slate-200'
                      }`}
                    >
                      <span className={`w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform ${
                        activeSpeaker ? 'translate-x-[18px]' : 'translate-x-0'
                      }`}></span>
                    </button>
                  </div>

                  {/* Simulated telemetry values */}
                  <div className={`mt-4 p-3 rounded-xl border text-[10px] font-bold text-slate-400 flex justify-between gap-4 ${
                    isDarkMode ? 'bg-slate-800/20 border-slate-800/65' : 'bg-slate-50 border-slate-100'
                  }`}>
                    <span>Battery Status: 84% Capacity</span>
                    <span>Sound Telemetry Rate: 6.4 KB/s</span>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* ===== PAGE FOOTER ===== */}
          <footer className={`px-6 py-5 mt-2 border-t flex flex-col sm:flex-row items-center justify-between gap-2 ${isDarkMode ? 'border-[#3E5071]' : 'border-slate-100'}`}>
            <div className="flex items-center gap-2 text-[11px] text-slate-500">
              <span className="font-bold text-slate-400">© 2026 cryOS</span>
              <span className="text-slate-600">·</span>
              <span>Nursery Intelligence</span>
            </div>
            <div className="flex items-center gap-4 text-[11px] font-semibold text-slate-500">
              <button className="hover:text-slate-300 transition-colors cursor-pointer">Privacy</button>
              <button className="hover:text-slate-300 transition-colors cursor-pointer">Terms</button>
              <button className="hover:text-slate-300 transition-colors cursor-pointer">Support</button>
              <span className="text-slate-600">v0.1</span>
            </div>
          </footer>

        </div>
      </main>

      {/* =======================================================================
          SIMULATED LOG EVENT MAKER (DUMMY EVENT MODAL FOR JUDGES)
          ======================================================================= */}
      {showLogCreatorModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-up">
          <div className="bg-[#26344A] rounded-2xl border border-[#3E5071] shadow-xl max-w-sm w-full p-5 flex flex-col gap-4">
            
            <div className="flex items-center justify-between border-b border-[#3E5071] pb-3">
              <span className="text-sm font-bold text-slate-100">Add Dummy Cry incident</span>
              <button
                onClick={() => setShowLogCreatorModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-[#2E3E56] transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomEvent} className="flex flex-col gap-3">
              
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cry Category</label>
                <select
                  value={newLogType}
                  onChange={(e: any) => setNewLogType(e.target.value)}
                  className="px-3 py-1.5 border border-[#3E5071] bg-[#2E3E56] rounded-xl text-xs font-bold outline-none text-slate-200"
                >
                  <option className="bg-[#26344A]" value="Hungry">Hungry</option>
                  <option className="bg-[#26344A]" value="Tired">Tired</option>
                  <option className="bg-[#26344A]" value="Discomfort">Discomfort</option>
                  <option className="bg-[#26344A]" value="Burping">Burping</option>
                  <option className="bg-[#26344A]" value="Pain">Pain</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Acoustic Intensity</label>
                <select
                  value={newLogIntensity}
                  onChange={(e: any) => setNewLogIntensity(e.target.value)}
                  className="px-3 py-1.5 border border-[#3E5071] bg-[#2E3E56] rounded-xl text-xs font-bold outline-none text-slate-200"
                >
                  <option className="bg-[#26344A]" value="Low">Low</option>
                  <option className="bg-[#26344A]" value="Moderate">Moderate</option>
                  <option className="bg-[#26344A]" value="High">High</option>
                </select>
              </div>

              <div className="flex flex-col gap-2 pt-1">
                <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  <span>Simulated confidence</span>
                  <span className="text-slate-400">{newLogConfidence}%</span>
                </div>
                <input
                  type="range"
                  min="60"
                  max="100"
                  value={newLogConfidence}
                  onChange={(e) => setNewLogConfidence(Number(e.target.value))}
                  className="w-full h-1 bg-[#3E5071] cursor-pointer accent-[#E9879F]"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[#E9879F] text-white py-2 rounded-xl text-xs font-bold tracking-wide transition-all shadow-md shadow-pink-900/30 cursor-pointer mt-3"
              >
                Inject Log into Database
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
