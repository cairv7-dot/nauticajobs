async function fetchOffers(){
  const el = document.getElementById('offers-list');
  try{
    const res = await fetch('/api/offers');
    let offers = await res.json();
    const q = (document.getElementById('search-q') && document.getElementById('search-q').value) || '';
    const loc = (document.getElementById('filter-location') && document.getElementById('filter-location').value) || '';
    const type = (document.getElementById('filter-type') && document.getElementById('filter-type').value) || '';
    if (q) offers = offers.filter(o => (o.title+" "+o.description).toLowerCase().includes(q.toLowerCase()));
    if (loc) offers = offers.filter(o => o.location.toLowerCase().includes(loc.toLowerCase()));
    if (type) offers = offers.filter(o => (o.type||'').toLowerCase().includes(type.toLowerCase()));
    if (!offers.length) { el.innerHTML = '<p>No hay ofertas por ahora.</p>'; return }
    el.innerHTML = offers.map(o=>`<div class="job-card"><h3><a href="/job.html?id=${o.id}">${o.title}</a></h3><div class="meta">${o.location} • ${o.type} • ${o.salary}</div><p>${o.description}</p><div style="margin-top:12px"><a class="btn" href="/apply.html?id=${o.id}">Postular</a> <a class="btn secondary" href="/job.html?id=${o.id}">Ver detalle</a></div></div>`).join('');
  }catch(e){ el.innerHTML = '<p>Error cargando ofertas.</p>' }
}

document.addEventListener('DOMContentLoaded', ()=>{
  // build filters
  const container = document.getElementById('ofertas');
  const filters = document.createElement('div');
  filters.innerHTML = `<div style="display:flex;gap:8px;margin-bottom:8px"><input id="search-q" placeholder="Buscar título o descripción"><input id="filter-location" placeholder="Ubicación"><input id="filter-type" placeholder="Tipo"><button id="do-search">Buscar</button></div>`;
  container.insertBefore(filters, container.querySelector('#offers-list'));
  document.getElementById('do-search').addEventListener('click', fetchOffers);
  fetchOffers();

  const form = document.getElementById('contact-form');
  const result = document.getElementById('contact-result');
  form.addEventListener('submit', async (ev)=>{
    ev.preventDefault();
    result.textContent = 'Enviando...';
    const data = Object.fromEntries(new FormData(form));
    try{
      const res = await fetch('/api/contact', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(data)});
      const json = await res.json();
      if (json.ok) { result.textContent = 'Mensaje enviado. ¡Gracias!'; form.reset(); }
      else result.textContent = json.error || 'Error al enviar';
    }catch(e){ result.textContent = 'Error de red al enviar'; }
  });
});
