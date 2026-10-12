import test from 'node:test';
import assert from 'node:assert/strict';
import {activate} from '../index.js';

async function fixture() {
  let handler,token,subscriber;
  let snapshot={playback:{trackId:'song',title:'Test',isPlaying:true,currentTime:0,duration:30}};
  const commands=[];
  const ctx={electron:{platform:'win32'},storage:{get:async()=>({enabled:true,hoverControls:false,hoverProgress:false})},
    nowPlaying:{getSnapshot:async()=>snapshot,onSnapshot:callback=>{subscriber=callback;return ()=>{};},command:async action=>{
      commands.push(action);
      snapshot={...snapshot,playback:{...snapshot.playback,...(action==='nextTrack'?{trackId:'next'}:{isPlaying:!snapshot.playback.isPlaying})}};
      subscriber(snapshot);
    }},player:{volume:{value:50}},
    vue:{ref:value=>({value}),shallowRef:value=>({value}),defineComponent:x=>x,defineAsyncComponent:x=>x},
    ui:{components:{},settings:{define:()=>{}}},toast:{warning:()=>{}},dispose:()=>{},
    webServer:{listen:async callback=>{handler=callback;return {ok:true,origin:'http://127.0.0.1:12345'};}},
    process:{launch:async request=>{token=new URL(request.args[0]).searchParams.get('token');return {ok:true,pid:1};},terminate:async()=>{}}};
  await activate(ctx);
  return {commands,request:(action,extra={})=>handler({path:'/command',method:'POST',query:{token,action,trackId:'song',...extra}})};
}
test('right/middle gestures work when hover buttons are disabled',async()=>{
  for(const action of ['nextTrack','togglePlayback']){
    const f=await fixture();const response=await f.request(action,{gesture:'1'});
    assert.equal(JSON.parse(response.body).ok,true);assert.deepEqual(f.commands,[action]);
  }
});
test('gesture flag only permits next track and playback toggle',async()=>{
  const f=await fixture();
  for(const action of ['previousTrack','toggleFavorite','seek'])assert.equal((await f.request(action,{gesture:'1',value:'5'})).status,403);
  assert.equal((await f.request('nextTrack')).status,403);
  assert.equal((await f.request('togglePlayback',{gesture:'true'})).status,403);
  assert.deepEqual(f.commands,[]);
});
test('gesture commands still enforce authentication and track identity',async()=>{
  const f=await fixture();
  assert.equal((await f.request('nextTrack',{gesture:'1',token:'invalid'})).status,403);
  assert.equal((await f.request('nextTrack',{gesture:'1',trackId:'old'})).status,409);
  assert.deepEqual(f.commands,[]);
});
