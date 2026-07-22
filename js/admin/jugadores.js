import {S, esc, uid, getActiveLiga, pById, fsSet, fsDel, fsBatch, toast} from './state.js';

export async function addP(){const n=document.getElementById('pn').value.trim();if(!n){toast('Escribe nombre',1);return;}const liga=getActiveLiga();if(!liga){toast('Selecciona liga',1);return;}const ps=S.players.filter(p=>p.liga===liga);const p={id:uid(),nombre:n,cat:document.getElementById('pc').value,liga,tel:document.getElementById('pt').value,orden:ps.length,grupo:Math.floor(ps.length/4)+1,ausente:false};await fsSet('players',p.id,p);document.getElementById('pn').value='';document.getElementById('pt').value='';toast('✓ Jugador agregado');}
export async function delP(id){
  const p=pById(id);
  const enPartidos=S.partidos.some(m=>[m.a1,m.a2,m.b1,m.b2].includes(id));
  if(enPartidos){
    if(!confirm('Este jugador ya tiene grupos/partidos generados. Si lo eliminas, esos partidos se van a quedar con "?" en vez de su nombre.\n\n¿Seguro que quieres eliminarlo?\n\nTip: si es porque va a entrar alguien nuevo en su lugar, mejor cancela y usa el botón "Reemplazar" (⇄) — así no se rompen los partidos ya armados.'))return;
  } else if(!confirm('¿Eliminar a '+(p?p.nombre:'este jugador')+'?')){
    return;
  }
  await fsDel('players',id);
  toast('Eliminado');
}

// Encuentra jugadores que ya no existen como ficha pero siguen referenciados
// en partidos generados (a1/a2/b1/b2) — quedan mostrando "?" en resultados.
// Incluye su grupo y compañeros (los que sí se resuelven) para poder
// identificar de quién se trata al reemplazarlo.
export function findOrphanPlayerIds(){
  const lid=getActiveLiga();
  const knownIds=new Set(S.players.map(p=>p.id));
  const orphanIds=new Set();
  S.partidos.filter(m=>m.liga===lid).forEach(m=>{
    [m.a1,m.a2,m.b1,m.b2].forEach(pid=>{if(pid&&!knownIds.has(pid))orphanIds.add(pid);});
  });
  return [...orphanIds].map(id=>{
    const m=S.partidos.find(x=>x.liga===lid&&[x.a1,x.a2,x.b1,x.b2].includes(id));
    const grupo=m?m.grupo:null;
    const compIds=grupo!=null?[...new Set(S.partidos.filter(x=>x.liga===lid&&x.grupo===grupo).flatMap(x=>[x.a1,x.a2,x.b1,x.b2]))].filter(x=>x!==id):[];
    const companeros=compIds.map(cid=>S.players.find(p=>p.id===cid)).filter(Boolean).map(p=>p.nombre);
    return {id,grupo,companeros};
  });
}

// Reutiliza el mismo ID (de un jugador activo o de uno ya eliminado pero
// referenciado en partidos) asignándole los datos del jugador nuevo. Como los
// partidos guardan el ID y no el nombre, esto los "repara" sin tener que
// reescribir cada partido. Si el jugador nuevo ya se había agregado por
// separado (ficha con ID distinto y sin partidos todavía), permite elegirlo
// de una lista y elimina esa ficha duplicada en el mismo paso.
export async function reemplazarJugador(id){
  const p=pById(id);
  const orphanInfo=!p?findOrphanPlayerIds().find(o=>o.id===id):null;
  const liga=p?p.liga:getActiveLiga();
  const grupo=p?p.grupo:(orphanInfo?.grupo||1);
  const actual=p?p.nombre:'(jugador ya eliminado)';
  const contexto='Grupo '+grupo+(orphanInfo?.companeros.length?' — juega con: '+orphanInfo.companeros.join(', '):'');

  // Candidatos: jugadores de esta liga ya agregados pero que aún no están en ningún partido
  const enPartidoIds=new Set(S.partidos.filter(x=>x.liga===liga).flatMap(x=>[x.a1,x.a2,x.b1,x.b2]));
  const candidatos=S.players.filter(x=>x.liga===liga&&x.id!==id&&!enPartidoIds.has(x.id));

  let nombre=null,dup=null;
  if(candidatos.length){
    const lista=candidatos.map((c,i)=>(i+1)+'. '+c.nombre).join('\n');
    const resp=prompt('Reemplazar a '+actual+'\n'+contexto+'\n\nEscribe el número del jugador que ya agregaste y entra en su lugar, o escribe su nombre si aún no lo has agregado:\n\n'+lista);
    if(!resp||!resp.trim())return;
    const n=parseInt(resp.trim());
    if(!isNaN(n)&&candidatos[n-1]){dup=candidatos[n-1];nombre=dup.nombre;}
    else nombre=resp.trim();
  } else {
    const resp=prompt('Reemplazar a '+actual+' ('+contexto+') por (nombre del jugador nuevo):',p?p.nombre:'');
    if(!resp||!resp.trim())return;
    nombre=resp.trim();
  }

  if(!confirm('¿Reemplazar a '+actual+' por "'+nombre+'"?\n\nConserva su grupo, cancha y horario ya asignados.'+(dup?'\n\nSe eliminará la ficha duplicada de "'+dup.nombre+'" que ya existía.':'')))return;

  const ps=S.players.filter(x=>x.liga===liga);
  const base=p||dup||{cat:'Avanzado',tel:'',orden:ps.length,ausente:false};
  const data={...base,id,nombre,liga,grupo};
  Object.keys(data).forEach(k=>{if(k.startsWith('ausente_j_')||k.startsWith('direct_j_'))delete data[k];});
  const ops=[{op:'set',col:'players',id,data}];
  if(dup)ops.push({op:'del',col:'players',id:dup.id});
  // Por si además ya existía otra ficha manual con el mismo nombre
  const otroDup=S.players.find(x=>x.liga===liga&&x.id!==id&&x.id!==dup?.id&&x.nombre.trim().toLowerCase()===nombre.toLowerCase());
  if(otroDup&&confirm('Ya existe otra ficha con el nombre "'+nombre+'". ¿Eliminarla para no duplicar?')){
    ops.push({op:'del',col:'players',id:otroDup.id});
  }
  await fsBatch(ops);
  toast('✓ Jugador reemplazado');
}
export async function editPNombre(id){
  const p=pById(id);if(!p)return;
  const nuevo=prompt('Editar nombre:',p.nombre);
  if(!nuevo||nuevo.trim()===p.nombre)return;
  await fsSet('players',id,{...p,nombre:nuevo.trim()});
  toast('Nombre actualizado');
}
export function renderPlist(){
  const el=document.getElementById('plist');
  if(!el)return;
  const lid=getActiveLiga();
  const ps=S.players.filter(p=>p.liga===lid);
  const orphans=findOrphanPlayerIds();
  if(!ps.length&&!orphans.length){el.innerHTML='<p style="color:var(--muted2);font-size:.78rem">Sin jugadores</p>';return;}
  const byG={};
  ps.forEach(p=>{if(!byG[p.grupo])byG[p.grupo]=[];byG[p.grupo].push(p);});
  const grupos=Object.keys(byG).map(Number).sort((a,b)=>a-b);
  const incompletos=grupos.filter(g=>byG[g].length!==4);
  var html='';
  if(orphans.length){
    html+='<div style="background:rgba(255,59,92,.08);border:1px solid rgba(255,59,92,.3);border-radius:8px;padding:.65rem .9rem;margin-bottom:.85rem;font-size:.76rem;color:var(--accent2)">'+
      '<b>Jugadores pendientes de reemplazo</b> — hay '+orphans.length+' jugador(es) eliminado(s) que siguen asignados a partidos ya generados. Sus nombres se muestran como "?" en resultados. Usa "Reemplazar" para ponerles el nombre del jugador nuevo sin perder el grupo/horario ya armado:'+
      '<div style="margin-top:.5rem;display:flex;flex-direction:column;gap:.35rem">'+
      orphans.map(o=>'<div style="display:flex;align-items:center;gap:.6rem;flex-wrap:wrap">'+
        '<span>Grupo '+(o.grupo??'?')+(o.companeros.length?' — con '+o.companeros.map(esc).join(', '):'')+'</span>'+
        '<button class="btn bs bsm" data-pid="'+o.id+'" onclick="reemplazarJugador(this.dataset.pid)">⇄ Reemplazar</button>'+
      '</div>').join('')+
      '</div></div>';
  }
  if(incompletos.length){
    html+='<div style="background:rgba(255,59,92,.08);border:1px solid rgba(255,59,92,.3);border-radius:8px;padding:.65rem .9rem;margin-bottom:.85rem;font-size:.76rem;color:var(--accent2)">'+
      '<b>Grupos incompletos</b> — cada grupo debe tener exactamente 4 jugadores para generar partidos: '+
      incompletos.map(g=>'Grupo '+g+' ('+byG[g].length+')').join(', ')+
    '</div>';
  }
  html+='<div style="font-size:.72rem;color:var(--muted2);margin-bottom:.7rem">'+ps.length+' jugadores · '+grupos.length+' grupos</div>';
  html+='<div id="plist-groups" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:.6rem">';
  grupos.forEach(g=>{
    const list=byG[g];
    const complete=list.length===4;
    html+='<div class="pgroup" data-grupo="'+g+'" style="background:var(--card2);border:1px solid var(--border);border-radius:10px;padding:.7rem .8rem">';
    html+='<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:.5rem">'+
      '<span style="font-family:\'Bebas Neue\',sans-serif;font-size:.95rem;letter-spacing:1px;color:var(--accent)">GRUPO '+g+'</span>'+
      '<span style="font-size:.62rem;font-weight:700;padding:.12rem .45rem;border-radius:20px;background:'+(complete?'rgba(0,229,158,.1)':'rgba(255,59,92,.1)')+';color:'+(complete?'var(--accent3)':'var(--accent2)')+'">'+list.length+'/4</span>'+
    '</div>';
    html+='<div style="display:flex;flex-direction:column;gap:.25rem">';
    list.forEach(function(p){
      html+='<div class="prow" data-name="'+esc(p.nombre.toLowerCase())+'" style="display:flex;align-items:center;gap:.5rem;padding:.24rem .1rem">';
      html+='<div class="pav" style="width:24px;height:24px;font-size:.68rem;flex-shrink:0">'+esc((p.nombre[0]||'?').toUpperCase())+'</div>';
      html+='<span style="flex:1;font-size:.8rem;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+esc(p.nombre)+'</span>';
      html+='<button style="background:none;border:none;color:var(--accent3);cursor:pointer;font-size:.72rem;padding:2px" data-pid="'+p.id+'" onclick="editPNombre(this.dataset.pid)" title="Editar">&#9998;</button>';
      html+='<button style="background:none;border:none;color:var(--accent);cursor:pointer;font-size:.78rem;padding:2px" data-pid="'+p.id+'" onclick="reemplazarJugador(this.dataset.pid)" title="Reemplazar por otro jugador (conserva grupo y partidos)">&#8646;</button>';
      html+='<button style="background:none;border:none;color:var(--muted2);cursor:pointer;font-size:.78rem;padding:2px" data-pid="'+p.id+'" onclick="delP(this.dataset.pid)" title="Eliminar">&#x2715;</button>';
      html+='</div>';
    });
    html+='</div></div>';
  });
  html+='</div>';
  html+='<p id="plist-empty" style="display:none;color:var(--muted2);font-size:.78rem;margin-top:.7rem">Sin resultados</p>';
  el.innerHTML=html;
  const search=document.getElementById('p-search');
  if(search&&search.value)filterPlayers(search.value);
}

export function filterPlayers(q){
  const term=q.toLowerCase().trim();
  let anyVisible=false;
  document.querySelectorAll('#plist-groups .pgroup').forEach(function(group){
    let match=false;
    group.querySelectorAll('.prow').forEach(function(row){
      const ok=!term||row.dataset.name.includes(term);
      row.style.display=ok?'':'none';
      if(ok)match=true;
    });
    group.style.display=match?'':'none';
    if(match)anyVisible=true;
  });
  const empty=document.getElementById('plist-empty');
  if(empty)empty.style.display=anyVisible?'none':'';
}

let dsrc=null;
export function renderDrag(){const el=document.getElementById('drag-cont');if(!el)return;const lid=getActiveLiga();const ps=[...S.players.filter(p=>p.liga===lid)].sort((a,b)=>a.orden-b.orden);if(!ps.length){el.innerHTML='<p style="color:var(--muted2);font-size:.74rem">Sin jugadores</p>';return;}const list=document.createElement('div');list.className='dlist';list.id='dl';ps.forEach((p,i)=>{const item=document.createElement('div');item.className='di';item.dataset.pid=p.id;item.draggable=true;item.innerHTML=`<span style="color:var(--muted);font-size:.82rem">⠿</span><span style="font-family:'Bebas Neue';font-size:.95rem;color:var(--muted);min-width:24px">${i+1}</span><div class="pav">${esc(p.nombre[0])}</div><span style="flex:1;font-size:.8rem;font-weight:500">${esc(p.nombre)}</span><span style="font-size:.64rem;color:var(--muted2)">G${Math.floor(i/4)+1}</span>`;item.addEventListener('dragstart',e=>{dsrc=item;item.classList.add('dragging');e.dataTransfer.effectAllowed='move';});item.addEventListener('dragend',()=>{item.classList.remove('dragging');updDrag();});item.addEventListener('dragover',e=>{e.preventDefault();if(dsrc&&dsrc!==item){const r=item.getBoundingClientRect();if(e.clientY<r.top+r.height/2)list.insertBefore(dsrc,item);else list.insertBefore(dsrc,item.nextSibling);}});list.appendChild(item);});el.innerHTML='';el.appendChild(list);}
function updDrag(){document.querySelectorAll('#dl .di').forEach((item,i)=>{item.querySelectorAll('span')[1].textContent=i+1;item.querySelectorAll('span')[4].textContent='G'+(Math.floor(i/4)+1);});}
export async function saveOrder(){const items=document.querySelectorAll('#dl .di');if(!items.length){toast('Sin jugadores',1);return;}const ops=[];items.forEach((item,i)=>{const p=S.players.find(x=>x.id===item.dataset.pid);if(p){p.orden=i;p.grupo=Math.floor(i/4)+1;ops.push({op:'set',col:'players',id:p.id,data:{...p}});}});await fsBatch(ops);toast('✓ Orden guardado');}

export function importExcel(input){const file=input.files[0];if(!file)return;const lid=getActiveLiga();if(!lid){toast('Selecciona liga primero',1);input.value='';return;}const reader=new FileReader();reader.onload=async e=>{try{const data=new Uint8Array(e.target.result);const wb=XLSX.read(data,{type:'array'});const ws=wb.Sheets[wb.SheetNames[0]];const rows=XLSX.utils.sheet_to_json(ws,{defval:''});if(!rows.length){toast('Archivo vacío',1);input.value='';return;}const keys=Object.keys(rows[0]);const fk=p=>keys.find(k=>p.some(x=>k.toLowerCase().replace(/\s/g,'').includes(x)))||null;const cN=fk(['nombre','name','jugador']),cG=fk(['grupo','group','grp']);if(!cN||!cG){toast('Necesito columnas Nombre y Grupo',1);input.value='';return;}const toAdd=[];rows.forEach(row=>{const nom=String(row[cN]||'').trim();const g=parseInt(row[cG]);if(!nom||isNaN(g)||g<1)return;toAdd.push({nombre:nom,grupo:g,cat:'Avanzado'});});if(!toAdd.length){toast('Sin jugadores válidos',1);input.value='';return;}
  const existentes=S.players.filter(p=>p.liga===lid);
  const porNombre=new Map(existentes.map(p=>[p.nombre.toLowerCase(),p]));
  const nuevos=[],cambios=[];
  toAdd.forEach(p=>{const match=porNombre.get(p.nombre.toLowerCase());if(match){if(match.grupo!==p.grupo)cambios.push({p:match,grupo:p.grupo});}else nuevos.push(p);});
  if(!nuevos.length&&!cambios.length){toast('Sin cambios: ya estaban así',1);input.value='';return;}
  const partes=[nuevos.length?`${nuevos.length} nuevo(s)`:null,cambios.length?`${cambios.length} cambiarán de grupo`:null].filter(Boolean).join(' · ');
  if(!confirm(`¿Aplicar? ${partes}`)){input.value='';return;}
  const ops=[];let base=existentes.length;
  nuevos.forEach(p=>{const np={id:uid(),nombre:p.nombre,cat:p.cat,liga:lid,tel:'',orden:base,grupo:p.grupo,ausente:false};ops.push({op:'set',col:'players',id:np.id,data:np});base++;});
  cambios.forEach(({p,grupo})=>{ops.push({op:'set',col:'players',id:p.id,data:{...p,grupo}});});
  await fsBatch(ops);
  const res=[nuevos.length?`${nuevos.length} agregados`:null,cambios.length?`${cambios.length} reasignados`:null].filter(Boolean).join(' · ');
  toast('✓ '+res);
  } catch(err){toast('Error: '+err.message,1);}input.value='';};reader.readAsArrayBuffer(file);}
