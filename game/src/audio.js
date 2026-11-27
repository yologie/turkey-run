'use strict';
// Turkey Run — all sound is synthesised with WebAudio. No audio files,
// no network: short oscillator blips and filtered noise, created lazily
// on the first user gesture (browsers block audio before one).
window.TR = window.TR || {};

TR.audio = {
  ctx: null,
  master: null,

  // Call from a key or pointer gesture. Safe to call repeatedly.
  unlock: function () {
    try {
      if (!window.AudioContext) return;
      if (!this.ctx) {
        this.ctx = new AudioContext();
        this.master = this.ctx.createGain();
        this.master.gain.value = 0.2;
        this.master.connect(this.ctx.destination);
      }
      if (this.ctx.state === 'suspended') void this.ctx.resume();
    } catch (err) {
      // Sound is garnish: a failure here must never break the game.
      this.ctx = null;
    }
  },

  ready: function () {
    return !!(this.ctx && this.ctx.state === 'running' && this.master);
  },

  // A short pitched blip.
  tone: function (freq, dur, type, vol, slideTo) {
    if (!this.ready()) return;
    try {
      const t0 = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type || 'sine';
      osc.frequency.setValueAtTime(freq, t0);
      if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t0 + dur);
      gain.gain.setValueAtTime(vol || 0.5, t0);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
      osc.connect(gain);
      gain.connect(this.master);
      osc.start(t0);
      osc.stop(t0 + dur + 0.02);
    } catch (err) {
      /* ignore */
    }
  },

  // A burst of filtered noise (whooshes, thuds, flaps).
  noise: function (dur, filterFreq, vol) {
    if (!this.ready()) return;
    try {
      const t0 = this.ctx.currentTime;
      const len = Math.max(1, Math.floor(this.ctx.sampleRate * dur));
      const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = filterFreq || 1200;
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(vol || 0.4, t0);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
      src.connect(filter);
      filter.connect(gain);
      gain.connect(this.master);
      src.start(t0);
    } catch (err) {
      /* ignore */
    }
  },

  jump: function () { this.tone(320, 0.18, 'sine', 0.5, 720); },
  flap: function () { this.noise(0.09, 2400, 0.25); },
  pickup: function () {
    this.tone(880, 0.09, 'triangle', 0.5);
    setTimeout(() => this.tone(1318, 0.12, 'triangle', 0.45), 70);
  },
  pumpkin: function () {
    this.tone(660, 0.1, 'triangle', 0.5);
    setTimeout(() => this.tone(990, 0.1, 'triangle', 0.5), 80);
    setTimeout(() => this.tone(1320, 0.16, 'triangle', 0.45), 160);
  },
  whoosh: function () { this.noise(0.28, 3200, 0.3); },
  hit: function () {
    this.tone(140, 0.25, 'sawtooth', 0.55, 60);
    this.noise(0.2, 500, 0.5);
  },
  stumble: function () { this.noise(0.14, 900, 0.4); },
  caught: function () {
    this.tone(392, 0.22, 'sawtooth', 0.5, 370);
    setTimeout(() => this.tone(311, 0.22, 'sawtooth', 0.5, 294), 200);
    setTimeout(() => this.tone(233, 0.45, 'sawtooth', 0.5, 110), 400);
  },
  escaped: function () {
    const notes = [523, 659, 784, 1047];
    notes.forEach((f, i) => setTimeout(() => this.tone(f, 0.22, 'triangle', 0.5), i * 130));
  },
};
