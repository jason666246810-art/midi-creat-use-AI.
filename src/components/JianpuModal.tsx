import React, { useState } from 'react';
import { parseJianpu, Note } from '../utils/music';

interface JianpuModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (notes: Note[]) => void;
}

export const JianpuModal: React.FC<JianpuModalProps> = ({ isOpen, onClose, onApply }) => {
  const [input, setInput] = useState('1 - 2 - 3 - 5 - | 6 - - - 5 - - -');

  if (!isOpen) return null;

  const handleApply = () => {
    const notes = parseJianpu(input);
    onApply(notes);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center">
      <div className="bg-[#12121a] border border-cyan-500 rounded-lg p-6 w-[500px] shadow-[0_0_60px_rgba(0,229,255,0.3)]">
        <h2 className="text-cyan-400 text-lg tracking-widest mb-4 font-bold">🎼 简谱输入</h2>
        
        <div className="text-xs text-gray-400 mb-4 space-y-1">
          <p>规则 (1格 = 1个16分音符):</p>
          <p>1-7: 音符, 0: 休止符, -: 延长上一个音符</p>
          <p>+1: 高音, -1: 低音, 空格或|: 分隔符</p>
        </div>

        <textarea 
          value={input}
          onChange={e => setInput(e.target.value)}
          className="w-full h-32 bg-[#0a0a0f] border border-[#2a2a40] text-white p-3 rounded text-sm focus:outline-none focus:border-cyan-500 font-mono mb-4"
          placeholder="例如: 1 2 3 5 | 6 - 5 -"
        />

        <div className="flex gap-2">
          <button 
            onClick={handleApply}
            className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-4 rounded transition-colors"
          >
            应用到当前轨道
          </button>
          <button 
            onClick={onClose}
            className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded transition-colors"
          >
            取消
          </button>
        </div>
      </div>
    </div>
  );
};
