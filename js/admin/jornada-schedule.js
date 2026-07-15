import {S, uid, getActiveLiga, pShort, fsSet, fsBatch, toast} from './state.js';
import {getRestriccionesForTurno} from './restricciones.js';
import {renderImpPrev} from './imprimir.js';
import {showAT} from './dispatch.js';

export function loadJornada(){
  const lid=getActiveLiga();if(!lid)return;
  const num=parseInt(document.getElementById('jn')?.value);if(!num)return;
  const j=S.jornadas.find(x=>x.liga===lid&&x.num===num);
  if(!j)return;
  if(j.fecha)document.getElementById('jf').value=j.fecha;
  if(j.turnos&&j.turnos.length)document.getElementById('jt').value=j.turnos.join('\n');
  if(j.canchas)document.getElementById('jc').value=j.canchas;
  const tempKey=lid+'_j'+num;
  // Always reload from Firebase partidos when selecting a jornada
  const ms=S.partidos.filter(m=>m.jornadaId===j.id);
  const asgn={};
  ms.forEach(m=>{if(m.turno&&m.cancha)asgn[m.turno+'_'+m.cancha]=m.grupo;});
  scheduleAssignments[tempKey]=asgn;
  renderScheduleGrid();
}

// ═══ SCHEDULE GRID ═══
const scheduleAssignments={};
let schedDragGrupo=null,schedDragFrom=null;
export function renderScheduleGrid(){
  const lid=getActiveLiga();
  if(!lid){document.getElementById('sched-grid-container').innerHTML='';return;}
  const turnos=document.getElementById('jt').value.split('\n').map(t=>t.trim()).filter(Boolean);
  const canchas=parseInt(document.getElementById('jc').value)||6;
  const grupos=[...new Set(S.players.filter(p=>p.liga===lid).map(p=>p.grupo))].sort((a,b)=>a-b);
  const jnum=parseInt(document.getElementById('jn').value)||1;
  const tempKey=lid+'_j'+jnum;
  if(!scheduleAssignments[tempKey])scheduleAssignments[tempKey]={};
  const asgn=scheduleAssignments[tempKey];
  const assigned=new Set(Object.values(asgn));
  const unassigned=grupos.filter(g=>!assigned.has(g));
  const pool=document.getElementById('unassigned-pool');
  if(pool){
    if(unassigned.length){
      pool.innerHTML='';
      unassigned.forEach(g=>{
        const chip=document.createElement('div');
        chip.className='pool-chip';chip.draggable=true;chip.dataset.grupo=g;
        chip.textContent='G'+g;
        chip.ondragstart=function(e){schedDS(e,'pool',g);};
        chip.ondragend=schedDE;
        pool.appendChild(chip);
      });
    } else {
      pool.innerHTML='<span style="color:var(--muted2);font-size:.78rem">✓ Todos asignados</span>';
    }
  }
  const cont=document.getElementById('sched-grid-container');
  const grid=document.createElement('div');
  grid.className='sched-grid';
  grid.style.gridTemplateColumns='90px repeat('+canchas+',1fr)';
  const mkSlotEvents=(el,key)=>{
    el.addEventListener('dragover',e=>{e.preventDefault();el.classList.add('drag-over');});
    el.addEventListener('dragleave',()=>el.classList.remove('drag-over'));
    el.addEventListener('drop',e=>schedDrop(e,key));
  };
  const th=document.createElement('div');th.className='sched-th';th.textContent='HORA';grid.appendChild(th);
  for(let c=1;c<=canchas;c++){const t=document.createElement('div');t.className='sched-th';t.textContent='C'+c;grid.appendChild(t);}
  turnos.forEach(turno=>{
    const tEl=document.createElement('div');tEl.className='sched-time';tEl.textContent=turno;grid.appendChild(tEl);
    for(let c=1;c<=canchas;c++){
      const key=turno+'_C'+c;const g=asgn[key];
      const slot=document.createElement('div');
      mkSlotEvents(slot,key);
      if(g){
        slot.className='sched-slot filled';
        const gps=S.players.filter(p=>p.liga===lid&&p.grupo===g);
        const names=gps.map(p=>pShort(p.nombre)).join(', ');
        const inner=document.createElement('div');inner.className='slot-grupo';inner.draggable=true;
        inner.innerHTML='<div class="slot-grupo-num">G'+g+'</div><div class="slot-grupo-names">'+names+'</div>';
        inner.ondragstart=function(e){schedDS(e,'slot:'+key,g);};
        inner.ondragend=schedDE;
        const rmBtn=document.createElement('button');rmBtn.className='slot-remove';rmBtn.textContent='✕';
        const tk=tempKey,sk=key;
        rmBtn.onclick=function(){schedRm(tk,sk);renderScheduleGrid();};
        slot.appendChild(inner);slot.appendChild(rmBtn);
      } else {
        slot.className='sched-slot';
        const sp=document.createElement('span');sp.style.cssText='font-size:.6rem;color:var(--muted)';sp.textContent='libre';
        slot.appendChild(sp);
      }
      grid.appendChild(slot);
    }
  });
  cont.innerHTML='';cont.appendChild(grid);
}

function schedDS(e,from,g){schedDragGrupo=g;schedDragFrom=from;setTimeout(()=>e.target?.classList.add('dragging'),0);}
function schedDE(e){e.target?.classList.remove('dragging');document.querySelectorAll('.sched-slot').forEach(s=>s.classList.remove('drag-over'));}
function schedDrop(e,toKey){e.preventDefault();document.querySelectorAll('.sched-slot').forEach(s=>s.classList.remove('drag-over'));const lid=getActiveLiga();if(!lid||schedDragGrupo===null)return;
  // Check restrictions
  const turno=toKey.split('_')[0];
  const jnum2=parseInt(document.getElementById('jn').value)||0;
  const jId2=(S.jornadas.find(j=>j.liga===lid&&j.num===jnum2)||{}).id||null;
  const conflictos=getRestriccionesForTurno(lid,turno,jId2);
  const grupoPlayers=S.players.filter(p=>p.liga===lid&&p.grupo===schedDragGrupo);
  const afectados=conflictos.filter(cp=>grupoPlayers.find(gp=>gp.id===cp.id));
  if(afectados.length){
    const nombres=afectados.map(p=>pShort(p.nombre)).join(', ');
    if(!confirm('Restriccion de horario\n\n'+nombres+' no puede jugar a las '+turno+'\n\n¿Asignar de todas formas como excepcion?'))return;
  }
  const jnum=parseInt(document.getElementById('jn').value)||1;const tempKey=`${lid}_j${jnum}`;if(!scheduleAssignments[tempKey])scheduleAssignments[tempKey]={};const asgn=scheduleAssignments[tempKey];const existing=asgn[toKey];if(schedDragFrom?.startsWith('slot:')){const fk=schedDragFrom.replace('slot:','');delete asgn[fk];if(existing)asgn[fk]=existing;}asgn[toKey]=schedDragGrupo;renderScheduleGrid();}
function schedRm(tempKey,slotKey){if(scheduleAssignments[tempKey])delete scheduleAssignments[tempKey][slotKey];}
export function autoAssign(){
  const lid=getActiveLiga();if(!lid)return;
  const jnum=parseInt(document.getElementById('jn').value)||1;
  const jId=(S.jornadas.find(j=>j.liga===lid&&j.num===jnum)||{}).id||null;
  const grupos=[...new Set(S.players.filter(p=>p.liga===lid).map(p=>p.grupo))].sort((a,b)=>a-b);
  const turnos=document.getElementById('jt').value.split('\n').map(t=>t.trim()).filter(Boolean);
  const canchas=parseInt(document.getElementById('jc').value)||6;
  const tempKey=lid+'_j'+jnum;
  scheduleAssignments[tempKey]={};
  const asgn=scheduleAssignments[tempKey];

  // Build slots list: [turno_C1, turno_C2, ...]
  const slots=[];
  for(let t=0;t<turnos.length;t++)
    for(let c=1;c<=canchas;c++)
      slots.push({key:turnos[t]+'_C'+c, turno:turnos[t]});

  // Score: how many players in grupo have restriction for this turno
  function conflictos(grupo, turno){
    const rsts=getRestriccionesForTurno(lid,turno,jId);
    const gps=S.players.filter(p=>p.liga===lid&&p.grupo===grupo);
    return rsts.filter(rp=>gps.find(gp=>gp.id===rp.id)).length;
  }

  // Assign each grupo to best available slot (fewest conflicts)
  const pending=[...grupos];
  const usedSlots=new Set();

  while(pending.length>0){
    let bestGrupo=null, bestSlot=null, bestScore=999;
    for(const grupo of pending){
      for(const slot of slots){
        if(usedSlots.has(slot.key))continue;
        const score=conflictos(grupo,slot.turno);
        if(score<bestScore){bestScore=score;bestGrupo=grupo;bestSlot=slot;}
      }
    }
    if(!bestSlot)break;
    asgn[bestSlot.key]=bestGrupo;
    usedSlots.add(bestSlot.key);
    pending.splice(pending.indexOf(bestGrupo),1);
  }

  renderScheduleGrid();
  const conflictCount=Object.entries(asgn).filter(([k,g])=>conflictos(g,k.split('_')[0])>0).length;
  if(conflictCount>0)
    toast('Auto-asignado · '+conflictCount+' grupo(s) con restricciones no evitables',1);
  else
    toast('✓ Auto-asignado respetando restricciones');
}

// ═══ GENERAR JORNADA ═══
// NOTA: función histórica sin uso (ningún botón la invoca) — se conserva tal
// cual estaba, incluyendo el bug preexistente de `num` sin definir.
async function genJornada(){const lid=getActiveLiga();if(!lid){toast('Selecciona liga',1);return;}const ps=S.players.filter(p=>p.liga===lid);if(ps.length<4){toast('Mín. 4 jugadores',1);return;}const fecha=document.getElementById('jf').value;const canchas=parseInt(document.getElementById('jc').value)||6;const turnos=document.getElementById('jt').value.split('\n').map(t=>t.trim()).filter(Boolean);if(!turnos.length){toast('Define horarios',1);return;}const tempKey=`${lid}_j${num}`;const asgn=scheduleAssignments[tempKey]||{};const jId=uid();const ops=[];S.jornadas.filter(j=>j.liga===lid&&j.num===num).forEach(j=>ops.push({op:'del',col:'jornadas',id:j.id}));S.partidos.filter(p=>p.liga===lid&&p.jornada===num).forEach(p=>ops.push({op:'del',col:'partidos',id:p.id}));ops.push({op:'set',col:'jornadas',id:jId,data:{id:jId,liga:lid,num,fecha,canchas,turnos}});const grupos=[...new Set(ps.map(p=>p.grupo))].sort((a,b)=>a-b);let cnt=0;grupos.forEach((g,gi)=>{const gps=[...ps.filter(p=>p.grupo===g)].sort((a,b)=>a.orden-b.orden);if(gps.length<4)return;const[p1,p2,p3,p4]=gps;const slotEntry=Object.entries(asgn).find(([k,v])=>v===g);let turno=turnos[0],cancha='C1';if(slotEntry){const parts=slotEntry[0].split('_');turno=parts[0];cancha=parts[1];}else{turno=turnos[Math.min(Math.floor(gi/canchas),turnos.length-1)];cancha='C'+((gi%canchas)+1);}[[p1,p2,p3,p4],[p1,p3,p2,p4],[p1,p4,p2,p3]].forEach(([a1,a2,b1,b2],si)=>{const m={id:uid(),liga:lid,jornadaId:jId,jornada:num,grupo:g,set:si+1,turno,cancha,a1:a1.id,a2:a2.id,b1:b1.id,b2:b2.id,gA:null,gB:null,finalizado:false,ausente:false};ops.push({op:'set',col:'partidos',id:m.id,data:m});cnt++;});});await fsBatch(ops);document.getElementById('j-prev').innerHTML=`<div style="background:rgba(0,229,158,.05);border:1px solid rgba(0,229,158,.2);border-radius:7px;padding:.8rem"><div style="color:var(--accent3);font-weight:700">✓ Jornada ${num} — ${cnt} partidos</div></div>`;populateSels();toast(`✓ Jornada ${num} generada`);}

export async function saveHorarios(){
  const lid=getActiveLiga();
  const num=parseInt(document.getElementById('jn')?.value);
  if(!lid||!num){toast('Selecciona liga y jornada',1);return;}
  const tempKeyH=lid+'_j'+num;
  const asgnH=scheduleAssignments[tempKeyH]||{};
  if(!Object.keys(asgnH).length){toast('Arrastra los grupos a las canchas primero',1);return;}
  let existing=S.jornadas.find(j=>j.liga===lid&&j.num===num);
  if(!existing){
    const t2=document.getElementById('jt').value.split('\n').map(t=>t.trim()).filter(Boolean);
    const c2=parseInt(document.getElementById('jc').value)||6;
    const f2=document.getElementById('jf').value;
    const nid=uid();
    await fsSet('jornadas',nid,{id:nid,liga:lid,num,fecha:f2,canchas:c2,turnos:t2});
    existing={id:nid,liga:lid,num,fecha:f2,canchas:c2,turnos:t2};
    await new Promise(r=>setTimeout(r,400));
  }
  const tempKey=lid+'_j'+num;
  const asgn=scheduleAssignments[tempKey]||{};
  const turnos=document.getElementById('jt').value.split('\n').map(t=>t.trim()).filter(Boolean);
  const fecha=document.getElementById('jf').value;
  const canchas=parseInt(document.getElementById('jc').value)||6;
  const ops=[];
  // Update jornada
  ops.push({op:'set',col:'jornadas',id:existing.id,data:{...existing,fecha,turnos,canchas}});
  // Update or create matches with correct cancha/turno
  const ps=S.players.filter(p=>p.liga===lid);
  const grupos=[...new Set(ps.map(p=>p.grupo))].sort((a,b)=>a-b);
  // Check if matches already exist for this jornada
  const existingMatches=S.partidos.filter(p=>p.jornadaId===existing.id);
  if(existingMatches.length===0){
    // Create matches
    grupos.forEach((g,gi)=>{
      const gps=[...ps.filter(p=>p.grupo===g)].sort((a,b)=>a.orden-b.orden);
      if(gps.length<4)return;
      const[p1,p2,p3,p4]=gps;
      const slotEntry=Object.entries(asgn).find(([k,v])=>v===g);
      let turno=turnos[0],cancha='C1';
      if(slotEntry){const parts=slotEntry[0].split('_');turno=parts[0];cancha=parts[1];}
      else{turno=turnos[Math.min(Math.floor(gi/canchas),turnos.length-1)];cancha='C'+((gi%canchas)+1);}
      [[p1,p2,p3,p4],[p1,p3,p2,p4],[p1,p4,p2,p3]].forEach(([a1,a2,b1,b2],si)=>{
        const m={id:uid(),liga:lid,jornadaId:existing.id,jornada:num,grupo:g,set:si+1,
          turno,cancha,a1:a1.id,a2:a2.id,b1:b1.id,b2:b2.id,gA:null,gB:null,finalizado:false,ausente:false};
        ops.push({op:'set',col:'partidos',id:m.id,data:m});
      });
    });
  } else {
    // Update cancha/turno on existing matches
    existingMatches.forEach(m=>{
      const slotEntry=Object.entries(asgn).find(([k,v])=>v===m.grupo);
      if(slotEntry){
        const parts=slotEntry[0].split('_');
        const turno=parts[0],cancha=parts[1];
        if(m.turno!==turno||m.cancha!==cancha){
          ops.push({op:'set',col:'partidos',id:m.id,data:{...m,turno,cancha}});
        }
      }
    });
  }
  await fsBatch(ops);
  toast('✓ Horarios guardados · J'+num);
  document.getElementById('j-prev').innerHTML=`<div style="background:rgba(0,229,158,.05);border:1px solid rgba(0,229,158,.2);border-radius:7px;padding:.7rem .85rem;font-size:.78rem;color:var(--accent3)">✓ Jornada ${num} lista · ${Object.keys(asgn).length} grupos asignados</div>`;
}

export function goToJornada(lid,num){S.activeLiga=lid;const btn=document.querySelector('.it[onclick*="jornada"]');if(btn)showAT('jornada',btn);const jnEl=document.getElementById('jn');if(jnEl){jnEl.value=num;}}

export function goToImprimir(lid,jId){S.activeLiga=lid;const btn=document.querySelector('.it[onclick*="imprimir"]');if(btn)showAT('imprimir',btn);setTimeout(()=>{const imjEl=document.getElementById('imj');if(imjEl){imjEl.value=jId;renderImpPrev();}},100);}

// NOTA: función histórica sin uso (nada la invoca) — se conserva tal cual
// (estaba duplicada dos veces de forma idéntica en el archivo original).
function enableHorarioEdit(){
  window._jornadaLocked=false;
  document.getElementById('sched-grid-container').style.pointerEvents='';
  document.getElementById('sched-grid-container').style.opacity='';
  toast('Puedes editar horarios — guarda cuando termines');
}
