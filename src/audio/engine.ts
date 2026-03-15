class AudioEngine {
  ctx: AudioContext;
  masterGain: GainNode;
  convolver: ConvolverNode | null = null;
  reverbGain: GainNode | null = null;

  constructor() {
    this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.8;
    this.masterGain.connect(this.ctx.destination);
    this.setupReverb();
  }

  async setupReverb() {
    const length = this.ctx.sampleRate * 2.5;
    const impulse = this.ctx.createBuffer(2, length, this.ctx.sampleRate);
    for (let i = 0; i < 2; i++) {
      const channelData = impulse.getChannelData(i);
      for (let j = 0; j < length; j++) {
        channelData[j] = (Math.random() * 2 - 1) * Math.pow(1 - j / length, 3);
      }
    }
    this.convolver = this.ctx.createConvolver();
    this.convolver.buffer = impulse;
    this.reverbGain = this.ctx.createGain();
    this.reverbGain.gain.value = 0.25;
    this.convolver.connect(this.reverbGain);
    this.reverbGain.connect(this.masterGain);
  }

  resume() {
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  playNote(instrument: string, freq: number, vol: number, dur: number) {
    this.resume();
    const t = this.ctx.currentTime;
    
    const gain = this.ctx.createGain();
    gain.connect(this.masterGain);
    if (this.convolver) {
      gain.connect(this.convolver);
    }

    if (instrument === 'guzheng') {
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      osc1.type = 'sawtooth';
      osc2.type = 'square';
      osc1.frequency.value = freq;
      osc2.frequency.value = freq * 1.005;
      
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(freq * 6, t);
      filter.frequency.exponentialRampToValueAtTime(freq, t + dur);
      
      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(vol * 1.2, t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, t + dur * 2);
      
      osc1.start(t); osc2.start(t);
      osc1.stop(t + dur * 2); osc2.stop(t + dur * 2);
      
    } else if (instrument === 'dizi') {
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      
      const lfo = this.ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.value = 5.5;
      const lfoGain = this.ctx.createGain();
      lfoGain.gain.setValueAtTime(0, t);
      lfoGain.gain.linearRampToValueAtTime(freq * 0.03, t + 0.3);
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      lfo.start(t);
      lfo.stop(t + dur + 0.5);
      
      const noiseSize = this.ctx.sampleRate * (dur + 0.5);
      const noiseBuf = this.ctx.createBuffer(1, noiseSize, this.ctx.sampleRate);
      const output = noiseBuf.getChannelData(0);
      for (let i = 0; i < noiseSize; i++) output[i] = Math.random() * 2 - 1;
      const noise = this.ctx.createBufferSource();
      noise.buffer = noiseBuf;
      const noiseFilter = this.ctx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.value = freq * 2;
      noiseFilter.Q.value = 2;
      const noiseGain = this.ctx.createGain();
      noiseGain.gain.value = vol * 0.1;
      noise.connect(noiseFilter);
      noiseFilter.connect(gain);
      noise.start(t);
      
      osc.connect(gain);
      
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(vol * 0.8, t + 0.08);
      gain.gain.linearRampToValueAtTime(vol * 0.6, t + dur - 0.1);
      gain.gain.linearRampToValueAtTime(0, t + dur);
      
      osc.start(t);
      osc.stop(t + dur + 0.1);
      
    } else if (instrument === 'erhu') {
      const osc = this.ctx.createOscillator();
      osc.type = 'sawtooth';
      
      osc.frequency.setValueAtTime(freq * 0.95, t);
      osc.frequency.exponentialRampToValueAtTime(freq, t + 0.1);
      
      const lfo = this.ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.value = 6;
      const lfoGain = this.ctx.createGain();
      lfoGain.gain.setValueAtTime(0, t);
      lfoGain.gain.linearRampToValueAtTime(freq * 0.02, t + 0.2);
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      lfo.start(t);
      lfo.stop(t + dur + 0.5);
      
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = freq * 2.5;
      filter.Q.value = 1.5;
      
      osc.connect(filter);
      filter.connect(gain);
      
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(vol * 0.9, t + 0.15);
      gain.gain.linearRampToValueAtTime(vol * 0.7, t + dur - 0.15);
      gain.gain.linearRampToValueAtTime(0, t + dur);
      
      osc.start(t);
      osc.stop(t + dur + 0.1);
      
    } else if (instrument === 'piano') {
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      osc1.type = 'triangle';
      osc2.type = 'sine';
      osc1.frequency.value = freq;
      osc2.frequency.value = freq * 1.002;
      
      osc1.connect(gain);
      osc2.connect(gain);
      
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(vol, t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, t + dur * 1.5);
      
      osc1.start(t); osc2.start(t);
      osc1.stop(t + dur * 1.5); osc2.stop(t + dur * 1.5);
      
    } else if (instrument === 'bass') {
      const osc = this.ctx.createOscillator();
      osc.type = 'square';
      osc.frequency.value = freq / 2;
      
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(freq * 4, t);
      filter.frequency.exponentialRampToValueAtTime(freq, t + 0.3);
      
      osc.connect(filter);
      filter.connect(gain);
      
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(vol * 0.8, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
      
      osc.start(t);
      osc.stop(t + dur);
      
    } else {
      const osc = this.ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = freq;
      
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(freq * 8, t);
      filter.frequency.exponentialRampToValueAtTime(freq, t + 0.2);
      
      osc.connect(filter);
      filter.connect(gain);
      
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(vol * 0.6, t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
      
      osc.start(t);
      osc.stop(t + dur);
    }
  }

  playDrum(type: 'kick' | 'snare' | 'hihat', vol: number) {
    this.resume();
    const t = this.ctx.currentTime;
    const gain = this.ctx.createGain();
    gain.connect(this.masterGain);
    
    if (this.convolver && type !== 'kick') {
      const revGain = this.ctx.createGain();
      revGain.gain.value = 0.15;
      revGain.connect(this.convolver);
      gain.connect(revGain);
    }

    if (type === 'kick') {
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(150, t);
      osc.frequency.exponentialRampToValueAtTime(40, t + 0.1);
      osc.frequency.exponentialRampToValueAtTime(0.01, t + 0.5);
      
      gain.gain.setValueAtTime(vol, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.5);
      
      osc.connect(gain);
      osc.start(t);
      osc.stop(t + 0.5);
      
    } else if (type === 'snare') {
      const osc = this.ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(250, t);
      osc.frequency.exponentialRampToValueAtTime(150, t + 0.1);
      
      const oscGain = this.ctx.createGain();
      oscGain.gain.setValueAtTime(vol * 0.8, t);
      oscGain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
      osc.connect(oscGain);
      oscGain.connect(gain);
      
      const noiseSize = this.ctx.sampleRate * 0.25;
      const noiseBuf = this.ctx.createBuffer(1, noiseSize, this.ctx.sampleRate);
      const output = noiseBuf.getChannelData(0);
      for (let i = 0; i < noiseSize; i++) output[i] = Math.random() * 2 - 1;
      const noise = this.ctx.createBufferSource();
      noise.buffer = noiseBuf;
      
      const noiseFilter = this.ctx.createBiquadFilter();
      noiseFilter.type = 'highpass';
      noiseFilter.frequency.value = 1500;
      
      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(vol * 0.6, t);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.25);
      
      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(gain);
      
      osc.start(t); osc.stop(t + 0.2);
      noise.start(t);
      
    } else if (type === 'hihat') {
      const noiseSize = this.ctx.sampleRate * 0.1;
      const noiseBuf = this.ctx.createBuffer(1, noiseSize, this.ctx.sampleRate);
      const output = noiseBuf.getChannelData(0);
      for (let i = 0; i < noiseSize; i++) output[i] = Math.random() * 2 - 1;
      const noise = this.ctx.createBufferSource();
      noise.buffer = noiseBuf;
      
      const noiseFilter = this.ctx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.value = 8000;
      noiseFilter.Q.value = 1.2;
      
      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(vol * 0.5, t);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
      
      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(gain);
      
      noise.start(t);
    }
  }
}

export const engine = new AudioEngine();
