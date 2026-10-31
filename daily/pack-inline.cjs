#!/usr/bin/env node
'use strict';
// Compress a compact v2 Notion war-map payload using deterministic gzip.
// Usage: node daily/pack-inline.cjs < input.json
// Output: single JSON object with mode, url, length; mode=snapshot adds file and content.
const fs = require('node:fs');
const zlib = require('node:zlib');
const BASE = 'https://pyotrilyichtchaikovsky.github.io/notion-map-prototypes/daily/';
const MAX_URL = 1800;
const id = s => typeof s === 'string' && /^[0-9a-f]{32}$/i.test(s.replace(/-/g, ''));
function check(data) {
  if (!data || data.v !== 2 || typeof data.d !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}$/.test(data.d) || !id(data.p) ||
      !Array.isArray(data.e) || data.e.length > 250) throw Error('Invalid v2 map');
  for (const [i, r] of data.e.entries()) {
    if (!Array.isArray(r) || r.length !== 9) throw Error('Invalid event ' + i);
    for (let j=0; j<5; j++) if (typeof r[j] !== 'string' || !r[j].trim() || r[j].length>3000) throw Error('Invalid event text ' + i);
    if ((r[5]===null)!==(r[6]===null)) throw Error('Partial coordinates ' + i);
    if (r[5]!==null && (!Number.isFinite(r[5])||!Number.isFinite(r[6])||Math.abs(r[5])>85||Math.abs(r[6])>180)) throw Error('Invalid coordinates ' + i);
    if (!id(r[7]) || !id(r[8])) throw Error('Invalid Notion block or history ID ' + i);
  }
}
function main(){
  const data = JSON.parse(fs.readFileSync(0,'utf8').replace(/^\uFEFF/,''));
  check(data);
  const raw = JSON.stringify(data);
  const gzip = zlib.gzipSync(Buffer.from(raw,'utf8'), {level:9,mtime:0});
  if(zlib.gunzipSync(gzip).toString('utf8')!==raw) throw Error('Compression round-trip failed');
  const url = BASE + '#data=gz.' + gzip.toString('base64url');
  if(url.length<=MAX_URL){
    process.stdout.write(JSON.stringify({mode:'inline',url,length:url.length,eventCount:data.e.length})+'\n');
  }else{
    const file = data.d + '.json';
    // GitHub connector must create/update this UTF-8 plaintext file, then read it back.
    const fallbackUrl = BASE + '?snapshot=' + file;
    process.stdout.write(JSON.stringify({mode:'snapshot',url:fallbackUrl,length:url.length,file,path:'daily/snapshots/'+file,content:raw,eventCount:data.e.length})+'\n');
  }
}
try{main()}catch(e){process.stderr.write(String(e.message||e)+'\n');process.exitCode=1}
