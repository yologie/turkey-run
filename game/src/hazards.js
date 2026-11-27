'use strict';
// Turkey Run — flying carving knives and pickups (corn cobs and pumpkins).
// Knives come in from the right on telegraphed paths; pickups drift in
// with the world and are worth score — and distance from the farmer.
window.TR = window.TR || {};

TR.hazards = {
  knives: [], // {x, y, vy, spin, born}
  pickups: [], // {x, y, kind, phase}
  knifeTimer: 1.4,
  pickupTimer: 0.9,

  reset: function () {
    this.knives = [];
    this.pickups = [];
    this.knifeTimer = 1.4;
    this.pickupTimer = 0.9;
  },

  update: function (dt, speed, viewW, groundY, distance) {
    const cfg = TR.config;
    // Knives: faster and more frequent as the run goes on.
    this.knifeTimer -= dt;
    if (this.knifeTimer <= 0) {
      const t = Math.min(1, distance / cfg.goalDistance);
      const interval = cfg.knifeStartInterval + (cfg.knifeMinInterval - cfg.knifeStartInterval) * t;
      this.knifeTimer = interval * (0.8 + TR.rng() * 0.4);
      this.knives.push({
        x: viewW + 70,
        y: groundY - 30 - TR.rng() * 230,
        vy: TR.rand(-40, 40),
        spin: TR.rand(-3, 3),
        born: performance.now(),
      });
      TR.audio.whoosh();
    }
    // Pickups: corn most of the time, pumpkin as a rarer prize.
    this.pickupTimer -= dt;
    if (this.pickupTimer <= 0) {
      this.pickupTimer = cfg.pickupInterval * (0.7 + TR.rng() * 0.6);
      const kind = TR.rng() < 0.3 ? 'pumpkin' : 'corn';
      this.pickups.push({
        x: viewW + 60,
        y: groundY - 20 - TR.rng() * 210,
        kind: kind,
        phase: TR.rng() * 6.28,
      });
    }
    const knifeSpeed = speed * 1.35 + 90 + distance * 0.02;
    for (const knife of this.knives) {
      knife.x -= knifeSpeed * dt;
      knife.y += knife.vy * dt;
      knife.spin += dt * 4;
    }
    for (const pickup of this.pickups) {
      pickup.x -= speed * dt;
      pickup.phase += dt * 3;
    }
    while (this.knives.length && this.knives[0].x < -90) this.knives.shift();
    while (this.pickups.length && this.pickups[0].x < -70) this.pickups.shift();
  },

  // A knife overlapping the turkey (centre-based, generous but fair).
  knifeHit: function (turkeyX, turkeyY) {
    for (let i = 0; i < this.knives.length; i++) {
      const k = this.knives[i];
      if (Math.abs(k.x - turkeyX) < 46 && Math.abs(k.y - (turkeyY - 30)) < 42) {
        this.knives.splice(i, 1);
        return k;
      }
    }
    return null;
  },

  // A pickup overlapping the turkey; returns the kind collected.
  pickupHit: function (turkeyX, turkeyY) {
    for (let i = 0; i < this.pickups.length; i++) {
      const p = this.pickups[i];
      if (Math.abs(p.x - turkeyX) < 48 && Math.abs(p.y - (turkeyY - 30)) < 50) {
        this.pickups.splice(i, 1);
        return p.kind;
      }
    }
    return null;
  },
};
