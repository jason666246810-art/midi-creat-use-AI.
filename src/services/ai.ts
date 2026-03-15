export interface AIGenerateParams {
  mode: 'original' | 'cover';
  length: number;
  style?: string;
  key?: string;
  mood?: string;
  reference?: string;
  songName?: string;
}

// 简单的种子随机数生成器，用于让“指定歌曲”每次生成相同的旋律
function getRNG(seedStr: string) {
  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) {
    hash = Math.imul(31, hash) + seedStr.charCodeAt(i) | 0;
  }
  let a = hash;
  return function() {
    let t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
}

export async function generateAITracks(params: AIGenerateParams) {
  // 模拟 AI 思考时间
  await new Promise(resolve => setTimeout(resolve, 1500));

  const seed = params.mode === 'cover' ? (params.songName || 'default') : (Date.now().toString());
  const random = getRNG(seed);

  const length = params.length || 64;
  const bars = length / 16;

  // 钢琴卷帘行数映射：0 是 C6 (MIDI 84), 47 是 C#2 (MIDI 37)
  // 中音 C4 (MIDI 60) 是第 24 行
  // 公式: row = 84 - midi
  const midiToRow = (midi: number) => {
    const row = 84 - midi;
    return Math.max(0, Math.min(47, row)); // 限制在 0-47 范围内
  };

  // 音阶定义 (相对于根音的半音偏移)
  const majorScale = [0, 2, 4, 5, 7, 9, 11];
  const minorScale = [0, 2, 3, 5, 7, 8, 10];
  const pentatonicMajor = [0, 2, 4, 7, 9];
  const pentatonicMinor = [0, 3, 5, 7, 10];

  let rootMidi = 60; // 默认 C4
  let isMinor = false;

  // 如果是翻弹模式，随机决定一个调式；否则使用用户选择的调式
  const keyStr = params.mode === 'cover' ? ['C', 'Am', 'F', 'G', 'Em'][Math.floor(random() * 5)] : (params.key || 'C');

  if (keyStr.includes('m')) isMinor = true;
  if (keyStr.startsWith('C')) rootMidi = 60;
  if (keyStr.startsWith('D')) rootMidi = 62;
  if (keyStr.startsWith('E')) rootMidi = 64;
  if (keyStr.startsWith('F')) rootMidi = 65;
  if (keyStr.startsWith('G')) rootMidi = 67;
  if (keyStr.startsWith('A')) rootMidi = 69;
  if (keyStr.startsWith('B')) rootMidi = 71;

  const scale = isMinor ? minorScale : majorScale;
  const pentatonic = isMinor ? pentatonicMinor : pentatonicMajor;

  // 经典和弦进行 (基于音阶的索引: 0=I, 1=ii, 2=iii, 3=IV, 4=V, 5=vi, 6=vii)
  const progressions = isMinor ? [
    [5, 3, 0, 4], // vi - IV - I - V (流行小调)
    [0, 5, 3, 4], // i - VI - iv - v
    [0, 3, 4, 0], // i - iv - v - i
  ] : [
    [0, 4, 5, 3], // I - V - vi - IV (万能和弦)
    [0, 5, 3, 4], // I - vi - IV - V (50年代进行)
    [3, 4, 2, 5], // IV - V - iii - vi (王道进行/日本流行)
  ];

  const prog = progressions[Math.floor(random() * progressions.length)];

  const melody = [];
  const chords = [];
  const bass = [];
  const drums = { kick: [] as number[], snare: [] as number[], hihat: [] as number[] };

  for (let bar = 0; bar < bars; bar++) {
    const chordIdx = prog[bar % prog.length];
    const chordRootMidi = rootMidi + scale[chordIdx];

    // 构建三和弦 (根音, 三音, 五音)
    const thirdIdx = (chordIdx + 2) % 7;
    const fifthIdx = (chordIdx + 4) % 7;
    
    let thirdMidi = rootMidi + scale[thirdIdx];
    if (thirdIdx < chordIdx) thirdMidi += 12; // 跨八度处理
    
    let fifthMidi = rootMidi + scale[fifthIdx];
    if (fifthIdx < chordIdx) fifthMidi += 12;

    const chordNotes = [chordRootMidi, thirdMidi, fifthMidi];

    // --- BASS (低音) ---
    // 弹奏根音，降低两个八度
    bass.push({ row: midiToRow(chordRootMidi - 24), col: bar * 16, len: 8 });
    if (random() > 0.5) {
      bass.push({ row: midiToRow(chordRootMidi - 24), col: bar * 16 + 8, len: 8 });
    }

    // --- CHORDS (和弦) ---
    // 柱式和弦或节奏律动
    const chordRhythm = random() > 0.5 ? [0, 8] : [0, 4, 8, 12];
    for (const step of chordRhythm) {
      for (const note of chordNotes) {
        chords.push({ row: midiToRow(note - 12), col: bar * 16 + step, len: 4 });
      }
    }

    // --- MELODY (旋律) ---
    let step = 0;
    while (step < 16) {
      if (random() > 0.2) { // 80% 概率生成音符
        // 优先从和弦内音或五声音阶中选择，保证和谐
        const isChordNote = random() > 0.5;
        let noteMidi;
        if (isChordNote) {
          noteMidi = chordNotes[Math.floor(random() * chordNotes.length)] + 12; // 升高一个八度
        } else {
          noteMidi = rootMidi + pentatonic[Math.floor(random() * pentatonic.length)] + 12;
        }
        
        const lenChoices = [2, 4, 8];
        const len = lenChoices[Math.floor(random() * lenChoices.length)];
        
        const actualLen = Math.min(len, 16 - step); // 防止溢出当前小节
        melody.push({ row: midiToRow(noteMidi), col: bar * 16 + step, len: actualLen });
        step += actualLen;
      } else {
        step += 2; // 休止符
      }
    }

    // --- DRUMS (鼓组) ---
    const style = params.mode === 'cover' ? 'pop' : (params.style || 'edm');
    if (style === 'edm') {
      drums.kick.push(bar * 16, bar * 16 + 4, bar * 16 + 8, bar * 16 + 12);
      drums.snare.push(bar * 16 + 4, bar * 16 + 12);
      for (let i = 0; i < 16; i += 2) drums.hihat.push(bar * 16 + i);
    } else if (style === 'lofi' || style === 'ambient') {
      drums.kick.push(bar * 16, bar * 16 + 10);
      drums.snare.push(bar * 16 + 8);
      for (let i = 0; i < 16; i += 4) drums.hihat.push(bar * 16 + i);
    } else if (style === 'folk') {
      drums.kick.push(bar * 16);
      drums.snare.push(bar * 16 + 12);
      drums.hihat.push(bar * 16 + 4, bar * 16 + 8);
    } else {
      // Pop / Game / Default
      drums.kick.push(bar * 16, bar * 16 + 8);
      drums.snare.push(bar * 16 + 4, bar * 16 + 12);
      for (let i = 0; i < 16; i += 2) drums.hihat.push(bar * 16 + i);
    }
  }

  return { melody, chords, bass, drums };
}
