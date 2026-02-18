function authHeaders(){
  const t = localStorage.getItem('adminToken');
  return t ? { 'x-admin-token': t } : {};
}

async function loadOffers(){
  const el = document.getElementById('admin-offers');
  try{
    const res = await fetch('/api/offers');
    const offers = await res.json();
    if (!offers.length) { el.innerHTML = '<p>No hay ofertas.</p>'; return }
    el.innerHTML = offers.map(o=>`<div class="offer"><h4>${o.title}</h4><p><strong>${o.location}</strong> • ${o.type} • ${o.salary}</p><p>${o.description}</p><p><button data-id="${o.id}" class="edit">Editar</button> <button data-id="${o.id}" class="del">Eliminar</button></p></div>`).join('');
    document.querySelectorAll('.edit').forEach(b=>b.addEventListener('click', ()=>fillForm(Number(b.dataset.id), offers)));
    document.querySelectorAll('.del').forEach(b=>b.addEventListener('click', async ()=>{
      if (!confirm('Eliminar oferta?')) return;
      const id = Number(b.dataset.id);
      await fetch('/api/offers/' + id, { method: 'DELETE', headers: authHeaders() });
      loadOffers();
    }));
  }catch(e){ el.innerHTML = '<p>Error cargando ofertas</p>' }
}

function fillForm(id, offers){
  const f = document.getElementById('offer-form');
  const o = offers.find(x=>x.id===id);
  if (!o) return;
  f.id.value = o.id;
  f.title.value = o.title;
  f.location.value = o.location;
  f.type.value = o.type || '';
  f.salary.value = o.salary || '';
  f.description.value = o.description || '';
}

async function doLogin(password){
  const res = await fetch('/api/admin/login', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ password }) });
  const json = await res.json();
  if (json.token) { localStorage.setItem('adminToken', json.token); return true }
  return false;
}

function showAdmin(){
  document.getElementById('login-section').style.display = 'none';
  document.getElementById('admin-section').style.display = '';
  document.getElementById('list-section').style.display = '';
}

function showLogin(){
  document.getElementById('login-section').style.display = '';
  document.getElementById('admin-section').style.display = 'none';
  document.getElementById('list-section').style.display = 'none';
}

document.addEventListener('DOMContentLoaded', ()=>{
  const token = localStorage.getItem('adminToken');
  if (token) showAdmin(); else showLogin();

  const loginForm = document.getElementById('login-form');
  loginForm.addEventListener('submit', async (ev)=>{
    ev.preventDefault();
    const password = loginForm.password.value;
    document.getElementById('login-result').textContent = 'Verificando...';
    const ok = await doLogin(password);
    if (ok) { document.getElementById('login-result').textContent = 'Acceso concedido'; showAdmin(); loadOffers(); }
    else document.getElementById('login-result').textContent = 'Password incorrecta';
  });

  const f = document.getElementById('offer-form');
  const resetBtn = document.getElementById('reset-btn');
  const logoutBtn = document.getElementById('logout-btn');
  f.addEventListener('submit', async (ev)=>{
    ev.preventDefault();
    const data = Object.fromEntries(new FormData(f));
    if (data.id) {
      const id = data.id; delete data.id;
      await fetch('/api/offers/' + id, { method: 'PUT', headers: Object.assign({'Content-Type':'application/json'}, authHeaders()), body: JSON.stringify(data) });
    } else {
      await fetch('/api/offers', { method: 'POST', headers: Object.assign({'Content-Type':'application/json'}, authHeaders()), body: JSON.stringify(data) });
    }
    f.reset();
    loadOffers();
  });
  resetBtn.addEventListener('click', ()=>{ document.getElementById('offer-form').reset(); });
  logoutBtn.addEventListener('click', ()=>{ localStorage.removeItem('adminToken'); showLogin(); });

  if (localStorage.getItem('adminToken')) loadOffers();
});

// Load applications for admin
async function loadApplications(){
  const el = document.getElementById('applications-list');
  if (!el) return;
  try{
    const res = await fetch('/api/applications', { headers: authHeaders() });
    if (!res.ok) { el.innerHTML = '<p>No autorizado o error.</p>'; return }
    const apps = await res.json();
    if (!apps.length) { el.innerHTML = '<p>No hay candidaturas.</p>'; return }
    el.innerHTML = apps.map(a=>{
      const cvLink = a.cv ? ('/' + a.cv.replace(/\\\\/g,'/')) : null;
      return `<div class="offer"><h4>${a.name} — ${a.email} <small style="color:#666">(${a.createdAt.split('T')[0]})</small></h4><p>Oferta: ${a.jobId}</p><p>${a.message || ''}</p><p>${cvLink?`<a class="btn" href="${cvLink}" target="_blank">Descargar CV</a>`:''}</p></div>`
    }).join('');
  }catch(e){ el.innerHTML = '<p>Error cargando candidaturas</p>' }
}

// call applications loader when admin visible
document.addEventListener('DOMContentLoaded', ()=>{
  const orig = localStorage.getItem('adminToken');
  if (orig) loadApplications();
  // also refresh applications when offers loaded or after actions
  const obs = new MutationObserver(()=>{ if (localStorage.getItem('adminToken')) loadApplications(); });
  const node = document.getElementById('admin-offers'); if (node) obs.observe(node, { childList:true, subtree:true });
});
