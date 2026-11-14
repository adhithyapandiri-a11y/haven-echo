'use strict';
const canvas=document.getElementById('game'), ctx=canvas.getContext('2d',{alpha:false});
ctx.imageSmoothingEnabled=false;
const game=new EchoGame(), keys=new Set(), pressed=new Set();
const ui=Object.fromEntries(['menu','pause-menu','win-menu','dialogue','chapter','counter','objective','result','gentle','sound'].map(id=>[id,document.getElementById(id)]));
const colors=['#8671b6','#439264','#c4a047','#c99a8b'];
const sprites={riders:new Image(),shadow:new Image(),bikes:new Image()};
sprites.riders.src='assets/riders.png';sprites.shadow.src='assets/shadow.png';sprites.bikes.src='assets/empty-bikes.png';
let soundOn=false,audioContext,lastTime=0,lastState='',audioBeat=0;
const townArt=new Image();
let darkTownArt=null;
townArt.onload=()=>{
  darkTownArt=document.createElement('canvas');
  darkTownArt.width=townArt.width;darkTownArt.height=townArt.height;
  const painter=darkTownArt.getContext('2d');
  painter.filter='grayscale(0.7) brightness(0.48)';
  painter.drawImage(townArt,0,0);
  painter.filter='none';painter.globalCompositeOperation='source-atop';
  painter.fillStyle='#18344466';painter.fillRect(0,0,townArt.width,townArt.height);
};
townArt.src='assets/town-sunset.png';
const rect=(x,y,width,height,color)=>{ctx.fillStyle=color;ctx.fillRect(Math.round(x),Math.round(y),width,height);};
function line(points,color,width=1) {
  for(let index=1;index<points.length;index++) {
    let x=Math.round(points[index-1][0]),y=Math.round(points[index-1][1]);
    const endX=Math.round(points[index][0]),endY=Math.round(points[index][1]),dx=Math.abs(endX-x),dy=-Math.abs(endY-y),stepX=x<endX?1:-1,stepY=y<endY?1:-1;
    let error=dx+dy;
    for(;;){rect(x-Math.floor(width/2),y-Math.floor(width/2),width,width,color);if(x===endX&&y===endY)break;const doubled=error*2;if(doubled>=dy){error+=dy;x+=stepX;}if(doubled<=dx){error+=dx;y+=stepY;}}
  }
}
function text(value,x,y,color='#f6e7ba',size=8) {ctx.fillStyle=color;ctx.font=`${size}px monospace`;ctx.fillText(value,Math.round(x),Math.round(y));}
function tone(frequency,duration=.12,type='triangle',volume=.025) {
  if(!soundOn)return;
  try { audioContext??=new (window.AudioContext||window.webkitAudioContext)(); audioContext.resume();const oscillator=audioContext.createOscillator(),gain=audioContext.createGain();oscillator.type=type;oscillator.frequency.value=frequency;gain.gain.setValueAtTime(volume,audioContext.currentTime);gain.gain.exponentialRampToValueAtTime(.001,audioContext.currentTime+duration);oscillator.connect(gain);gain.connect(audioContext.destination);oscillator.start();oscillator.stop(audioContext.currentTime+duration); } catch { soundOn=false; }
}
function bike(x,y,color,fallen=false,pedal=0) {
  ctx.save();ctx.translate(Math.round(x),Math.round(y));if(fallen){ctx.scale(1,1-.65*fallen);ctx.translate(0,9*fallen);}
  for(const wheel of [-12,12]) {rect(wheel-6,-12,12,2,'#203340');rect(wheel-8,-10,2,9,'#203340');rect(wheel+6,-10,2,9,'#203340');rect(wheel-6,-1,12,2,'#203340');rect(wheel-5,-9,10,8,'#bbc5b3');rect(wheel-1,-8,2,7,'#586574');}
  line([[-12,-6],[-5,-18],[3,-6],[-12,-6]],color,2);line([[3,-6],[12,-6],[6,-23],[12,-24]],color,2);line([[-5,-18],[9,-18]],color,2);rect(-9,-22,8,3,'#273443');
  if(!fallen) rider(0,-19,color,pedal,true);ctx.restore();
}
function rider(x,y,color,phase=0,cycling=false) {
  const leg=Math.round(Math.sin(phase)*3);
  rect(x-5,y-24,10,3,'#263348');rect(x-6,y-21,11,7,'#263348');rect(x-3,y-20,8,8,'#eec39b');rect(x+4,y-18,2,4,'#eec39b');rect(x+3,y-19,1,1,'#293242');rect(x-5,y-12,10,12,color);rect(x-6,y-10,3,8,color);rect(x+3,y-10,3,8,color);
  if(color===colors[3]){for(let stripe=0;stripe<3;stripe++)rect(x-5,y-11+stripe*4,9,2,'#f0dcc0');rect(x-8,y-11,3,10,'#783641');}
  if(cycling){line([[x-2,y],[x+4,y+3+leg],[x-1,y+10+leg]],'#39455b',3);line([[x+3,y-8],[x+9,y-3],[x+12,y-4]],'#eec39b',2);}else{rect(x-4,y,3,10+leg,'#6d7f99');rect(x+1,y,3,10-leg,'#53667e');rect(x-5,y+9+leg,5,3,'#e4d0a4');rect(x+1,y+9-leg,5,3,'#e4d0a4');}
}
function tree(x,y,dark,variant) {
  rect(x-4,y-57,8,57,dark?'#38333d':'#71594a');line([[x,y-27],[x-18,y-47]],dark?'#56323c':'#71594a',4);
  const foliage=dark?['#263b40','#31464a','#3f4a44']:['#74965c','#91ab66','#b6ba70'];
  for(let layer=0;layer<4;layer++){const width=48-layer*9;rect(x-width/2,y-54-layer*11,width,21,foliage[layer%3]);rect(x-width/2+5,y-59-layer*11,width-10,7,foliage[(layer+1)%3]);}
  if(dark)line([[x-4,y],[x+5,y-25],[x-3,y-39],[x+9,y-64]],'#a14a51',2);
}
function building(x,index,dark) {
  const widths=[104,86,120,94],heights=[104,132,92,115],width=widths[index%4],height=heights[index%4],top=272-height;
  const paint=dark?['#334553','#3c424b','#374e52','#42464a']:['#d5b887','#ba9882','#a4b9a4','#b6b9b5'];
  rect(x+4,top-10,width-8,10,dark?'#28353e':'#7c7169');rect(x,top,width,height,paint[index%4]);rect(x-3,top,width+6,5,dark?'#5f6260':'#eee1b8');rect(x+width-8,top+5,8,height-5,dark?'#2a3541':'#9e927e');
  for(let row=0;row<2;row++)for(let col=0;col<3;col++) {
    const wx=x+12+col*(width-26)/3,wy=top+17+row*29;
    rect(wx-2,wy-2,17,22,dark?'#607074':'#f0dec0');rect(wx,wy,13,18,dark?'#172b3b':'#527d87');rect(wx+6,wy,1,18,dark?'#485764':'#b1d0c3');rect(wx,wy+9,13,1,dark?'#485764':'#b1d0c3');
    if(!dark)rect(wx+2,wy+2,3,6,'#9fc4bf');else if((index+col)%3===0)rect(wx+3,wy+12,7,2,'#b65e60');
  }
  rect(x+7,246,width-15,10,dark?'#5b4649':'#ba6c52');text(['RECORDS','OAK & PINE','CORNER STORE','VIDEO CLUB'][index%4],x+10,253,dark?'#be8b80':'#fff1bd',6);
  rect(x+width/2-7,259,14,23,dark?'#162b35':'#547e7b');rect(x+width/2+3,270,2,2,'#dbc18a');
  for(let mark=0;mark<12;mark++) rect(x+8+(mark*23)%(width-18),top+8+(mark*17)%Math.max(8,height-40),4,1,dark?'#526068':'#b19f80');
  if(dark) {line([[x+5,283],[x+18,257],[x+12,231],[x+30,214],[x+26,top+3]],'#713d4b',3);line([[x+18,257],[x+39,247],[x+48,224]],'#a35057',2);}
}
function background(dark) {
  if(townArt.complete&&townArt.naturalWidth&&(!dark||darkTownArt)) {
    const art=dark?darkTownArt:townArt,width=townArt.naturalWidth;
    const offset=Math.round(game.camera)%width;
    ctx.drawImage(art,-offset,0);
    if(width-offset<640)ctx.drawImage(art,width-offset,0);
    if(dark){
      for(let index=0;index<30;index++){
        const x=index*127-Math.round(game.camera);
        if(x < -40 || x > 680)continue;
        line([[x,289],[x+12,267],[x+3,247],[x+20,224],[x+16,196]],'#793b4c',3);
        line([[x+12,267],[x+30,255],[x+36,234]],'#ac5261',2);
        rect(x+19,223,3,3,'#df8b82');
      }
      for(let index=0;index<40;index++){
        const x=((index*79-game.camera*.7+Math.sin(game.time*.3+index)*12)%660+660)%660;
        rect(x,(index*37+game.time*(3+index%4))%360,1+index%2,1,'#9c7c76');
      }
    }
    return;
  }
  rect(0,0,640,360,dark?'#152635':'#a6c6bd');
  rect(0,80,640,55,dark?'#26313d':'#c3d1b5');rect(0,135,640,70,dark?'#35404a':'#e4d4a9');
  rect(488-game.camera*.06,36,31,31,dark?'#9e6b6b':'#f5e3ad');rect(483-game.camera*.06,42,41,19,dark?'#9e6b6b':'#f5e3ad');
  for(let index=0;index<10;index++){const x=((index*139-game.camera*.13)%800+800)%800-80;rect(x,34+index%3*24,47,7,dark?'#3b4049':'#e7dfbd');rect(x+10,28+index%3*24,25,8,dark?'#3b4049':'#eee4c4');}
  for(let index=0;index<25;index++){const x=index*71-Math.round(game.camera*.35)%71-70;rect(x,154-index%4*12,59,97,dark?'#2a3c46':'#88a59d');rect(x+7,145-index%4*12,42,12,dark?'#2a3c46':'#88a59d');}
  for(let index=0;index<25;index++){const x=index*150-game.camera; if(x>-180&&x<700){building(x,index,dark);tree(x+132,282,dark,index);}}
  line([[-10,113],[200,135],[420,120],[650,134]],dark?'#29323e':'#737b70');
  for(let index=0;index<12;index++){const x=index*340-game.camera;rect(x,134,3,150,dark?'#51616a':'#697778');rect(x-6,130,15,6,dark?'#374a54':'#697778');rect(x-3,136,9,8,dark?'#c29375':'#f7deb0');}
  rect(0,282,640,12,dark?'#687173':'#d7c6a7');rect(0,294,640,6,dark?'#394957':'#8e9e95');rect(0,300,640,60,dark?'#27353f':'#667a7d');
  for(let index=0;index<40;index++){const x=index*100-Math.round(game.camera);rect(x,327,37,3,dark?'#676060':'#d3cba8');rect(x+42,287,1,6,dark?'#404e55':'#9b9e8a');rect(x+13,345,17,1,dark?'#384952':'#82908b');}
  rect(0,355,640,5,dark?'#1c2b36':'#536c70');
  if(dark)for(let index=0;index<40;index++){const x=((index*79-game.camera*.7+Math.sin(game.time*.3+index)*12)%660+660)%660;rect(x,(index*37+game.time*(3+index%4))%360,1+index%2,1,'#9c7c76');}
}
function vines(x,width) {
  rect(x,294,width,66,'#101b28');rect(x+4,301,width-8,59,'#0b1420');
  for(let index=0;index<width;index+=13) {rect(x+index,293+index%5,9,5,'#773c4c');rect(x+index+2,297,3,10+index%17,'#ab5157');}
  for(const edge of [x,x+width]){line([[edge-20,310],[edge-10,299],[edge-17,283],[edge-4,269]],'#983e4e',3);line([[edge+20,322],[edge+7,309],[edge+14,291],[edge+7,278]],'#bd5b5d',2);}
}
function monster(x,y,scale=1) {
  ctx.save();ctx.translate(Math.round(x),Math.round(y));ctx.scale(scale,scale);
  const black='#131b29';rect(-13,-63,26,38,black);rect(-9,-79,19,20,black);rect(-17,-83,7,9,black);rect(9,-90,5,22,black);
  line([[-10,-54],[-29,-41],[-37,-8]],black,7);line([[12,-56],[28,-37],[38,-22],[32,-8]],black,6);line([[-7,-27],[-13,-5],[-24,0]],black,8);line([[7,-27],[12,-9],[20,0]],black,8);rect(-4,-71,3,2,'#d99782');rect(4,-71,3,2,'#d99782');ctx.restore();
}
function cyclist(index,x,y) {
  if(sprites.riders.complete&&sprites.riders.naturalWidth){
    const frame=Math.floor(game.cycleTime*8)%48;
    ctx.drawImage(sprites.riders,frame*54,index*72,54,72,Math.round(x)-27,Math.round(y)-72,54,72);
  }else bike(x,y,index===0?colors[3]:colors[index-1],false,game.cycleTime*18);
}
function emptyBike(index,x,y,tilt) {
  if(!sprites.bikes.complete||!sprites.bikes.naturalWidth){bike(x,y,colors[index-1],Math.max(.001,tilt));return;}
  ctx.save();ctx.translate(Math.round(x),Math.round(y));
  const height=Math.round(38*(1-tilt*.78));
  ctx.drawImage(sprites.bikes,index*54,0,54,38,-27+Math.round(tilt*7),-height,54,height);
  ctx.restore();
}
function render() {
  const state=game.state,dark=['dark','dead','win'].includes(state),camera=Math.round(game.camera);
  background(dark);
  const scene=game.openingVisuals();
  if(!dark&&game.disturbed){ctx.globalAlpha=.52;rect(0,0,640,360,'#310916');ctx.globalAlpha=.22;rect(0,0,640,360,'#b12d40');ctx.globalAlpha=1;}
  if(dark) {
    vines(1600-camera,480);
    for(let index=0;index<3;index++){const anchor=EchoGame.anchors[index],active=index<game.echoes,x=anchor.x-camera;
      if(active){rect(x,anchor.y,anchor.w,5,'#a9e1d1');rect(x+3,anchor.y+5,anchor.w-6,7,'#486d70');for(let block=0;block<7;block++)rect(x+block*13,anchor.y+12,9,3,'#33505c');}
      else {for(let dot=0;dot<anchor.w;dot+=9)rect(x+dot,anchor.y,4,1,'#6c7a80');text('ECHO '+(index+1),x+20,anchor.y-8,'#b0aaa1',7);}}
    for(const block of EchoGame.solids.slice(2)){rect(block.x-camera,block.y,block.w,6,'#718b8c');rect(block.x-camera+4,block.y+6,block.w-8,12,'#3f5865');}
    for(const spike of [{x:1320,w:42},{x:2200,w:40},{x:2520,w:45}])for(let offset=0;offset<spike.w;offset+=9){rect(spike.x-camera+offset,291,8,9,'#b05e65');rect(spike.x-camera+offset+2,285,4,6,'#dda08d');}
    monster(2370+Math.sin(game.time*1.3)*40-camera,300,.42);
    rect(2770-camera,208,64,92,'#121f2a');rect(2770-camera,208,5,92,'#b7d9ba');rect(2829-camera,208,5,92,'#b7d9ba');rect(2770-camera,208,64,5,'#b7d9ba');text('COME BACK',2774-camera,201,'#c3debc');
    for(let index=0;index<3;index++)rider(2785+index*15-camera,285,colors[index],0);
    text('OAK STREET',1020-camera,236,'#c5b69a');text('EVERY FALL LEAVES A WAY FORWARD',1430-camera,203,'#c6c2ae',7);
    text('CHECKPOINT',2114-camera,247,'#b8d9c0',7);rect(2140-camera,261,3,39,'#86acaa');rect(2143-camera,261,16,10,'#bbcfab');
    if(state!=='dead')rider(game.x-camera,game.y-12,colors[3],game.onGround?game.x*.2:0);
    else {for(let index=0;index<16;index++)rect(game.x-camera+Math.sin(index*2)*game.phaseTime*60,game.y-15+Math.cos(index*2)*game.phaseTime*50,3,3,'#b3ddd1');}
    if(game.phaseTime<1.4&&state==='dark'){ctx.globalAlpha=Math.max(0,.6-game.phaseTime*.5);rect(0,0,640,360,'#000');ctx.globalAlpha=1;}
  } else {
    if(['approach','fall','blackout'].includes(state)){
      const growth=Math.max(0,Math.min(1,(game.x-900)/140));
      if(growth>0){line([[1040-camera,303],[1075-camera,297],[1095-camera,310],[1140-camera,299],[1180-camera,306]],'#c36b68',2);vines(1060-camera,Math.max(1,Math.round(135*growth)));}
    }
    if(scene.monster){
      ctx.globalAlpha=scene.monster;
      if(sprites.shadow.complete&&sprites.shadow.naturalWidth)ctx.drawImage(sprites.shadow,Math.round(game.abductionX+105-camera),130,174,160);
      else monster(game.abductionX+190-camera,290,1.75);
      ctx.globalAlpha=1;
    }
    if(scene.riders===4)for(let index=3;index>=1;index--)cyclist(index,game.x+index*60-camera,300);
    if(scene.emptyBikes)for(let index=1;index<4;index++)emptyBike(index,game.abductionX+index*60-camera,300,scene.bikeTilt);
    if(state!=='blackout')cyclist(0,game.x-camera,game.y);
    if(scene.flash){ctx.globalAlpha=scene.flash*(ui.gentle.checked?.36:1);rect(0,0,640,360,state==='vanish'?'#ffe4d5':'#f34550');ctx.globalAlpha=1;}
    if(state==='blackout')rect(0,0,640,360,'#05090f');
    if(state==='fall'){ctx.globalAlpha=Math.min(1,Math.max(0,(game.phaseTime-.7)/.7));rect(0,0,640,360,'#05090f');ctx.globalAlpha=1;}
  }
  if(state==='dark'||state==='dead'){rect(16,16,95,24,'#11212c');text('ECHOES',24,32,'#bbc5bf');for(let index=0;index<3;index++)rect(67+index*12,25,7,7,index<game.echoes?'#b1dfcc':'#415760');}
}
function syncUI() {
  const state=game.state,dark=['dark','dead','win'].includes(state);
  ui.menu.classList.toggle('hidden',state!=='title');ui['pause-menu'].classList.toggle('hidden',!game.paused);ui['win-menu'].classList.toggle('hidden',state!=='win');
  ui.chapter.textContent=dark?'02 / THE SAME STREET. SOMETHING ELSE.':'01 / THE LAST GOOD EVENING';
  ui.counter.textContent=dark?`${game.echoes}/3 ECHOES · ${game.deaths} FALLS`:'FOUR FRIENDS · ONE ROAD';
  const message=game.openingVisuals().dialogue||(state==='blackout'?'Somewhere beneath the same town…':state==='dead'?(game.echoes<3?'Your fall left an Echo. Try again.':'The Echoes remain. So do you.'):state==='dark'&&game.phaseTime<4&&game.checkpoint===1040?'Same street… Where is everyone?':'');
  ui.dialogue.textContent=message;ui.dialogue.classList.toggle('hidden',!message);
  ui.objective.textContent=dark?'A / D  MOVE · SPACE  JUMP · R  LEAVE AN ECHO':state==='thought'?'FIND YOUR FRIENDS':state==='fall'?'A / D — STEER THROUGH THE FALL':'HOLD D / → TO RIDE TOGETHER';
  if(state==='dark'&&game.x>1410&&game.x<2100)ui.objective.textContent='THE GAP IS TOO WIDE. FALL OR PRESS R TO BUILD AN ECHO.';
  if(['disturbance','reveal','vanish','upright','topple','thought','resolve'].includes(state))ui.objective.textContent='SOMETHING IS WRONG…';
  ui.result.textContent=`${game.deaths} falls. ${game.echoes} Echoes. Four friends together again.`;
  if(lastState!==state){if(state==='disturbance')tone(55,1.6,'sawtooth',.025);if(state==='reveal')tone(65,2,'sawtooth',.035);if(state==='vanish')tone(90,.7,'sawtooth');if(state==='dead')tone(110,.45,'triangle');if(state==='win'){tone(330,.6);setTimeout(()=>tone(440,.7),180);}lastState=state;}
}
function start(){keys.clear();pressed.clear();audioBeat=0;game.start();canvas.focus();tone(330,.2);syncUI();}
function pause(force){if(['title','win'].includes(game.state))return;game.paused=force??!game.paused;keys.clear();pressed.clear();syncUI();if(!game.paused)canvas.focus();}
document.getElementById('start').onclick=start;document.getElementById('replay').onclick=start;document.getElementById('restart').onclick=start;
document.getElementById('pause').onclick=()=>pause();document.getElementById('resume').onclick=()=>pause(false);
ui.sound.onclick=()=>{soundOn=!soundOn;ui.sound.textContent=soundOn?'SOUND ON':'SOUND OFF';ui.sound.setAttribute('aria-pressed',String(soundOn));tone(440);canvas.focus();};
window.addEventListener('keydown',event=>{if(event.target.matches('button,input,a'))return;if(['ArrowLeft','ArrowRight','ArrowUp','Space','KeyA','KeyD','KeyW','KeyR','Escape','Enter'].includes(event.code))event.preventDefault();if(event.code==='Escape'&&!event.repeat)pause();if(event.code==='Enter'&&['title','win'].includes(game.state))start();keys.add(event.code);if(!event.repeat)pressed.add(event.code);});
window.addEventListener('keyup',event=>keys.delete(event.code));window.addEventListener('blur',()=>{keys.clear();pause(true);});document.addEventListener('visibilitychange',()=>{if(document.hidden)pause(true);});
for(const button of document.querySelectorAll('[data-key]')){button.onpointerdown=event=>{event.preventDefault();button.setPointerCapture(event.pointerId);keys.add(button.dataset.key);pressed.add(button.dataset.key);};button.onpointerup=button.onpointercancel=()=>keys.delete(button.dataset.key);button.onlostpointercapture=()=>keys.delete(button.dataset.key);}
function frame(now){const dt=lastTime?Math.min((now-lastTime)/1000,.033):0;lastTime=now;game.step(dt,{right:keys.has('KeyD')||keys.has('ArrowRight'),left:keys.has('KeyA')||keys.has('ArrowLeft'),jump:['Space','ArrowUp','KeyW'].some(key=>keys.has(key)||pressed.has(key)),retry:keys.has('KeyR')||pressed.has('KeyR')});pressed.clear();if(game.event==='jump')tone(260,.08,'square',.012);if(!game.paused&&game.state==='ride'&&game.rideTime>audioBeat){audioBeat=game.rideTime+.4;tone([220,277,330,277][Math.floor(game.rideTime*2.5)%4],.13,'triangle',.015);}render();syncUI();requestAnimationFrame(frame);}
if(new URLSearchParams(location.search).has('test'))window.echoTest={game,render,syncUI};
requestAnimationFrame(frame);
