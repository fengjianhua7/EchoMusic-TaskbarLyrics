// Run explicitly on an interactive Windows desktop after build-native.ps1.
// Moves the cursor temporarily and sends clicks only to a simulated player.
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';
import {makeFrame,DEFAULTS} from '../src/core.mjs';
assert.equal(process.platform,'win32');
const buttons=process.argv.includes('--buttons'),input=process.argv.includes('--input');
assert.ok(buttons!==input,'Choose --buttons or --input');
const settings={...DEFAULTS,display:process.argv.includes('--all')?'all':process.argv.includes('--secondary')?'\\\\.\\DISPLAY2':'primary',offset:200,width:180,hideFullscreen:false,showCover:false,playedColorSource:'custom',controlsBackgroundSource:'custom',controlsIconColorSource:'custom',noticeTextSource:'custom'};
const snapshot={playback:{trackId:'test',title:'输入回归测试',currentTime:1,updatedAt:Date.now(),isPlaying:true,playbackRate:1,duration:100},lyric:{trackId:'test',lines:[{time:0,text:'任务栏输入测试'},{time:10,text:'测试结束后自动关闭'}]}};
const frame=makeFrame(snapshot,settings),commands=[];
let volume=50,volumeRequests=0;
const server=http.createServer((req,res)=>{
  res.setHeader('content-type','application/json');
  const url=new URL(req.url,'http://localhost');
  if(url.pathname==='/command'){commands.push(url.searchParams.get('action'));res.end(JSON.stringify({ok:true,frame:{...frame,volume}}));}
  else if(url.pathname==='/volume'){volume+=Number(url.searchParams.get('delta'));volumeRequests++;res.end(JSON.stringify({ok:true,volume}));}
  else res.end(JSON.stringify({...frame,volume}));
});
const directory=fs.mkdtempSync(path.join(os.tmpdir(),'echo-lyrics-native-'));
const output=path.join(directory,'report.json');
let child,timer;
try {
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  child=spawn(fileURLToPath(new URL('../bin/TaskbarLyrics.exe',import.meta.url)),[`http://127.0.0.1:${server.address().port}/state?token=test`,output,buttons?'--verify-buttons':'--verify-input'],{windowsHide:true});
  timer=setTimeout(()=>child.kill(),15000);
  const code=await new Promise((resolve,reject)=>{child.on('exit',resolve);child.on('error',reject);});
  assert.equal(code,0);
  const report=JSON.parse(fs.readFileSync(output,'utf8').replace(/^\uFEFF/,''));
  for(const surface of Object.values(report.surfaces)){assert.equal(surface.embedded,true);assert.equal(surface.paintSucceeded,true);assert.equal(surface.noActivate,true);}
  if(buttons)assert.deepEqual(commands,['previousTrack','togglePlayback','nextTrack','toggleFavorite']);
  else {assert.equal(volume,55);assert.equal(volumeRequests,1);assert.equal(report.volumeVisible,true);assert.equal(report.mouseTransparent,true);}
  console.log('PASS',buttons?'four native button clicks':'wheel volume',Object.values(report.surfaces).map(s=>s.windowDpi));
} finally {
  clearTimeout(timer);if(child && child.exitCode===null)child.kill();server.close();
  if(fs.existsSync(output))fs.unlinkSync(output);fs.rmdirSync(directory);
}
