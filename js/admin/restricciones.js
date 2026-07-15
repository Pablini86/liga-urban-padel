import {S, esc, uid, getActiveLiga, pById, fsBatch, fsDel, toast} from './state.js';
import {openM, closeM} from './modal.js';

// ═══ RESTRICCIONES ═══
export function getRestriccionesForTurno(lid,turno,jId){
  if(!S.restricciones)return[];
  return S.restricciones.filter(r=>{
    if(r.liga!==lid||r.turno!==turno)return false;
    return r.scope==='liga'||(r.scope==='jornada'&&r.jornadaId===jId);
  }).map(r=>pById(r.pid)).filter(Boolean);
}

export function renderRestricciones(){
  const lid=getActiveLiga();
  const el=document.getElementById('restricciones-list');if(!el)return;
  const ps=S.players.filter(p=>p.liga===lid).sort((a,b)=>a.grupo-b.grupo||a.orden-b.orden);
  const rsts=(S.restricciones||[]).filter(r=>r.liga===lid);
  const js=S.jornadas.filter(j=>j.liga===lid).sort((a,b)=>a.num-b.num);
  const turnos=[...new Set(S.jornadas.filter(j=>j.liga===lid).flatMap(j=>j.turnos||[]))].sort();
  const allTurnos=turnos.length?turnos:['18:00','19:15','20:30','21:45'];
  if(!ps.length){el.innerHTML='<p style="color:var(--muted2);font-size:.82rem">Sin jugadores en esta liga</p>';return;}
  el.innerHTML='<div style="display:grid;gap:.45rem">'+
    ps.map(function(p){
      const pRsts=rsts.filter(function(r){return r.pid===p.id;});
      return '<div style="background:var(--card);border:1px solid var(--border);border-radius:10px;padding:.75rem 1rem">'+
        '<div style="display:flex;align-items:center;gap:.65rem;margin-bottom:'+(pRsts.length?'.5rem':'0')+'">'+
          '<span style="font-family:Bebas Neue,sans-serif;font-size:.85rem;color:var(--accent);min-width:28px">G'+p.grupo+'</span>'+
          '<span style="font-weight:600;font-size:.88rem;flex:1">'+esc(p.nombre)+'</span>'+
          '<button data-pid="'+p.id+'" onclick="openAddRestriccion(this.dataset.pid)" style="padding:.22rem .6rem;border-radius:5px;border:1px solid var(--border2);background:transparent;color:var(--muted2);font-size:.72rem;cursor:pointer;font-family:inherit">+ Restriccion</button>'+
        '</div>'+
        (pRsts.length?
          '<div style="display:flex;flex-wrap:wrap;gap:.3rem">'+
            pRsts.map(function(r){
              const jLabel=r.scope==='liga'?'Liga':('J'+((js.find(function(j){return j.id===r.jornadaId;})||{}).num||'?'));
              return '<div style="display:inline-flex;align-items:center;gap:.35rem;background:rgba(255,59,92,.08);border:1px solid rgba(255,59,92,.25);border-radius:6px;padding:.2rem .55rem">'+
                '<span style="font-size:.78rem;font-weight:700;color:var(--accent2)">'+esc(r.turno)+'</span>'+
                '<span style="font-size:.65rem;color:var(--muted2)">'+jLabel+'</span>'+
                '<button data-rid="'+r.id+'" onclick="delRestriccion(this.dataset.rid)" style="background:none;border:none;color:var(--muted2);cursor:pointer;font-size:.9rem;line-height:1;padding:0 0 0 2px">&times;</button>'+
              '</div>';
            }).join('')+
          '</div>'
        :'<span style="font-size:.72rem;color:var(--muted2)">Sin restricciones</span>')+
      '</div>';
    }).join('')+
  '</div>';
}

export function openAddRestriccion(preselectPid){
  const lid=getActiveLiga();
  const pSel=document.getElementById('rst-player');
  const ps=S.players.filter(p=>p.liga===lid).sort((a,b)=>a.grupo-b.grupo||a.orden-b.orden);
  pSel.innerHTML=ps.map(p=>'<option value="'+p.id+'"'+(p.id===preselectPid?' selected':'')+'>G'+p.grupo+' - '+esc(p.nombre)+'</option>').join('');
  const turnos=[...new Set(S.jornadas.filter(j=>j.liga===lid).flatMap(j=>j.turnos||[]))].sort();
  const tChips=document.getElementById('rst-turno-chips');
  tChips.className='chip-select';
  tChips.innerHTML=(turnos.length?turnos:['18:00','19:15','20:30','21:45']).map(t=>'<span class="chip-toggle" data-turno="'+esc(t)+'" onclick="toggleRstChip(this)">'+esc(t)+'</span>').join('');
  const jSel=document.getElementById('rst-jornada');
  const js=S.jornadas.filter(j=>j.liga===lid).sort((a,b)=>a.num-b.num);
  jSel.innerHTML=js.map(j=>'<option value="'+j.id+'">J'+j.num+(j.fecha?' - '+esc(j.fecha):'')+'</option>').join('');
  document.getElementById('rst-scope').value='liga';
  document.getElementById('rst-jornada-wrap').style.display='none';
  openM('m-restriccion');
}

export function toggleRstJornada(){
  document.getElementById('rst-jornada-wrap').style.display=document.getElementById('rst-scope').value==='jornada'?'':'none';
}

export function toggleRstChip(el){
  el.classList.toggle('active');
}

export function filterRestricciones(q){
  const term=q.toLowerCase().trim();
  document.querySelectorAll('#restricciones-list > div > div').forEach(row=>{
    const name=row.querySelector('span[style*="font-weight:600"]')?.textContent||'';
    row.style.display=(!term||name.toLowerCase().includes(term))?'':'none';
  });
}

export async function saveRestriccion(){
  const lid=getActiveLiga();
  const pid=document.getElementById('rst-player').value;
  const turnos=[...document.querySelectorAll('#rst-turno-chips .chip-toggle.active')].map(el=>el.dataset.turno);
  const scope=document.getElementById('rst-scope').value;
  const jornadaId=scope==='jornada'?document.getElementById('rst-jornada').value:null;
  if(!pid||!turnos.length){toast('Selecciona jugador y al menos un horario',1);return;}
  const ops=turnos.map(turno=>{const id=uid();return{op:'set',col:'restricciones',id,data:{id,liga:lid,pid,turno,scope,jornadaId:jornadaId||null}};});
  await fsBatch(ops);
  closeM('m-restriccion');
  toast(turnos.length>1?`✓ ${turnos.length} restricciones guardadas`:'Restriccion guardada');
}

export async function delRestriccion(id){
  await fsDel('restricciones',id);
  toast('Restriccion eliminada');
  renderRestricciones();
}
