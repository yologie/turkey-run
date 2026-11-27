'use strict';
// Turkey Run — the game loop and state machine: title / play / paused /
// caught / escaped. Owns the canvas, the run state, collisions, scoring
// and the best-run record. Everything else lives in the sibling files.
window.TR = window.TR || {};

TR.game = {
  state: 'title',
  time: 0,
  distance: 0,
  score: 0,
  bonus: 0,
  lives: 3,
  speed: 260,
  scrollX: 0,
  best: { score: 0, distance: 0 },
  frozen: false,
  shot: null,
  floaters: [],
  shakeUntil: 0,
  slowUntil: 0,
  nowMs: 0,
};

// The canvas and its size, in CSS pixels.
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
let W = 1280;
let H = 720;
let groundY = H - 96;

function ground() {
  return H - 96;
}

function resize() {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  W = window.innerWidth;
  H = window.innerHeight;
  canvas.width = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);
  canvas.style.width = W + 'px';
  canvas.style.height = H + 'px';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  groundY = H - 96;
  TR.turkey.x = Math.round(W * 0.3);
  if (TR.turkey.onGround) TR.turkey.y = groundY;
}
window.addEventListener('resize', resize);

function loadBest() {
  try {
    const raw = window.localStorage.getItem('turkey-run-best');
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.score === 'number' && typeof parsed.distance === 'number') {
      TR.game.best = parsed;
    }
  } catch (err) {
    // No storage (or a bad value) just means no best run yet.
  }
}

function saveBest() {
  const g = TR.game;
  if (g.score > g.best.score) g.best.score = g.score;
  if (g.distance > g.best.distance) g.best.distance = Math.floor(g.distance);
  try {
    window.localStorage.setItem('turkey-run-best', JSON.stringify(g.best));
  } catch (err) {
    /* ignore */
  }
}

function floater(x, y, text, color) {
  TR.game.floaters.push({ x: x, y: y, text: text, color: color, born: performance.now() });
  if (TR.game.floaters.length > 12) TR.game.floaters.shift();
}

function startRun() {
  const g = TR.game;
  g.state = 'play';
  g.time = 0;
  g.distance = 0;
  g.score = 0;
  g.bonus = 0;
  g.lives = TR.config.startLives;
  g.speed = TR.config.baseSpeed;
  g.scrollX = 0;
  g.floaters = [];
  g.shakeUntil = 0;
  g.slowUntil = 0;
  TR.rng = TR.makeRng(TR.seedFromUrl());
  TR.world.reset((Math.random() * 4294967296) >>> 0);
  TR.hazards.reset();
  TR.farmer.reset();
  TR.turkey.reset(groundY, Math.round(W * 0.3));
  TR.turkey.invulnUntil = 0;
  // The press that started the run must not also jump the turkey, and
  // stale confirms must not leak into the run.
  TR.input.jumpQueued = false;
  TR.input.confirmQueued = false;
}

function endRun(won) {
  const g = TR.game;
  g.state = won ? 'escaped' : 'caught';
  // Clear queued presses: a Space mashed during the run must not
  // instantly restart from the end screen.
  TR.input.jumpQueued = false;
  TR.input.confirmQueued = false;
  TR.input.restartQueued = false;
  saveBest();
  if (won) TR.audio.escaped();
  else TR.audio.caught();
  updateStatus();
}

function updateStatus() {
  const g = TR.game;
  const el = document.getElementById('status');
  if (!el) return;
  const words = {
    title: 'Turkey Run. Press Space or click to start.',
    play: 'Score ' + g.score + ', distance ' + Math.floor(g.distance) + ' metres, ' + g.lives + ' lives.',
    paused: 'Paused.',
    caught: 'Caught! Final score ' + g.score + '. Press R to run again.',
    escaped: 'Escaped! Final score ' + g.score + '. Press R to run again.',
  };
  el.textContent = words[g.state] || '';
}

function hitTurkey(kind) {
  const g = TR.game;
  // Only a live run can lose a life: a hit landing on the same frame as
  // the run ending must not push lives below zero.
  if (g.state !== 'play') return;
  if (TR.turkey.invulnerable(performance.now())) return;
  g.lives -= 1;
  TR.turkey.invulnUntil = performance.now() + TR.config.invulnMs;
  TR.farmer.hit();
  g.shakeUntil = performance.now() + 220;
  floater(TR.turkey.x, TR.turkey.y - 90, '-1 LIFE', '#ff5a3c');
  TR.audio.hit();
  if (g.lives <= 0) endRun(false);
}

function stumble() {
  const g = TR.game;
  TR.farmer.stumble();
  g.slowUntil = performance.now() + TR.config.stumbleSlowSec * 1000;
  g.shakeUntil = performance.now() + 140;
  floater(TR.turkey.x, TR.turkey.y - 90, 'STUMBLE!', '#ffd23f');
  TR.audio.stumble();
}

function collect(kind) {
  const g = TR.game;
  const cfg = TR.config;
  if (kind === 'corn') {
    g.bonus += cfg.cornScore;
    TR.farmer.pushBack(cfg.farmerCornPush);
    floater(TR.turkey.x, TR.turkey.y - 90, '+10 CORN', '#ffd23f');
    TR.audio.pickup();
  } else {
    g.bonus += cfg.pumpkinScore;
    TR.farmer.pushBack(cfg.farmerPumpkinPush);
    floater(TR.turkey.x, TR.turkey.y - 90, '+25 PUMPKIN', '#ff8c1a');
    TR.audio.pumpkin();
  }
}

function updatePlay(dt) {
  const g = TR.game;
  const cfg = TR.config;
  g.time += dt;
  // Speed climbs with distance; a stumble briefly slows the turkey.
  const target = Math.min(cfg.maxSpeed, cfg.baseSpeed + g.distance * cfg.speedPerMeter);
  g.speed = performance.now() < g.slowUntil ? target * 0.72 : target;
  g.scrollX += g.speed * dt;
  g.distance += g.speed * dt * cfg.metersPerPixel;
  g.score = Math.floor(g.distance) * cfg.pointsPerMeter + g.bonus;

  TR.turkey.update(dt, TR.input, groundY, g.speed);
  TR.world.update(g.scrollX, W);
  TR.hazards.update(dt, g.speed, W, groundY, g.distance);
  TR.farmer.update(dt, g.speed);

  // Collisions, in order: knives, pickups, oven, fence.
  if (TR.hazards.knifeHit(TR.turkey.x, TR.turkey.y)) hitTurkey('knife');
  if (g.state !== 'play') return;
  const got = TR.hazards.pickupHit(TR.turkey.x, TR.turkey.y);
  if (got) collect(got);
  if (TR.world.ovenHit(TR.turkey.x, TR.turkey.y, groundY)) {
    // Bounce the turkey off the hot oven.
    TR.turkey.vy = -560;
    TR.turkey.onGround = false;
    hitTurkey('oven');
  }
  if (g.state !== 'play') return;
  if (TR.world.fenceHit(TR.turkey.x, TR.turkey.y, groundY)) stumble();
  if (g.state !== 'play') return;
  if (TR.farmer.caught()) {
    endRun(false);
    return;
  }
  if (TR.world.atGate(g.scrollX, TR.turkey.x)) {
    endRun(true);
  }
}

let last = performance.now();
let readySignalled = false;

function frame(nowMs) {
  const g = TR.game;
  g.nowMs = nowMs;
  let dt = Math.min(0.033, (nowMs - last) / 1000);
  last = nowMs;
  if (dt < 0) dt = 0;

  if (!g.frozen) {
    if (g.state === 'title') {
      // Attract mode: the farmyard drifts by behind the title panel.
      g.scrollX += 26 * dt;
      TR.world.update(g.scrollX, W);
      TR.turkey.phase += dt * 2;
      if (TR.input.consumeConfirm()) startRun();
    } else if (g.state === 'play') {
      // A confirm means nothing mid-run: drain it, or a stale Space from
      // the jump would instantly unpause the game after P.
      TR.input.consumeConfirm();
      if (TR.input.consumePause()) {
        g.state = 'paused';
        updateStatus();
      } else {
        updatePlay(dt);
      }
    } else if (g.state === 'paused') {
      if (TR.input.consumePause() || TR.input.consumeConfirm()) {
        g.state = 'play';
        updateStatus();
      }
    } else if (g.state === 'caught' || g.state === 'escaped') {
      if (TR.input.consumeRestart() || TR.input.consumeConfirm()) startRun();
    }
    // Clear stale queued presses so they never leak into the next screen.
    if (g.state === 'title') TR.input.consumeJump();
  }

  TR.render.draw(ctx, g, W, H, nowMs);
  if (!readySignalled) {
    readySignalled = true;
    window.__shotReady = true;
    updateStatus();
  }
  requestAnimationFrame(frame);
}

function init() {
  resize();
  loadBest();
  TR.input.init(canvas);
  TR.world.reset((Math.random() * 4294967296) >>> 0);
  TR.hazards.reset();
  TR.farmer.reset();
  TR.turkey.reset(groundY, Math.round(W * 0.3));
  const shot = TR.shots.mode();
  if (shot) {
    TR.shots.apply(shot, TR.game, W, H);
  }
  updateStatus();
  requestAnimationFrame(frame);
}

// Debug handle for the playtest driver: read-only state plus a few
// forced events (a knife hit, a distance jump) so the test can reach
// every screen without playing a perfect run.
window.__turkey = {
  state: function () {
    const g = TR.game;
    return {
      screen: g.state,
      score: g.score,
      distance: Math.floor(g.distance),
      lives: g.lives,
      speed: Math.round(g.speed),
      farmerGap: Math.round(TR.farmer.gap),
      knives: TR.hazards.knives.length,
      pickups: TR.hazards.pickups.length,
    };
  },
  forceHit: function () {
    TR.turkey.invulnUntil = 0;
    hitTurkey('knife');
  },
  setDistance: function (m) {
    TR.game.distance = m;
    TR.game.scrollX = m / TR.config.metersPerPixel;
  },
  start: function () {
    if (TR.game.state === 'title') startRun();
  },
};

init();
