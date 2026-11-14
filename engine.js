(function (root) {
  'use strict';

  const LEVEL_CONFIGS = {
    1: {
      name: '01 / THE BROKEN OVERPASS',
      theme: 'dark',
      anchors: [{x:1650,y:277,w:90},{x:1790,y:255,w:90},{x:1930,y:277,w:90}],
      solids: [{x:850,y:300,w:750},{x:2080,y:300,w:1000},{x:2280,y:264,w:65},{x:2420,y:235,w:65}],
      spikes: [{x:1320,w:42},{x:2200,w:40},{x:2520,w:45}],
      stalkers: [{baseX:2370,range:40,speed:1.3}]
    },
    2: {
      name: '02 / THE POWER SUBSTATION',
      theme: 'substation',
      anchors: [{x:1630,y:275,w:85},{x:1780,y:250,w:85},{x:1930,y:275,w:85}],
      solids: [{x:850,y:300,w:730},{x:2080,y:300,w:1000},{x:2260,y:260,w:55},{x:2410,y:230,w:55},{x:2560,y:255,w:50}],
      spikes: [{x:1310,w:44},{x:1460,w:40},{x:2180,w:45},{x:2480,w:45},{x:2640,w:40}],
      stalkers: [{baseX:2210,range:45,speed:1.6},{baseX:2490,range:45,speed:1.4}]
    },
    3: {
      name: '03 / THE WATER TOWER CORE',
      theme: 'core',
      anchors: [{x:1620,y:270,w:80},{x:1770,y:245,w:80},{x:1920,y:270,w:80}],
      solids: [{x:850,y:300,w:710},{x:2090,y:300,w:1000},{x:2250,y:255,w:50},{x:2390,y:220,w:50},{x:2530,y:245,w:45},{x:2660,y:230,w:45}],
      spikes: [{x:1300,w:45},{x:1440,w:42},{x:2160,w:48},{x:2310,w:42},{x:2450,w:48},{x:2600,w:44},{x:2720,w:35}],
      stalkers: [{baseX:2200,range:50,speed:1.8},{baseX:2500,range:55,speed:1.7}]
    }
  };

  class EchoGame {
    constructor() { this.reset(); }
    reset() {
      this.level = 1;
      this.state = 'title'; this.time = 0; this.phaseTime = 0; this.rideTime = 0; this.x = 140; this.y = 300;
      this.vx = 0; this.vy = 0; this.camera = 0; this.echoes = 0; this.deaths = 0; this.checkpoint = 1040;
      this.onGround = true; this.coyote = 0; this.buffer = 0; this.previousJump = false; this.previousRetry = false; this.paused = false; this.event = '';
      this.cycleTime = 0; this.disturbed = false; this.abductionX = 0;
    }
    start() { this.reset(); this.state = 'ride'; }
    startLevel(lvl = 1) {
      this.level = lvl;
      this.x = 1040; this.y = 300; this.vx = 0; this.vy = 0;
      this.echoes = 0; this.checkpoint = 1040; this.onGround = true;
      this.coyote = 0; this.buffer = 0;
      this.enter('dark');
    }
    currentConfig() { return LEVEL_CONFIGS[this.level] || LEVEL_CONFIGS[1]; }
    getAnchors() { return this.currentConfig().anchors; }
    getSolids() { return this.currentConfig().solids; }
    getSpikes() { return this.currentConfig().spikes; }
    getStalkers() { return this.currentConfig().stalkers; }
    enter(state) { this.state = state; this.phaseTime = 0; this.event = state; }
    die() { this.deaths++; this.echoes = Math.min(3, this.echoes + 1); this.enter('dead'); }
    platforms() { return this.getSolids().concat(this.getAnchors().slice(0, this.echoes)); }
    openingVisuals() {
      const state = this.state, time = this.phaseTime;
      const together = ['title','ride','disturbance','reveal'].includes(state);
      const empty = ['vanish','upright','topple','thought','resolve','approach','fall'].includes(state);
      const pulse = (start) => Math.max(0, 1 - Math.abs(time - start) / 0.15);
      return {
        riders: together ? 4 : 1,
        emptyBikes: empty ? 3 : 0,
        monster: state === 'reveal' ? Math.min(1, time / 0.55) : state === 'vanish' ? 1 : 0,
        flash: state === 'disturbance' ? Math.max(pulse(0.25), pulse(0.95)) : state === 'vanish' ? Math.max(0, 1 - time / 0.24) : 0,
        bikeTilt: state === 'topple' ? Math.min(1, time / 0.7) : ['thought','resolve','approach','fall'].includes(state) ? 1 : 0,
        dialogue: state === 'thought' ? 'What happened?!' : state === 'resolve' ? 'I have to save them!' : ''
      };
    }
    step(dt, input = {}) {
      if (this.paused || this.state === 'title' || this.state === 'win') return;
      dt = Math.min(dt, 1 / 30); this.time += dt; this.phaseTime += dt; this.event = '';
      const jump = !!input.jump, newJump = jump && !this.previousJump, retry = !!input.retry && !this.previousRetry;
      this.previousJump = jump; this.previousRetry = !!input.retry;

      if (this.state === 'ride') {
        if (input.right) { this.x += 95 * dt; this.rideTime += dt; this.cycleTime += dt; }
        if (this.rideTime >= 5.6 && !this.disturbed) { this.disturbed = true; this.abductionX = this.x; this.enter('disturbance'); }
      } else if (this.state === 'disturbance') { if (this.phaseTime >= 1.6) this.enter('reveal'); }
      else if (this.state === 'reveal') { if (this.phaseTime >= 2.2) this.enter('vanish'); }
      else if (this.state === 'vanish') { if (this.phaseTime >= 0.24) this.enter('upright'); }
      else if (this.state === 'upright') { if (this.phaseTime >= 0.65) this.enter('topple'); }
      else if (this.state === 'topple') { if (this.phaseTime >= 0.9) this.enter('thought'); }
      else if (this.state === 'thought') { if (this.phaseTime >= 1.8) this.enter('resolve'); }
      else if (this.state === 'resolve') { if (this.phaseTime >= 2) this.enter('approach'); }
      else if (this.state === 'approach') { if (input.right) { this.x += 95 * dt; this.cycleTime += dt; } if (this.x >= 1065) { this.vy = 0; this.enter('fall'); } }
      else if (this.state === 'fall') { this.x += ((input.right ? 36 : 0) - (input.left ? 36 : 0)) * dt; this.vy += 320 * dt; this.y += this.vy * dt; if (this.phaseTime > 1.4) this.enter('blackout'); }
      else if (this.state === 'blackout') { if (this.phaseTime > 1.4) { this.x = 1040; this.y = 300; this.vx = 0; this.vy = 0; this.onGround = true; this.enter('dark'); } }
      else if (this.state === 'dead') { if (this.phaseTime > 0.65) { this.x = this.checkpoint; this.y = 300; this.vx = 0; this.vy = 0; this.onGround = true; this.enter('dark'); } }
      else if (this.state === 'dark') {
        if (retry) { this.die(); return; }
        if (newJump) this.buffer = 0.13; else this.buffer = Math.max(0, this.buffer - dt);
        this.coyote = this.onGround ? 0.1 : Math.max(0, this.coyote - dt);
        const direction = (input.right ? 1 : 0) - (input.left ? 1 : 0);
        const speed = this.level === 3 ? 135 : this.level === 2 ? 130 : 125;
        const target = direction * speed;
        this.vx += Math.max(-900 * dt, Math.min(900 * dt, target - this.vx));
        if (this.buffer > 0 && this.coyote > 0) { this.vy = -265; this.onGround = false; this.coyote = 0; this.buffer = 0; this.event = 'jump'; }
        if (!jump && this.vy < -110) this.vy = -110;
        const oldY = this.y;
        this.vy += 680 * dt; this.x = Math.max(960, this.x + this.vx * dt); this.y += this.vy * dt; this.onGround = false;

        for (const platform of this.platforms()) {
          if (this.x + 7 > platform.x && this.x - 7 < platform.x + platform.w && oldY <= platform.y + 0.01 && this.y >= platform.y && this.vy >= 0) {
            this.y = platform.y; this.vy = 0; this.onGround = true;
          }
        }

        const spikes = this.getSpikes();
        const hitSpike = spikes.some(hazard => this.x + 6 > hazard.x && this.x - 6 < hazard.x + hazard.w && this.y > 290);

        let hitStalker = false;
        for (const s of this.getStalkers()) {
          const stalkerX = s.baseX + Math.sin(this.time * s.speed) * s.range;
          if (Math.abs(this.x - stalkerX) < 16 && this.y > 278) {
            hitStalker = true;
            break;
          }
        }

        if (this.y > 405 || hitSpike || hitStalker) { this.die(); return; }
        if (this.x > 2130) this.checkpoint = 2140;
        if (this.x > 2810) this.enter('win');
      }

      const goal = Math.max(0, this.x - 200);
      if (['dark','dead','win'].includes(this.state)) this.camera += (goal - this.camera) * Math.min(1, dt * 5);
      else this.camera = goal;
    }
  }

  // Backwards-compatible constants for static access
  EchoGame.anchors = LEVEL_CONFIGS[1].anchors;
  EchoGame.solids = LEVEL_CONFIGS[1].solids;
  EchoGame.LEVELS = LEVEL_CONFIGS;

  if (typeof module !== 'undefined') module.exports = EchoGame;
  root.EchoGame = EchoGame;
})(typeof window !== 'undefined' ? window : globalThis);
