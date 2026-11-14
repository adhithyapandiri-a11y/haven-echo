const {chromium}=require(process.env.PLAYWRIGHT_PATH || 'playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
(async()=>{
  fs.mkdirSync('build/browser-checks',{recursive:true});
  const browser=await chromium.launch({channel:'chrome',headless:true});
  try {
    const page=await browser.newPage({viewport:{width:1440,height:1000}});
    const errors=[];page.on('pageerror',error=>errors.push(error.message));
    await page.goto('http://127.0.0.1:8061/?test');
    await page.waitForFunction(()=>Object.values(sprites).every(sprite=>sprite.complete&&sprite.naturalWidth));
    await page.screenshot({path:'build/browser-checks/title.png'});
    await page.click('#start');
    await page.waitForTimeout(300);
    assert.equal(await page.evaluate(()=>echoTest.game.x),140);
    await page.keyboard.down('KeyD');await page.waitForTimeout(1800);await page.keyboard.up('KeyD');
    const stopped=await page.evaluate(()=>echoTest.game.x);
    const stoppedArt=await page.evaluate(()=>({cycle:echoTest.game.cycleTime,camera:echoTest.game.camera}));
    await page.waitForTimeout(300);assert.equal(await page.evaluate(()=>echoTest.game.x),stopped);
    assert.deepEqual(await page.evaluate(()=>({cycle:echoTest.game.cycleTime,camera:echoTest.game.camera})),stoppedArt);
    await page.screenshot({path:'build/browser-checks/town.png'});
    await page.keyboard.down('ArrowRight');
    await page.waitForFunction(()=>echoTest.game.state==='disturbance');await page.keyboard.up('ArrowRight');
    assert.ok(Math.abs(await page.evaluate(()=>echoTest.game.rideTime)-5.6)<.05);
    assert.equal(await page.evaluate(()=>echoTest.game.openingVisuals().riders),4);
    await page.waitForFunction(()=>echoTest.game.state==='reveal'&&echoTest.game.phaseTime>.6);
    await page.screenshot({path:'build/browser-checks/shadow.png'});
    assert.equal(await page.evaluate(()=>echoTest.game.openingVisuals().riders),4);
    await page.waitForFunction(()=>echoTest.game.state==='upright');
    assert.deepEqual(await page.evaluate(()=>{const scene=echoTest.game.openingVisuals();return [scene.riders,scene.emptyBikes,scene.bikeTilt,scene.monster];}),[1,3,0,0]);
    await page.screenshot({path:'build/browser-checks/empty-bikes.png'});
    await page.waitForFunction(()=>echoTest.game.state==='thought');
    assert.equal(await page.locator('#dialogue').textContent(),'What happened?!');
    await page.screenshot({path:'build/browser-checks/vanished.png'});
    await page.waitForFunction(()=>echoTest.game.state==='resolve');
    assert.equal(await page.locator('#dialogue').textContent(),'I have to save them!');
    await page.waitForFunction(()=>echoTest.game.state==='approach');
    await page.keyboard.down('KeyD');await page.waitForFunction(()=>echoTest.game.state==='fall');await page.keyboard.up('KeyD');
    await page.waitForFunction(()=>echoTest.game.state==='blackout');
    await page.waitForFunction(()=>echoTest.game.state==='dark');
    await page.waitForTimeout(1500);await page.screenshot({path:'build/browser-checks/dark.png'});
    await page.keyboard.press('Escape');assert.equal(await page.evaluate(()=>echoTest.game.paused),true);
    await page.click('#resume');
    await page.keyboard.press('KeyR');await page.waitForFunction(()=>echoTest.game.state==='dead');await page.waitForFunction(()=>echoTest.game.state==='dark');
    assert.equal(await page.evaluate(()=>echoTest.game.echoes),1);
    await page.keyboard.down('Space');await page.waitForTimeout(150);
    assert.ok(await page.evaluate(()=>echoTest.game.y<290));await page.keyboard.up('Space');
    for(const width of [1024,768,390,320]){
      await page.setViewportSize({width,height:844});
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
      await page.screenshot({path:`build/browser-checks/width-${width}.png`});
    }
    await page.evaluate(()=>{echoTest.game.enter('win');echoTest.syncUI();});
    await page.click('#replay');assert.equal(await page.evaluate(()=>echoTest.game.echoes),0);
    await page.click('#sound');assert.equal(await page.locator('#sound').getAttribute('aria-pressed'),'true');
    assert.deepEqual(errors,[]);
    console.log('PASS: Chrome opening with real keys, hold/release, dialogue, pit/blackout/dark transition, pause, retry, jump, replay, sound, and 320–1440px layouts. No browser errors.');
  } finally { await browser.close(); }
})().catch(error=>{console.error(error);process.exitCode=1;});
