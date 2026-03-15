import React, { useRef, useEffect } from 'react';
import { Project } from '../utils/music';

interface DrumRollProps {
  project: Project;
  currentStep: number;
  onUpdateDrums: (type: 'kick' | 'snare' | 'hihat', cols: number[]) => void;
}

export const DrumRoll: React.FC<DrumRollProps> = ({ project, currentStep, onUpdateDrums }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const CELL_W = 30;
  const CELL_H = 30;
  const ROWS = 3;
  
  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.clearRect(0, 0, project.cols * CELL_W, ROWS * CELL_H);
    
    const colors = ['#f59e0b', '#fb923c', '#fde68a'];
    const drumData = [project.drums.kick, project.drums.snare, project.drums.hihat];
    
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < project.cols; c++) {
        ctx.fillStyle = c % 4 === 0 ? '#131320' : '#0e0e18';
        ctx.fillRect(c * CELL_W, r * CELL_H, CELL_W, CELL_H);
        
        ctx.strokeStyle = '#2a2a44';
        ctx.strokeRect(c * CELL_W, r * CELL_H, CELL_W, CELL_H);
        
        if (drumData[r].includes(c)) {
          ctx.fillStyle = colors[r];
          ctx.fillRect(c * CELL_W + 2, r * CELL_H + 3, CELL_W - 4, CELL_H - 6);
        }
      }
    }
    
    // Playhead
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fillRect(currentStep * CELL_W, 0, CELL_W, ROWS * CELL_H);
  };

  useEffect(() => { draw(); }, [project, currentStep]);

  const handleMouseDown = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const c = Math.floor(x / CELL_W);
    const r = Math.floor(y / CELL_H);
    
    if (c >= 0 && c < project.cols && r >= 0 && r < ROWS) {
      const type = r === 0 ? 'kick' : r === 1 ? 'snare' : 'hihat';
      const current = project.drums[type];
      let newArr;
      if (current.includes(c)) {
        newArr = current.filter(val => val !== c);
      } else {
        newArr = [...current, c];
      }
      onUpdateDrums(type, newArr);
    }
  };

  return (
    <div className="flex h-[90px] flex-shrink-0 border-t border-[#2a2a40] bg-[#0a0a0f]">
      <div className="w-16 flex-shrink-0 bg-[#12121a] border-r border-[#2a2a40] flex flex-col justify-around px-1 py-1 text-[10px] text-gray-400 font-mono">
        <div>KICK</div>
        <div>SNARE</div>
        <div>HH</div>
      </div>
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <canvas
          ref={canvasRef}
          width={project.cols * CELL_W}
          height={ROWS * CELL_H}
          className="cursor-pointer"
          onMouseDown={handleMouseDown}
        />
      </div>
    </div>
  );
};
