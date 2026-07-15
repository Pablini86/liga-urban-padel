import {S, esc} from './state.js';
import {showLT} from './navigation.js';

let _horariosLid=null;

// HORARIOS
export function showHorarioJornada(lid, jId){
  _horariosLid=lid;
  const btn=document.querySelector('.lt[onclick*="horarios"]');
  showLT('horarios', btn);
  // Build pills first
  const js=S.jornadas.filter(j=>j.liga===lid&&S.partidos.some(p=>p.jornadaId===j.id)).sort((a,b)=>b.num-a.num);
  const sel=document.getElementById('horarios-sel');
  if(sel){
    sel.innerHTML=js.map(j=>`<button onclick="renderHorariosSingle('${lid}','${j.id}')"
      style="padding:.35rem .85rem;border-radius:20px;border:1px solid var(--border2);background:transparent;color:var(--muted2);font-family:'Outfit',sans-serif;font-size:.78rem;font-weight:600;cursor:pointer"
      id="hpill-${j.id}">J${j.num}</button>`).join('');
  }
  setTimeout(()=>renderHorariosSingle(lid, jId), 50);
}

export function renderHorarios(lid){
  _horariosLid=lid;
  const js=S.jornadas.filter(j=>j.liga===lid&&S.partidos.some(p=>p.jornadaId===j.id)).sort((a,b)=>b.num-a.num);
  const sel=document.getElementById('horarios-sel');
  if(sel){
    sel.innerHTML=js.map((j,i)=>`<button onclick="renderHorariosSingle('${lid}','${j.id}')"
      style="padding:.35rem .85rem;border-radius:20px;border:1px solid var(--border2);background:${i===0?'var(--accent)':'transparent'};color:${i===0?'var(--black)':'var(--muted2)'};font-family:'Outfit',sans-serif;font-size:.78rem;font-weight:600;cursor:pointer"
      id="hpill-${j.id}">J${j.num}</button>`).join('');
  }
  if(js.length) renderHorariosSingle(lid, js[0].id);
}

export function renderHorariosSingle(lid, jId){
  document.querySelectorAll('[id^="hpill-"]').forEach(p=>{
    const active = p.id === 'hpill-' + jId;
    p.style.background = active ? 'var(--accent)' : 'transparent';
    p.style.color = active ? 'var(--black)' : 'var(--muted2)';
  });

  // Wire search after 50ms
  setTimeout(()=>{
    const inp = document.getElementById('hs-' + jId);
    if(inp) inp.addEventListener('input', function(){
      const q = this.value.toLowerCase().trim();
      document.querySelectorAll('.h-grupo').forEach(g=>{
        let show = false;
        g.querySelectorAll('.h-row').forEach(r=>{
          const match = !q || r.dataset.name.includes(q);
          r.style.display = match ? 'flex' : 'none';
          if(match) show = true;
        });
        g.style.display = show ? 'block' : 'none';
      });
    });
  }, 50);

  const jornada = S.jornadas.find(j => j.id === jId);
  const el = document.getElementById('horarios-content');
  if(!el) return;

  const ms = S.partidos.filter(p => p.jornadaId === jId);
  const byGrupo = {};
  ms.forEach(m => {
    if(!byGrupo[m.grupo]) byGrupo[m.grupo] = {turno: m.turno, pids: new Set()};
    [m.a1, m.a2, m.b1, m.b2].forEach(pid => byGrupo[m.grupo].pids.add(pid));
  });
  const grupos = Object.keys(byGrupo).map(Number).sort((a,b) => a-b);
  renderHorariosGrid(el, jId,
    'JORNADA ' + (jornada?.num||''),
    jornada?.fecha || 'Fecha por confirmar',
    jornada?.turnos || [],
    grupos.map(g => ({
      grupo: g,
      turno: byGrupo[g].turno,
      players: [...byGrupo[g].pids]
        .map(pid => S.players.find(p => p.id === pid))
        .filter(Boolean)
        .sort((a,b) => a.orden - b.orden)
        .map(p => ({nombre: esc(p.nombre), inicial: esc(p.nombre[0])}))
    }))
  );
}

function renderHorariosGrid(el, jId, title, fecha, turnos, grupos){
  let html = '<input id="hs-' + jId + '" type="text" placeholder="Busca tu nombre..." ' +
    'style="width:100%;padding:.65rem 1rem;border-radius:9px;border:1px solid var(--border2);' +
    'background:var(--card2);color:var(--text);font-size:.88rem;outline:none;' +
    'box-sizing:border-box;margin-bottom:.85rem;font-family:inherit">';

  grupos.forEach(({grupo, turno, players}) => {
    html += '<div class="h-grupo" style="background:var(--card);border:1px solid var(--border);' +
      'border-radius:12px;margin-bottom:.55rem;overflow:hidden">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;' +
      'padding:.6rem 1rem;background:var(--card2);border-bottom:1px solid var(--border)">' +
      '<span style="background:var(--accent);color:var(--black);font-family:Bebas Neue,sans-serif;' +
      'font-size:1rem;padding:1px 8px;border-radius:5px;font-weight:700">G' + grupo + '</span>' +
      '<span style="font-family:Bebas Neue,sans-serif;font-size:1.15rem;color:var(--accent);' +
      'letter-spacing:1px">' + esc(turno) + '</span></div>';

    players.forEach((p, i) => {
      html += '<div class="h-row" data-name="' + p.nombre.toLowerCase() + '" ' +
        'style="display:flex;align-items:center;gap:.75rem;padding:.6rem 1rem;' +
        'border-bottom:1px solid ' + (i === players.length-1 ? 'transparent' : 'var(--border)') + '">' +
        '<div style="width:28px;height:28px;border-radius:50%;background:var(--border2);' +
        'display:flex;align-items:center;justify-content:center;font-family:Bebas Neue,sans-serif;' +
        'font-size:.85rem;color:var(--accent);flex-shrink:0">' + p.inicial + '</div>' +
        '<span style="font-size:.9rem;font-weight:' + (i===0?600:400) + '">' + p.nombre + '</span>' +
        '</div>';
    });
    html += '</div>';
  });
  el.innerHTML = html;
}
