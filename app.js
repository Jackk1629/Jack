
// app.js - localStorage DB + admin session + upload handler
const DB_KEY = 'karya_db_v1';
const ADMIN_SESSION = 'ks_admin_session_v1';

function getDB(){ try{ return JSON.parse(localStorage.getItem(DB_KEY)) || []; }catch(e){ console.error('DB parse error', e); return []; } }
function saveDB(db){ try{ localStorage.setItem(DB_KEY, JSON.stringify(db)); return true; }catch(e){ console.error('DB save error', e); return false; } }

// seed sample if empty
if(!localStorage.getItem(DB_KEY)){
  const sample=[
    {id:'w1', type:'Cerpen', title:'Senja di Batang Kuis', author:'Jakaria P. Sinaga', content:'Matahari turun di balik perbukitan, meninggalkan langit keemasan.'},
    {id:'w2', type:'Puisi', title:'Secangkir Fokus', author:'Jakaria P. Sinaga', content:'Kopi hangat menulis sunyi di meja tugasku.'}
  ];
  saveDB(sample);
}

// CRUD
function addWork(obj){ const db=getDB(); db.unshift(obj); return saveDB(db); }
function updateWork(id,data){ const db=getDB().map(w=> w.id===id? Object.assign({}, w, data): w); return saveDB(db); }
function deleteWork(id){ const db=getDB().filter(w=>w.id!==id); return saveDB(db); }
function getWork(id){ return getDB().find(w=>w.id===id) || null; }

// render list
function renderList(containerSelector){
  const container=document.querySelector(containerSelector); if(!container) return;
  const db=getDB();
  if(db.length===0){ container.innerHTML = '<p style="color:#9aa4b2">Belum ada karya. Tambahkan di Dashboard.</p>'; return; }
  container.innerHTML = db.map(w=> `
    <div class="card">
      <h3>${escapeHtml(w.title)}</h3>
      <p>${w.type} • ${escapeHtml(w.author || '')}</p>
      <div style="margin-top:12px;display:flex;gap:8px"><a class="btn small" href="reader.html?id=${w.id}">Baca</a></div>
    </div>
  `).join('');
}

// reader
function setupReader(){ const params=new URLSearchParams(location.search); const id=params.get('id'); if(!id) return; const w=getWork(id); if(!w){ document.getElementById('r-content').textContent = 'Karya tidak ditemukan.'; return; } document.getElementById('r-title').textContent = w.title; document.getElementById('r-author').textContent = w.author; const contentEl = document.getElementById('r-content'); contentEl.textContent = w.content; document.getElementById('inc').onclick = ()=> changeFont(1); document.getElementById('dec').onclick = ()=> changeFont(-1); document.getElementById('toggle-night').onclick = ()=> document.body.classList.toggle('night'); document.getElementById('download-btn').onclick = ()=> { const blob = new Blob([w.content], {type:'text/plain'}); const url = URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download = (w.title || 'karya').replace(/\s+/g,'_') + '.txt'; a.click(); } }

function changeFont(delta){ const el=document.getElementById('r-content'); const current = parseFloat(window.getComputedStyle(el).fontSize) || 16; el.style.fontSize = (current + delta) + 'px'; }

// admin session (simple client-side)
function adminLogin(username, password){
  const U = 'Jackk'; const P = 'Jaka_pesadmin';
  if(username === U && password === P){
    sessionStorage.setItem(ADMIN_SESSION, JSON.stringify({user: username, ts: Date.now()}));
    return true;
  }
  return false;
}
function adminLogout(){ sessionStorage.removeItem(ADMIN_SESSION); location.href = 'login.html'; }
function isAdmin(){ try{ return !!JSON.parse(sessionStorage.getItem(ADMIN_SESSION)); }catch(e){ return false; } }

// admin UI
function adminInit(){
  if(!isAdmin()){ location.href = 'login.html'; return; }
  const list=document.getElementById('admin-list');
  function refresh(){
    const db=getDB();
    list.innerHTML = db.map(w=> `
      <div style="padding:12px;border-radius:8px;background:rgba(255,255,255,0.02);margin-bottom:8px">
        <b>${escapeHtml(w.title)}</b> <span style="color:#9aa4b2">(${w.type})</span>
        <div style="margin-top:8px"><button class="btn small" onclick="editWork('${w.id}')">Edit</button> <button class="btn small" onclick="removeWork('${w.id}')">Delete</button> <a class="btn small" href="reader.html?id=${w.id}">View</a></div>
      </div>
    `).join('');
  }
  refresh();
  window.editWork = function(id){ const w=getWork(id); if(!w) return alert('Not found'); document.getElementById('w-id').value = w.id; document.getElementById('w-title').value = w.title; document.getElementById('w-type').value = w.type; document.getElementById('w-author').value = w.author; document.getElementById('w-content').value = w.content; }
  window.removeWork = function(id){ if(confirm('Hapus karya ini?')){ deleteWork(id); refresh(); } }
  document.getElementById('w-form').onsubmit = function(e){ e.preventDefault(); const idField=document.getElementById('w-id').value; const payload = { id: idField || ('w' + Date.now()), title: document.getElementById('w-title').value, type: document.getElementById('w-type').value, author: document.getElementById('w-author').value || 'Jakaria P. Sinaga', content: document.getElementById('w-content').value, created: Date.now() }; if(idField){ updateWork(idField, payload); } else { addWork(payload); } document.getElementById('w-form').reset(); refresh(); }
  // upload file handler (on admin dashboard)
  const fileInput = document.getElementById('upload-file');
  if(fileInput){
    fileInput.onchange = function(e){
      const f = e.target.files[0]; if(!f) return alert('No file selected'); const reader = new FileReader(); reader.onload = function(){ const content = reader.result; const payload = { id: 'w'+Date.now(), title: f.name.replace(/\.[^/.]+$/, ''), type: document.getElementById('w-type').value || 'Cerpen', author: document.getElementById('w-author').value || 'Jakaria P. Sinaga', content: content, created: Date.now() }; addWork(payload); alert('Upload sukses'); refresh(); }; reader.readAsText(f); 
    };
  }
}

// login page handler
function loginInit(){ const form = document.getElementById('login-form'); form.onsubmit = function(e){ e.preventDefault(); const u = document.getElementById('login-user').value; const p = document.getElementById('login-pass').value; if(adminLogin(u,p)){ location.href = 'admin.html'; } else { alert('Login gagal. Periksa username/password.'); } } }

// utilities
function escapeHtml(str){ return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
