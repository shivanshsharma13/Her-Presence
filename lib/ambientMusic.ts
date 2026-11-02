/**
 * A soft, generative ambient pad built with the Web Audio API, so there is no
 * audio file to load. It only ever starts after she taps the sound button.
 */

const midiToHz = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

// Fmaj7 · Am7 · Dm7 · B♭maj7, voiced low and open.
const CHORDS = [
  [41, 53, 57, 60, 64],
  [45, 52, 57, 60, 67],
  [38, 50, 57, 60, 65],
  [46, 53, 58, 62, 69],
];
// F major pentatonic, high and sparse.
const BELLS = [77, 79, 81, 84, 86, 89];
const CHORD_SECONDS = 9;

function createReverb(ctx: AudioContext, seconds = 5) {
  const length = ctx.sampleRate * seconds;
  const impulse = ctx.createBuffer(2, length, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const data = impulse.getChannelData(ch);
    for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 3);
  }
  const conv = ctx.createConvolver();
  conv.buffer = impulse;
  return conv;
}

export class AmbientMusic {
  private ctx?: AudioContext;
  private master?: GainNode;
  private reverb?: ConvolverNode;
  private timers: number[] = [];
  private chordIndex = 0;
  playing = false;

  async start() {
    if (this.playing) return;
    if (!this.ctx) {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new Ctx();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0;
      this.reverb = createReverb(this.ctx);
      const wet = this.ctx.createGain();
      wet.gain.value = 0.55;
      this.reverb.connect(wet).connect(this.master);
      this.master.connect(this.ctx.destination);
    }
    await this.ctx.resume();
    this.playing = true;
    const now = this.ctx.currentTime;
    this.master!.gain.cancelScheduledValues(now);
    this.master!.gain.setValueAtTime(this.master!.gain.value, now);
    this.master!.gain.linearRampToValueAtTime(0.16, now + 4);
    this.playChord();
    this.scheduleBell();
  }

  stop() {
    if (!this.ctx || !this.playing) return;
    this.playing = false;
    this.timers.forEach((t) => window.clearTimeout(t));
    this.timers = [];
    const now = this.ctx.currentTime;
    this.master!.gain.cancelScheduledValues(now);
    this.master!.gain.setValueAtTime(this.master!.gain.value, now);
    this.master!.gain.linearRampToValueAtTime(0, now + 1.8);
    const ctx = this.ctx;
    this.timers.push(window.setTimeout(() => !this.playing && ctx.suspend(), 2000));
  }

  private playChord() {
    if (!this.playing || !this.ctx) return;
    const ctx = this.ctx;
    const notes = CHORDS[this.chordIndex % CHORDS.length];
    this.chordIndex++;
    const start = ctx.currentTime + 0.05;
    const end = start + CHORD_SECONDS + 4;

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 820;
    filter.Q.value = 0.4;
    const env = ctx.createGain();
    env.gain.setValueAtTime(0, start);
    env.gain.linearRampToValueAtTime(0.11, start + 3.5);
    env.gain.setValueAtTime(0.11, start + CHORD_SECONDS - 1);
    env.gain.linearRampToValueAtTime(0, end);
    filter.connect(env);
    env.connect(this.master!);
    env.connect(this.reverb!);

    notes.forEach((note, i) => {
      [-5, 5].forEach((cents) => {
        const osc = ctx.createOscillator();
        osc.type = i === 0 ? "sine" : "triangle";
        osc.frequency.value = midiToHz(note);
        osc.detune.value = cents;
        const g = ctx.createGain();
        g.gain.value = i === 0 ? 0.5 : 0.22;
        osc.connect(g).connect(filter);
        osc.start(start);
        osc.stop(end + 0.1);
      });
    });

    this.timers.push(window.setTimeout(() => this.playChord(), CHORD_SECONDS * 1000));
  }

  private scheduleBell() {
    if (!this.playing || !this.ctx) return;
    const ctx = this.ctx;
    const t = ctx.currentTime + 0.05;
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = midiToHz(BELLS[Math.floor(Math.random() * BELLS.length)]);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.035, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 4);
    osc.connect(g);
    g.connect(this.reverb!);
    g.connect(this.master!);
    osc.start(t);
    osc.stop(t + 4.2);
    this.timers.push(window.setTimeout(() => this.scheduleBell(), 2500 + Math.random() * 4500));
  }
}
