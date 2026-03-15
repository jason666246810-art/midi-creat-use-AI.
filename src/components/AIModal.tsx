import React, { useState } from 'react';
import { generateAITracks, AIGenerateParams } from '../services/ai';

interface AIModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (data: any, length: number) => void;
}

export const AIModal: React.FC<AIModalProps> = ({ isOpen, onClose, onGenerate }) => {
  const [mode, setMode] = useState<'original' | 'cover'>('original');
  const [songName, setSongName] = useState('');
  const [style, setStyle] = useState('edm');
  const [length, setLength] = useState(64);
  const [key, setKey] = useState('Am');
  const [mood, setMood] = useState('chill');
  const [reference, setReference] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const params: AIGenerateParams = {
        mode,
        length,
        style,
        key,
        mood,
        reference,
        songName
      };
      const data = await generateAITracks(params);
      onGenerate(data, length);
      onClose();
    } catch (e: any) {
      alert('生成失败: ' + e.message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center">
      <div className="bg-[#12121a] border border-purple-500 rounded-lg p-6 w-[460px] shadow-[0_0_60px_rgba(168,85,247,0.3)]">
        <h2 className="text-purple-400 text-lg tracking-widest mb-4 font-bold">🤖 AI 智能作曲</h2>
        
        {/* Mode Tabs */}
        <div className="flex mb-6 bg-[#0a0a0f] p-1 rounded border border-[#2a2a40]">
          <button
            onClick={() => setMode('original')}
            className={`flex-1 py-1.5 text-sm font-bold rounded transition-colors ${mode === 'original' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}
          >
            ✨ 自主创作
          </button>
          <button
            onClick={() => setMode('cover')}
            className={`flex-1 py-1.5 text-sm font-bold rounded transition-colors ${mode === 'cover' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}
          >
            🎵 指定歌曲翻弹
          </button>
        </div>

        <div className="flex flex-col gap-4 mb-6 min-h-[200px]">
          {mode === 'cover' ? (
            <>
              <div className="flex flex-col gap-2">
                <label className="text-gray-300 text-sm font-bold">你想让 AI 制作哪首歌的纯音乐？</label>
                <input 
                  type="text" 
                  value={songName}
                  onChange={e => setSongName(e.target.value)}
                  className="w-full bg-[#0a0a0f] border border-purple-500/50 text-white px-3 py-3 rounded text-sm focus:outline-none focus:border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.1)]"
                  placeholder="例如：周杰伦《青花瓷》、陈奕迅《孤勇者》"
                />
                <p className="text-xs text-gray-500 mt-1">
                  AI 将凭借其强大的乐理知识，直接为您扒谱并制作这首歌的旋律、和弦、低音与鼓组。其他参数将由 AI 自动决定。
                </p>
              </div>
              
              <div className="flex items-center gap-2 mt-4">
                <label className="text-gray-400 text-sm w-16">生成时长</label>
                <select 
                  value={length}
                  onChange={e => setLength(parseInt(e.target.value))}
                  className="flex-1 bg-[#0a0a0f] border border-[#2a2a40] text-white px-3 py-2 rounded text-sm focus:outline-none focus:border-purple-500"
                >
                  <option value={64}>64拍 (~32秒 - 推荐)</option>
                  <option value={128}>128拍 (~1分钟)</option>
                  <option value={256}>256拍 (~2分钟)</option>
                </select>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <label className="text-gray-400 text-sm w-16">参考曲目</label>
                <input 
                  type="text" 
                  value={reference}
                  onChange={e => setReference(e.target.value)}
                  className="flex-1 bg-[#0a0a0f] border border-[#2a2a40] text-white px-3 py-2 rounded text-sm focus:outline-none focus:border-purple-500"
                  placeholder="例如：Hans Zimmer (选填)"
                />
              </div>

              <div className="flex items-center gap-2">
                <label className="text-gray-400 text-sm w-16">风格</label>
                <select 
                  value={style}
                  onChange={e => setStyle(e.target.value)}
                  className="flex-1 bg-[#0a0a0f] border border-[#2a2a40] text-white px-3 py-2 rounded text-sm focus:outline-none focus:border-purple-500"
                >
                  <option value="edm">⚡ EDM / 电子</option>
                  <option value="lofi">☁️ Lo-Fi / 复古</option>
                  <option value="game">🎮 游戏 BGM</option>
                  <option value="jazz">🎷 爵士</option>
                  <option value="ambient">🌊 氛围</option>
                  <option value="folk">🎋 传统民乐</option>
                  <option value="pop">🎤 流行音乐</option>
                </select>
              </div>
              
              <div className="flex items-center gap-2">
                <label className="text-gray-400 text-sm w-16">时长</label>
                <select 
                  value={length}
                  onChange={e => setLength(parseInt(e.target.value))}
                  className="flex-1 bg-[#0a0a0f] border border-[#2a2a40] text-white px-3 py-2 rounded text-sm focus:outline-none focus:border-purple-500"
                >
                  <option value={32}>32拍 (~16秒)</option>
                  <option value={64}>64拍 (~32秒)</option>
                  <option value={128}>128拍 (~1分钟)</option>
                  <option value={256}>256拍 (~2分钟)</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-gray-400 text-sm w-16">调式</label>
                <select 
                  value={key}
                  onChange={e => setKey(e.target.value)}
                  className="flex-1 bg-[#0a0a0f] border border-[#2a2a40] text-white px-3 py-2 rounded text-sm focus:outline-none focus:border-purple-500"
                >
                  <option value="C">C 大调</option>
                  <option value="Am">A 小调</option>
                  <option value="G">G 大调</option>
                  <option value="Em">E 小调</option>
                  <option value="F">F 大调</option>
                  <option value="Dm">D 小调</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-gray-400 text-sm w-16">情绪</label>
                <select 
                  value={mood}
                  onChange={e => setMood(e.target.value)}
                  className="flex-1 bg-[#0a0a0f] border border-[#2a2a40] text-white px-3 py-2 rounded text-sm focus:outline-none focus:border-purple-500"
                >
                  <option value="energetic">激昂</option>
                  <option value="chill">轻松</option>
                  <option value="dark">暗沉</option>
                  <option value="happy">愉快</option>
                  <option value="mysterious">神秘</option>
                </select>
              </div>
            </>
          )}
        </div>

        <div className="flex gap-2">
          <button 
            onClick={handleGenerate}
            disabled={isGenerating || (mode === 'cover' && !songName.trim())}
            className="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 px-4 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? '生成中...' : '🎵 生成音乐'}
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
