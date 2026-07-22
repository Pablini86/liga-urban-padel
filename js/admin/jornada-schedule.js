import {S, uid, getActiveLiga, pShort, esc, fsSet, fsBatch, toast} from './state.js';
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

// Regenera los partidos de una jornada a partir de la lista de Jugadores
// actual (fuente de verdad), grupo por grupo, conservando la cancha/turno que
// ya tenía cada grupo. Sirve cuando la lista de Jugadores se editó (drag,
// Excel, reemplazos) después de generar los partidos y "Resultados" se quedó
// con la formación vieja. No toca grupos cuyos partidos ya tienen resultados
// capturados Y coinciden con la lista actual; si ya tienen resultados pero NO
// coinciden, los deja intactos y avisa para revisarlos a mano (para no borrar
// puntos ya jugados).
export async function resyncPartidosDesdeJugadores(){
  const lid=getActiveLiga();
  const num=parseInt(document.getElementById('jn')?.value);
  const jornada=S.jornadas.find(j=>j.liga===lid&&j.num===num);
  if(!lid||!jornada){toast('Selecciona liga y jornada',1);return;}

  const canchaMap={};
  S.partidos.filter(m=>m.jornadaId===jornada.id).forEach(m=>{
    if(!canchaMap[m.grupo])canchaMap[m.grupo]={cancha:m.cancha,turno:m.turno};
  });
  const ps=S.players.filter(p=>p.liga===lid);
  const grupos=[...new Set([...ps.map(p=>p.grupo),...Object.keys(canchaMap).map(Number)])].sort((a,b)=>a-b);

  const ops=[];
  const sinTocar=[],regenerados=[],incompletos=[];
  grupos.forEach(g=>{
    const gps=ps.filter(p=>p.grupo===g).sort((a,b)=>(a.orden||0)-(b.orden||0));
    const oldMs=S.partidos.filter(m=>m.jornadaId===jornada.id&&m.grupo===g);
    const oldIds=[...new Set(oldMs.flatMap(m=>[m.a1,m.a2,m.b1,m.b2]))];
    const newIds=gps.map(p=>p.id);
    const igual=oldIds.length===newIds.length&&oldIds.every(pid=>newIds.includes(pid));
    if(igual)return;
    const yaJugado=oldMs.length>0&&oldMs.every(m=>m.finalizado);
    if(yaJugado){sinTocar.push(g);return;}
    if(gps.length!==4){incompletos.push(g);return;}
    oldMs.forEach(m=>ops.push({op:'del',col:'partidos',id:m.id}));
    const ct=canchaMap[g]||{cancha:'C1',turno:(jornada.turnos&&jornada.turnos[0])||'18:00'};
    const [p1,p2,p3,p4]=gps;
    [[p1,p2,p3,p4],[p1,p3,p2,p4],[p1,p4,p2,p3]].forEach(([a1,a2,b1,b2],si)=>{
      const mid=uid();
      ops.push({op:'set',col:'partidos',id:mid,data:{id:mid,liga:lid,jornadaId:jornada.id,jornada:jornada.num,grupo:g,set:si+1,turno:ct.turno,cancha:ct.cancha,a1:a1.id,a2:a2.id,b1:b1.id,b2:b2.id,gA:null,gB:null,finalizado:false,ausente:false}});
    });
    regenerados.push(g);
  });

  if(!regenerados.length){
    let msg='Ya estaba todo sincronizado';
    if(sinTocar.length)msg+=' (Grupo(s) '+sinTocar.join(', ')+' no coinciden pero ya tienen resultados capturados — revísalos a mano)';
    toast(msg,sinTocar.length?1:0);
    return;
  }
  if(!confirm('Se van a regenerar los partidos de '+regenerados.length+' grupo(s) para que coincidan con la lista de Jugadores: Grupo(s) '+regenerados.join(', ')+'.\n\nConservan su cancha y horario ya asignados. No se toca ningún grupo con resultados ya capturados.\n\n¿Continuar?'))return;

  await fsBatch(ops);
  let msg='✓ '+regenerados.length+' grupo(s) sincronizado(s): '+regenerados.join(', ');
  if(sinTocar.length)msg+=' · '+sinTocar.length+' con resultados ya capturados, sin tocar';
  if(incompletos.length)msg+=' · Grupo(s) '+incompletos.join(', ')+' sin 4 jugadores, no se generaron';
  toast(msg);
  loadJornada();
}

// Corrige el campo Grupo de los jugadores en la pestaña Jugadores para que
// vuelva a coincidir con los partidos ya generados de una jornada — sin
// tocar ni borrar ningún partido. Sirve para deshacer un reacomodo accidental
// (arrastrar en "Reordenar grupos", importar Excel, etc.) que movió a varios
// jugadores de grupo después de que los partidos ya se habían creado. Los
// jugadores que ya no tienen ficha (huecos) se quedan igual — para esos usa
// "Reemplazar" (⇄) en la lista de Jugadores.
export async function restaurarGruposDesdePartidos(){
  const lid=getActiveLiga();
  const num=parseInt(document.getElementById('jn')?.value);
  const jornada=S.jornadas.find(j=>j.liga===lid&&j.num===num);
  if(!lid||!jornada){toast('Selecciona liga y jornada',1);return;}

  const byId=new Map(S.players.filter(p=>p.liga===lid).map(p=>[p.id,p]));
  const grupoCorrecto={};
  S.partidos.filter(m=>m.jornadaId===jornada.id).forEach(m=>{
    [m.a1,m.a2,m.b1,m.b2].forEach(pid=>{if(byId.has(pid))grupoCorrecto[pid]=m.grupo;});
  });

  const cambios=[];
  Object.entries(grupoCorrecto).forEach(([pid,g])=>{
    const p=byId.get(pid);
    if(p.grupo!==g)cambios.push({p,grupo:g});
  });

  if(!cambios.length){toast('La lista de Jugadores ya coincide con los partidos de esta jornada',1);return;}
  if(!confirm('Se va a corregir el Grupo de '+cambios.length+' jugador(es) en la lista de Jugadores para que vuelva a coincidir con los partidos ya creados de la Jornada '+num+'.\n\nNo se borra ni se crea ningún partido — solo se corrige el número de Grupo en su ficha.\n\n¿Continuar?'))return;

  const ops=cambios.map(({p,grupo})=>({op:'set',col:'players',id:p.id,data:{...p,grupo}}));
  await fsBatch(ops);
  toast('✓ '+cambios.length+' jugador(es) corregido(s) en la lista de Jugadores');
}

// ═══ COMPARAR ACOMODO REAL (PDF Jornada 1) ═══
// Fuente: "LIGA XXIII - HORARIOS-jornada1.pdf". La columna "CANCHA" del PDF es
// en realidad el número de GRUPO (1-24), no una cancha física — confirmado con
// Pablo. La columna "HORARIO" es el turno de esa jornada. Cada entrada trae los
// 4 nombres tal como aparecen impresos (algunos son apodos/solo primer nombre).
const ACOMODO_REAL_J1=[
  {grupo:1,turno:'19:15',nombres:['Santiago Díaz','Paco Corona','Daniel González','Rafael Pacheco']},
  {grupo:2,turno:'20:30',nombres:['Tony','Yorch Cárdenas','Alejandro Lara','Gustavo Schraidt']},
  {grupo:3,turno:'21:45',nombres:['Rollo','Roberto Chavez','Miguel Remis','Agustin Pacheco']},
  {grupo:4,turno:'20:30',nombres:['Giuseppe','Gus Sandoval','Daniel Bojorquez','Kike Flores']},
  {grupo:5,turno:'18:00',nombres:['Sebas Leiva','Edgar Huerta','Daniel Topete','Gabriel Salles']},
  {grupo:6,turno:'20:30',nombres:['Ricardo Caballero','David Zamarripa','Eduardo Maldonado','Erick Huerta']},
  {grupo:7,turno:'19:15',nombres:['Ricardo Garibay','Diego Noriega','Pablo Lemus','Francisco Marquez']},
  {grupo:8,turno:'20:30',nombres:['Roberto Calderón','Armando Bojórquez','Oscar Cancino','David Colmenero']},
  {grupo:9,turno:'21:45',nombres:['Jorge Urzua','Daniela','Aldo Rosas','Pepe Ruben']},
  {grupo:10,turno:'18:00',nombres:['Daniel Francia','Rodolfo Torres','Alejandro Camarena','Rafa Godinez']},
  {grupo:11,turno:'19:15',nombres:['Juan Pablo Hernan','Alejandro Gómez','Diego Gómez','Erika']},
  {grupo:12,turno:'21:45',nombres:['Sergio Romero','Frida Leycegui','Poncho Alarcón','Manuel Núñez']},
  {grupo:13,turno:'18:00',nombres:['César Rubio','Memo Núñez','Martín','Marco Garcia']},
  {grupo:14,turno:'21:45',nombres:['Omar Romo','Alma Preciado','Cesar Sandoval','Héctor Gutiérrez']},
  {grupo:15,turno:'18:00',nombres:['Fer Acero','Araceli Delgado','Alex Torre','Leonel Lee']},
  {grupo:16,turno:'19:15',nombres:['Claudia Medina','Carlos Gonzalez','Carlos Aceves','Marcelo Menendez']},
  {grupo:17,turno:'18:00',nombres:['Pepe Solis','Jorge Alvarado','Ricardo Garibay Jr','Adrián Araiza']},
  {grupo:18,turno:'18:00',nombres:['José Luis Lomelí','Madra','Diego Lepe','Juan Pablo Sandoval']},
  {grupo:19,turno:'20:30',nombres:['Osvaldo Rodriguez','Alfredo Martinez','Enrique Lago','Gonzalo Peralta']},
  {grupo:20,turno:'20:30',nombres:['Luis Carmona','Santiago Lepe','Arturo Osuna','Marco Naranjo']},
  {grupo:21,turno:'21:45',nombres:['Leo Bojorquez','Carlos Vázquez','Ivette','Erik Hernández Flores']},
  {grupo:22,turno:'21:45',nombres:['Anahí Gonzalez','René Ahumada','Diego Ahumada','Livier Rodríguez']},
  {grupo:23,turno:'19:15',nombres:['Carlo Negrete','César Medina','Diego González','Georgina Hermosillo']},
  {grupo:24,turno:'19:15',nombres:['Elizabeth','Dhamara','Antonieta Rojas','Adrián Noriega']},
];
function _normNombre(s){return String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/\s+/g,' ').trim();}

export function compararAcomodoRealJ1(){
  const lid=getActiveLiga();
  const num=parseInt(document.getElementById('jn')?.value);
  if(!lid){toast('Selecciona liga',1);return;}
  const jornada=S.jornadas.find(j=>j.liga===lid&&j.num===num);
  const ps=S.players.filter(p=>p.liga===lid);
  const byNorm=new Map();
  ps.forEach(p=>{
    const k=_normNombre(p.nombre);
    if(!byNorm.has(k))byNorm.set(k,[]);
    byNorm.get(k).push(p);
  });

  const matchedIds=new Set();
  const filas=ACOMODO_REAL_J1.map(entry=>{
    const resueltos=entry.nombres.map(n=>{
      const cands=byNorm.get(_normNombre(n))||[];
      return {nombre:n,cands};
    });
    const sinMatch=resueltos.filter(r=>r.cands.length===0);
    const ambiguos=resueltos.filter(r=>r.cands.length>1);
    let estado,detalle;
    if(sinMatch.length||ambiguos.length){
      estado='sin-match';
      const partes=[];
      if(sinMatch.length)partes.push('sin ficha: '+sinMatch.map(r=>r.nombre).join(', '));
      if(ambiguos.length)partes.push('nombre repetido (revisar a mano): '+ambiguos.map(r=>r.nombre).join(', '));
      detalle=partes.join(' · ');
    } else {
      const players=resueltos.map(r=>r.cands[0]);
      players.forEach(p=>matchedIds.add(p.id));
      const grupos=[...new Set(players.map(p=>p.grupo))];
      if(grupos.length>1){
        estado='reagrupar';
        detalle='jugadores repartidos en grupos '+grupos.join(', ')+' del sistema — hay que juntarlos en 1 solo grupo';
      } else {
        const g=grupos[0];
        const msG=jornada?S.partidos.filter(m=>m.jornadaId===jornada.id&&m.grupo===g):[];
        if(!msG.length){
          estado='sin-partidos';
          detalle='Grupo '+g+' ya está correcto en Jugadores pero no tiene partidos generados en Jornada '+ (num||'?');
        } else if(g!==entry.grupo){
          estado='renumerar';
          detalle='Mismos 4 jugadores y coinciden de grupo, pero el sistema los tiene como Grupo '+g+' y el PDF los marca como '+entry.grupo;
        } else if(msG.some(m=>m.turno!==entry.turno)){
          const turnoActual=[...new Set(msG.map(m=>m.turno))].join('/');
          estado='turno-distinto';
          detalle='Grupo '+g+' — sistema: '+turnoActual+' · PDF: '+entry.turno;
        } else {
          estado='ok';
          detalle='Grupo '+g+' · '+entry.turno+' ✓';
        }
      }
    }
    return {entry,estado,detalle};
  });

  const sobrantes=ps.filter(p=>!matchedIds.has(p.id));

  const orden={'sin-match':0,'reagrupar':1,'renumerar':2,'turno-distinto':3,'sin-partidos':4,'ok':5};
  filas.sort((a,b)=>orden[a.estado]-orden[b.estado]||a.entry.grupo-b.entry.grupo);
  const colores={'sin-match':'#ff3b5c','reagrupar':'#ffb020','renumerar':'#ffb020','turno-distinto':'#ffb020','sin-partidos':'#7a8a99','ok':'#00e59e'};
  const etiquetas={'sin-match':'✗ Sin ficha','reagrupar':'⚠ Reagrupar','renumerar':'⚠ Renumerar','turno-distinto':'⚠ Turno distinto','sin-partidos':'· Sin partidos','ok':'✓ OK'};
  const resumen={};
  filas.forEach(f=>{resumen[f.estado]=(resumen[f.estado]||0)+1;});
  const resumenTxt=Object.entries(resumen).map(([k,v])=>etiquetas[k]+': '+v).join(' · ');

  const rows=filas.map(f=>`<tr style="border-bottom:1px solid var(--border)">
    <td style="padding:.35rem .5rem;color:${colores[f.estado]};font-weight:700;white-space:nowrap">${etiquetas[f.estado]}</td>
    <td style="padding:.35rem .5rem;white-space:nowrap">Cancha PDF ${f.entry.grupo}</td>
    <td style="padding:.35rem .5rem">${esc(f.entry.nombres.join(', '))}</td>
    <td style="padding:.35rem .5rem;color:var(--muted2)">${esc(f.detalle)}</td>
  </tr>`).join('');

  const warnNum=(num!==1)?`<div style="background:rgba(255,59,92,.08);border:1px solid rgba(255,59,92,.3);border-radius:9px;padding:.7rem .85rem;margin-bottom:.6rem;font-size:.78rem;color:#ff3b5c">⚠ Este PDF es de la Jornada 1, pero tienes seleccionada la Jornada ${num||'?'}. Selecciona Jornada 1 arriba y vuelve a comparar.</div>`:'';

  const sobrantesHtml=sobrantes.length?`<div style="background:var(--card2);border:1px solid var(--border2);border-radius:9px;padding:.7rem .85rem;margin-top:.6rem;font-size:.78rem">
    <b>${sobrantes.length} jugador(es) en el sistema que NO aparecen en ningún grupo del PDF:</b><br>
    <span style="color:var(--muted2)">${sobrantes.map(p=>esc(p.nombre)).join(', ')}</span>
  </div>`:'';

  document.getElementById('j-prev').innerHTML=`
    ${warnNum}
    <div style="background:var(--card2);border:1px solid var(--border2);border-radius:9px;padding:.8rem;margin-bottom:.6rem;font-size:.78rem">${esc(resumenTxt)}</div>
    <div style="max-height:480px;overflow:auto;border:1px solid var(--border);border-radius:9px">
      <table style="width:100%;border-collapse:collapse;font-size:.76rem">
        <thead><tr style="background:var(--card2);position:sticky;top:0"><th style="text-align:left;padding:.4rem .5rem">Estado</th><th style="text-align:left;padding:.4rem .5rem">PDF</th><th style="text-align:left;padding:.4rem .5rem">Nombres</th><th style="text-align:left;padding:.4rem .5rem">Detalle</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    ${sobrantesHtml}`;
  toast('Comparación lista — revisa la tabla abajo');
}

// Aplica ACOMODO_REAL_J1: corrige el Grupo de los 96 jugadores y recrea los
// partidos de la Jornada 1 desde cero para que coincidan con el PDF. Se niega
// a correr si algún nombre no se resuelve a exactamente un jugador, o si ya
// hay algún partido de Jornada 1 con resultado capturado (finalizado) — en
// ese caso no toca nada y avisa. Pensada para usarse una sola vez, antes de
// que arranque a jugarse la Jornada 1.
export async function aplicarAcomodoRealJ1(){
  const lid=getActiveLiga();
  if(!lid){toast('Selecciona liga',1);return;}
  const ps=S.players.filter(p=>p.liga===lid);
  const byNorm=new Map();
  ps.forEach(p=>{
    const k=_normNombre(p.nombre);
    if(!byNorm.has(k))byNorm.set(k,[]);
    byNorm.get(k).push(p);
  });

  const problemas=[];
  const gruposResueltos=ACOMODO_REAL_J1.map(entry=>{
    const players=entry.nombres.map(n=>{
      const cands=byNorm.get(_normNombre(n))||[];
      if(cands.length!==1)problemas.push('Cancha PDF '+entry.grupo+' — "'+n+'": '+(cands.length===0?'sin ficha en Jugadores':'nombre repetido, hay '+cands.length+' jugadores así'));
      return cands.length===1?cands[0]:null;
    });
    return {entry,players};
  });

  if(problemas.length){
    alert('No se puede aplicar el acomodo todavía — hay '+problemas.length+' nombre(s) del PDF que no coinciden exactamente con un jugador de la lista:\n\n'+problemas.join('\n')+'\n\nCorrige esos nombres en la pestaña Jugadores (o el nombre en el PDF) y vuelve a intentar.');
    return;
  }

  const existing=S.jornadas.find(j=>j.liga===lid&&j.num===1);
  const partidosJ1=existing?S.partidos.filter(m=>m.jornadaId===existing.id):[];
  if(partidosJ1.some(m=>m.finalizado)){
    alert('Ya hay partidos de la Jornada 1 con resultado capturado — no se puede recrear todo desde cero sin perder esos puntos. Avísame y lo revisamos a mano.');
    return;
  }

  const totalPartidos=ACOMODO_REAL_J1.length*3;
  const matchedIds2=new Set(gruposResueltos.flatMap(g=>g.players.map(p=>p.id)));
  const sobrantes2=ps.filter(p=>!matchedIds2.has(p.id));
  const avisoSobrantes=sobrantes2.length?('\n\n⚠ '+sobrantes2.length+' jugador(es) del sistema NO aparecen en el PDF y se quedarán con su Grupo actual, que podría chocar con los nuevos números: '+sobrantes2.map(p=>p.nombre).join(', ')):'';
  if(!confirm('Se va a:\n\n· Corregir el Grupo de '+matchedIds2.size+' jugadores según el PDF\n· Borrar los '+partidosJ1.length+' partidos actuales de Jornada 1 (ninguno tiene resultado) y crear '+totalPartidos+' nuevos con los grupos y horarios del PDF'+avisoSobrantes+'\n\n¿Continuar?'))return;

  const ops=[];
  gruposResueltos.forEach(({entry,players})=>{
    players.forEach(p=>{
      if(p.grupo!==entry.grupo)ops.push({op:'set',col:'players',id:p.id,data:{...p,grupo:entry.grupo}});
    });
  });

  let jId=existing?.id;
  if(!existing){
    jId=uid();
    ops.push({op:'set',col:'jornadas',id:jId,data:{id:jId,liga:lid,num:1,fecha:document.getElementById('jf')?.value||'',canchas:6,turnos:['18:00','19:15','20:30','21:45']}});
  }
  partidosJ1.forEach(m=>ops.push({op:'del',col:'partidos',id:m.id}));

  const canchaCounter={};
  gruposResueltos.forEach(({entry,players})=>{
    canchaCounter[entry.turno]=(canchaCounter[entry.turno]||0)+1;
    const cancha='C'+canchaCounter[entry.turno];
    const [p1,p2,p3,p4]=players;
    [[p1,p2,p3,p4],[p1,p3,p2,p4],[p1,p4,p2,p3]].forEach(([a1,a2,b1,b2],si)=>{
      const mid=uid();
      ops.push({op:'set',col:'partidos',id:mid,data:{id:mid,liga:lid,jornadaId:jId,jornada:1,grupo:entry.grupo,set:si+1,turno:entry.turno,cancha,a1:a1.id,a2:a2.id,b1:b1.id,b2:b2.id,gA:null,gB:null,finalizado:false,ausente:false}});
    });
  });

  await fsBatch(ops);
  toast('✓ Jornada 1 recreada según el PDF · 24 grupos · '+totalPartidos+' partidos');
  const jnEl=document.getElementById('jn');if(jnEl)jnEl.value=1;
  loadJornada();
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
