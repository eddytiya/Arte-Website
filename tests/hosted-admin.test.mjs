import test from 'node:test';
import assert from 'node:assert/strict';
import app from '../api/manage.ts';
import {readFile,access} from 'node:fs/promises';

test('deployment maps old admin URLs to 404 and ships the renamed workspace',async()=>{
  const config=JSON.parse(await readFile(new URL('../vercel.json',import.meta.url),'utf8'));
  assert.ok(config.rewrites.some(r=>r.source==='/admin'&&r.destination==='/api/not-found'));
  assert.ok(config.rewrites.some(r=>r.source==='/admin/:path*'&&r.destination==='/api/not-found'));
  await access(new URL('../public/studio-7c9e4a2f6b18d035/index.html',import.meta.url));
  await assert.rejects(access(new URL('../public/admin/index.html',import.meta.url)));
});

test('hosted login and GitHub-backed product lifecycle', async () => {
  const originalFetch=globalThis.fetch;
  const keys=['ADMIN_USERNAME','ADMIN_PASSWORD','ADMIN_SESSION_SECRET','CONTENT_GITHUB_REPO','CONTENT_GITHUB_BRANCH','CONTENT_GITHUB_TOKEN'];
  const originalEnv=Object.fromEntries(keys.map(key=>[key,process.env[key]]));
  Object.assign(process.env,{ADMIN_USERNAME:'admin',ADMIN_PASSWORD:'admin',ADMIN_SESSION_SECRET:'test-only-secret-with-at-least-32-characters',CONTENT_GITHUB_REPO:'test/site',CONTENT_GITHUB_BRANCH:'main',CONTENT_GITHUB_TOKEN:'test-only-token'});
  let counter=0, head='initial', commits=0;
  const blobs=new Map(),trees=new Map(),commitTrees=new Map();
  const blob=content=>{const sha=`blob${++counter}`;blobs.set(sha,Buffer.from(content));return sha;};
  const image='/images/products/worm-wheel.webp';
  trees.set('initial-tree',new Map([
    ['public'+image,blob('test-image')],
    ['content/settings.json',blob(JSON.stringify({companyName:'Test',workshopPhoto:''}))],
  ]));commitTrees.set(head,'initial-tree');
  globalThis.fetch=async(url,options={})=>{
    assert.match(String(url),/^https:\/\/api.github.com\/repos\/test\/site\//);
    assert.equal(options.headers.Authorization,'Bearer test-only-token');
    const path=String(url).split('/repos/test/site/')[1], method=options.method||'GET', body=options.body?JSON.parse(options.body):{};
    let result;
    if(path==='git/ref/heads/main') result={object:{sha:head}};
    else if(path.startsWith('git/commits/')&&method==='GET')result={tree:{sha:commitTrees.get(path.slice('git/commits/'.length))}};
    else if(path.startsWith('git/trees/')&&method==='GET')result={tree:[...trees.get(path.split('/')[2].split('?')[0])].map(([path,sha])=>({path,sha,type:'blob'}))};
    else if(path.startsWith('git/blobs/')&&method==='GET')result={content:blobs.get(path.split('/')[2]).toString('base64'),encoding:'base64'};
    else if(path==='git/blobs'&&method==='POST')result={sha:blob(Buffer.from(body.content,body.encoding==='base64'?'base64':'utf8'))};
    else if(path==='git/trees'&&method==='POST'){const next=new Map(trees.get(body.base_tree));for(const change of body.tree){if(change.sha===null)next.delete(change.path);else next.set(change.path,change.sha);}const sha=`tree${++counter}`;trees.set(sha,next);result={sha};}
    else if(path==='git/commits'&&method==='POST'){const sha=`commit${++counter}`;commitTrees.set(sha,body.tree);result={sha};commits++;}
    else if(path==='git/refs/heads/main'&&method==='PATCH'){assert.equal(body.force,false);head=body.sha;result={ok:true};}
    else throw Error(`Unexpected GitHub request: ${method} ${path}`);
    return Response.json(result);
  };
  const origin='https://site.example';
  let cookie='';
  const call=(action,data,options={})=>app.fetch(new Request(`${origin}/api/manage?action=${encodeURIComponent(action)}`,{method:data===undefined?'GET':'POST',headers:{...(data===undefined?{}:{Origin:origin,'Content-Type':'application/json'}),Cookie:cookie,...options},body:data===undefined?undefined:JSON.stringify(data)}));
  try{
    assert.equal((await call('products')).status,401);
    assert.equal((await call('login',{username:'admin',password:'wrong'})).status,401);
    const login=await call('login',{username:'admin',password:'admin'});assert.equal(login.status,200);
    assert.match(login.headers.get('set-cookie'),/HttpOnly; Secure; SameSite=Strict/);cookie=login.headers.get('set-cookie').split(';')[0];
    assert.equal((await call('products',{}, {Origin:'https://elsewhere.example'})).status,403);
    const product={title:'Test Gear',summary:'A test component',image,supply:'manufactured',enquiry:'Worm Wheel',featured:true,fullRange:true,order:10,includes:['Test detail']};
    const create=await call('products',product);assert.equal(create.status,200);assert.equal((await create.json()).publishing,true);assert.equal(commits,1);
    let list=await (await call('products')).json();assert.equal(list.length,1);assert.equal(list[0].id,'test-gear');assert.ok(list[0]._version);
    assert.equal((await call('products',product)).status,409);
    const update={...product,id:'test-gear',version:list[0]._version,summary:'Updated summary'};
    assert.equal((await call('products',update)).status,200);
    assert.equal((await call('products',update)).status,409,'stale edits must not overwrite newer saves');
    list=await (await call('products')).json();assert.equal(list[0].summary,'Updated summary');
    const deleted=await call('products/delete',{id:'test-gear',version:list[0]._version});assert.equal(deleted.status,200);const recovery=(await deleted.json()).recovery;
    assert.deepEqual(await (await call('products')).json(),[]);
    assert.equal((await call('products/restore',{id:'test-gear',recovery})).status,200);
    assert.equal((await (await call('products')).json()).length,1);
    assert.equal((await call('products/restore',{id:'test-gear',recovery})).status,409);
    assert.equal((await call('products/delete',{id:'../../outside'})).status,422);
    const badUpload=await call('workshop-photo',{upload:'data:image/png;base64,aW52YWxpZA=='});assert.equal(badUpload.status,422);
    const upload='data:image/png;base64,'+Buffer.from([137,80,78,71,13,10,26,10,0,0,0,0]).toString('base64');
    const before=commits;assert.equal((await call('workshop-photo',{upload})).status,200);assert.equal(commits,before+1,'image and settings are saved in a single commit');
    assert.match((await (await call('workshop-photo')).json()).image,/^\/images\/uploads\/workshop-/);
    const logout=await call('logout',{});assert.equal(logout.status,200);assert.match(logout.headers.get('set-cookie'),/Max-Age=0/);
    process.env.ADMIN_PASSWORD='new-password';assert.equal((await call('products')).status,401,'changing credentials invalidates existing sessions');
    delete process.env.ADMIN_SESSION_SECRET;assert.equal((await call('login',{username:'admin',password:'new-password'})).status,503);
  }finally{
    globalThis.fetch=originalFetch;
    for(const key of keys){if(originalEnv[key]===undefined)delete process.env[key];else process.env[key]=originalEnv[key];}
  }
});
