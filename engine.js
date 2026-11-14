(function (root) {
  'use strict';
  const anchors = [{x:1650,y:277,w:90},{x:1790,y:255,w:90},{x:1930,y:277,w:90}];
  const solids = [{x:850,y:300,w:750},{x:2080,y:300,w:1000},{x:2280,y:264,w:65},{x:2420,y:235,w:65}];
  class EchoGame {
    constructor() { this.reset(); }
    reset() {
      this.state='title'; this.time=0; this.phaseTime=0; this.rideTime=0; this.x=140; this.y=300;
      this.vx=0; this.vy=0; this.camera=0; this.echoes=0; this.deaths=0; this.checkpoint=1040;
      this.onGround=true; this.coyote=0; this.buffer=0; this.previousJump=false; this.previousRetry=false; this.paused=false; this.event='';
      this.cycleTime=0; this.disturbed=false; this.abductionX=0;
    }
    start() { this.reset(); this.state='ride'; }
    enter(state) { this.state=state; this.phaseTime=0; this.event=state; }
    die() { this.deaths++; this.echoes=Math.min(3,this.echoes+1); this.enter('dead'); }
    platforms() { return solids.concat(anchors.slice(0,this.echoes)); }
    openingVisuals() {
      const state=this.state,time=this.phaseTime;
      const together=['title','ride','disturbance','reveal'].includes(state);
      const empty=['vanish','upright','topple','thought','resolve','approach','fall'].includes(state);
      const pulse=(start)=>Math.max(0,1-Math.abs(time-start)/.15);
      return {
        riders:together?4:1,
        emptyBikes:empty?3:0,
        monster:state==='reveal'?Math.min(1,time/.55):state==='vanish'?1:0,
        flash:state==='disturbance'?Math.max(pulse(.25),pulse(.95)):state==='vanish'?Math.max(0,1-time/.24):0,
        bikeTilt:state==='topple'?Math.min(1,time/.7):['thought','resolve','approach','fall'].includes(state)?1:0,
        dialogue:state==='thought'?'What happened?!':state==='resolve'?'I have to save them!':''
      };
    }
    step(dt,input={}) {
      if(this.paused || this.state==='title' || this.state==='win') return;
      dt=Math.min(dt,1/30); this.time+=dt; this.phaseTime+=dt; this.event='';
      const jump=!!input.jump, newJump=jump&&!this.previousJump, retry=!!input.retry&&!this.previousRetry;
      this.previousJump=jump; this.previousRetry=!!input.retry;
      if(this.state==='ride') {
        if(input.right) { this.x+=95*dt; this.rideTime+=dt; this.cycleTime+=dt; }
        if(this.rideTime>=5.6&&!this.disturbed) {this.disturbed=true;this.abductionX=this.x;this.enter('disturbance');}
      } else if(this.state==='disturbance') { if(this.phaseTime>=1.6) this.enter('reveal'); }
      else if(this.state==='reveal') { if(this.phaseTime>=2.2) this.enter('vanish'); }
      else if(this.state==='vanish') { if(this.phaseTime>=.24) this.enter('upright'); }
      else if(this.state==='upright') { if(this.phaseTime>=.65) this.enter('topple'); }
      else if(this.state==='topple') { if(this.phaseTime>=.9) this.enter('thought'); }
      else if(this.state==='thought') { if(this.phaseTime>=1.8) this.enter('resolve'); }
      else if(this.state==='resolve') { if(this.phaseTime>=2) this.enter('approach'); }
      else if(this.state==='approach') { if(input.right) {this.x+=95*dt;this.cycleTime+=dt;} if(this.x>=1065) {this.vy=0;this.enter('fall');} }
      else if(this.state==='fall') { this.x+=((input.right?36:0)-(input.left?36:0))*dt; this.vy+=320*dt; this.y+=this.vy*dt; if(this.phaseTime>1.4) this.enter('blackout'); }
      else if(this.state==='blackout') { if(this.phaseTime>1.4) { this.x=1040;this.y=300;this.vx=0;this.vy=0;this.onGround=true;this.enter('dark'); } }
      else if(this.state==='dead') { if(this.phaseTime>.65) { this.x=this.checkpoint;this.y=300;this.vx=0;this.vy=0;this.onGround=true;this.enter('dark'); } }
      else if(this.state==='dark') {
        if(retry) { this.die(); return; }
        if(newJump) this.buffer=.13; else this.buffer=Math.max(0,this.buffer-dt);
        this.coyote=this.onGround?.1:Math.max(0,this.coyote-dt);
        const direction=(input.right?1:0)-(input.left?1:0);
        const target=direction*125;
        this.vx+=Math.max(-900*dt,Math.min(900*dt,target-this.vx));
        if(this.buffer>0&&this.coyote>0) { this.vy=-265;this.onGround=false;this.coyote=0;this.buffer=0;this.event='jump'; }
        if(!jump&&this.vy < -110) this.vy=-110;
        const oldY=this.y;
        this.vy+=680*dt; this.x=Math.max(960,this.x+this.vx*dt); this.y+=this.vy*dt;this.onGround=false;
        for(const platform of this.platforms()) {
          if(this.x+7>platform.x&&this.x-7<platform.x+platform.w&&oldY<=platform.y+.01&&this.y>=platform.y&&this.vy>=0) {
            this.y=platform.y;this.vy=0;this.onGround=true;
          }
        }
        const spikes=[{x:1320,w:42},{x:2200,w:40},{x:2520,w:45}];
        const stalker=2370+Math.sin(this.time*1.3)*40;
        if(this.y>405 || spikes.some(hazard=>this.x+6>hazard.x&&this.x-6<hazard.x+hazard.w&&this.y>290) || (Math.abs(this.x-stalker)<15&&this.y>278)) { this.die(); return; }
        if(this.x>2130) this.checkpoint=2140;
        if(this.x>2810) this.enter('win');
      }
      const goal=Math.max(0,this.x-200);
      if(['dark','dead','win'].includes(this.state))this.camera+=(goal-this.camera)*Math.min(1,dt*5);
      else this.camera=goal;
    }
  }
  EchoGame.anchors=anchors; EchoGame.solids=solids;
  if(typeof module!=='undefined') module.exports=EchoGame;
  root.EchoGame=EchoGame;
})(typeof window!=='undefined'?window:globalThis);
