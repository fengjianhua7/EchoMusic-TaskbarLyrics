import test from 'node:test';
import assert from 'node:assert/strict';
import {activate} from '../index.js';

// Capture the token through the authorized process launch for integration requests.
async function connected(options={}) {
  let handler,token;
  const value={value:options.volume??50},disposals=[];
  const ctx={electron:{platform:'win32'},storage:{get:async()=>({enabled:true})},
    nowPlaying:{getSnapshot:async()=>({playback:null}),onSnapshot:()=>()=>{}},
    player:{volume:value,setVolume:async next=>{if(options.setVolume)await options.setVolume(next);value.value=next;}},
    vue:{ref:value=>({value}),shallowRef:value=>({value}),defineComponent:x=>x,defineAsyncComponent:x=>x},
    ui:{components:{},settings:{define:()=>{}}},toast:{warning:()=>{}},dispose:x=>disposals.push(x),
    webServer:{listen:async callback=>{handler=callback;return {ok:true,origin:'http://127.0.0.1:12345'};}},
    process:{launch:async request=>{token=new URL(request.args[0]).searchParams.get('token');return {ok:true,pid:1};},terminate:async()=>{}}};
  await activate(ctx);
  return {value,request:(delta,extra={})=>handler({path:'/volume',method:'POST',query:{token,delta},...extra}),disposals};
}
test('volume endpoint adjusts actual host volume and clamps both boundaries',async()=>{
  const f=await connected({volume:98});
  assert.equal(JSON.parse((await f.request('5')).body).volume,100);
  assert.equal(JSON.parse((await f.request('-100')).body).volume,0);
  f.value.value=37;
  assert.equal(JSON.parse((await f.request('5')).body).volume,42);
});
test('volume endpoint rejects malformed values, wrong method and invalid token',async()=>{
  const f=await connected();
  for(const delta of [undefined,'',' ','NaN','Infinity','101','-101'])assert.equal((await f.request(delta)).status,400);
  assert.equal((await f.request('5',{method:'GET'})).status,405);
  assert.equal((await f.request('5',{query:{token:'wrong',delta:'5'}})).status,403);
  assert.equal(f.value.value,50);
});
test('volume endpoint serializes requests and releases lock after host failure',async()=>{
  let release;
  const f=await connected({setVolume:()=>new Promise((resolve,reject)=>{release=()=>reject(new Error('failed'));})});
  const pending=f.request('5');
  assert.equal((await f.request('5')).status,409);
  release();assert.equal((await pending).status,502);
  const retry=f.request('5');release();assert.equal((await retry).status,502);
});
test('disposed plugin refuses volume commands',async()=>{
  const f=await connected();await f.disposals.at(-1)();
  assert.equal((await f.request('5')).status,403);
});
