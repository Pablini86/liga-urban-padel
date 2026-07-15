import {S, esc, pShort, pFirst} from './state.js';

// JORNADAS
export function renderJornadas(lid){
  const el=document.getElementById('jornadas-list');
  if(!el)return;
  const js=S.jornadas.filter(j=>j.liga===lid).sort((a,b)=>b.num-a.num);
  if(!js.length){
    el.innerHTML='<div class="empty-state"><div>📅</div><p>Sin jornadas registradas</p></div>';
    return;
  }
  el.innerHTML=js.map(j=>{
    const ms=S.partidos.filter(p=>p.jornadaId===j.id);
    const fin=ms.filter(m=>m.finalizado&&m.gA!==null).length;
    const hasResults=fin>0;
    const allDone=ms.length>0&&fin===ms.length;
    const badge=allDone?`<span class="jc-badge jc-done">Completa</span>`:
      hasResults?`<span class="jc-badge jc-pending">${fin}/${ms.length} sets</span>`:
      ms.length?`<span class="jc-badge jc-empty">Sin resultados</span>`:
      `<span class="jc-badge jc-empty">Por jugarse</span>`;
    const bodyContent = hasResults ? renderJornadaBody(j.id,lid) : (ms.length ? renderJornadaFixture(j.id,lid) : `<div class="jc-empty-msg">⏳ Jornada aún no generada</div>`);
    return`<div class="jornada-card">
      <div class="jc-header" onclick="toggleJornada('${j.id}')">
        <div>
          <div class="jc-title">JORNADA ${j.num}</div>
          <div class="jc-meta">${esc(j.fecha||'Fecha por confirmar')} · ${esc((j.turnos||[]).join(' · '))}</div>
        </div>
        <div style="display:flex;align-items:center;gap:.5rem">
          ${badge}
          <button onclick="event.stopPropagation();showHorarioJornada('${lid}','${j.id}')" style="padding:2px 8px;border-radius:5px;border:1px solid var(--border2);background:transparent;color:var(--muted2);font-size:.68rem;cursor:pointer">🕐 Horarios</button>
        </div>
      </div>
      <div class="jc-body" id="jb-${j.id}">
        ${bodyContent}
      </div>
    </div>`;
  }).join('');
}

export function toggleJornada(jId){
  const el=document.getElementById('jb-'+jId);
  if(!el)return;
  el.classList.toggle('open');
}

function renderJornadaFixture(jId,lid){
  // Show groups and who plays who, no scores yet
  const ms=S.partidos.filter(p=>p.jornadaId===jId).sort((a,b)=>a.grupo-b.grupo||a.set-b.set);
  if(!ms.length)return`<div class="jc-empty-msg">⏳ Aún no hay resultados para esta jornada</div>`;
  const grupos=[...new Set(ms.map(m=>m.grupo))].sort((a,b)=>a-b);
  return`<div style="padding:.5rem 0">`+grupos.map(g=>{
    const gms=ms.filter(m=>m.grupo===g);
    const gps=S.players.filter(p=>p.liga===lid&&p.grupo===g).sort((a,b)=>a.orden-b.orden);
    return`<div class="grupo-block">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:.5rem">
        <div class="grupo-title">GRUPO ${g}</div>
        <span style="font-size:.68rem;color:var(--muted2)">${esc(gms[0]?.cancha||'')} · ${esc(gms[0]?.turno||'')}</span>
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:.3rem;margin-bottom:.5rem">
        ${gps.map(p=>`<span style="background:var(--card2);border:1px solid var(--border);border-radius:5px;padding:2px 8px;font-size:.75rem;font-weight:500">${pShort(p.nombre)}</span>`).join('')}
      </div>
      ${gms.map(m=>`<div style="display:flex;align-items:center;gap:.4rem;font-size:.75rem;padding:.3rem 0;border-top:1px solid var(--border)">
        <span style="font-size:.6rem;color:var(--muted);min-width:32px">Set ${m.set}</span>
        <span style="flex:1;text-align:right;color:var(--text)">${pFirst(m.a1)} / ${pFirst(m.a2)}</span>
        <span style="color:var(--muted);font-size:.7rem;padding:0 4px">vs</span>
        <span style="flex:1;color:var(--text)">${pFirst(m.b1)} / ${pFirst(m.b2)}</span>
      </div>`).join('')}
    </div>`;
  }).join('')+'</div>';
}

function renderJornadaBody(jId,lid){
  const ms=S.partidos.filter(p=>p.jornadaId===jId&&p.finalizado&&p.gA!==null).sort((a,b)=>a.grupo-b.grupo||a.set-b.set);
  if(!ms.length)return`<div class="jc-empty-msg">⏳ Aún no hay resultados</div>`;
  const grupos=[...new Set(ms.map(m=>m.grupo))].sort((a,b)=>a-b);
  return grupos.map(g=>{
    const gms=ms.filter(m=>m.grupo===g);
    return`<div class="grupo-block">
      <div class="grupo-title">GRUPO ${g} · ${esc(gms[0]?.cancha||'')} · ${esc(gms[0]?.turno||'')}</div>
      ${gms.map(m=>{
        const wA=m.gA>m.gB,wB=m.gB>m.gA;
        return`<div style="margin-bottom:.55rem">
          <div class="set-label">Set ${m.set}</div>
          <div class="set-row">
            <div class="set-team-a">
              <div style="font-weight:600;font-size:.82rem">${pFirst(m.a1)}</div>
              <div style="font-size:.7rem;color:var(--muted2)">${pFirst(m.a2)}</div>
            </div>
            <span class="set-sc ${wA?'win':''}">${m.gA}</span>
            <span class="set-dash">—</span>
            <span class="set-sc ${wB?'win':''}">${m.gB}</span>
            <div class="set-team-b">
              <div style="font-weight:600;font-size:.82rem">${pFirst(m.b1)}</div>
              <div style="font-size:.7rem;color:var(--muted2)">${pFirst(m.b2)}</div>
            </div>
          </div>
        </div>`;
      }).join('')}
    </div>`;
  }).join('');
}
