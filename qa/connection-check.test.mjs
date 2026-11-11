import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {classifyStatus,probeCloudflare,WORKER,PROBE_URL,HEALTH_URL,PROBE_BODY} from '../diagnostics/connection/check.mjs';

test('Cloudflare route uses only dedicated PAE04 test Worker',()=>{
  assert.equal(WORKER,'https://pae04-qa-technical-receiver.mastyukov.workers.dev');
  assert.equal(PROBE_URL,WORKER+'/v1/basic-error');
  assert.equal(HEALTH_URL,WORKER+'/health');
  assert.equal(PROBE_BODY,'{}');
});
test('HTTP 503 confirms live Cloudflare with diagnostic ingest OFF',()=>{
  const x=classifyStatus(503);
  assert.equal(x.kind,'ok');
  assert.match(x.detail,/выключен/);
});
test('HTTP 204 is an unsafe unexpected event, NOT a pass',()=>{
  const x=classifyStatus(204);
  assert.equal(x.kind,'danger');
});
test('HTTP 400, 403, 429 and unexpected server response do not claim PASS',()=>{
  for(const status of [400,403,429,404,500,200]){
    assert.notEqual(classifyStatus(status).kind,'ok');
  }
});
test('exact synthetic invalid body, no tokens, no referrer and no credentials',async()=>{
  const calls=[];
  const result=await probeCloudflare({transport:async(url,options)=>{
    calls.push({url,options});return {status:503};
  }});
  assert.equal(result.kind,'ok');
  assert.equal(calls.length,1);
  const {url,options}=calls[0];
  assert.equal(url,PROBE_URL);
  assert.equal(options.method,'POST');
  assert.equal(options.mode,'cors');
  assert.equal(options.credentials,'omit');
  assert.equal(options.referrerPolicy,'no-referrer');
  assert.equal(options.cache,'no-store');
  assert.equal(options.body,'{}');
  assert.deepEqual(options.headers,{'Content-Type':'application/json'});
});
test('never accepts arbitrary endpoint or external domain',async()=>{
  let count=0;
  await assert.rejects(()=>probeCloudflare({
    endpoint:'https://evil.example.test/anything',
    transport:async()=>{count++;return {status:503};}
  }),/PAE04_PROBE_ENDPOINT_FORBIDDEN/);
  assert.equal(count,0);
});
test('network failure remains safe and no raw URL or exception leaks to UI',async()=>{
  const r=await probeCloudflare({transport:async()=>{throw Error('PRIVATE token bad user email');}});
  assert.equal(r.kind,'warning');
  assert.doesNotMatch(JSON.stringify(r),/PRIVATE token bad user email/);
  assert.match(r.title,/Cloudflare/);
});
test('a delayed request aborts with safe human-readable notice',async()=>{
  const r=await probeCloudflare({timeoutMs:2,
    transport:(_url,opt)=>new Promise((_resolve,reject)=>{
      opt.signal.addEventListener('abort',()=>reject(Error('aborted')), {once:true});
    })
  });
  assert.equal(r.kind,'warning');
  assert.match(r.title,/время/);
});
test('the user-facing HTML is self-hosted and forbids other connections',()=>{
  const html=readFileSync(new URL('../diagnostics/connection/index.html',import.meta.url),'utf8');
  assert.match(html,/connect-src https:\/\/pae04-qa-technical-receiver\.mastyukov\.workers\.dev/);
  assert.match(html,/default-src 'none'/);
  assert.match(html,/script-src 'self'/);
  assert.match(html,/referrer" content="no-referrer"/);
  assert.match(html,/name="viewport"/);
  assert.match(html,/id="probe"/);
  assert.doesNotMatch(html,/src="https?:\/\//);
});
test('no automatic telemetry sender, storage or analytics in browser script',()=>{
  const script=readFileSync(new URL('../diagnostics/connection/app.mjs',import.meta.url),'utf8');
  assert.match(script,/button\.addEventListener\('click',test\)/);
  for(const forbidden of [
    'localStorage','sessionStorage','sendBeacon(', 'analytics','password','systolic=','access_token'
  ])assert.equal(script.includes(forbidden),false,forbidden);
});
