const assert = require('node:assert/strict');
const EchoGame = require('../engine.js');
const game = new EchoGame();
const tick = (seconds, input = {}) => { for (let frame = 0; frame < Math.ceil(seconds * 120); frame++) game.step(1 / 120, input); };
game.start();
tick(8);
assert.equal(game.x, 140, 'Opening must wait for forward input');
tick(3, {right:true});
const frozen = {x:game.x,camera:game.camera,cycle:game.cycleTime};
tick(5);
assert.deepEqual({x:game.x,camera:game.camera,cycle:game.cycleTime},frozen,'Release stops movement, camera, and pedalling');
assert.equal(game.state, 'ride', 'Only cumulative movement advances opening');
tick(2.7, {right:true});
assert.equal(game.state, 'disturbance');
const lockedX=game.x,lockedCycle=game.cycleTime;
let flashes=0,lit=false;
while(game.state==='disturbance'){
  const flash=game.openingVisuals().flash>0;
  if(flash&&!lit)flashes++;
  lit=flash;
  assert.equal(game.openingVisuals().riders,4);
  game.step(1/120,{right:true});
}
assert.equal(flashes,2,'Exactly two red pulses');
assert.equal(game.state,'reveal');
function waitFor(state){for(let frame=0;game.state!==state&&frame<2000;frame++)game.step(1/120,{right:true});assert.equal(game.state,state);}
tick(1);
assert.equal(game.openingVisuals().monster,1);
assert.equal(game.openingVisuals().riders,4);
waitFor('vanish');assert.equal(game.openingVisuals().riders,1);assert.equal(game.openingVisuals().emptyBikes,3);
waitFor('upright');assert.equal(game.openingVisuals().bikeTilt,0);assert.equal(game.openingVisuals().monster,0);
waitFor('topple');tick(.4);assert.ok(game.openingVisuals().bikeTilt>0&&game.openingVisuals().bikeTilt<1);
waitFor('thought');assert.equal(game.openingVisuals().dialogue,'What happened?!');
waitFor('resolve');assert.equal(game.openingVisuals().dialogue,'I have to save them!');
waitFor('approach');assert.equal(game.x,lockedX);assert.equal(game.cycleTime,lockedCycle);
assert.equal(game.disturbed,true);
const stopped = game.x;
tick(2);
assert.equal(game.x, stopped);
tick(4.5, {right:true});
assert.equal(game.state, 'fall');
tick(3);
assert.equal(game.state, 'dark');
assert.equal(game.x, 1040);
assert.equal(game.disturbed,true,'Opening remains consumed after dark-world entry');
game.paused = true;
tick(1, {right:true});
assert.equal(game.x, 1040);
game.paused = false;
for (let death = 0; death < 4; death++) { tick(.01,{retry:true}); tick(.8); }
assert.equal(game.echoes, 3);
assert.equal(game.deaths, 4);
function walkTo(destination) {
  for(let frame=0;game.x<destination&&frame<3000;frame++)game.step(1/120,{right:true});
  assert.equal(game.state,'dark');
  assert.ok(game.x>=destination, `Reached ${destination}`);
}
function jumpTo(destination) {
  let landed=false;
  for(let frame=0;frame<160;frame++) {
    game.step(1/120,{right:game.x<destination,jump:true});
    if(frame>10&&game.onGround){landed=true;break;}
  }
  assert.equal(game.state,'dark', `Survived jump to ${destination}`);
  assert.ok(landed, `Landed at ${destination}`);
  game.step(1/120,{});
}
walkTo(1285);jumpTo(1395);
walkTo(1575);jumpTo(1695);
walkTo(1723);jumpTo(1835);
walkTo(1860);jumpTo(1975);
walkTo(2000);jumpTo(2120);
walkTo(2165);jumpTo(2275);
assert.equal(game.checkpoint,2140);
walkTo(2268);jumpTo(2325);
walkTo(2340);jumpTo(2445);
walkTo(2480);jumpTo(2595);
walkTo(2805);tick(.2,{right:true});
assert.equal(game.state,'win');
assert.equal(game.deaths,4,'Full level completed without unexpected deaths');
game.start();assert.equal(game.echoes,0);assert.equal(game.deaths,0);assert.equal(game.state,'ride');
game.state='dark';game.x=1700;game.y=390;game.onGround=false;tick(.4);
assert.equal(game.state,'dead');assert.equal(game.echoes,1);
console.log('PASS: input-gated opening, all story transitions, pause, Echo cap, every jump, checkpoint, rescue, replay, and fall death.');
