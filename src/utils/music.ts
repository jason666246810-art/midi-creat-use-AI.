export interface Note {
  row: number;
  col: number;
  len: number;
}

export interface Track {
  id: string;
  name: string;
  instrument: string;
  color: string;
  notes: Note[];
  volume: number;
  muted: boolean;
  solo: boolean;
}

export interface Drums {
  kick: number[];
  snare: number[];
  hihat: number[];
  volume: number;
  muted: boolean;
  solo: boolean;
}

export interface Project {
  cols: number;
  bpm: number;
  tracks: Track[];
  drums: Drums;
}

export const generateNotes = (startOctave: number, numOctaves: number) => {
  const names = ['C', 'B', 'A#', 'A', 'G#', 'G', 'F#', 'F', 'E', 'D#', 'D', 'C#'];
  const isBlack = [false, false, true, false, true, false, true, false, false, true, false, true];
  const notes = [];
  for (let oct = startOctave; oct > startOctave - numOctaves; oct--) {
    for (let i = 0; i < 12; i++) {
      notes.push({
        name: `${names[i]}${oct}`,
        isBlack: isBlack[i],
        freq: 440 * Math.pow(2, ((12 - i) + (oct - 4) * 12 - 9) / 12)
      });
    }
  }
  return notes;
};

export const PIANO_KEYS = generateNotes(6, 4); // 48 keys, C6 down to C#2

export function parseJianpu(input: string, baseRow: number = 24): Note[] {
  const scaleOffsets = [0, 2, 4, 5, 7, 9, 11];
  const tokens = input.replace(/\|/g, ' ').trim().split(/\s+/);
  const notes: Note[] = [];
  let col = 0;
  
  for (const token of tokens) {
    if (!token) continue;
    
    if (token === '0') {
      col++;
      continue;
    }
    
    if (token === '-') {
      if (notes.length > 0) {
        notes[notes.length - 1].len++;
      }
      col++;
      continue;
    }
    
    let octaveOffset = 0;
    let noteStr = token;
    if (token.startsWith('+')) {
      octaveOffset = 1;
      noteStr = token.substring(1);
    } else if (token.startsWith('-')) {
      octaveOffset = -1;
      noteStr = token.substring(1);
    }
    
    const degree = parseInt(noteStr.charAt(0));
    if (degree >= 1 && degree <= 7) {
      const offset = scaleOffsets[degree - 1];
      const row = baseRow - offset - (octaveOffset * 12);
      if (row >= 0 && row < 48) {
        notes.push({ row, col, len: 1 });
      }
    }
    col++;
  }
  return notes;
}
