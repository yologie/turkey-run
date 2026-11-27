'use strict';
// Turkey Run — tuning constants. One place for every number that shapes
// how the run feels: speeds, hazards, scoring and the farmer chase.
window.TR = window.TR || {};

TR.config = {
  // The run ends at the forest gate, this many metres from the barn.
  goalDistance: 1200,
  startLives: 3,
  // Turkey speed in px/s; it climbs with distance so late runs feel hot.
  baseSpeed: 260,
  maxSpeed: 540,
  speedPerMeter: 0.16,
  // Metres earned per pixel of ground scrolled.
  metersPerPixel: 0.055,
  // Vertical physics for the turkey.
  gravity: 2400,
  jumpVel: -880,
  flapVel: -520,
  diveVel: 950,
  maxFall: 1250,
  // Hazard pacing (seconds between spawns, easing with distance).
  knifeStartInterval: 2.4,
  knifeMinInterval: 1.05,
  pickupInterval: 1.7,
  // The farmer chase, in pixels behind the turkey.
  farmerStartGap: 210,
  farmerCatchGap: 26,
  farmerDecayPerSec: 1.5,
  farmerStumbleClose: 40,
  farmerHitClose: 55,
  farmerCornPush: 28,
  farmerPumpkinPush: 45,
  // Scoring.
  pointsPerMeter: 2,
  cornScore: 10,
  pumpkinScore: 25,
  // Brief invulnerability after a hit, in milliseconds.
  invulnMs: 1200,
  // How long a stumble slows the turkey, in seconds.
  stumbleSlowSec: 0.8,
};
