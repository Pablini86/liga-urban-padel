import {S} from './state.js';
import {renderLiga} from './liga.js';
import {renderTabla} from './tabla.js';
import {renderJornadas} from './jornadas.js';
import {renderHorarios} from './horarios.js';

let activeLigaId = null;
export function getActiveLigaId(){ return activeLigaId; }

export function goHome(){
  activeLigaId=null;
  document.getElementById('view-home').classList.add('active');
  document.getElementById('view-liga').classList.remove('active');
  document.getElementById('back-btn').classList.remove('show');
  document.getElementById('nav-liga-name').classList.remove('show');
  document.getElementById('nav-liga-name').textContent='';
}
export function openLiga(lid){
  activeLigaId=lid;
  document.getElementById('view-home').classList.remove('active');
  document.getElementById('view-liga').classList.add('active');
  document.getElementById('back-btn').classList.add('show');
  const liga=S.ligas.find(l=>l.id===lid);
  document.getElementById('nav-liga-name').textContent=liga?.nombre||'';
  document.getElementById('nav-liga-name').classList.add('show');
  // Reset to inicio tab
  showLT('inicio',document.querySelector('.lt'));
  renderLiga(lid);
}
export function showLT(id,btn){
  document.querySelectorAll('.ltab').forEach(t=>t.classList.remove('active'));
  document.querySelectorAll('.lt').forEach(t=>t.classList.remove('active'));
  document.getElementById('lt-'+id).classList.add('active');
  if(btn)btn.classList.add('active');
  if(id==='tabla'&&activeLigaId)renderTabla(activeLigaId);
  if(id==='jornadas'&&activeLigaId)renderJornadas(activeLigaId);
  if(id==='horarios'&&activeLigaId)renderHorarios(activeLigaId);
}
