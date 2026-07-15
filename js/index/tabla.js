import {S, esc, calcPts, calcGlobal} from './state.js';

// TABLA GENERAL
export function renderTabla(lid){
  const liga=S.ligas.find(l=>l.id===lid);
  const js=S.jornadas.filter(j=>j.liga===lid).sort((a,b)=>a.num-b.num);
  const st=calcGlobal(lid);

  // Headers
  const thead=document.getElementById('tabla-thead');
  if(thead) thead.innerHTML='<tr><th>#</th><th>Jugador</th><th>Gr</th>'+js.map(j=>`<th>J${j.num}</th>`).join('')+'<th class="acc">Total</th></tr>';

  const body=document.getElementById('tabla-body');
  if(!body)return;
  body.innerHTML=st.map((s,i)=>{
    const jCells=js.map(j=>{
      const pts=calcPts(s.player.id,lid,j.id);
      if(pts===null)return`<td style="color:var(--muted)">—</td>`;
      return`<td class="${pts>0?'pv':pts<0?'nv':''}">${pts>0?'+':''}${pts}</td>`;
    }).join('');
    return`<tr class="${i===0?'top1':''}" onclick="openPlayer('${s.player.id}','${lid}')">
      <td class="pos">${i+1}</td>
      <td style="font-weight:600">${esc(s.player.nombre)}</td>
      <td><span class="gr">G${s.player.grupo}</span></td>
      ${jCells}
      <td class="tot ${s.total>=0?'pv':'nv'}">${s.total>0?'+':''}${s.total}</td>
    </tr>`;
  }).join('');
}
