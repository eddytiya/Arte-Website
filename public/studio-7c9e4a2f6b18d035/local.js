const $ = id => document.getElementById(id);
const form = $('product-form');
let products = [], upload = '', dirty = false, previewUrl = '';
let deleted = null;
let version = '';
const local = ['localhost','127.0.0.1','[::1]'].includes(location.hostname);
const maxImageBytes = 3_000_000;
const imageSource = path => local ? path : '/api/manage?action=image&path=' + encodeURIComponent(path);
const publishedMessage = local ? 'Select Client website above to preview it.' : 'Saved to GitHub. The client website updates after the Vercel deployment finishes.';
const status = text => { $('status').textContent = text; };
function saveState(text) { $('save-state').textContent=text; $('save-state').dataset.dirty=String(dirty); }
async function api(path, data) {
  const endpoint = local ? '/__local-admin/' + path : '/api/manage?action=' + encodeURIComponent(path);
  const response = await fetch(endpoint, data === undefined ? {} : {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(data)});
  const result = await response.json();
  if (!response.ok) { if(response.status === 401) { $('login').hidden=false; $('workspace').hidden=true; } throw new Error(result.error || 'Please try again.'); }
  return result;
}
async function load() {
  products = await api('products');
  $('login').hidden=true; $('workspace').hidden=false;
  renderProducts();
}
function renderProducts() {
  const query=$('search').value.trim().toLowerCase();
  const visible=products.filter(p=>p.title.toLowerCase().includes(query)).sort((a,b)=>a.order-b.order||a.title.localeCompare(b.title));
  $('product-count').textContent=`${visible.length} of ${products.length} products`;
  $('products').replaceChildren(...visible.map(p=>{const button=document.createElement('button');button.type='button';button.dataset.id=p.id;button.setAttribute('aria-current',String(form.elements.id.value===p.id));const image=document.createElement('img');image.src=imageSource(p.image);image.alt='';image.loading='lazy';const label=document.createElement('span');label.textContent=p.title;button.append(image,label);button.onclick=()=>edit(p);return button;}));
  if(!visible.length){const empty=document.createElement('p');empty.textContent=query?'No matching products. Try another name.':'No products yet. Choose Add product to begin.';$('products').append(empty);}
}
$('search').oninput=renderProducts;
function edit(p = {}) {
  if(dirty && !confirm('Discard unsaved product changes?')) return;
  form.reset(); upload=''; dirty=false; status('');
  version=p._version || '';
  saveState(p.id ? 'Saved' : 'New product · not saved');
  for(const key of ['id','title','summary','image','alt','supply','enquiry','order']) if(p[key]!==undefined) form.elements[key].value=p[key];
  form.elements.includes.value=(p.includes||[]).join('\n');
  form.elements.featured.checked=!!p.featured; form.elements.fullRange.checked=p.fullRange!==false;
  form.elements.photo.required=!p.image;
  $('photo-preview').hidden=!p.image; if(p.image) $('photo-preview').src=imageSource(p.image);
  $('form-heading').textContent=p.id?'Edit product':'Add product'; form.hidden=false; $('empty').hidden=true;
  $('delete').hidden=!p.id;
  renderProducts();
  form.elements.title.focus();
}
$('login-form').onsubmit=async event=>{event.preventDefault();const button=event.submitter;button.disabled=true;try{const data=new FormData(event.target);await api('login',Object.fromEntries(data));event.target.reset();status('');await load();}catch(error){status(error.message);}finally{button.disabled=false;}};
$('add').onclick=()=>edit();
$('delete').onclick=async()=>{
  const id=form.elements.id.value;
  const current=products.find(p=>p.id===id);
  if(!current||!confirm(`Delete “${current.title}” from the website? You can undo this deletion.`))return;
  $('delete').disabled=true;
  try {
    const result=await api('products/delete',{id,version});
    deleted={id,recovery:result.recovery};dirty=false;form.reset();form.hidden=true;$('empty').hidden=false;
    await load();$('recovery-message').textContent=`“${current.title}” was deleted.`;$('recovery').hidden=false;status('Product deleted. '+publishedMessage);$('undo').focus();
  } catch(error){status(error.message);}finally{$('delete').disabled=false;}
};
$('undo').onclick=async()=>{
  if(!deleted)return;
  $('undo').disabled=true;
  try{await api('products/restore',deleted);deleted=null;$('recovery').hidden=true;await load();status('Product restored.');}catch(error){status(error.message);}finally{$('undo').disabled=false;}
};
$('logout').onclick=async()=>{if(dirty&&!confirm('Discard unsaved changes and sign out?'))return;try{await api('logout',{});location.reload();}catch(error){status(error.message);}};
form.oninput=()=>{dirty=true;saveState('Unsaved changes');};
form.elements.photo.onchange=async()=>{
  const file=form.elements.photo.files[0]; upload='';
  if(!file)return;
  if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>maxImageBytes){status('Choose a PNG, JPG or WebP image smaller than 3 MB.');form.elements.photo.value='';return;}
  upload=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(file);});
  if(previewUrl)URL.revokeObjectURL(previewUrl);previewUrl=URL.createObjectURL(file);$('photo-preview').src=previewUrl;$('photo-preview').hidden=false;
};
form.onsubmit=async event=>{
  event.preventDefault();const button=$('save');button.disabled=true;saveState('Saving…');status('Saving product…');
  try{const data=Object.fromEntries(new FormData(form));delete data.photo;data.version=version;data.featured=form.elements.featured.checked;data.fullRange=form.elements.fullRange.checked;data.includes=data.includes.split('\n').map(s=>s.trim()).filter(Boolean);if(upload)data.upload=upload;const result=await api('products',data);dirty=false;await load();edit(products.find(p=>p.id===result.id));saveState(local?'Saved':'Saved to GitHub');status('Product saved. '+publishedMessage);}catch(error){saveState('Not saved · try again');status(error.message);}finally{button.disabled=false;}
};
window.addEventListener('beforeunload',event=>{if(dirty){event.preventDefault();event.returnValue='';}});
load().catch(error=>{if(error.message!=='Please sign in.')status(error.message);});
$('workshop-form').onsubmit=async event=>{
  event.preventDefault();const button=event.submitter;const file=$('workshop-file').files[0];
  if(!file)return;
  if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>maxImageBytes){status('Choose a PNG, JPG or WebP photograph smaller than 3 MB.');return;}
  button.disabled=true;status('Saving workshop photograph…');
  try{const upload=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(file);});await api('workshop-photo',{upload});$('workshop-form').reset();status('Workshop photograph saved. '+publishedMessage);}catch(error){status(error.message);}finally{button.disabled=false;}
};

