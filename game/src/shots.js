'use strict';
// Turkey Run — deterministic screenshot states. ?shot=title|play|chase|end
// builds a fixed frame with a fixed seed, so the screenshots are
// reproducible: no user input, no wall-clock drift, same farm every time.
window.TR = window.TR || {};

TR.shots = {
  // The ?shot= value, or null when playing normally.
  mode: function () {
    try {
      const params = new URLSearchParams(window.location.search);
      const shot = params.get('shot');
      if (shot === 'title' || shot === 'play' || shot === 'chase' || shot === 'end') return shot;
    } catch (err) {
      /* ignore */
    }
    return null;
  },

  // Builds the frozen state for one shot mode and marks the game frozen.
  apply: function (mode, g, W, H) {
    const groundY = H - 96;
    const cfg = TR.config;
    g.frozen = true;
    g.shot = mode;
    // A fixed best run, so the title and end screens always show numbers.
    g.best = { score: 4860, distance: 1240 };
    TR.rng = TR.makeRng(7);
    TR.world.reset(7);
    TR.hazards.reset();
    TR.farmer.reset();
    TR.turkey.reset(groundY, Math.round(W * 0.3));

    if (mode === 'title') {
      g.state = 'title';
      g.scrollX = 420;
      TR.world.update(g.scrollX, W);
      TR.turkey.phase = 0.6;
      return;
    }

    if (mode === 'play') {
      g.state = 'play';
      g.distance = 214;
      g.score = 1250;
      g.lives = 3;
      g.speed = 330;
      g.scrollX = 214 / cfg.metersPerPixel;
      TR.world.update(g.scrollX, W);
      // Turkey mid-jump over a fence, knife incoming, corn ahead.
      TR.turkey.y = groundY - 96;
      TR.turkey.vy = -260;
      TR.turkey.onGround = false;
      TR.turkey.phase = 1.2;
      TR.turkey.wingFlap = 1.1;
      TR.world.fences.push({ x: g.scrollX + TR.turkey.x - 10, w: 64, h: 74, hit: false });
      TR.hazards.knives.push({ x: TR.turkey.x + 260, y: groundY - 130, vy: 0, spin: 0.4, born: performance.now() - 120 });
      TR.hazards.pickups.push({ x: TR.turkey.x + 420, y: groundY - 60, kind: 'corn', phase: 0.5 });
      TR.hazards.pickups.push({ x: TR.turkey.x + 520, y: groundY - 170, kind: 'pumpkin', phase: 1.9 });
      TR.farmer.gap = 190;
      return;
    }

    if (mode === 'chase') {
      g.state = 'play';
      g.distance = 486;
      g.score = 2380;
      g.lives = 2;
      g.speed = 380;
      g.scrollX = 486 / cfg.metersPerPixel;
      TR.world.update(g.scrollX, W);
      // Farmer right on the turkey's tail, oven ahead on the ground.
      // Gap 80 keeps both characters readable instead of merged.
      TR.farmer.gap = 80;
      TR.farmer.reaching = true;
      TR.farmer.phase = 2.2;
      TR.turkey.phase = 2.2;
      TR.turkey.y = groundY;
      TR.turkey.onGround = true;
      TR.world.ovens.push({ x: g.scrollX + TR.turkey.x + 330, w: 96, h: 118, hit: false, flame: 2 });
      TR.hazards.knives.push({ x: TR.turkey.x + 430, y: groundY - 90, vy: 0, spin: -0.3, born: performance.now() - 100 });
      TR.hazards.pickups.push({ x: TR.turkey.x + 180, y: groundY - 150, kind: 'corn', phase: 2.4 });
      return;
    }

    // mode === 'end': the ESCAPED! screen with final numbers.
    g.state = 'escaped';
    g.distance = 1200;
    g.score = 5210;
    g.lives = 2;
    // Frame the gate just right of the end panel (panel ends at cx+300),
    // so it stays visible instead of hiding behind the overlay.
    g.scrollX = 1200 / cfg.metersPerPixel - 1000;
    TR.world.update(g.scrollX, W);
    TR.turkey.y = groundY;
    TR.turkey.onGround = true;
  },
};
