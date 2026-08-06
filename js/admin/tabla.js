import {S, esc, getActiveLiga, calcGlobal, calcPtsJornada} from './state.js';

// ═══ TABLA GENERAL (ADMIN) ═══
export function renderTablaAdmin(){
  const wrap=document.getElementById('tabla-admin-wrap');
  if(!wrap)return;
  const lid=getActiveLiga();
  if(!lid){wrap.innerHTML='';return;}
  const js=S.jornadas.filter(j=>j.liga===lid).sort((a,b)=>a.num-b.num);
  const st=calcGlobal(lid);
  if(!st.length){wrap.innerHTML='<p style="color:var(--muted2);font-size:.85rem">Sin jugadores en esta liga.</p>';return;}
  const thead=`<tr><th>#</th><th>Jugador</th><th>Gr</th>${js.map(j=>`<th>J${j.num}</th>`).join('')}<th class="acc">Total</th></tr>`;
  const body=st.map((s,i)=>{
    const jCells=js.map(j=>{
      const pts=calcPtsJornada(s.player.id,lid,j.id);
      if(pts===null)return`<td style="color:var(--muted)">—</td>`;
      return`<td class="${pts>0?'pv':pts<0?'nv':''}">${pts>0?'+':''}${pts}</td>`;
    }).join('');
    return`<tr class="${i===0?'top1':''}">
      <td class="pos">${i+1}</td>
      <td style="font-weight:600">${esc(s.player.nombre)}</td>
      <td><span class="gr">G${s.player.grupo}</span></td>
      ${jCells}
      <td class="tot ${s.total>=0?'pv':'nv'}">${s.total>0?'+':''}${s.total}</td>
    </tr>`;
  }).join('');
  wrap.innerHTML=`<div class="tabla-scroll"><table class="tabla-general"><thead>${thead}</thead><tbody>${body}</tbody></table></div>`;
}
