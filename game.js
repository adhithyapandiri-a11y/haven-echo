'use strict';
const canvas = document.getElementById('game'), ctx = canvas.getContext('2d', {alpha: false});
ctx.imageSmoothingEnabled = false;
const game = new EchoGame(), keys = new Set(), pressed = new Set();
const ui = Object.fromEntries(['menu','pause-menu','win-menu','dialogue','chapter','counter','objective','result','gentle','sound'].map(id => [id, document.getElementById(id)]));
const replayBtn = document.getElementById('replay');
const colors = ['#8671b6', '#439264', '#c4a047', '#c99a8b'];

// Descaled clean audio synthesizer (No AI assets, 100% in-code Web Audio)
let soundOn = false, audioContext, lastTime = 0, lastState = '', audioBeat = 0;

const rect = (x, y, width, height, color) => {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), width, height);
};

function line(points, color, width = 1) {
  if (!points || points.length < 2) return;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'square';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(Math.round(points[0][0]), Math.round(points[0][1]));
  for (let index = 1; index < points.length; index++) {
    ctx.lineTo(Math.round(points[index][0]), Math.round(points[index][1]));
  }
  ctx.stroke();
  ctx.restore();
}

function text(value, x, y, color = '#f6e7ba', size = 8) {
  ctx.fillStyle = color;
  ctx.font = `${size}px monospace`;
  ctx.fillText(value, Math.round(x), Math.round(y));
}

function tone(frequency, duration = 0.12, type = 'triangle', volume = 0.025) {
  if (!soundOn) return;
  try {
    audioContext ??= new (window.AudioContext || window.webkitAudioContext)();
    audioContext.resume();
    const oscillator = audioContext.createOscillator(), gain = audioContext.createGain();
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(volume, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + duration);
  } catch {
    soundOn = false;
  }
}

function bike(x, y, color, fallen = false, pedal = 0) {
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  if (fallen) {
    ctx.scale(1, 1 - 0.65 * fallen);
    ctx.translate(0, 9 * fallen);
  }
  for (const wheel of [-12, 12]) {
    rect(wheel - 6, -12, 12, 2, '#203340');
    rect(wheel - 8, -10, 2, 9, '#203340');
    rect(wheel + 6, -10, 2, 9, '#203340');
    rect(wheel - 6, -1, 12, 2, '#203340');
    rect(wheel - 5, -9, 10, 8, '#bbc5b3');
    rect(wheel - 1, -8, 2, 7, '#586574');
  }
  line([[-12, -6], [-5, -18], [3, -6], [-12, -6]], color, 2);
  line([[3, -6], [12, -6], [6, -23], [12, -24]], color, 2);
  line([[-5, -18], [9, -18]], color, 2);
  rect(-9, -22, 8, 3, '#273443');
  if (!fallen) rider(0, -19, color, pedal, true);
  ctx.restore();
}

function rider(x, y, color, phase = 0, cycling = false) {
  const leg = Math.round(Math.sin(phase) * 3);
  rect(x - 5, y - 24, 10, 3, '#263348');
  rect(x - 6, y - 21, 11, 7, '#263348');
  rect(x - 3, y - 20, 8, 8, '#eec39b');
  rect(x + 4, y - 18, 2, 4, '#eec39b');
  rect(x + 3, y - 19, 1, 1, '#293242');
  rect(x - 5, y - 12, 10, 12, color);
  rect(x - 6, y - 10, 3, 8, color);
  rect(x + 3, y - 10, 3, 8, color);
  if (color === colors[3]) {
    for (let stripe = 0; stripe < 3; stripe++) rect(x - 5, y - 11 + stripe * 4, 9, 2, '#f0dcc0');
    rect(x - 8, y - 11, 3, 10, '#783641');
  }
  if (cycling) {
    line([[x - 2, y], [x + 4, y + 3 + leg], [x - 1, y + 10 + leg]], '#39455b', 3);
    line([[x + 3, y - 8], [x + 9, y - 3], [x + 12, y - 4]], '#eec39b', 2);
  } else {
    rect(x - 4, y, 3, 10 + leg, '#6d7f99');
    rect(x + 1, y, 3, 10 - leg, '#53667e');
    rect(x - 5, y + 9 + leg, 5, 3, '#e4d0a4');
    rect(x + 1, y + 9 - leg, 5, 3, '#e4d0a4');
  }
}

function tree(x, y, dark, variant) {
  const trunkCol = dark ? (game.level === 3 ? '#2e0e16' : game.level === 2 ? '#241433' : '#38333d') : '#71594a';
  rect(x - 4, y - 57, 8, 57, trunkCol);
  line([[x, y - 27], [x - 18, y - 47]], trunkCol, 4);
  const foliage = dark
    ? (game.level === 3 ? ['#420f1a', '#541724', '#661f2f'] : game.level === 2 ? ['#2c153d', '#3d1d54', '#4e256b'] : ['#263b40', '#31464a', '#3f4a44'])
    : ['#74965c', '#91ab66', '#b6ba70'];
  for (let layer = 0; layer < 4; layer++) {
    const width = 48 - layer * 9;
    rect(x - width / 2, y - 54 - layer * 11, width, 21, foliage[layer % 3]);
    rect(x - width / 2 + 5, y - 59 - layer * 11, width - 10, 7, foliage[(layer + 1) % 3]);
  }
}

/* ==========================================================
   ATMOSPHERIC BACKGROUND (Only Shadowed Buildings in Background)
   Front row of buildings completely removed per user request!
   ========================================================== */
function background(dark) {
  const lvl = game.level || 1;
  let skyTop, skyMid, skyLow, shadowCol1, shadowCol2, groundCol, lineCol;

  if (!dark) {
    // Opening Sunset
    skyTop = '#a6c6bd'; skyMid = '#c3d1b5'; skyLow = '#e4d4a9';
    shadowCol1 = '#88a59d'; shadowCol2 = '#88a59d';
    groundCol = '#667a7d'; lineCol = '#737b70';
  } else if (lvl === 1) {
    // Level 1: Cold Midnight Town
    skyTop = '#0e1824'; skyMid = '#172738'; skyLow = '#22364c';
    shadowCol1 = '#1c2d3d'; shadowCol2 = '#263b4f';
    groundCol = '#1f2e3d'; lineCol = '#385068';
  } else if (lvl === 2) {
    // Level 2: Power Substation (Industrial Voltage Violet & Amber)
    skyTop = '#140a20'; skyMid = '#221136'; skyLow = '#331852';
    shadowCol1 = '#27153d'; shadowCol2 = '#381e57';
    groundCol = '#25153a'; lineCol = '#5b2f8c';
  } else {
    // Level 3: The Water Tower Core (Crimson Vortex)
    skyTop = '#140308'; skyMid = '#24060f'; skyLow = '#3b0a19';
    shadowCol1 = '#300b16'; shadowCol2 = '#451020';
    groundCol = '#2a0a14'; lineCol = '#70192e';
  }

  // Full screen sky gradients - seamless coverage with ZERO gaps from 0 to 282
  rect(0, 0, 640, 80, skyTop);
  rect(0, 80, 640, 60, skyMid);
  rect(0, 140, 640, 142, skyLow); // 140 + 142 = 282 (meets the curb perfectly)

  // Distant Moon / Rift Core
  const moonX = 488 - game.camera * 0.06;
  const moonCol = dark ? (lvl === 3 ? '#e11d48' : lvl === 2 ? '#f59e0b' : '#94a3b8') : '#f5e3ad';
  rect(moonX, 36, 31, 31, moonCol);
  rect(moonX - 5, 42, 41, 19, moonCol);

  // Distant Shadowed Silhouette Buildings (Background skyline, seated flush on curb line 282)
  for (let index = 0; index < 28; index++) {
    const x = index * 68 - Math.round(game.camera * 0.28) % 68 - 60;
    const h = 80 + (index % 5) * 14;
    rect(x, 282 - h, 54, h, shadowCol1);
    rect(x + 6, 274 - h, 38, 10, shadowCol2);
    // Rooftop antenna / pipes
    if (index % 3 === 0) rect(x + 24, 260 - h, 3, 14, shadowCol1);
    // Industrial water tank silhouette
    if (index % 4 === 1) {
      rect(x + 12, 258 - h, 24, 16, shadowCol1);
      rect(x + 16, 274 - h, 16, 4, shadowCol2);
    }
  }

  // Midground: Shadowed Power Pylons & Pine Trees (NO front-row storefronts!)
  for (let index = 0; index < 25; index++) {
    const x = index * 150 - game.camera;
    if (x > -180 && x < 700) {
      tree(x + 132, 282, dark, index);
      // Telephone poles and high voltage crossbars
      rect(x + 20, 134, 3, 150, dark ? '#344754' : '#697778');
      rect(x + 14, 130, 15, 6, dark ? '#26353f' : '#697778');
    }
  }

  // Realistic dynamic utility cables that hang between poles and scroll with camera
  const startPylon = Math.floor((game.camera - 100) / 150);
  const endPylon = Math.ceil((game.camera + 700) / 150);
  for (let i = startPylon; i <= endPylon; i++) {
    const p1x = i * 150 - game.camera + 21;
    const p2x = (i + 1) * 150 - game.camera + 21;
    const midX = (p1x + p2x) / 2;
    line([[p1x, 133], [midX, 142], [p2x, 133]], lineCol, 1);
  }

  // Road surface - seamlessly covers 282 to 360
  rect(0, 282, 640, 12, dark ? (lvl === 3 ? '#3b121c' : lvl === 2 ? '#2e1c3b' : '#33434f') : '#d7c6a7');
  rect(0, 294, 640, 6, dark ? '#1b252f' : '#8e9e95');
  rect(0, 300, 640, 60, groundCol);

  // Road dashed lines
  for (let index = 0; index < 30; index++) {
    const x = index * 100 - Math.round(game.camera);
    rect(x, 327, 37, 3, dark ? (lvl === 2 ? '#f59e0b' : '#576775') : '#d3cba8');
  }

  // Floating rift embers / dust
  if (dark) {
    const emberCol = lvl === 3 ? '#ef4444' : lvl === 2 ? '#f59e0b' : '#8ae1d2';
    for (let index = 0; index < 35; index++) {
      const x = ((index * 79 - game.camera * 0.7 + Math.sin(game.time * 0.3 + index) * 12) % 660 + 660) % 660;
      rect(x, (index * 37 + game.time * (4 + index % 4)) % 360, 1 + index % 2, 1, emberCol);
    }
  }
}

function vines(x, width) {
  const col1 = game.level === 3 ? '#2e0812' : game.level === 2 ? '#220e33' : '#101b28';
  const col2 = game.level === 3 ? '#7f1d1d' : game.level === 2 ? '#6b21a8' : '#773c4c';
  const col3 = game.level === 3 ? '#ef4444' : game.level === 2 ? '#d97706' : '#ab5157';

  rect(x, 294, width, 66, col1);
  rect(x + 4, 301, width - 8, 59, '#070c14');
  for (let index = 0; index < width; index += 13) {
    rect(x + index, 293 + index % 5, 9, 5, col2);
    rect(x + index + 2, 297, 3, 10 + index % 17, col3);
  }
}

function monster(x, y, scale = 1) {
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  ctx.scale(scale, scale);
  const black = game.level === 3 ? '#1f040b' : '#0f1722';
  rect(-13, -63, 26, 38, black);
  rect(-9, -79, 19, 20, black);
  rect(-17, -83, 7, 9, black);
  rect(9, -90, 5, 22, black);
  line([[-10, -54], [-29, -41], [-37, -8]], black, 7);
  line([[12, -56], [28, -37], [38, -22], [32, -8]], black, 6);
  line([[-7, -27], [-13, -5], [-24, 0]], black, 8);
  line([[7, -27], [12, -9], [20, 0]], black, 8);
  const eyeCol = game.level === 3 ? '#ef4444' : game.level === 2 ? '#f59e0b' : '#8ae1d2';
  rect(-4, -71, 3, 2, eyeCol);
  rect(4, -71, 3, 2, eyeCol);
  ctx.restore();
}

function drawInfectedWall(camera, state) {
  const wallX = 1065 - camera;
  if (wallX < -100 || wallX > 740) return;

  const pulse = Math.sin(game.time * 5) * 3;

  // 1. Concrete & Brick Barricade Wall Structure
  rect(wallX - 6, 120, 48, 182, '#181b24');
  rect(wallX, 125, 36, 177, '#252a36');

  // Weathered hazard warning bands at the top
  for (let s = 0; s < 4; s++) {
    rect(wallX + s * 9, 125, 5, 14, s % 2 === 0 ? '#b8860b' : '#11141a');
  }

  // Brick horizontal mortar lines
  for (let row = 0; row < 11; row++) {
    rect(wallX, 142 + row * 14, 36, 1, '#181c24');
  }

  // 2. The Ruptured Hole (Stranger Things "The Gate")
  // Inner dark swirling abyss
  rect(wallX - 3, 205, 42, 95, '#120206');
  rect(wallX + 1, 212, 34, 88, '#24030b');
  rect(wallX + 5, 220, 26, 78, '#420614');

  // Pulsing rift portal glow
  const coreAlpha = 0.55 + Math.sin(game.time * 6) * 0.25;
  ctx.globalAlpha = coreAlpha;
  rect(wallX + 8, 228, 20, 68, '#881337');
  rect(wallX + 12, 238, 12, 50, '#e11d48');
  ctx.globalAlpha = 1.0;

  // 3. Stranger Things Creeping Vines & Fleshy Tendrils
  const vineDark = '#4c0519';
  const vineMid = '#881337';
  const vineBright = '#e11d48';

  // Leftward creeping vines stretching out across the road towards the player!
  line([[wallX + 8, 285], [wallX - 18, 292], [wallX - 45, 298], [wallX - 90, 301]], vineDark, 4);
  line([[wallX - 18, 292], [wallX - 38, 286], [wallX - 65, 288]], vineMid, 2);
  line([[wallX + 10, 275], [wallX - 14, 278], [wallX - 35, 283], [wallX - 70, 295]], vineMid, 3);
  line([[wallX - 35, 283], [wallX - 55, 280], [wallX - 95, 291]], vineBright, 2);
  line([[wallX + 12, 296], [wallX - 25, 300], [wallX - 60, 302]], vineDark, 3);

  // Upward climbing vines wrapping the wall
  line([[wallX + 6, 215], [wallX - 8, 190], [wallX + 4, 165], [wallX - 6, 138]], vineDark, 4);
  line([[wallX - 8, 190], [wallX + 18, 175], [wallX + 14, 148]], vineMid, 2);
  line([[wallX + 30, 212], [wallX + 42, 185], [wallX + 34, 160], [wallX + 45, 130]], vineDark, 3);
  line([[wallX + 42, 185], [wallX + 24, 168]], vineMid, 2);

  // Jagged organic perimeter of the hole
  line([[wallX - 4, 208], [wallX + 18, 202 + pulse], [wallX + 40, 210]], vineBright, 3);
  line([[wallX - 4, 208], [wallX - 6, 252], [wallX - 3, 298]], vineMid, 3);
  line([[wallX + 40, 210], [wallX + 42, 252], [wallX + 38, 298]], vineMid, 3);

  // Spores & pulsing organic nodes
  for (let n = 0; n < 8; n++) {
    const nx = wallX - 22 + (n * 13) % 52;
    const ny = 215 + (n * 17) % 80;
    rect(nx, ny, 3 + (n % 2), 3 + (n % 2), n % 2 === 0 ? '#f43f5e' : '#991b1b');
  }

  // Floating crimson spore dust around the breach
  for (let s = 0; s < 10; s++) {
    const sx = wallX - 40 + ((s * 23 + game.time * 20) % 95);
    const sy = 205 + ((s * 19 + game.time * 12) % 90);
    rect(sx, sy, 1, 1, '#fecdd3');
  }
}

function cyclist(index, x, y) {
  bike(x, y, index === 0 ? colors[3] : colors[index - 1], false, game.cycleTime * 18);
}

function emptyBike(index, x, y, tilt) {
  bike(x, y, colors[index - 1], Math.max(0.001, tilt));
}

function render() {
  ctx.globalAlpha = 1;
  ctx.clearRect(0, 0, 640, 360);
  const state = game.state, dark = ['dark', 'dead', 'win'].includes(state), camera = Math.round(game.camera);
  const lvl = game.level || 1;
  const cfg = game.currentConfig();

  background(dark);
  const scene = game.openingVisuals();

  if (!dark && game.disturbed) {
    ctx.globalAlpha = 0.52; rect(0, 0, 640, 360, '#310916');
    ctx.globalAlpha = 0.22; rect(0, 0, 640, 360, '#b12d40');
    ctx.globalAlpha = 1;
  }

  if (dark) {
    vines(1600 - camera, 480);

    // Echo anchors
    const echoCol = lvl === 3 ? '#f43f5e' : lvl === 2 ? '#fbbf24' : '#a9e1d1';
    const activeAnchors = game.getAnchors();
    for (let index = 0; index < 3; index++) {
      const anchor = activeAnchors[index];
      const active = index < game.echoes;
      const x = anchor.x - camera;
      if (active) {
        rect(x, anchor.y, anchor.w, 5, echoCol);
        rect(x + 3, anchor.y + 5, anchor.w - 6, 7, lvl === 3 ? '#5c1020' : lvl === 2 ? '#543010' : '#486d70');
        for (let block = 0; block < 7; block++) {
          rect(x + block * 13, anchor.y + 12, 9, 3, lvl === 3 ? '#360912' : lvl === 2 ? '#3b220b' : '#33505c');
        }
      } else {
        for (let dot = 0; dot < anchor.w; dot += 9) rect(x + dot, anchor.y, 4, 1, '#6c7a80');
        text('ECHO ' + (index + 1), x + 18, anchor.y - 8, '#b0aaa1', 7);
      }
    }

    // Solid stepping ledges
    for (const block of game.getSolids().slice(2)) {
      rect(block.x - camera, block.y, block.w, 6, lvl === 3 ? '#882233' : lvl === 2 ? '#885522' : '#718b8c');
      rect(block.x - camera + 4, block.y + 6, block.w - 8, 12, lvl === 3 ? '#4d121c' : lvl === 2 ? '#452a12' : '#3f5865');
    }

    // Spikes (Dynamic per level)
    const spikeCol = lvl === 3 ? '#ef4444' : lvl === 2 ? '#f59e0b' : '#b05e65';
    for (const spike of game.getSpikes()) {
      for (let offset = 0; offset < spike.w; offset += 9) {
        rect(spike.x - camera + offset, 291, 8, 9, spikeCol);
        rect(spike.x - camera + offset + 2, 285, 4, 6, '#fecdd3');
      }
    }

    // Stalkers (Dynamic per level: 1 on L1, 2 on L2 & L3)
    for (const s of game.getStalkers()) {
      const sx = s.baseX + Math.sin(game.time * s.speed) * s.range - camera;
      monster(sx, 300, 0.42);
    }

    // Level Exit Doorway
    rect(2770 - camera, 208, 64, 92, '#121f2a');
    const doorCol = lvl === 3 ? '#f43f5e' : lvl === 2 ? '#fbbf24' : '#b7d9ba';
    rect(2770 - camera, 208, 5, 92, doorCol);
    rect(2829 - camera, 208, 5, 92, doorCol);
    rect(2770 - camera, 208, 64, 5, doorCol);
    text(lvl === 3 ? 'RESCUE ALL' : 'EXIT TO NEXT', 2772 - camera, 201, doorCol, 7);

    // Friends waiting inside or near exit
    for (let index = 0; index < 3; index++) {
      rider(2785 + index * 15 - camera, 285, colors[index], 0);
    }

    // Checkpoint flag
    text('CHECKPOINT', 2114 - camera, 247, doorCol, 7);
    rect(2140 - camera, 261, 3, 39, '#86acaa');
    rect(2143 - camera, 261, 16, 10, doorCol);

    // Player Sam
    if (state !== 'dead') {
      rider(game.x - camera, game.y - 12, colors[3], game.onGround ? game.x * 0.2 : 0);
    } else {
      for (let index = 0; index < 16; index++) {
        rect(game.x - camera + Math.sin(index * 2) * game.phaseTime * 60, game.y - 15 + Math.cos(index * 2) * game.phaseTime * 50, 3, 3, echoCol);
      }
    }

    if (game.phaseTime < 1.4 && state === 'dark') {
      ctx.globalAlpha = Math.max(0, 0.6 - game.phaseTime * 0.5);
      rect(0, 0, 640, 360, '#000');
      ctx.globalAlpha = 1;
    }
  } else {
    // Opening ride phase: Stranger Things Infected Wall with Ruptured Breach
    drawInfectedWall(camera, state);
    if (scene.monster) {
      ctx.globalAlpha = scene.monster;
      monster(game.abductionX + 190 - camera, 290, 1.75);
      ctx.globalAlpha = 1;
    }
    if (scene.riders === 4) {
      for (let index = 3; index >= 1; index--) cyclist(index, game.x + index * 60 - camera, 300);
    }
    if (scene.emptyBikes) {
      for (let index = 1; index < 4; index++) emptyBike(index, game.abductionX + index * 60 - camera, 300, scene.bikeTilt);
    }
    if (state !== 'blackout') cyclist(0, game.x - camera, game.y);
    if (scene.flash) {
      ctx.globalAlpha = scene.flash * (ui.gentle.checked ? 0.36 : 1);
      rect(0, 0, 640, 360, state === 'vanish' ? '#ffe4d5' : '#f34550');
      ctx.globalAlpha = 1;
    }
    if (state === 'blackout') rect(0, 0, 640, 360, '#05090f');
    if (state === 'fall') {
      ctx.globalAlpha = Math.min(1, Math.max(0, (game.phaseTime - 0.7) / 0.7));
      rect(0, 0, 640, 360, '#05090f');
      ctx.globalAlpha = 1;
    }
  }

  // Top Left Echo Counter
  if (state === 'dark' || state === 'dead') {
    rect(16, 16, 95, 24, '#11212c');
    text('ECHOES', 24, 32, '#bbc5bf');
    const echoCol = lvl === 3 ? '#f43f5e' : lvl === 2 ? '#fbbf24' : '#b1dfcc';
    for (let index = 0; index < 3; index++) {
      rect(67 + index * 12, 25, 7, 7, index < game.echoes ? echoCol : '#415760');
    }
  }
}

function syncUI() {
  const state = game.state, dark = ['dark', 'dead', 'win'].includes(state);
  const lvl = game.level || 1;

  ui.menu.classList.toggle('hidden', state !== 'title');
  ui['pause-menu'].classList.toggle('hidden', !game.paused);
  ui['win-menu'].classList.toggle('hidden', state !== 'win');

  if (dark) {
    ui.chapter.textContent = lvl === 3 ? '03 / THE WATER TOWER CORE' : lvl === 2 ? '02 / THE POWER SUBSTATION' : '01 / THE SAME STREET. SOMETHING ELSE.';
  } else {
    ui.chapter.textContent = '01 / THE LAST GOOD EVENING';
  }

  ui.counter.textContent = dark ? `${game.echoes}/3 ECHOES · ${game.deaths} FALLS` : 'FOUR FRIENDS · ONE ROAD';

  let message = game.openingVisuals().dialogue;
  if (!message) {
    if (state === 'blackout') message = 'Somewhere beneath the same town…';
    else if (state === 'dead') message = game.echoes < 3 ? `Your fall left Echo ${game.echoes}. A memory you can stand on.` : 'All Echoes remain. Keep your footing.';
    else if (state === 'dark') {
      if (game.phaseTime < 4 && game.checkpoint === 1040) {
        if (lvl === 1) message = "Same street… but frozen. Lucas's walkie-talkie crackles: 'Sam! Can you hear me?'";
        else if (lvl === 2) message = "Industrial generator hum… Lucas: 'Sam! Maya and Ben were pulled to the water tower!'";
        else message = "The rift core is pulsing above! Free your friends!";
      } else if (game.x > 1410 && game.x < 1650) {
        message = "Lucas on radio: 'The gap is wide! Use your Echoes to cross!'";
      } else if (game.x > 2110 && game.x < 2280) {
        message = "Lucas: 'Checkpoint reached! Watch for the shadow stalkers ahead!'";
      } else if (game.x > 2550) {
        message = lvl === 3 ? "Lucas: 'The core beacon is open! Jump in to break the rift!'" : "Lucas: 'Doorway ahead! Head to the next sector!'";
      }
    }
  }

  ui.dialogue.textContent = message || '';
  ui.dialogue.classList.toggle('hidden', !message);

  ui.objective.textContent = dark
    ? (lvl === 3 ? 'LEVEL 3: REACH THE RIFT APEX · TIMED STALKERS ACTIVE' : lvl === 2 ? 'LEVEL 2: NAVIGATE HIGH VOLTAGE CORRIDORS' : 'A / D  MOVE · SPACE  JUMP · R  LEAVE AN ECHO')
    : state === 'thought' ? 'FIND YOUR FRIENDS' : state === 'fall' ? 'A / D — STEER THROUGH THE FALL' : 'HOLD D / → TO RIDE TOGETHER';

  if (state === 'dark' && game.x > 1410 && game.x < 2100) ui.objective.textContent = 'THE GAP IS TOO WIDE. FALL OR PRESS R TO BUILD AN ECHO.';
  if (['disturbance', 'reveal', 'vanish', 'upright', 'topple', 'thought', 'resolve'].includes(state)) ui.objective.textContent = 'SOMETHING IS WRONG…';

  // Multi-Level Win Screen Dialogue & Progression
  if (state === 'win') {
    if (lvl === 1) {
      ui.result.innerHTML = `<strong>CHAPTER 01 COMPLETE: THE RIFT CROSSED</strong><br><br>${game.deaths} falls. ${game.echoes} Echoes.<br><br>You reach the transit shelter and find Lucas safe.<br>He points down the tracks: <em>"Maya and Ben are trapped in the high-voltage substation! We have to hurry!"</em>`;
      replayBtn.textContent = 'ENTER CHAPTER 02: THE SUBSTATION ↗';
      replayBtn.onclick = () => { game.startLevel(2); syncUI(); };
    } else if (lvl === 2) {
      ui.result.innerHTML = `<strong>CHAPTER 02 COMPLETE: SUBSTATION CLEARED</strong><br><br>${game.deaths} falls. ${game.echoes} Echoes.<br><br>You pull Ben out of the generator room.<br>He looks up at the crimson sky: <em>"Maya is at the very top of the Old Water Tower... that's where the rift is anchored!"</em>`;
      replayBtn.textContent = 'ENTER CHAPTER 03: WATER TOWER APEX ↗';
      replayBtn.onclick = () => { game.startLevel(3); syncUI(); };
    } else {
      ui.result.innerHTML = `<strong>CAMPAIGN COMPLETE: THE CIRCLE RESTORED</strong><br><br>${game.deaths} total falls. All 3 sectors conquered.<br><br>You shatter the cosmic rift anchor. Lucas, Maya, and Ben break free.<br>The nightmare dissolves into golden morning light.<br><strong>Four friends ride home together.</strong>`;
      replayBtn.textContent = 'PLAY AGAIN FROM CHAPTER 01 ↗';
      replayBtn.onclick = () => { game.start(); syncUI(); };
    }
  }

  if (lastState !== state) {
    if (state === 'disturbance') tone(55, 1.6, 'sawtooth', 0.025);
    if (state === 'reveal') tone(65, 2, 'sawtooth', 0.035);
    if (state === 'vanish') tone(90, 0.7, 'sawtooth');
    if (state === 'dead') tone(110, 0.45, 'triangle');
    if (state === 'win') {
      tone(330, 0.6);
      setTimeout(() => tone(440, 0.7), 180);
      if (lvl === 3) setTimeout(() => tone(554, 0.9), 360);
    }
    lastState = state;
  }
}

function start() {
  keys.clear(); pressed.clear(); audioBeat = 0;
  game.start();
  canvas.focus();
  tone(330, 0.2);
  syncUI();
}

function pause(force) {
  if (['title', 'win'].includes(game.state)) return;
  game.paused = force ?? !game.paused;
  keys.clear(); pressed.clear();
  syncUI();
  if (!game.paused) canvas.focus();
}

document.getElementById('start').onclick = start;
document.getElementById('restart').onclick = () => { game.startLevel(game.level || 1); syncUI(); };
document.getElementById('pause').onclick = () => pause();
document.getElementById('resume').onclick = () => pause(false);

ui.sound.onclick = () => {
  soundOn = !soundOn;
  ui.sound.textContent = soundOn ? 'SOUND ON' : 'SOUND OFF';
  ui.sound.setAttribute('aria-pressed', String(soundOn));
  tone(440);
  canvas.focus();
};

window.addEventListener('keydown', event => {
  if (event.target.matches('button,input,a')) return;
  if (['ArrowLeft','ArrowRight','ArrowUp','Space','KeyA','KeyD','KeyW','KeyR','Escape','Enter'].includes(event.code)) event.preventDefault();
  if (event.code === 'Escape' && !event.repeat) pause();
  if (event.code === 'Enter') {
    if (game.state === 'title') start();
    else if (game.state === 'win') {
      if (game.level === 1) game.startLevel(2);
      else if (game.level === 2) game.startLevel(3);
      else game.start();
      syncUI();
    }
  }
  keys.add(event.code);
  if (!event.repeat) pressed.add(event.code);
});

window.addEventListener('keyup', event => keys.delete(event.code));
window.addEventListener('blur', () => { keys.clear(); pause(true); });
document.addEventListener('visibilitychange', () => { if (document.hidden) pause(true); });

for (const button of document.querySelectorAll('[data-key]')) {
  button.onpointerdown = event => {
    event.preventDefault();
    button.setPointerCapture(event.pointerId);
    keys.add(button.dataset.key);
    pressed.add(button.dataset.key);
  };
  button.onpointerup = button.onpointercancel = () => keys.delete(button.dataset.key);
  button.onlostpointercapture = () => keys.delete(button.dataset.key);
}

function frame(now) {
  const dt = lastTime ? Math.min((now - lastTime) / 1000, 0.033) : 0;
  lastTime = now;
  game.step(dt, {
    right: keys.has('KeyD') || keys.has('ArrowRight'),
    left: keys.has('KeyA') || keys.has('ArrowLeft'),
    jump: ['Space','ArrowUp','KeyW'].some(key => keys.has(key) || pressed.has(key)),
    retry: keys.has('KeyR') || pressed.has('KeyR')
  });
  pressed.clear();

  if (game.event === 'jump') tone(260, 0.08, 'square', 0.012);
  if (!game.paused && game.state === 'ride' && game.rideTime > audioBeat) {
    audioBeat = game.rideTime + 0.4;
    tone([220, 277, 330, 277][Math.floor(game.rideTime * 2.5) % 4], 0.13, 'triangle', 0.015);
  }

  render();
  syncUI();
  requestAnimationFrame(frame);
}

if (new URLSearchParams(location.search).has('test')) window.echoTest = {game, render, syncUI};
requestAnimationFrame(frame);
