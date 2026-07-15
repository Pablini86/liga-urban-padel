import {S, esc, pById, pShort, calcTotal, calcGlobal, calcPts} from './state.js';

// PLAYER MODAL
export function openPlayer(pid,lid){
  const p=pById(pid);
  if(!p)return;
  const total=calcTotal(pid,lid);
  const js=S.jornadas.filter(j=>j.liga===lid).sort((a,b)=>a.num-b.num);
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
    <div class="cl" style="margin-bottom:.55rem">Historial por jornada</div>
    ${js.map(j=>{
      const pts=calcPts(pid,lid,j.id);
      const bar=pts!==null?`<div style="display:flex;align-items:center;gap:.5rem;margin-top:.25rem"><div class="bar-container" style="height:5px"><div class="bar-fill" style="width:${Math.max(0,Math.min(100,((pts+12)/24)*100))}%;background:${pts>=0?'var(--accent)':'var(--accent2)'}"></div></div></div>`:'';
      return`<div style="display:flex;align-items:center;gap:.65rem;padding:.45rem 0;border-bottom:1px solid var(--border)">
        <span style="font-family:'Bebas Neue',sans-serif;font-size:1rem;color:var(--muted);min-width:24px">J${j.num}</span>
        <span style="font-size:.78rem;color:var(--muted2);flex:1">${esc(j.fecha||'')}</span>
        <span style="font-family:'Bebas Neue',sans-serif;font-size:1.3rem;color:${pts===null?'var(--muted)':pts>=0?'var(--accent)':'var(--accent2)'}">${pts===null?'—':pts>0?'+'+pts:pts}</span>
      </div>`;
    }).join('')}`;

  document.getElementById('player-modal').classList.add('open');
}
export function closeModal(){document.getElementById('player-modal').classList.remove('open');}

document.getElementById('player-modal').addEventListener('click',function(e){if(e.target===this)closeModal();});
