'use strict';
// Turkey Run — every pixel the player sees, drawn in code on a 2D canvas:
// the autumn farmyard, the turkey, the farmer, the oven, the knives,
// the pickups, the HUD and the title / end screens.
window.TR = window.TR || {};

TR.render = {
  // Main entry: draws the whole frame for the current game state.
  draw: function (ctx, g, W, H, nowMs) {
    const groundY = H - 96;
    ctx.save();
    // Screen shake right after a hit.
    if (nowMs < (g.shakeUntil || 0)) {
      const s = 7;
      ctx.translate((Math.random() - 0.5) * s, (Math.random() - 0.5) * s);
    }
    this.sky(ctx, W, H, nowMs);
    this.hills(ctx, W, H, g.scrollX);
    this.barn(ctx, W, H, g.scrollX);
    this.trees(ctx, W, H, g.scrollX);
    this.ground(ctx, W, H, g.scrollX, groundY);
    this.gate(ctx, g, W, groundY);
    for (const fence of TR.world.fences) this.fence(ctx, fence.x - g.scrollX, groundY);
    for (const oven of TR.world.ovens) this.oven(ctx, oven.x - g.scrollX, groundY, nowMs, oven.flame);
    for (const p of TR.hazards.pickups) {
      const bob = Math.sin(p.phase) * 6;
      if (p.kind === 'corn') this.corn(ctx, p.x, p.y + bob);
      else this.pumpkin(ctx, p.x, p.y + bob);
    }
    for (const k of TR.hazards.knives) this.knife(ctx, k.x, k.y, k.spin, nowMs - k.born);
    // The farmer runs behind the turkey; the turkey is drawn on top.
    const fx = TR.farmer.x(TR.turkey.x);
    this.farmer(ctx, fx, groundY, TR.farmer.phase, TR.farmer.reaching);
    const blink = TR.turkey.invulnerable(nowMs) && Math.floor(nowMs / 90) % 2 === 0;
    ctx.globalAlpha = blink ? 0.35 : 1;
    this.turkey(ctx, TR.turkey.x, TR.turkey.y, TR.turkey.phase, TR.turkey.wingFlap, !TR.turkey.onGround, 1);
    ctx.globalAlpha = 1;
    this.floaters(ctx, g, nowMs);
    if (g.state === 'play' || g.state === 'paused') this.hud(ctx, g, W, H);
    if (g.state === 'play' && TR.farmer.gap < 110) {
      const a = 0.55 + 0.45 * Math.sin(nowMs / 130);
      ctx.globalAlpha = a;
      ctx.fillStyle = '#ff2d1a';
      ctx.font = 'bold 26px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText("HE'S RIGHT BEHIND YOU!", W / 2, H - 150);
      ctx.globalAlpha = 1;
    }
    if (g.state === 'title') this.title(ctx, g, W, H, nowMs);
    if (g.state === 'caught' || g.state === 'escaped') this.end(ctx, g, W, H, nowMs);
    if (g.state === 'paused') {
      ctx.fillStyle = 'rgba(20,12,6,0.55)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 44px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('PAUSED', W / 2, H / 2 - 8);
      ctx.font = '20px system-ui, sans-serif';
      ctx.fillText('Press P to resume', W / 2, H / 2 + 34);
    }
    ctx.restore();
  },

  sky: function (ctx, W, H, nowMs) {
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#ffe6b8');
    grad.addColorStop(0.45, '#ffb36b');
    grad.addColorStop(0.8, '#f0784f');
    grad.addColorStop(1, '#e85d3d');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
    // Low autumn sun.
    ctx.fillStyle = '#fff3c4';
    ctx.beginPath();
    ctx.arc(W - 180, 110, 52, 0, 6.2832);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,243,196,0.35)';
    ctx.beginPath();
    ctx.arc(W - 180, 110, 78, 0, 6.2832);
    ctx.fill();
    // Drifting clouds.
    ctx.fillStyle = 'rgba(255,248,235,0.85)';
    for (const c of TR.world.clouds) {
      const span = 4200;
      let x = (c.x - nowMs * 0.008) % span;
      if (x < -260) x += span;
      const y = c.y;
      const s = c.s;
      ctx.beginPath();
      ctx.ellipse(x, y, 64 * s, 20 * s, 0, 0, 6.2832);
      ctx.ellipse(x + 42 * s, y + 6 * s, 44 * s, 16 * s, 0, 0, 6.2832);
      ctx.ellipse(x - 44 * s, y + 8 * s, 40 * s, 14 * s, 0, 0, 6.2832);
      ctx.fill();
    }
  },

  hills: function (ctx, W, H, scrollX) {
    const groundY = H - 96;
    for (const h of TR.world.hills) {
      const span = 4200;
      let x = (h.x - scrollX * 0.25) % span;
      if (x < -700) x += span;
      ctx.fillStyle = '#5d8a42';
      ctx.beginPath();
      ctx.ellipse(x, groundY + 6, h.w / 2, h.h, 0, Math.PI, 2 * Math.PI);
      ctx.fill();
    }
    ctx.fillStyle = '#4a7c3a';
    ctx.beginPath();
    ctx.ellipse(W * 0.2 - ((scrollX * 0.25) % 900), groundY + 6, 620, 120, 0, Math.PI, 2 * Math.PI);
    ctx.fill();
  },

  barn: function (ctx, W, H, scrollX) {
    const groundY = H - 96;
    const span = 4200;
    let x = (700 - scrollX * 0.4) % span;
    if (x < -420) x += span;
    const bx = x;
    const by = groundY - 190;
    ctx.fillStyle = '#a93226';
    ctx.fillRect(bx, by + 40, 260, 150);
    ctx.fillStyle = '#7a241a';
    ctx.beginPath();
    ctx.moveTo(bx - 14, by + 48);
    ctx.lineTo(bx + 130, by - 18);
    ctx.lineTo(bx + 274, by + 48);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#f5ead6';
    ctx.fillRect(bx + 104, by + 96, 52, 94);
    ctx.strokeStyle = '#7a241a';
    ctx.lineWidth = 4;
    ctx.strokeRect(bx + 104, by + 96, 52, 94);
    ctx.beginPath();
    ctx.moveTo(bx + 104, by + 96);
    ctx.lineTo(bx + 156, by + 190);
    ctx.moveTo(bx + 156, by + 96);
    ctx.lineTo(bx + 104, by + 190);
    ctx.stroke();
    ctx.fillStyle = '#ffe9a8';
    ctx.fillRect(bx + 30, by + 70, 44, 40);
    ctx.fillRect(bx + 186, by + 70, 44, 40);
  },

  trees: function (ctx, W, H, scrollX) {
    const groundY = H - 96;
    const span = 4200;
    for (const t of TR.world.trees) {
      let x = (t.x - scrollX * 0.55) % span;
      if (x < -120) x += span;
      const s = t.s;
      const tx = x;
      const ty = groundY;
      ctx.fillStyle = '#6b4423';
      ctx.fillRect(tx - 6 * s, ty - 70 * s, 12 * s, 70 * s);
      ctx.fillStyle = t.kind === 0 ? '#c96a1e' : t.kind === 1 ? '#d98a1f' : '#7a9a2e';
      ctx.beginPath();
      ctx.arc(tx, ty - 92 * s, 42 * s, 0, 6.2832);
      ctx.arc(tx - 30 * s, ty - 70 * s, 28 * s, 0, 6.2832);
      ctx.arc(tx + 30 * s, ty - 70 * s, 28 * s, 0, 6.2832);
      ctx.fill();
    }
  },

  ground: function (ctx, W, H, scrollX, groundY) {
    ctx.fillStyle = '#6a9a3f';
    ctx.fillRect(0, groundY, W, 14);
    ctx.fillStyle = '#a67c44';
    ctx.fillRect(0, groundY + 14, W, H - groundY - 14);
    ctx.fillStyle = '#96692f';
    ctx.fillRect(0, groundY + 14, W, 4);
    // Grass tufts scrolling with the world.
    ctx.strokeStyle = '#4e7d2e';
    ctx.lineWidth = 3;
    const span = 2400;
    for (const t of TR.world.tufts) {
      let x = (t.x - scrollX) % span;
      if (x < -20) x += span;
      ctx.beginPath();
      ctx.moveTo(x, groundY + 2);
      ctx.lineTo(x - 4, groundY - t.h);
      ctx.moveTo(x + 4, groundY + 2);
      ctx.lineTo(x + 8, groundY - t.h * 0.8);
      ctx.stroke();
    }
    // Fallen leaves drifting on the dirt.
    ctx.fillStyle = '#d98a1f';
    for (let i = 0; i < 14; i++) {
      const lx = ((i * 317 - scrollX * 1.0) % (W + 80) + W + 80) % (W + 80) - 40;
      ctx.beginPath();
      ctx.ellipse(lx, groundY + 34 + (i % 3) * 16, 7, 4, 0.5, 0, 6.2832);
      ctx.fill();
    }
  },

  fence: function (ctx, x, groundY) {
    if (x < -120 || x > 1400) return;
    ctx.fillStyle = '#7d5230';
    ctx.fillRect(x, groundY - 74, 10, 74);
    ctx.fillRect(x + 54, groundY - 74, 10, 74);
    ctx.fillStyle = '#9a6a3c';
    ctx.fillRect(x - 6, groundY - 66, 76, 12);
    ctx.fillRect(x - 6, groundY - 36, 76, 12);
    ctx.fillStyle = '#6b4423';
    ctx.fillRect(x, groundY - 74, 10, 8);
    ctx.fillRect(x + 54, groundY - 74, 10, 8);
  },

  oven: function (ctx, x, groundY, nowMs, seed) {
    if (x < -160 || x > 1400) return;
    const flick = 0.7 + 0.3 * Math.sin(nowMs / 90 + seed * 7);
    ctx.fillStyle = '#8c3b22';
    ctx.fillRect(x, groundY - 118, 96, 118);
    ctx.fillStyle = '#a34a2c';
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 3; c++) {
        ctx.fillRect(x + 6 + c * 30 + (r % 2) * 8, groundY - 110 + r * 28, 22, 20);
      }
    }
    // Arched mouth with fire inside.
    ctx.fillStyle = '#2b150c';
    ctx.beginPath();
    ctx.arc(x + 48, groundY - 34, 26, Math.PI, 0);
    ctx.fill();
    ctx.fillRect(x + 22, groundY - 34, 52, 34);
    ctx.fillStyle = 'rgba(255,' + Math.floor(140 * flick + 60) + ',26,0.95)';
    ctx.beginPath();
    ctx.moveTo(x + 30, groundY);
    ctx.quadraticCurveTo(x + 40, groundY - 34, x + 48, groundY - 40);
    ctx.quadraticCurveTo(x + 56, groundY - 34, x + 66, groundY);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ffd23f';
    ctx.beginPath();
    ctx.arc(x + 48, groundY - 8, 7 * flick + 3, 0, 6.2832);
    ctx.fill();
    // Chimney with smoke.
    ctx.fillStyle = '#6e2f1c';
    ctx.fillRect(x + 62, groundY - 142, 20, 26);
    ctx.fillStyle = 'rgba(240,235,225,0.55)';
    const sy = groundY - 150 - ((nowMs / 40 + seed * 30) % 40);
    ctx.beginPath();
    ctx.arc(x + 72, sy, 9, 0, 6.2832);
    ctx.arc(x + 80, sy - 14, 12, 0, 6.2832);
    ctx.fill();
    // Warning sign.
    ctx.fillStyle = '#fff3c4';
    ctx.fillRect(x + 22, groundY - 168, 52, 22);
    ctx.fillStyle = '#c0392b';
    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('HOT!', x + 48, groundY - 152);
  },

  gate: function (ctx, g, W, groundY) {
    const x = TR.world.gateX - g.scrollX;
    if (x < -260 || x > W + 260) return;
    ctx.fillStyle = '#5d3a1e';
    ctx.fillRect(x, groundY - 210, 16, 210);
    ctx.fillRect(x + 190, groundY - 210, 16, 210);
    ctx.fillStyle = '#7a9a2e';
    ctx.beginPath();
    ctx.arc(x + 103, groundY - 210, 60, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = '#fff3c4';
    ctx.font = 'bold 20px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('FOREST GATE', x + 103, groundY - 226);
    ctx.fillStyle = '#e8761d';
    ctx.font = 'bold 15px system-ui, sans-serif';
    ctx.fillText('FREEDOM →', x + 103, groundY - 200);
  },

  corn: function (ctx, x, y) {
    ctx.fillStyle = '#4e9a3d';
    ctx.beginPath();
    ctx.ellipse(x - 12, y + 6, 8, 16, -0.5, 0, 6.2832);
    ctx.ellipse(x + 12, y + 6, 8, 16, 0.5, 0, 6.2832);
    ctx.fill();
    ctx.fillStyle = '#f2c230';
    ctx.beginPath();
    ctx.ellipse(x, y, 11, 20, 0, 0, 6.2832);
    ctx.fill();
    ctx.fillStyle = '#d9a41f';
    for (let i = -1; i <= 1; i++) {
      ctx.fillRect(x + i * 6 - 1, y - 16, 2, 32);
    }
  },

  pumpkin: function (ctx, x, y) {
    ctx.fillStyle = '#c85a10';
    ctx.beginPath();
    ctx.ellipse(x, y, 26, 20, 0, 0, 6.2832);
    ctx.fill();
    ctx.fillStyle = '#e8761d';
    ctx.beginPath();
    ctx.ellipse(x - 8, y, 12, 19, 0, 0, 6.2832);
    ctx.ellipse(x + 8, y, 12, 19, 0, 0, 6.2832);
    ctx.fill();
    ctx.fillStyle = '#3f7d2c';
    ctx.fillRect(x - 3, y - 26, 6, 10);
    ctx.fillStyle = '#2b2b2b';
    ctx.beginPath();
    ctx.arc(x - 7, y - 4, 2.5, 0, 6.2832);
    ctx.arc(x + 7, y - 4, 2.5, 0, 6.2832);
    ctx.fill();
    ctx.strokeStyle = '#2b2b2b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y + 4, 7, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();
  },

  knife: function (ctx, x, y, spin, ageMs) {
    if (x < -90 || x > 1400) return;
    // Telegraph: a fading red dash along the flight path when fresh.
    if (ageMs < 350) {
      ctx.globalAlpha = 1 - ageMs / 350;
      ctx.strokeStyle = '#ff2d1a';
      ctx.lineWidth = 3;
      ctx.setLineDash([10, 8]);
      ctx.beginPath();
      ctx.moveTo(x + 40, y);
      ctx.lineTo(x + 190, y);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
    }
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.sin(spin) * 0.35);
    ctx.fillStyle = '#d7dde3';
    ctx.beginPath();
    ctx.moveTo(-34, -6);
    ctx.lineTo(26, -6);
    ctx.lineTo(40, 0);
    ctx.lineTo(26, 6);
    ctx.lineTo(-34, 6);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#f4f7f9';
    ctx.fillRect(-30, -6, 52, 2);
    ctx.fillStyle = '#3a2f28';
    ctx.fillRect(-52, -8, 20, 16);
    ctx.fillStyle = '#5a4636';
    ctx.fillRect(-52, -8, 20, 4);
    ctx.restore();
  },

  turkey: function (ctx, x, feetY, phase, wingFlap, airborne, scale) {
    ctx.save();
    ctx.translate(x, feetY);
    ctx.scale(scale, scale);
    const run = Math.sin(phase);
    const run2 = Math.sin(phase + Math.PI);
    // Legs.
    ctx.strokeStyle = '#e8a13a';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-6, -14);
    ctx.lineTo(-6 + run * (airborne ? 4 : 12), 0);
    ctx.moveTo(8, -14);
    ctx.lineTo(8 + run2 * (airborne ? 4 : 12), 0);
    ctx.stroke();
    // Fanned tail behind.
    const tailCols = ['#a0522d', '#cd853f', '#8b4513', '#d98a1f', '#7a3b12'];
    for (let i = 0; i < 5; i++) {
      const a = -0.5 - i * 0.42;
      ctx.fillStyle = tailCols[i];
      ctx.save();
      ctx.translate(-26, -34);
      ctx.rotate(a);
      ctx.beginPath();
      ctx.ellipse(0, -22, 9, 26, 0, 0, 6.2832);
      ctx.fill();
      ctx.restore();
    }
    // Body.
    ctx.fillStyle = '#8a5a2b';
    ctx.beginPath();
    ctx.ellipse(0, -30, 34, 26, 0, 0, 6.2832);
    ctx.fill();
    ctx.fillStyle = '#a06a35';
    ctx.beginPath();
    ctx.ellipse(2, -36, 26, 18, 0, 0, 6.2832);
    ctx.fill();
    // Wing, flapping when airborne or flapping.
    const flap = airborne ? Math.sin(wingFlap) * 0.7 : run * 0.12;
    ctx.fillStyle = '#6b4423';
    ctx.save();
    ctx.translate(-4, -34);
    ctx.rotate(-0.5 - flap);
    ctx.beginPath();
    ctx.ellipse(-8, 0, 22, 12, 0, 0, 6.2832);
    ctx.fill();
    ctx.restore();
    // Head and neck.
    ctx.fillStyle = '#8a5a2b';
    ctx.fillRect(20, -62, 12, 26);
    ctx.fillStyle = '#c96f4a';
    ctx.beginPath();
    ctx.arc(28, -64, 13, 0, 6.2832);
    ctx.fill();
    // Beak.
    ctx.fillStyle = '#e8a13a';
    ctx.beginPath();
    ctx.moveTo(38, -66);
    ctx.lineTo(52, -61);
    ctx.lineTo(38, -58);
    ctx.closePath();
    ctx.fill();
    // Wattle.
    ctx.fillStyle = '#d43d2a';
    ctx.beginPath();
    ctx.ellipse(36, -52, 4, 8, 0.3, 0, 6.2832);
    ctx.fill();
    // Eye.
    ctx.fillStyle = '#1c1c1c';
    ctx.beginPath();
    ctx.arc(31, -67, 2.6, 0, 6.2832);
    ctx.fill();
    ctx.restore();
  },

  farmer: function (ctx, x, feetY, phase, reaching) {
    ctx.save();
    ctx.translate(x, feetY);
    const run = Math.sin(phase);
    const run2 = Math.sin(phase + Math.PI);
    // Legs in blue overalls.
    ctx.strokeStyle = '#2e5fa3';
    ctx.lineWidth = 9;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-4, -52);
    ctx.lineTo(-4 + run * 16, 0);
    ctx.moveTo(6, -52);
    ctx.lineTo(6 + run2 * 16, 0);
    ctx.stroke();
    // Boots.
    ctx.fillStyle = '#4a2f1d';
    ctx.fillRect(-10 + run * 16, -8, 16, 8);
    ctx.fillRect(0 + run2 * 16, -8, 16, 8);
    // Body: red shirt, blue overalls.
    ctx.fillStyle = '#c0392b';
    ctx.fillRect(-16, -96, 34, 46);
    ctx.fillStyle = '#2e5fa3';
    ctx.fillRect(-14, -72, 30, 26);
    ctx.fillStyle = '#d9d9d9';
    ctx.fillRect(-14, -72, 30, 6);
    // Arms: pumping, or stretched out reaching when close.
    ctx.strokeStyle = '#c0392b';
    ctx.lineWidth = 8;
    if (reaching) {
      ctx.beginPath();
      ctx.moveTo(14, -88);
      ctx.lineTo(52, -76);
      ctx.stroke();
      ctx.fillStyle = '#e8b98a';
      ctx.beginPath();
      ctx.arc(54, -75, 6, 0, 6.2832);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-14, -88);
      ctx.lineTo(-30, -66);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.moveTo(14, -88);
      ctx.lineTo(26, -66 + run * 8);
      ctx.moveTo(-14, -88);
      ctx.lineTo(-26, -66 + run2 * 8);
      ctx.stroke();
    }
    // Head with straw hat and moustache.
    ctx.fillStyle = '#e8b98a';
    ctx.beginPath();
    ctx.arc(2, -108, 15, 0, 6.2832);
    ctx.fill();
    ctx.fillStyle = '#e8c96a';
    ctx.beginPath();
    ctx.ellipse(2, -118, 26, 7, 0, 0, 6.2832);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(2, -120, 12, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = '#5a4636';
    ctx.fillRect(-8, -118, 20, 3);
    // Angry eyes + moustache.
    ctx.strokeStyle = '#1c1c1c';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-4, -112);
    ctx.lineTo(2, -110);
    ctx.moveTo(10, -112);
    ctx.lineTo(4, -110);
    ctx.stroke();
    ctx.fillStyle = '#5a4636';
    ctx.fillRect(-4, -100, 14, 4);
    ctx.restore();
  },

  floaters: function (ctx, g, nowMs) {
    ctx.textAlign = 'center';
    for (const f of g.floaters) {
      const age = (nowMs - f.born) / 900;
      if (age > 1) continue;
      ctx.globalAlpha = 1 - age;
      ctx.fillStyle = f.color;
      ctx.font = 'bold 22px system-ui, sans-serif';
      ctx.fillText(f.text, f.x, f.y - age * 46);
    }
    ctx.globalAlpha = 1;
  },

  hud: function (ctx, g, W, H) {
    ctx.textAlign = 'left';
    // Score chip.
    ctx.fillStyle = 'rgba(20,16,12,0.55)';
    this.chip(ctx, 16, 14, 218, 52);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 15px system-ui, sans-serif';
    ctx.fillText('SCORE', 30, 34);
    ctx.font = 'bold 24px system-ui, sans-serif';
    ctx.fillText(String(g.score).padStart(5, '0'), 30, 58);
    // Distance progress: turkey to the forest gate.
    const barW = Math.min(460, W - 560);
    const barX = (W - barW) / 2;
    ctx.fillStyle = 'rgba(20,16,12,0.55)';
    this.chip(ctx, barX - 12, 14, barW + 24, 52);
    const t = Math.min(1, g.distance / TR.config.goalDistance);
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fillRect(barX, 34, barW, 10);
    ctx.fillStyle = '#ffb13d';
    ctx.fillRect(barX, 34, barW * t, 10);
    ctx.fillStyle = '#7a9a2e';
    ctx.beginPath();
    ctx.arc(barX + barW + 4, 39, 8, 0, 6.2832);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(Math.floor(g.distance) + ' m  /  ' + TR.config.goalDistance + ' m to the forest', barX + barW / 2, 58);
    ctx.textAlign = 'left';
    // Lives hearts.
    ctx.fillStyle = 'rgba(20,16,12,0.55)';
    this.chip(ctx, W - 176, 14, 160, 52);
    for (let i = 0; i < TR.config.startLives; i++) {
      const hx = W - 152 + i * 46;
      this.heart(ctx, hx, 40, i < g.lives ? '#ff3b30' : 'rgba(255,255,255,0.25)');
    }
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.fillText('LIVES', W - 152, 62);
  },

  chip: function (ctx, x, y, w, h) {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 10);
    ctx.fill();
  },

  heart: function (ctx, x, y, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, y + 8);
    ctx.bezierCurveTo(x - 12, y - 4, x - 6, y - 14, x, y - 6);
    ctx.bezierCurveTo(x + 6, y - 14, x + 12, y - 4, x, y + 8);
    ctx.fill();
  },

  title: function (ctx, g, W, H, nowMs) {
    const cx = W / 2;
    ctx.fillStyle = 'rgba(20,12,6,0.45)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(20,12,6,0.62)';
    this.chip(ctx, cx - 340, 108, 680, 420);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffb13d';
    ctx.font = 'bold 84px system-ui, sans-serif';
    ctx.fillText('TURKEY RUN', cx, 196);
    ctx.fillStyle = '#fff3c4';
    ctx.font = 'bold 26px system-ui, sans-serif';
    ctx.fillText('Escape becoming Thanksgiving dinner!', cx, 238);
    // The live turkey runs in the farmyard behind the panel, so the panel
    // keeps its text clear instead of drawing a second bird over it.
    ctx.fillStyle = '#ffffff';
    ctx.font = '20px system-ui, sans-serif';
    ctx.fillText('The farmer is right behind you. Dodge the carving', cx + 60, 292);
    ctx.fillText('knives, jump the fences and the HOT oven,', cx + 60, 320);
    ctx.fillText('grab corn and pumpkins to stay ahead.', cx + 60, 348);
    ctx.fillStyle = '#ffd23f';
    ctx.font = 'bold 19px system-ui, sans-serif';
    ctx.fillText('UP / W flap  •  DOWN / S dive  •  SPACE / CLICK jump', cx, 402);
    ctx.fillText('Drag the mouse to steer  •  P pause', cx, 430);
    ctx.fillStyle = '#ffffff';
    ctx.font = '18px system-ui, sans-serif';
    ctx.fillText(
      'Best run: ' + Math.floor(g.best.distance) + ' m   •   Best score: ' + g.best.score,
      cx, 470,
    );
    // In a frozen screenshot the prompt must always show; live, it blinks.
    const blink = g.frozen ? true : Math.floor(nowMs / 500) % 2 === 0;
    if (blink) {
      ctx.fillStyle = '#ffb13d';
      ctx.font = 'bold 26px system-ui, sans-serif';
      ctx.fillText('PRESS SPACE OR CLICK TO START', cx, 512);
    }
    ctx.textAlign = 'left';
  },

  end: function (ctx, g, W, H, nowMs) {
    const cx = W / 2;
    const won = g.state === 'escaped';
    ctx.fillStyle = 'rgba(20,12,6,0.5)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(20,12,6,0.68)';
    this.chip(ctx, cx - 300, 150, 600, 330);
    ctx.textAlign = 'center';
    ctx.fillStyle = won ? '#7ddc4f' : '#ff5a3c';
    ctx.font = 'bold 72px system-ui, sans-serif';
    ctx.fillText(won ? 'ESCAPED!' : 'CAUGHT!', cx, 240);
    ctx.fillStyle = '#fff3c4';
    ctx.font = '22px system-ui, sans-serif';
    ctx.fillText(
      won ? 'You reached the forest gate — no Thanksgiving dinner for you!' : 'The farmer got you... dinner is served.',
      cx, 282,
    );
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 26px system-ui, sans-serif';
    ctx.fillText('SCORE  ' + g.score, cx, 336);
    ctx.font = '22px system-ui, sans-serif';
    ctx.fillText('Distance: ' + Math.floor(g.distance) + ' m   •   Best: ' + Math.floor(g.best.distance) + ' m', cx, 372);
    ctx.fillStyle = '#ffd23f';
    ctx.font = 'bold 22px system-ui, sans-serif';
    // In a frozen screenshot the prompt must always show; live, it blinks.
    const blink = g.frozen ? true : Math.floor(nowMs / 500) % 2 === 0;
    if (blink) ctx.fillText('PRESS R OR CLICK TO RUN AGAIN', cx, 430);
    ctx.textAlign = 'left';
  },
};
