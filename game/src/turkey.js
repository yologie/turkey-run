'use strict';
// Turkey Run — the player: a turkey with gravity, a jump, wing flaps for
// height, a dive, and pointer-drag steering. It auto-runs; the player
// steers it up and down and jumps the fences and the oven.
window.TR = window.TR || {};

TR.turkey = {
  x: 300, // screen x (fixed; the world scrolls past)
  y: 0, // feet position (screen y)
  vy: 0,
  onGround: true,
  phase: 0, // run-cycle phase, drives the legs and wings
  wingFlap: 0, // wing animation phase
  facing: 1,

  reset: function (groundY, x) {
    this.x = x;
    this.y = groundY;
    this.vy = 0;
    this.onGround = true;
    this.phase = 0;
    this.wingFlap = 0;
  },

  update: function (dt, input, groundY, speed) {
    const cfg = TR.config;
    // Pointer drag steers the turkey straight toward the pointer height.
    if (input.dragging && input.dragY !== null) {
      const target = Math.max(70, Math.min(groundY, input.dragY));
      const next = this.y + (target - this.y) * Math.min(1, dt * 12);
      this.vy = (next - this.y) / Math.max(dt, 0.001);
      this.y = next;
      this.onGround = this.y >= groundY - 1;
      if (this.onGround) this.y = groundY;
    } else {
      // Held Up / W flaps the wings for height; held Down dives.
      if (input.up && this.vy > cfg.flapVel) {
        this.vy = cfg.flapVel;
        this.wingFlap += dt * 22;
        TR.audio.flap();
      }
      if (input.down && this.vy < cfg.diveVel) this.vy = cfg.diveVel;
      this.vy = Math.min(cfg.maxFall, this.vy + cfg.gravity * dt);
      this.y += this.vy * dt;
      if (this.y >= groundY) {
        // Landing thud, only when coming down from a real jump.
        if (!this.onGround && this.vy > 500) TR.audio.noise(0.05, 700, 0.12);
        this.y = groundY;
        this.vy = 0;
        this.onGround = true;
      } else {
        this.onGround = false;
      }
    }
    // A queued jump only works from the ground.
    if (input.consumeJump() && this.onGround) {
      this.vy = cfg.jumpVel;
      this.onGround = false;
      this.wingFlap = 0;
      TR.audio.jump();
    }
    // Run cycle advances with ground speed; wings settle on the ground.
    this.phase += dt * (4 + speed / 55);
    if (this.onGround) this.wingFlap = Math.max(0, this.wingFlap - dt * 8);
  },

  // Feet height above the ground, in pixels (0 on the ground).
  heightAboveGround: function (groundY) {
    return Math.max(0, groundY - this.y);
  },

  invulnerable: function (nowMs) {
    return nowMs < (this.invulnUntil || 0);
  },
};
