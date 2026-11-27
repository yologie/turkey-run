'use strict';
// Turkey Run — a tiny seeded random generator (mulberry32) so the
// screenshot modes are deterministic: same seed, same farmyard.
window.TR = window.TR || {};

TR.makeRng = function (seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

// Seed from the URL (?seed=7) when present, else a fresh random seed.
TR.seedFromUrl = function () {
  try {
    const params = new URLSearchParams(window.location.search);
    const raw = params.get('seed');
    if (raw !== null && raw !== '') {
      const n = Number(raw);
      if (Number.isFinite(n)) return n >>> 0;
    }
  } catch (err) {
    // A bad query string must never stop the game loading.
  }
  return (Math.random() * 4294967296) >>> 0;
};

TR.rng = TR.makeRng(TR.seedFromUrl());

// Range helper on the shared generator.
TR.rand = function (min, max) {
  return min + TR.rng() * (max - min);
};
TR.pick = function (list) {
  if (!list || list.length === 0) return undefined;
  return list[Math.floor(TR.rng() * list.length) % list.length];
};
