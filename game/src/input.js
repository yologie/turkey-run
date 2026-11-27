'use strict';
// Turkey Run — keyboard and mouse input. Tracks held keys, queues
// single presses (jump / confirm) for the game loop to consume, and
// turns a pointer drag into a target height for the turkey.
window.TR = window.TR || {};

TR.input = {
  up: false,
  down: false,
  // A queued jump press (Space / click). Consumed once by the loop.
  jumpQueued: false,
  // A queued confirm press (Space / Enter / click) for title/end screens.
  confirmQueued: false,
  // Pointer drag: while the pointer is held, the turkey follows this y.
  dragging: false,
  dragY: null,
  // Restart key (R) pressed this frame.
  restartQueued: false,
  pauseQueued: false,

  _downAt: 0,
  _downY: 0,
  _moved: 0,

  consumeJump: function () {
    const v = this.jumpQueued;
    this.jumpQueued = false;
    return v;
  },
  consumeConfirm: function () {
    const v = this.confirmQueued;
    this.confirmQueued = false;
    return v;
  },
  consumeRestart: function () {
    const v = this.restartQueued;
    this.restartQueued = false;
    return v;
  },
  consumePause: function () {
    const v = this.pauseQueued;
    this.pauseQueued = false;
    return v;
  },

  init: function (canvas) {
    const self = this;
    window.addEventListener('keydown', (ev) => {
      if (ev.repeat) return;
      TR.audio.unlock();
      switch (ev.code) {
        case 'ArrowUp':
        case 'KeyW':
          self.up = true;
          ev.preventDefault();
          break;
        case 'ArrowDown':
        case 'KeyS':
          self.down = true;
          ev.preventDefault();
          break;
        case 'Space':
        case 'KeyJ':
          self.jumpQueued = true;
          self.confirmQueued = true;
          ev.preventDefault();
          break;
        case 'Enter':
          self.confirmQueued = true;
          break;
        case 'KeyR':
          self.restartQueued = true;
          break;
        case 'KeyP':
          self.pauseQueued = true;
          break;
        default:
          break;
      }
    });
    window.addEventListener('keyup', (ev) => {
      switch (ev.code) {
        case 'ArrowUp':
        case 'KeyW':
          self.up = false;
          break;
        case 'ArrowDown':
        case 'KeyS':
          self.down = false;
          break;
        default:
          break;
      }
    });
    canvas.addEventListener('pointerdown', (ev) => {
      TR.audio.unlock();
      self.dragging = true;
      self.dragY = ev.clientY;
      self._downAt = performance.now();
      self._downY = ev.clientY;
      self._moved = 0;
      canvas.setPointerCapture(ev.pointerId);
    });
    canvas.addEventListener('pointermove', (ev) => {
      if (!self.dragging) return;
      self.dragY = ev.clientY;
      self._moved = Math.max(self._moved, Math.abs(ev.clientY - self._downY));
    });
    canvas.addEventListener('pointerup', (ev) => {
      const quick = performance.now() - self._downAt < 260;
      self.dragging = false;
      self.dragY = null;
      // A short tap with barely any movement is a jump / confirm.
      if (quick && self._moved < 14) {
        self.jumpQueued = true;
        self.confirmQueued = true;
      }
    });
    canvas.addEventListener('pointercancel', () => {
      self.dragging = false;
      self.dragY = null;
    });
    // Never let the page scroll away from the game on touch devices.
    canvas.addEventListener('touchmove', (ev) => ev.preventDefault(), { passive: false });
  },
};
