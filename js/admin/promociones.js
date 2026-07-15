import {S, esc, uid, getActiveLiga, pShort, pFN, calcGroupPos, fsBatch, toast} from './state.js';
import {populateSels} from './selects.js';
import {openM, closeM} from './modal.js';

// ═══ PROMOCIONES ═══
export function renderPromoP(){
  populateSels();
  const lid=getActiveLiga();
  const jSel=document.getElementById('prj');
  if(lid&&jSel){
    const js=S.jornadas.filter(j=>j.liga===lid).sort((a,b)=>b.num-a.num);
    const cur=jSel.value;
    jSel.innerHTML='<option value="">— selecciona —</option>'+js.map(j=>'<option value="'+j.id+'"'+(j.id===cur?' selected':'')+'>J'+j.num+' · '+(j.fecha||'')+'</option>').join('');
    if(!jSel.value&&js.length)jSel.value=js[0].id;
  }
  const jId=document.getElementById('prj')?.value;
  const actEl=document.getElementById('promo-actions');
  const el=document.getElementById('promo-prev');
  if(!lid||!jId){
    el.innerHTML='';
    if(actEl) actEl.style.display='none';
    renderPromoHist(lid);
    return;
  }
  // Check if selected jornada has partidos (played) or is just created (J2 without matches)
  const jornadaHasPartidos=S.partidos.some(p=>p.jornadaId===jId);
  const n=parseInt(document.getElementById('prn')?.value)||1;
  const jornada4promo=S.jornadas.find(j=>j.id===jId);
  const jnum4promo=jornada4promo?.num||1;
  // If jornada has partidos use snapshot, else use current grupo (new jornada)
  const gkey=jornadaHasPartidos?('grupo_j'+jnum4promo):null;
  const grupos=[...new Set(S.players.filter(p=>p.liga===lid).map(p=>(gkey?p[gkey]:null)||p.grupo))].sort((a,b)=>a-b);
  const nextNum=Math.max(...S.jornadas.filter(j=>j.liga===lid).map(j=>j.num),0)+1;

  // Check if this promo already applied
  const existing=S.promociones.find(p=>p.liga===lid&&p.jornadaId===jId);

  el.innerHTML=`<div style="font-size:.63rem;font-weight:700;letter-spacing:2px;color:var(--muted);text-transform:uppercase;margin-bottom:.65rem">
    PREVISUALIZACIÓN — ${n===1?'1 sube · 1 baja':'2 suben · 2 bajan'} por grupo
    ${existing?'<span class="bdg b-ok" style="margin-left:.5rem">YA APLICADA · J'+nextNum+' creada</span>':''}
  </div>
  <div class="gauto">
  ${grupos.map(g=>{
    const st=calcGroupPos(lid,g,jId);
    return '<div style="background:var(--card);border:1px solid var(--border);border-radius:8px;padding:.75rem">'+
      '<div style="font-family:\'Bebas Neue\';font-size:1rem;letter-spacing:1px;margin-bottom:.45rem">GRUPO '+g+' <button class="promo-edit-btn" onclick="editGroupPos(this.dataset.lid,parseInt(this.dataset.g),this.dataset.jid)" data-g="'+g+'" data-lid="'+lid+'" data-jid="'+jId+'" style="font-size:.6rem;padding:1px 5px;border-radius:3px;border:1px solid var(--border2);background:transparent;color:var(--muted2);cursor:pointer">Editar</button></div>'+
      st.map((s,i)=>{
        const isWin=i<n&&g>1,isLose=i>=st.length-n&&g<grupos.length;
        const rankColor=isWin?'var(--accent3)':isLose?'var(--accent2)':'var(--muted)';
        const ptsColor=s.pts>=0?'var(--accent)':'var(--accent2)';
        const ptsStr=(s.pts>0?'+':'')+s.pts;
        const badge=isWin?'<span class="bdg b-up">↑G'+(g-1)+'</span>':isLose?'<span class="bdg b-dn">↓G'+(g+1)+'</span>':'<span class="bdg b-eq">—</span>';
        const supTag=s.ausente?'<span style="font-size:.6rem;color:var(--muted2);margin-left:2px">[SUP]</span>':'';
        const bebas="font-family:'Bebas Neue'";
        return '<div style="display:flex;align-items:center;gap:.45rem;padding:.22rem 0;font-size:.78rem">'+
          '<span style="'+bebas+';color:'+rankColor+';min-width:16px">'+(i+1)+'</span>'+
          '<span style="flex:1">'+esc(s.player.nombre)+'</span>'+supTag+
          '<span style="color:'+ptsColor+';font-weight:600">'+ptsStr+'</span>'+
          badge+'</div>';
      }).join('')+
    '</div>';
  }).join('')}
  </div>`;

  // Show next jornada info
  if(actEl){
    if(!existing){
      actEl.style.display='block';
      const ni=document.getElementById('promo-next-info');
      if(ni) ni.textContent='Se creará la Jornada '+nextNum;
    } else {
      actEl.style.display='none';
      const created=document.getElementById('promo-created');
      if(created){
        const j=S.jornadas.find(x=>x.liga===lid&&x.num===nextNum);
        if(j){
          const gps=S.players.filter(p=>p.liga===lid);
          const newGrupos=[...new Set(gps.map(p=>p.grupo))].sort((a,b)=>a-b);
          const gruposHtml2=newGrupos.map(g=>{
            const members=gps.filter(p=>p.grupo===g).sort((a,b)=>(a.orden||0)-(b.orden||0));
            return '<div style="background:var(--card2);border:1px solid var(--border);border-radius:7px;padding:.5rem .7rem;min-width:140px">'+
              '<div style="font-family:Bebas Neue,sans-serif;font-size:.85rem;color:var(--accent);margin-bottom:.3rem">G'+g+'</div>'+
              members.map(p=>'<div style="font-size:.72rem">'+pShort(p.nombre)+'</div>').join('')+
            '</div>';
          }).join('');
          created.style.display='block';
          created.innerHTML=
            '<div style="background:rgba(0,229,158,.05);border:1px solid rgba(0,229,158,.2);border-radius:10px;padding:1rem 1.2rem;margin-top:.75rem">'+
            '<div style="font-weight:700;color:var(--accent3);margin-bottom:.6rem">Jornada '+nextNum+' creada</div>'+
            '<div style="font-size:.72rem;font-weight:700;letter-spacing:2px;color:var(--muted);text-transform:uppercase;margin-bottom:.6rem">Grupos J'+nextNum+'</div>'+
            '<div style="display:flex;flex-wrap:wrap;gap:.5rem;margin-bottom:1rem">'+gruposHtml2+'</div>'+
            '<div style="display:flex;gap:.65rem;flex-wrap:wrap">'+
            '<button class="btn bp bsm" data-lid="'+lid+'" data-num="'+nextNum+'" onclick="goToJornada(this.dataset.lid,parseInt(this.dataset.num))">Asignar Horarios J'+nextNum+'</button>'+
            '</div></div>';
        }
      }
    }
  }
  renderPromoHist(lid);
  // Wire edit buttons

}

export async function applyAndCreateJornada(){
  const lid=getActiveLiga();
  const jId=document.getElementById('prj')?.value;
  const n=parseInt(document.getElementById('prn')?.value)||1;
  if(!lid||!jId){toast('Selecciona liga y jornada',1);return;}

  // Check not already applied
  if(S.promociones.find(p=>p.liga===lid&&p.jornadaId===jId)){
    toast('Esta jornada ya tiene promoción aplicada',1);return;
  }

  const grupos=[...new Set(S.players.filter(p=>p.liga===lid).map(p=>p.grupo))].sort((a,b)=>a-b);
  const moves=[];
  grupos.forEach(g=>{
    const st=calcGroupPos(lid,g,jId);
    st.slice(0,n).forEach(s=>{if(g>1)moves.push({pid:s.player.id,from:g,to:g-1,dir:'up'});});
    st.slice(-n).forEach(s=>{if(g<grupos.length)moves.push({pid:s.player.id,from:g,to:g+1,dir:'down'});});
  });

  if(!confirm('¿Aplicar promociones y crear la siguiente jornada?'))return;

  const ops=[];

  // 1. Apply group changes to players - save snapshots
  const newGroups={};
  moves.forEach(mv=>{newGroups[mv.pid]=mv.to;});
  const jornadaRef2=S.jornadas.find(j=>j.id===jId);
  const currentJNum2=jornadaRef2?.num||1;
  const nextNum2a=Math.max(...S.jornadas.filter(j=>j.liga===lid).map(j=>j.num),0)+1;
  S.players.filter(p=>p.liga===lid).forEach(p=>{
    const newG=newGroups[p.id]||p.grupo;
    const updated={...p,
      ['grupo_j'+currentJNum2]:p.grupo,
      ['grupo_j'+nextNum2a]:newG,
      grupo:newG
    };
    ops.push({op:'set',col:'players',id:p.id,data:updated});
  });

  // 2. Reorder within new groups
  const byNewGroup={};
  S.players.filter(p=>p.liga===lid).forEach(p=>{
    const g=newGroups[p.id]||p.grupo;
    if(!byNewGroup[g])byNewGroup[g]=[];
    byNewGroup[g].push({...p,grupo:g});
  });

  // 3. Save promotion record
  const promo={id:uid(),liga:lid,jornadaId:jId,n,moves,fecha:new Date().toISOString().slice(0,10),applied:true};
  ops.push({op:'set',col:'promociones',id:promo.id,data:promo});

  // 4. Create new jornada (empty, no matches yet)
  const nextNum=Math.max(...S.jornadas.filter(j=>j.liga===lid).map(j=>j.num),0)+1;
  const jornada=S.jornadas.find(j=>j.id===jId);
  const newJId=uid();
  const newJ={id:newJId,liga:lid,num:nextNum,fecha:'',canchas:jornada?.canchas||6,turnos:jornada?.turnos||['18:00','19:15','20:30','21:45']};
  ops.push({op:'set',col:'jornadas',id:newJId,data:newJ});

  await fsBatch(ops);
  toast('✓ Promociones aplicadas · Jornada '+nextNum+' creada');

  // Show groups preview
  const created2=document.getElementById('promo-created');
  if(created2){
    const gps=S.players.filter(p=>p.liga===lid);
    const newGrupos=[...new Set(gps.map(p=>p.grupo))].sort((a,b)=>a-b);
    const gHtml=newGrupos.map(g=>{
      const members=gps.filter(p=>p.grupo===g).sort((a,b)=>(a.orden||0)-(b.orden||0));
      return '<div style="background:var(--card2);border:1px solid var(--border);border-radius:7px;padding:.5rem .7rem;min-width:140px">'+
        '<div style="font-family:Bebas Neue,sans-serif;font-size:.85rem;color:var(--accent);margin-bottom:.3rem">G'+g+'</div>'+
        members.map(p=>'<div style="font-size:.72rem">'+pShort(p.nombre)+'</div>').join('')+
      '</div>';
    }).join('');
    created2.style.display='block';
    created2.innerHTML=
      '<div style="background:rgba(0,229,158,.05);border:1px solid rgba(0,229,158,.2);border-radius:10px;padding:1rem 1.2rem;margin-top:.75rem">'+
      '<div style="font-weight:700;color:var(--accent3);margin-bottom:.6rem">Jornada '+nextNum+' creada</div>'+
      '<div style="font-size:.72rem;font-weight:700;letter-spacing:2px;color:var(--muted);text-transform:uppercase;margin-bottom:.6rem">Grupos J'+nextNum+'</div>'+
      '<div style="display:flex;flex-wrap:wrap;gap:.5rem;margin-bottom:1rem">'+gHtml+'</div>'+
      '<button class="btn bp bsm" data-lid="'+lid+'" data-num="'+nextNum+'" onclick="goToJornada(this.dataset.lid,parseInt(this.dataset.num))">Asignar Horarios J'+nextNum+'</button>'+
      '</div>';
  }

  // Show quick actions
  const created=document.getElementById('promo-created');
  if(created){
    created.style.display='block';
    created.innerHTML=`<div style="background:rgba(0,229,158,.05);border:1px solid rgba(0,229,158,.2);border-radius:10px;padding:1rem 1.2rem;margin-top:.75rem">
      <div style="font-weight:700;color:var(--accent3);margin-bottom:.6rem">✓ Jornada ${nextNum} creada — grupos actualizados</div>
      <p style="font-size:.78rem;color:var(--muted2);margin-bottom:.75rem">${moves.filter(m=>m.dir==='up').length} jugadores subieron · ${moves.filter(m=>m.dir==='down').length} bajaron</p>
      <div style="display:flex;gap:.65rem;flex-wrap:wrap">
        <button class="btn bp bsm" onclick="goToJornada('${lid}',${nextNum})">Asignar Horarios J${nextNum}</button>
        <button class="btn bs bsm" onclick="goToImprimir('${lid}','${newJId}')">Imprimir</button>
      </div>
    </div>`;
  }
  document.getElementById('promo-actions').style.display='none';
  renderPromoHist(lid);
  // Switch dropdown to show J2 and re-render promo
  setTimeout(()=>{
    const prjEl=document.getElementById('prj');
    if(prjEl){
      // Find the new jornada
      const newJ=S.jornadas.find(j=>j.liga===lid&&j.num===nextNum);
      if(newJ) prjEl.value=newJ.id;
    }
    renderPromoP();
  }, 800);
}

export function editGroupPos(lid,g,jId){
  const grupos=[...new Set(S.players.filter(p=>p.liga===lid).map(p=>p.grupo))].sort((a,b)=>a-b);
  const jornada=S.jornadas.find(j=>j.id===jId);
  const jnum=jornada?.num||1;
  const gkey='grupo_j'+jnum;
  const hasPartidos=S.partidos.some(p=>p.jornadaId===jId);

  // Get players for this group using snapshot
  const st=calcGroupPos(lid,g,jId);
  const inner=document.querySelector('#m-liga .modal');
  if(!inner)return;

  inner.innerHTML='<button class="mc" onclick="closeM(\'m-liga\');renderPromoP()">&#x2715;</button>'+
    '<h2>EDITAR <em>GRUPO '+g+'</em></h2>'+
    '<p style="font-size:.76rem;color:var(--muted2);margin-bottom:.85rem">Cambia el grupo de un jugador con el dropdown. Si intercambias con otro grupo, ese jugador vendrá aquí automáticamente.</p>'+
    '<div class="dlist" id="edit-group-list">'+
      st.map((s,i)=>{
        return '<div class="di" data-pid="'+s.player.id+'" data-orig-grupo="'+g+'">'+
          '<span class="pos-num" style="font-family:Bebas Neue;font-size:.95rem;color:var(--muted);min-width:20px">'+(i+1)+'</span>'+
          '<div class="pav">'+esc(s.player.nombre[0])+'</div>'+
          '<span style="flex:1;font-size:.82rem;font-weight:500">'+esc(s.player.nombre)+'</span>'+
          '<span style="font-size:.72rem;color:'+(s.pts>=0?'var(--accent)':'var(--accent2)')+';margin-right:.5rem">'+(s.pts>0?'+':'')+s.pts+'</span>'+
          '<select data-pid="'+s.player.id+'" onchange="onGrupoSelectChange(this,'+g+',\''+jId+'\')" style="background:var(--card2);border:1px solid var(--border2);border-radius:5px;color:var(--text);font-family:Outfit,sans-serif;font-size:.72rem;padding:2px 4px;width:60px">'+
            grupos.map(gr=>'<option value="'+gr+'"'+(gr===g?' selected':'')+'>G'+gr+'</option>').join('')+
          '</select>'+
        '</div>';
      }).join('')+
    '</div>'+
    '<div style="font-size:.7rem;color:var(--muted2);margin-top:.5rem">Al cambiar un jugador de grupo, el último jugador del grupo destino vendrá a ocupar su lugar.</div>'+
    '<div class="brow" style="margin-top:.85rem">'+
      '<button class="btn bp bsm" data-lid="'+lid+'" data-g="'+g+'" onclick="saveGroupEdit(this.dataset.lid,parseInt(this.dataset.g))">Guardar</button>'+
      '<button class="btn bs bsm" onclick="closeM(\'m-liga\');renderPromoP()">Cancelar</button>'+
    '</div>';

  openM('m-liga');
}

export function onGrupoSelectChange(sel, grupoOrigen, jId){
  const lid=getActiveLiga();
  const newGrupo=parseInt(sel.value);
  const pid=sel.dataset.pid;

  // Remove any existing swap row
  const existing=document.getElementById('swap-row');
  if(existing)existing.remove();

  if(newGrupo===grupoOrigen)return;

  // Show dropdown to pick who comes in exchange - show ALL players from other groups
  const lid2=getActiveLiga();
  const allOtherPlayers=S.players.filter(p=>p.liga===lid2&&p.grupo!==grupoOrigen).sort((a,b)=>a.grupo-b.grupo||(a.orden||0)-(b.orden||0));

  const swapRow=document.createElement('div');
  swapRow.id='swap-row';
  swapRow.style.cssText='background:rgba(0,229,158,.06);border:1px solid rgba(0,229,158,.2);border-radius:8px;padding:.65rem .85rem;margin-top:.5rem;display:flex;align-items:center;gap:.65rem;flex-wrap:wrap';
  swapRow.innerHTML=
    '<span style="font-size:.75rem;color:var(--accent3);font-weight:600;width:100%">↔ ¿Quién viene a G'+grupoOrigen+' desde G'+newGrupo+'?</span>'+
    '<select id="swap-player-sel" style="flex:1;background:var(--card2);border:1px solid var(--accent3);border-radius:5px;color:var(--text);font-family:Outfit,sans-serif;font-size:.8rem;padding:4px 6px">'+
      allOtherPlayers.map(p=>'<option value="'+p.id+'"'+(p.grupo===newGrupo?' selected':'')+'>G'+p.grupo+' · '+esc(p.nombre)+'</option>').join('')+
    '</select>';

  // Insert after the list
  const list=document.getElementById('edit-group-list');
  list.parentNode.insertBefore(swapRow, list.nextSibling);
}

// NOTA: función histórica sin uso (nada la invoca) — se conserva tal cual.
function updGroupEdit(){
  document.querySelectorAll('#edit-group-list .di').forEach((item,i)=>{
    item.querySelectorAll('span')[1].textContent=i+1;
  });
}

export async function saveGroupEdit(lid,g){
  const items=[...document.querySelectorAll('#edit-group-list .di')];
  if(!items.length){toast('Sin jugadores',1);return;}
  const jId=document.getElementById('prj')?.value;
  const jornada=S.jornadas.find(j=>j.id===jId);
  if(!jId||!jornada){toast('Selecciona una jornada',1);return;}

  // Build final group assignment from modal state
  // key: pid, value: new group
  const finalGroups={};
  items.forEach(item=>{
    const sel=item.querySelector('select');
    if(sel) finalGroups[item.dataset.pid]=parseInt(sel.value);
  });
  // Add swap player
  const swapSel=document.getElementById('swap-player-sel');
  if(swapSel?.value) finalGroups[swapSel.value]=g;

  // Detect affected groups
  const affected=new Set([g]);
  Object.entries(finalGroups).forEach(([pid,newG])=>{
    affected.add(newG);
    const p=S.players.find(x=>x.id===pid);
    if(p) affected.add(p.grupo);
  });

  closeM('m-liga');

  // Cancha map
  const canchaMap={};
  S.partidos.filter(m=>m.jornadaId===jId).forEach(m=>{
    if(!canchaMap[m.grupo])canchaMap[m.grupo]={cancha:m.cancha,turno:m.turno};
  });

  // Build updated player map using finalGroups
  const updMap={};
  S.players.filter(p=>p.liga===lid).forEach(p=>updMap[p.id]={...p});
  Object.entries(finalGroups).forEach(([pid,newG])=>{
    if(updMap[pid]) updMap[pid].grupo=newG;
  });

  // Recalc orden
  affected.forEach(grp=>{
    const gps=Object.values(updMap).filter(p=>p.liga===lid&&p.grupo===grp).sort((a,b)=>(a.orden||0)-(b.orden||0));
    gps.forEach((p,i)=>updMap[p.id].orden=(grp-1)*4+i);
  });

  const ops=[];
  // Save all players that changed
  Object.entries(finalGroups).forEach(([pid,newG])=>{
    const p=updMap[pid];if(!p)return;
    const snap={};snap['grupo_j'+jornada.num]=newG;
    ops.push({op:'set',col:'players',id:pid,data:{...p,...snap}});
  });
  // Delete old partidos
  S.partidos.filter(m=>m.jornadaId===jId&&affected.has(m.grupo)).forEach(m=>{
    ops.push({op:'del',col:'partidos',id:m.id});
  });
  // Regenerate
  affected.forEach(grp=>{
    const gps=Object.values(updMap).filter(p=>p.liga===lid&&p.grupo===grp).sort((a,b)=>(a.orden||0)-(b.orden||0));
    if(gps.length<4){toast('G'+grp+' tiene '+gps.length+' jugadores',1);return;}
    const ct=canchaMap[grp]||{cancha:'C1',turno:'18:00'};
    const [p1,p2,p3,p4]=gps;
    [[p1,p2,p3,p4],[p1,p3,p2,p4],[p1,p4,p2,p3]].forEach(([a1,a2,b1x,b2x],si)=>{
      const mid=uid();
      ops.push({op:'set',col:'partidos',id:mid,data:{id:mid,liga:lid,jornadaId:jId,jornada:jornada.num,grupo:grp,set:si+1,turno:ct.turno,cancha:ct.cancha,a1:a1.id,a2:a2.id,b1:b1x.id,b2:b2x.id,gA:null,gB:null,finalizado:false,ausente:false}});
    });
  });

  await fsBatch(ops);
  toast('Grupos actualizados');
  renderPromoP();
}

export function renderPromoHist(lid){
  const el=document.getElementById('promo-hist');
  if(!el||!lid)return;
  const hist=S.promociones.filter(p=>p.liga===lid).sort((a,b)=>b.fecha.localeCompare(a.fecha));
  if(!hist.length){el.innerHTML='';return;}
  el.innerHTML='<div class="cl" style="margin-bottom:.55rem">HISTORIAL</div>'+
    hist.map(h=>{
      const j=S.jornadas.find(x=>x.id===h.jornadaId);
      const ups=h.moves.filter(m=>m.dir==='up');
      const dns=h.moves.filter(m=>m.dir==='down');
      return`<div style="background:var(--card);border:1px solid var(--border);border-radius:8px;padding:.75rem 1rem;margin-bottom:.5rem">
        <div style="font-size:.72rem;font-weight:700;margin-bottom:.5rem">J${j?.num||'?'} → J${(j?.num||0)+1} · ${h.fecha} · ${h.n} por grupo</div>
        <div style="display:flex;flex-wrap:wrap;gap:.25rem;margin-bottom:.3rem">
          ${ups.map(m=>'<span style="background:rgba(0,229,158,.08);border:1px solid rgba(0,229,158,.2);border-radius:4px;padding:1px 7px;font-size:.72rem;color:var(--accent3)">↑ '+pFN(m.pid)+' G'+m.from+'→G'+m.to+'</span>').join('')}
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:.25rem">
          ${dns.map(m=>'<span style="background:rgba(255,59,92,.08);border:1px solid rgba(255,59,92,.2);border-radius:4px;padding:1px 7px;font-size:.72rem;color:var(--accent2)">↓ '+pFN(m.pid)+' G'+m.from+'→G'+m.to+'</span>').join('')}
        </div>
      </div>`;
    }).join('');
}
