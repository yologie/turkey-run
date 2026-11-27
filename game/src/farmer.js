'use strict';
// Turkey Run — the farmer chasing from behind. He never stops: the gap
// between him and the turkey shrinks a little every second, jumps shut
// when the turkey stumbles or is hit, and opens again when the turkey
// grabs corn or a pumpkin. If he reaches the turkey, the run is over.
window.TR = window.TR || {};

TR.farmer = {
  gap: 210, // pixels behind the turkey
  phase: 0, // run-cycle phase
  reaching: false, // arm stretched out when he is very close

  reset: function () {
    this.gap = TR.config.farmerStartGap;
    this.phase = 0;
    this.reaching = false;
  },

  // Screen x of the farmer, given the turkey's screen x.
  x: function (turkeyX) {
    return turkeyX - this.gap;
  },

  update: function (dt, speed) {
    const cfg = TR.config;
    // Relentless: he gains a little ground every second, and runs a touch
    // faster once he is close enough to reach for the turkey.
    this.gap = Math.max(cfg.farmerCatchGap, this.gap - cfg.farmerDecayPerSec * dt);
    this.phase += dt * (5 + speed / 60) * (this.reaching ? 1.25 : 1);
    this.reaching = this.gap < 110;
  },

  stumble: function () {
    this.gap = Math.max(TR.config.farmerCatchGap, this.gap - TR.config.farmerStumbleClose);
  },

  hit: function () {
    this.gap = Math.max(TR.config.farmerCatchGap, this.gap - TR.config.farmerHitClose);
  },

  pushBack: function (px) {
    this.gap += px;
  },

  caught: function () {
    return this.gap <= TR.config.farmerCatchGap + 0.5;
  },
};
