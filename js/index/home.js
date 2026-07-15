import {S, esc, calcGlobal} from './state.js';

export function renderHome(){
  const el=document.getElementById('leagues-grid');
  if(!el)return;
  if(!S.ligas.length){
    el.innerHTML='<div class="empty-state"><div>🎾</div><p>Sin ligas activas</p></div>';
    return;
  }
  const activas=S.ligas.filter(l=>l.status!=='archivada');
  const archivadas=S.ligas.filter(l=>l.status==='archivada');

  const cardActiva=l=>{
    const ps=S.players.filter(p=>p.liga===l.id).length;
    const js=S.jornadas.filter(j=>j.liga===l.id);
    const jornadasCompletas=js.filter(j=>{
      const ms=S.partidos.filter(p=>p.jornadaId===j.id);
      return ms.length>0&&ms.every(m=>m.finalizado&&m.gA!==null);
    });
    const currentJ=jornadasCompletas.length?Math.max(...jornadasCompletas.map(j=>j.num)):0;
    const nextJ=js.find(j=>{
      const ms=S.partidos.filter(p=>p.jornadaId===j.id);
      return ms.length>0&&!ms.some(m=>m.finalizado&&m.gA!==null);
    });
    const jornada_label=nextJ?`Jornada ${nextJ.num} próxima`:(currentJ?`En Jornada ${currentJ}`:'Por comenzar');
    return`<div class="league-card" onclick="openLiga('${l.id}')">
      <div class="lc-status"><span class="lc-dot"></span>En vivo</div>
      <div class="lc-name">${esc(l.nombre)}</div>
      <div class="lc-dia">${esc(l.dia||'')} · ${esc(l.cat||'Mixta')}</div>
      <div style="display:flex;gap:.4rem;flex-wrap:wrap;margin-bottom:.5rem">
        <span class="lc-tag">${ps} jugadores</span>
        <span class="lc-tag" style="background:rgba(0,229,158,.08);color:var(--accent3);border-color:rgba(0,229,158,.2)">${jornada_label}</span>
      </div>
      <div style="font-size:.68rem;color:var(--muted2)">${jornadasCompletas.length}/${l.nj||6} jornadas completadas</div>
      <div class="lc-arrow">→</div>
    </div>`;
  };

  const cardArchivada=l=>{
    const global=calcGlobal(l.id);
    const top3=global.slice(0,3);
    const medals=['🥇','🥈','🥉'];
    return`<div class="league-card" onclick="openLiga('${l.id}')" style="border-color:rgba(255,215,0,.2);opacity:.85">
      <div style="display:flex;align-items:center;gap:.5rem;margin-bottom:.65rem">
        <span style="font-size:.65rem;font-weight:700;letter-spacing:1.5px;color:var(--gold);text-transform:uppercase">Finalizada</span>
        ${l.fechaCierre?`<span style="font-size:.65rem;color:var(--muted2)">${esc(l.fechaCierre)}</span>`:''}
      </div>
      <div class="lc-name" style="font-size:1.4rem">${esc(l.nombre)}</div>
      <div class="lc-dia">${esc(l.dia||'')} · ${esc(l.cat||'Mixta')}</div>
      <div style="margin-top:.65rem;background:rgba(255,215,0,.05);border:1px solid rgba(255,215,0,.15);border-radius:7px;padding:.6rem .75rem">
        <div style="font-size:.58rem;font-weight:700;letter-spacing:2px;color:var(--gold);text-transform:uppercase;margin-bottom:.4rem">Podio</div>
        ${top3.map((x,i)=>`<div style="display:flex;align-items:center;gap:.5rem;padding:.2rem 0;font-size:.8rem">
          <span>${medals[i]}</span>
          <span style="flex:1;font-weight:${i===0?700:400}">${esc(x.player.nombre)}</span>
          <span style="font-family:'Bebas Neue',sans-serif;font-size:1rem;color:${x.total>=0?'var(--accent)':'var(--accent2)'}">${x.total>0?'+':''}${x.total}</span>
        </div>`).join('')}
      </div>
      <div class="lc-arrow" style="color:var(--muted2)">→</div>
    </div>`;
  };

  let html='';
  if(activas.length) html+=activas.map(cardActiva).join('');
  if(archivadas.length){
    if(activas.length) html+=`<div style="font-size:.63rem;font-weight:700;letter-spacing:2px;color:var(--muted);text-transform:uppercase;margin:1.5rem 0 .65rem;grid-column:1/-1">Ligas anteriores</div>`;
    html+=archivadas.map(cardArchivada).join('');
  }
  if(!activas.length&&!archivadas.length) html='<div class="empty-state"><div>🎾</div><p>Sin ligas activas</p></div>';
  el.innerHTML=html;
}
