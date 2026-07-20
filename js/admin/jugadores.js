import {S, esc, uid, getActiveLiga, pById, fsSet, fsDel, fsBatch, toast} from './state.js';

export async function addP(){const n=document.getElementById('pn').value.trim();if(!n){toast('Escribe nombre',1);return;}const liga=getActiveLiga();if(!liga){toast('Selecciona liga',1);return;}const ps=S.players.filter(p=>p.liga===liga);const p={id:uid(),nombre:n,cat:document.getElementById('pc').value,liga,tel:document.getElementById('pt').value,orden:ps.length,grupo:Math.floor(ps.length/4)+1,ausente:false};await fsSet('players',p.id,p);document.getElementById('pn').value='';document.getElementById('pt').value='';toast('✓ Jugador agregado');}
export async function delP(id){await fsDel('players',id);toast('Eliminado');}
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
  if(!ps.length){el.innerHTML='<p style="color:var(--muted2);font-size:.78rem">Sin jugadores</p>';return;}
  const byG={};
  ps.forEach(p=>{if(!byG[p.grupo])byG[p.grupo]=[];byG[p.grupo].push(p);});
  const incompletos=Object.entries(byG).filter(([g,list])=>list.length!==4).sort((a,b)=>parseInt(a[0])-parseInt(b[0]));
  const liga=S.ligas.find(l=>l.id===lid);
  var html='';
  if(incompletos.length){
    html+='<div style="background:rgba(255,59,92,.08);border:1px solid rgba(255,59,92,.3);border-radius:8px;padding:.65rem .9rem;margin-bottom:.85rem;font-size:.76rem;color:var(--accent2)">'+
      '<b>Grupos incompletos</b> — cada grupo debe tener exactamente 4 jugadores para generar partidos: '+
      incompletos.map(([g,list])=>'Grupo '+esc(g)+' ('+list.length+')').join(', ')+
    '</div>';
  }
  html+='<div style="margin-bottom:.85rem">';
  html+='<div style="font-size:.63rem;font-weight:700;letter-spacing:2px;color:var(--muted);text-transform:uppercase;margin-bottom:.3rem">'+(liga?esc(liga.nombre):esc(lid))+' ('+ps.length+')</div>';
  html+='<div style="display:flex;flex-wrap:wrap;gap:.22rem">';
  ps.forEach(function(p){
    html+='<div style="display:flex;align-items:center;gap:.3rem;background:var(--card2);border:1px solid var(--border);border-radius:5px;padding:.22rem .55rem;font-size:.74rem">';
    html+='<span style="background:var(--border2);border-radius:50%;width:17px;height:17px;display:flex;align-items:center;justify-content:center;font-size:.62rem;font-weight:700;color:var(--accent)">'+p.grupo+'</span>';
    html+=esc(p.nombre);
    html+='<button style="background:none;border:none;color:var(--accent3);cursor:pointer;font-size:.72rem" data-pid="'+p.id+'" onclick="editPNombre(this.dataset.pid)">&#9998;</button>';
    html+='<button style="background:none;border:none;color:var(--muted2);cursor:pointer;font-size:.78rem" data-pid="'+p.id+'" onclick="delP(this.dataset.pid)">&#x2715;</button>';
    html+='</div>';
  });
  html+='</div></div>';
  el.innerHTML=html;
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
