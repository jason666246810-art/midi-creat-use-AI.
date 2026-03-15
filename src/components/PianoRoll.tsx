import React, { useRef, useEffect, useState } from 'react';
import { Project, PIANO_KEYS, Note } from '../utils/music';

interface PianoRollProps {
  project: Project;
  activeTrackId: string;
  currentStep: number;
  onUpdateNotes: (trackId: string, notes: Note[]) => void;
}

export const PianoRoll: React.FC<PianoRollProps> = ({ project, activeTrackId, currentStep, onUpdateNotes }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const CELL_W = 30;
  const CELL_H = 20;
  const ROWS = 48;
  
  const [dragMode, setDragMode] = useState<'draw' | 'erase' | 'resize' | null>(null);
  const [dragNote, setDragNote] = useState<{ row: number, col: number, origLen: number } | null>(null);

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.clearRect(0, 0, project.cols * CELL_W, ROWS * CELL_H);
    
    // Grid
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < project.cols; c++) {
        ctx.fillStyle = PIANO_KEYS[r].isBlack ? '#1a1a24' : '#222230';
        ctx.fillRect(c * CELL_W, r * CELL_H, CELL_W, CELL_H);
        
        ctx.strokeStyle = c % 4 === 0 ? '#3a3a50' : '#2a2a3a';
        ctx.strokeRect(c * CELL_W, r * CELL_H, CELL_W, CELL_H);
      }
    }
    
    // Ghost notes
    project.tracks.forEach(track => {
      if (track.id === activeTrackId) return;
      ctx.fillStyle = track.color + '40';
      track.notes.forEach(n => {
        ctx.fillRect(n.col * CELL_W + 1, n.row * CELL_H + 1, n.len * CELL_W - 2, CELL_H - 2);
      });
    });
    
    // Active notes
    const activeTrack = project.tracks.find(t => t.id === activeTrackId);
    if (activeTrack) {
      ctx.fillStyle = activeTrack.color;
      activeTrack.notes.forEach(n => {
        ctx.fillRect(n.col * CELL_W + 1, n.row * CELL_H + 1, n.len * CELL_W - 2, CELL_H - 2);
        ctx.fillStyle = '#ffffff80';
        ctx.fillRect((n.col + n.len) * CELL_W - 4, n.row * CELL_H + 2, 2, CELL_H - 4);
        ctx.fillStyle = activeTrack.color;
      });
    }
    
    // Playhead
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fillRect(currentStep * CELL_W, 0, CELL_W, ROWS * CELL_H);
  };

  useEffect(() => {
    draw();
  }, [project, activeTrackId, currentStep]);

  const getRC = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { r: -1, c: -1, relX: 0 };
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    return { 
      r: Math.floor(y / CELL_H), 
      c: Math.floor(x / CELL_W),
      relX: x % CELL_W
    };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const { r, c, relX } = getRC(e);
    if (r < 0 || r >= ROWS || c < 0 || c >= project.cols) return;

    const activeTrack = project.tracks.find(t => t.id === activeTrackId);
    if (!activeTrack) return;

    let newNotes = [...activeTrack.notes];
    const existingNoteIdx = newNotes.findIndex(n => n.row === r && c >= n.col && c < n.col + n.len);

    if (e.button === 2) {
      // Right click: erase
      if (existingNoteIdx >= 0) {
        newNotes.splice(existingNoteIdx, 1);
        onUpdateNotes(activeTrackId, newNotes);
      }
      setDragMode('erase');
      return;
    }

    if (existingNoteIdx >= 0) {
      const note = newNotes[existingNoteIdx];
      const noteEndPx = (note.col + note.len) * CELL_W;
      const mousePx = c * CELL_W + relX;
      if (noteEndPx - mousePx < 8) {
        setDragMode('resize');
        setDragNote({ row: note.row, col: note.col, origLen: note.len });
        return;
      }
    }

    // Draw new note
    if (existingNoteIdx === -1) {
      newNotes.push({ row: r, col: c, len: 1 });
      onUpdateNotes(activeTrackId, newNotes);
      setDragMode('draw');
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragMode) return;
    const { r, c } = getRC(e);
    if (r < 0 || r >= ROWS || c < 0 || c >= project.cols) return;

    const activeTrack = project.tracks.find(t => t.id === activeTrackId);
    if (!activeTrack) return;

    let newNotes = [...activeTrack.notes];

    if (dragMode === 'erase') {
      const existingNoteIdx = newNotes.findIndex(n => n.row === r && c >= n.col && c < n.col + n.len);
      if (existingNoteIdx >= 0) {
        newNotes.splice(existingNoteIdx, 1);
        onUpdateNotes(activeTrackId, newNotes);
      }
    } else if (dragMode === 'resize' && dragNote) {
      const existingNoteIdx = newNotes.findIndex(n => n.row === dragNote.row && n.col === dragNote.col);
      if (existingNoteIdx >= 0) {
        const newLen = Math.max(1, c - dragNote.col + 1);
        if (newNotes[existingNoteIdx].len !== newLen) {
          newNotes[existingNoteIdx] = { ...newNotes[existingNoteIdx], len: newLen };
          onUpdateNotes(activeTrackId, newNotes);
        }
      }
    } else if (dragMode === 'draw') {
      const existingNoteIdx = newNotes.findIndex(n => n.row === r && c >= n.col && c < n.col + n.len);
      if (existingNoteIdx === -1) {
        newNotes.push({ row: r, col: c, len: 1 });
        onUpdateNotes(activeTrackId, newNotes);
      }
    }
  };

  const handleMouseUp = () => {
    setDragMode(null);
    setDragNote(null);
  };

  return (
    <div className="flex flex-1 overflow-hidden bg-[#0a0a0f]">
      {/* Piano Keys Sidebar */}
      <div className="w-16 flex-shrink-0 bg-[#12121a] border-r border-[#2a2a40] relative overflow-hidden">
        {PIANO_KEYS.map((key, i) => (
          <div 
            key={i} 
            className={`absolute w-full flex items-center justify-end pr-1 text-[9px] font-mono border-b border-black/30 select-none ${key.isBlack ? 'bg-[#1a1a2e] text-gray-400 w-[70%]' : 'bg-[#e8e8ee] text-black'}`}
            style={{ top: i * CELL_H, height: CELL_H }}
          >
            {key.name}
          </div>
        ))}
      </div>
      
      {/* Roll Canvas */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden" ref={containerRef}>
        <canvas
          ref={canvasRef}
          width={project.cols * CELL_W}
          height={ROWS * CELL_H}
          className="cursor-crosshair"
          onContextMenu={e => e.preventDefault()}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
      </div>
    </div>
  );
};
