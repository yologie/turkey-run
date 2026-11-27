'use strict';
// Turkey Run — the farmyard itself: parallax scenery (sky, hills, barn,
// trees), the ground, and the ground obstacles the turkey must clear:
// wooden fences, the brick oven, and the forest gate at the goal.
window.TR = window.TR || {};

TR.world = {
  fences: [], // {x, w, h, hit}
  ovens: [], // {x, w, h, hit, flame}
  gateX: 0, // world x of the forest gate (the escape)
  nextFenceX: 0,
  nextOvenX: 0,
  clouds: [],
  hills: [],
  trees: [],
  tufts: [],

  reset: function (seed) {
    const rng = TR.makeRng(seed ^ 0x9e3779b9);
    this.fences = [];
    this.ovens = [];
    // The gate stands where the goal distance is reached.
    this.gateX = TR.config.goalDistance / TR.config.metersPerPixel;
    this.nextFenceX = 1500;
    this.nextOvenX = 2600;
    this.clouds = [];
    for (let i = 0; i < 9; i++) {
      this.clouds.push({ x: rng() * 4200, y: 30 + rng() * 130, s: 0.6 + rng() * 0.9 });
    }
    this.hills = [];
    for (let i = 0; i < 8; i++) {
      this.hills.push({ x: rng() * 4200, w: 500 + rng() * 500, h: 90 + rng() * 90 });
    }
    this.trees = [];
    for (let i = 0; i < 14; i++) {
      this.trees.push({ x: rng() * 4200, s: 0.7 + rng() * 0.8, kind: i % 3 });
    }
    this.tufts = [];
    for (let i = 0; i < 40; i++) {
      this.tufts.push({ x: rng() * 2400, h: 8 + rng() * 12 });
    }
  },

  // Spawn ground obstacles ahead of the scrolling view.
  update: function (scrollX, viewW) {
    const ahead = scrollX + viewW + 260;
    while (this.nextFenceX < ahead) {
      // Never plant a fence right on top of an oven: the player must be
      // able to see each obstacle coming and jump it on its own.
      const lastOven = this.ovens[this.ovens.length - 1];
      if (lastOven && Math.abs(this.nextFenceX - lastOven.x) < 240) {
        this.nextFenceX += 260;
        continue;
      }
      this.fences.push({ x: this.nextFenceX, w: 64, h: 74, hit: false });
      this.nextFenceX += 720 + TR.rng() * 620;
    }
    while (this.nextOvenX < ahead) {
      this.ovens.push({ x: this.nextOvenX, w: 96, h: 118, hit: false, flame: TR.rng() * 10 });
      this.nextOvenX += 1500 + TR.rng() * 950;
    }
    // Drop anything far behind the camera.
    while (this.fences.length && this.fences[0].x + 200 < scrollX) this.fences.shift();
    while (this.ovens.length && this.ovens[0].x + 220 < scrollX) this.ovens.shift();
  },

  // True when the turkey's feet are inside an oven it has not cleared.
  ovenHit: function (turkeyX, turkeyFeetY, groundY) {
    for (const oven of this.ovens) {
      if (oven.hit) continue;
      if (turkeyX > oven.x - 26 && turkeyX < oven.x + oven.w + 6 && turkeyFeetY > groundY - 16) {
        oven.hit = true;
        return oven;
      }
    }
    return null;
  },

  // True when the turkey clips a fence instead of jumping it.
  fenceHit: function (turkeyX, turkeyFeetY, groundY) {
    for (const fence of this.fences) {
      if (fence.hit) continue;
      const top = groundY - fence.h;
      if (turkeyX > fence.x - 18 && turkeyX < fence.x + fence.w + 8 && turkeyFeetY > top + 14) {
        fence.hit = true;
        return fence;
      }
    }
    return null;
  },

  // True when the turkey has run far enough to reach the forest gate.
  atGate: function (scrollX, turkeyX) {
    return scrollX + turkeyX >= this.gateX;
  },
};
