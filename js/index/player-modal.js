import {S, esc, pById, pShort, pFirst, calcTotal, calcGlobal, calcPts} from './state.js';

// PLAYER MODAL
export function openPlayer(pid,lid){
  const p=pById(pid);
  if(!p)return;
  const total=calcTotal(pid,lid);
  const st=calcGlobal(lid);
  const rank=st.findIndex(x=>x.player.id===pid)+1;

  document.getElementById('modal-content').innerHTML=`
    <h2>${pShort(p.nombre)} <em>${esc(p.nombre.split(' ').slice(1).join(' '))}</em></h2>
    <div style="display:flex;gap:.65rem;flex-wrap:wrap;margin-bottom:1.1rem">
      <span style="font-size:.75rem;color:var(--muted2)">Grupo ${p.grupo} · ${esc(p.cat||'')}</span>
      <span style="font-size:.75rem;color:var(--accent);font-weight:700">#${rank} en tabla</span>
    </div>
    <div style="display:flex;gap:.65rem;margin-bottom:1.2rem">
      <div style="flex:1;background:var(--card);border:1px solid var(--border);border-radius:8px;padding:.75rem;text-align:center">
        <div style="font-size:.62rem;font-weight:700;letter-spacing:1.5px;color:var(--muted);text-transform:uppercase;margin-bottom:.25rem">Total</div>
        <div style="font-family:'Bebas Neue',sans-serif;font-size:2.2rem;color:${total>=0?'var(--accent)':'var(--accent2)'}">${total>0?'+':''}${total}</div>
      </div>
      <div style="flex:1;background:var(--card);border:1px solid var(--border);border-radius:8px;padding:.75rem;text-align:center">
        <div style="font-size:.62rem;font-weight:700;letter-spacing:1.5px;color:var(--muted);text-transform:uppercase;margin-bottom:.25rem">Ranking</div>
        <div style="font-family:'Bebas Neue',sans-serif;font-size:2.2rem;color:var(--text)">#${rank}</div>
      </div>
    </div>
    <div class="liga-tabs" style="margin-bottom:1rem">
      <button class="pmt active" id="pm-tab-resumen" onclick="switchPlayerTab('resumen')">Resumen</button>
      <button class="pmt" id="pm-tab-resultados" onclick="switchPlayerTab('resultados')">Resultados</button>
    </div>
    <div id="pm-panel-resumen"></div>
    <div id="pm-panel-resultados" style="display:none"></div>`;

  renderPlayerResumen(pid,lid);
  renderPlayerResultados(pid,lid);
  document.getElementById('player-modal').classList.add('open');
}

export function switchPlayerTab(tab){
  const resumen=document.getElementById('pm-panel-resumen');
  const resultados=document.getElementById('pm-panel-resultados');
  if(!resumen||!resultados)return;
  resumen.style.display=tab==='resumen'?'':'none';
  resultados.style.display=tab==='resultados'?'':'none';
  document.getElementById('pm-tab-resumen').classList.toggle('active',tab==='resumen');
  document.getElementById('pm-tab-resultados').classList.toggle('active',tab==='resultados');
}

function renderPlayerResumen(pid,lid){
  const js=S.jornadas.filter(j=>j.liga===lid).sort((a,b)=>a.num-b.num);
  document.getElementById('pm-panel-resumen').innerHTML=`
    <div class="cl" style="margin-bottom:.55rem">Historial por jornada</div>
    ${js.map(j=>{
      const pts=calcPts(pid,lid,j.id);
      return`<div style="display:flex;align-items:center;gap:.65rem;padding:.45rem 0;border-bottom:1px solid var(--border)">
        <span style="font-family:'Bebas Neue',sans-serif;font-size:1rem;color:var(--muted);min-width:24px">J${j.num}</span>
        <span style="font-size:.78rem;color:var(--muted2);flex:1">${esc(j.fecha||'')}</span>
        <span style="font-family:'Bebas Neue',sans-serif;font-size:1.3rem;color:${pts===null?'var(--muted)':pts>=0?'var(--accent)':'var(--accent2)'}">${pts===null?'—':pts>0?'+'+pts:pts}</span>
      </div>`;
    }).join('')}`;
}

function renderPlayerResultados(pid,lid){
  const nm=id=>`<span style="${id===pid?'color:var(--accent)':''}">${pFirst(id)}</span>`;
  const js=S.jornadas.filter(j=>j.liga===lid).sort((a,b)=>b.num-a.num);
  const blocks=js.map(j=>{
    const ms=S.partidos.filter(m=>m.jornadaId===j.id&&m.finalizado&&m.gA!==null&&[m.a1,m.a2,m.b1,m.b2].includes(pid)).sort((a,b)=>a.set-b.set);
    if(!ms.length)return'';
    // Modo directo no guarda scores reales por set (gA/gB quedan en 7-6 de relleno) —
    // el diferencial real vive en direct_j_<jornadaId> del jugador, así que se muestra aparte.
    const isDirect=ms[0].directMode;
    const body=isDirect?`<div style="text-align:center;padding:.5rem 0 .2rem">
        <div style="font-size:.62rem;font-weight:700;letter-spacing:1.5px;color:var(--muted);text-transform:uppercase;margin-bottom:.3rem">Diferencial capturado</div>
        <div style="font-family:'Bebas Neue',sans-serif;font-size:1.8rem;color:${directPts(pid,j.id)>=0?'var(--accent)':'var(--accent2)'}">${directPts(pid,j.id)>0?'+':''}${directPts(pid,j.id)}</div>
      </div>`:ms.map(m=>{
        const wA=m.gA>m.gB,wB=m.gB>m.gA;
        return`<div style="margin-bottom:.55rem">
          <div class="set-label">Set ${m.set}</div>
          <div class="set-row">
            <div class="set-team-a">
              <div style="font-weight:600;font-size:.82rem">${nm(m.a1)}</div>
              <div style="font-size:.7rem;color:var(--muted2)">${nm(m.a2)}</div>
            </div>
            <span class="set-sc ${wA?'win':''}">${m.gA}</span>
            <span class="set-dash">—</span>
            <span class="set-sc ${wB?'win':''}">${m.gB}</span>
            <div class="set-team-b">
              <div style="font-weight:600;font-size:.82rem">${nm(m.b1)}</div>
              <div style="font-size:.7rem;color:var(--muted2)">${nm(m.b2)}</div>
            </div>
          </div>
        </div>`;
      }).join('');
    return`<div class="jornada-card" style="margin-bottom:.7rem">
      <div class="jc-header" style="cursor:default">
        <div>
          <div class="jc-title">JORNADA ${j.num}</div>
          <div class="jc-meta">${esc(j.fecha||'')}</div>
        </div>
        <span class="jc-badge" style="background:rgba(212,240,0,.08);color:var(--accent)">GRUPO ${ms[0].grupo}</span>
      </div>
      <div class="jc-body open">
        <div class="grupo-block">${body}</div>
      </div>
    </div>`;
  }).filter(Boolean).join('');
  document.getElementById('pm-panel-resultados').innerHTML=blocks||`<p style="color:var(--muted2);font-size:.82rem;padding:.5rem 0">Sin resultados capturados todavía.</p>`;
}
function directPts(pid,jid){const p=pById(pid);const v=p?p['direct_j_'+jid]:undefined;return v!==undefined?v:0;}

export function closeModal(){document.getElementById('player-modal').classList.remove('open');}

document.getElementById('player-modal').addEventListener('click',function(e){if(e.target===this)closeModal();});
