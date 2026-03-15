import React, { useState, useEffect, useRef } from 'react';
import { Play, Square, Settings, Download, Upload, Music, Wand2, Trash2 } from 'lucide-react';
import { Project, Track, Note, PIANO_KEYS } from './utils/music';
import { engine } from './audio/engine';
import { PianoRoll } from './components/PianoRoll';
import { DrumRoll } from './components/DrumRoll';
import { AIModal } from './components/AIModal';
import { JianpuModal } from './components/JianpuModal';

const INITIAL_PROJECT: Project = {
  cols: 64,
  bpm: 120,
  tracks: [
    { id: 't1', name: 'Melody', instrument: 'dizi', color: '#00e5ff', notes: [], volume: 0.8, muted: false, solo: false },
    { id: 't2', name: 'Chords', instrument: 'guzheng', color: '#a855f7', notes: [], volume: 0.6, muted: false, solo: false },
    { id: 't3', name: 'Bass', instrument: 'bass', color: '#ff3d71', notes: [], volume: 0.7, muted: false, solo: false },
  ],
  drums: {
    kick: [], snare: [], hihat: [], volume: 0.8, muted: false, solo: false
  }
};

export default function App() {
  const [project, setProject] = useState<Project>(INITIAL_PROJECT);
  const [activeTrackId, setActiveTrackId] = useState('t1');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [isJianpuModalOpen, setIsJianpuModalOpen] = useState(false);

  const projectRef = useRef(project);
  useEffect(() => { projectRef.current = project; }, [project]);

  useEffect(() => {
    if (!isPlaying) return;
    
    const stepTime = (60 / projectRef.current.bpm) / 4 * 1000;
    
    const interval = setInterval(() => {
      setCurrentStep(prev => {
        const step = (prev + 1) % projectRef.current.cols;
        const proj = projectRef.current;
        
        const anySolo = proj.tracks.some(t => t.solo) || proj.drums.solo;

        // Tracks
        proj.tracks.forEach(track => {
          if (track.muted || (anySolo && !track.solo)) return;
          
          const notesToPlay = track.notes.filter(n => n.col === step);
          notesToPlay.forEach(n => {
            const freq = PIANO_KEYS[n.row].freq;
            const dur = (n.len * stepTime) / 1000;
            engine.playNote(track.instrument, freq, track.volume, dur);
          });
        });
        
        // Drums
        if (!proj.drums.muted && (!anySolo || proj.drums.solo)) {
          if (proj.drums.kick.includes(step)) engine.playDrum('kick', proj.drums.volume);
          if (proj.drums.snare.includes(step)) engine.playDrum('snare', proj.drums.volume);
          if (proj.drums.hihat.includes(step)) engine.playDrum('hihat', proj.drums.volume);
        }
        
        return step;
      });
    }, stepTime);
    
    return () => clearInterval(interval);
  }, [isPlaying]);

  const handlePlayStop = () => {
    if (isPlaying) {
      setIsPlaying(false);
      setCurrentStep(0);
    } else {
      engine.resume();
      setIsPlaying(true);
    }
  };

  const updateTrackNotes = (trackId: string, notes: Note[]) => {
    setProject(p => ({
      ...p,
      tracks: p.tracks.map(t => t.id === trackId ? { ...t, notes } : t)
    }));
  };

  const updateDrums = (type: 'kick' | 'snare' | 'hihat', cols: number[]) => {
    setProject(p => ({
      ...p,
      drums: { ...p.drums, [type]: cols }
    }));
  };

  const clearAll = () => {
    setProject(p => ({
      ...p,
      tracks: p.tracks.map(t => ({ ...t, notes: [] })),
      drums: { ...p.drums, kick: [], snare: [], hihat: [] }
    }));
    setCurrentStep(0);
  };

  const handleAIGenerate = (data: any, length: number) => {
    setProject(p => ({
      ...p,
      cols: Math.max(p.cols, length),
      tracks: p.tracks.map(t => {
        if (t.id === 't1') return { ...t, notes: data.melody || [] };
        if (t.id === 't2') return { ...t, notes: data.chords || [] };
        if (t.id === 't3') return { ...t, notes: data.bass || [] };
        return t;
      }),
      drums: {
        ...p.drums,
        kick: data.drums?.kick || [],
        snare: data.drums?.snare || [],
        hihat: data.drums?.hihat || []
      }
    }));
  };

  const handleJianpuApply = (notes: Note[]) => {
    setProject(p => ({
      ...p,
      tracks: p.tracks.map(t => t.id === activeTrackId ? { ...t, notes } : t)
    }));
  };

  const updateTrackProp = (trackId: string, prop: keyof Track, value: any) => {
    setProject(p => ({
      ...p,
      tracks: p.tracks.map(t => t.id === trackId ? { ...t, [prop]: value } : t)
    }));
  };

  const exportProject = () => {
    const json = JSON.stringify(project);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'daw-project.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const importProject = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const p = JSON.parse(ev.target?.result as string);
        if (p.tracks && p.drums) {
          setProject(p);
          setCurrentStep(0);
        }
      } catch (err) {
        alert('导入失败');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="flex flex-col h-screen bg-[#0a0a0f] text-gray-200 font-sans overflow-hidden">
      {/* Header */}
      <header className="flex items-center px-4 py-2 bg-[#12121a] border-b border-[#2a2a40] gap-4 flex-shrink-0">
        <h1 className="text-cyan-400 font-bold tracking-widest text-lg mr-4">⬡ DAW PRO</h1>
        
        <button 
          onClick={handlePlayStop}
          className={`flex items-center gap-2 px-4 py-1.5 rounded font-bold text-sm transition-colors ${isPlaying ? 'bg-red-500/20 text-red-500 border border-red-500/50' : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50 hover:bg-cyan-500/30'}`}
        >
          {isPlaying ? <Square size={16} /> : <Play size={16} />}
          {isPlaying ? 'STOP' : 'PLAY'}
        </button>

        <div className="h-6 w-px bg-[#2a2a40]"></div>

        <div className="flex items-center gap-2 text-sm text-gray-400">
          <span>BPM</span>
          <input 
            type="number" 
            value={project.bpm}
            onChange={e => setProject(p => ({ ...p, bpm: parseInt(e.target.value) || 120 }))}
            className="w-16 bg-[#0a0a0f] border border-[#2a2a40] rounded px-2 py-1 text-cyan-400 font-mono text-center focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-400">
          <span>小节数</span>
          <select 
            value={project.cols}
            onChange={e => setProject(p => ({ ...p, cols: parseInt(e.target.value) }))}
            className="bg-[#0a0a0f] border border-[#2a2a40] rounded px-2 py-1 text-white focus:outline-none focus:border-cyan-500"
          >
            <option value={32}>32</option>
            <option value={64}>64</option>
            <option value={128}>128</option>
            <option value={256}>256</option>
          </select>
        </div>

        <div className="h-6 w-px bg-[#2a2a40]"></div>

        <button 
          onClick={() => setIsAIModalOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded text-sm text-purple-400 border border-purple-500/50 hover:bg-purple-500/20 transition-colors"
        >
          <Wand2 size={16} />
          AI 作曲
        </button>

        <button 
          onClick={() => setIsJianpuModalOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded text-sm text-green-400 border border-green-500/50 hover:bg-green-500/20 transition-colors"
        >
          <Music size={16} />
          简谱输入
        </button>

        <div className="flex-1"></div>

        <button 
          onClick={exportProject}
          className="flex items-center gap-2 px-3 py-1.5 rounded text-sm text-gray-300 border border-gray-600 hover:bg-gray-800 transition-colors"
        >
          <Download size={16} />
          导出
        </button>

        <label className="flex items-center gap-2 px-3 py-1.5 rounded text-sm text-gray-300 border border-gray-600 hover:bg-gray-800 transition-colors cursor-pointer">
          <Upload size={16} />
          导入
          <input type="file" accept=".json" className="hidden" onChange={importProject} />
        </label>

        <button 
          onClick={clearAll}
          className="flex items-center gap-2 px-3 py-1.5 rounded text-sm text-red-400 border border-red-500/50 hover:bg-red-500/20 transition-colors"
        >
          <Trash2 size={16} />
          清除
        </button>
      </header>

      {/* Main Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Track List Sidebar */}
        <div className="w-64 bg-[#12121a] border-r border-[#2a2a40] flex flex-col overflow-y-auto">
          {project.tracks.map(track => (
            <div 
              key={track.id}
              onClick={() => setActiveTrackId(track.id)}
              className={`p-3 border-b border-[#2a2a40] cursor-pointer transition-colors ${activeTrackId === track.id ? 'bg-[#1a1a2e]' : 'hover:bg-[#161622]'}`}
              style={{ borderLeft: activeTrackId === track.id ? `4px solid ${track.color}` : '4px solid transparent' }}
            >
              <div className="flex justify-between items-center mb-2">
                <span className="font-bold text-sm" style={{ color: track.color }}>{track.name}</span>
                <div className="flex gap-1">
                  <button 
                    onClick={(e) => { e.stopPropagation(); updateTrackProp(track.id, 'muted', !track.muted); }}
                    className={`w-6 h-6 rounded text-xs font-bold ${track.muted ? 'bg-red-500/20 text-red-500' : 'bg-[#2a2a40] text-gray-400 hover:bg-[#3a3a50]'}`}
                  >M</button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); updateTrackProp(track.id, 'solo', !track.solo); }}
                    className={`w-6 h-6 rounded text-xs font-bold ${track.solo ? 'bg-yellow-500/20 text-yellow-500' : 'bg-[#2a2a40] text-gray-400 hover:bg-[#3a3a50]'}`}
                  >S</button>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <select 
                  value={track.instrument}
                  onChange={(e) => updateTrackProp(track.id, 'instrument', e.target.value)}
                  className="w-full bg-[#0a0a0f] border border-[#2a2a40] text-xs text-gray-300 rounded px-1 py-1 focus:outline-none"
                >
                  <option value="synth">Synth (电子合成器)</option>
                  <option value="bass">Bass (低音贝斯)</option>
                  <option value="piano">Piano (钢琴)</option>
                  <option value="guzheng">Guzheng (古筝)</option>
                  <option value="dizi">Dizi (笛子)</option>
                  <option value="erhu">Erhu (二胡)</option>
                </select>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-500 w-6">VOL</span>
                  <input 
                    type="range" 
                    min="0" max="1" step="0.01" 
                    value={track.volume}
                    onChange={(e) => updateTrackProp(track.id, 'volume', parseFloat(e.target.value))}
                    className="flex-1 h-1 bg-[#2a2a40] rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>
            </div>
          ))}
          
          {/* Drums Track Info */}
          <div className="p-3 border-b border-[#2a2a40] bg-[#12121a]">
            <div className="flex justify-between items-center mb-2">
              <span className="font-bold text-sm text-orange-400">Drums</span>
              <div className="flex gap-1">
                <button 
                  onClick={() => setProject(p => ({ ...p, drums: { ...p.drums, muted: !p.drums.muted } }))}
                  className={`w-6 h-6 rounded text-xs font-bold ${project.drums.muted ? 'bg-red-500/20 text-red-500' : 'bg-[#2a2a40] text-gray-400 hover:bg-[#3a3a50]'}`}
                >M</button>
                <button 
                  onClick={() => setProject(p => ({ ...p, drums: { ...p.drums, solo: !p.drums.solo } }))}
                  className={`w-6 h-6 rounded text-xs font-bold ${project.drums.solo ? 'bg-yellow-500/20 text-yellow-500' : 'bg-[#2a2a40] text-gray-400 hover:bg-[#3a3a50]'}`}
                >S</button>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-4">
              <span className="text-[10px] text-gray-500 w-6">VOL</span>
              <input 
                type="range" 
                min="0" max="1" step="0.01" 
                value={project.drums.volume}
                onChange={(e) => setProject(p => ({ ...p, drums: { ...p.drums, volume: parseFloat(e.target.value) } }))}
                className="flex-1 h-1 bg-[#2a2a40] rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Editor Area */}
        <div className="flex flex-col flex-1 overflow-hidden">
          <PianoRoll 
            project={project} 
            activeTrackId={activeTrackId} 
            currentStep={currentStep}
            onUpdateNotes={updateTrackNotes}
          />
          <DrumRoll 
            project={project}
            currentStep={currentStep}
            onUpdateDrums={updateDrums}
          />
        </div>
      </div>

      <AIModal 
        isOpen={isAIModalOpen} 
        onClose={() => setIsAIModalOpen(false)} 
        onGenerate={handleAIGenerate}
      />
      <JianpuModal 
        isOpen={isJianpuModalOpen} 
        onClose={() => setIsJianpuModalOpen(false)} 
        onApply={handleJianpuApply}
      />
    </div>
  );
}
