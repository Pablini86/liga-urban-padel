import {S, db, esc, uid, calcGlobal, fsSet, fsBatch, toast} from './state.js';
import {closeM} from './modal.js';
import {showAT, renderAdmin} from './dispatch.js';

// ═══ MIGRATE ═══
export function checkMigrate(){
  const local=localStorage.getItem('upl_v5')||localStorage.getItem('upl_v4');
  document.getElementById('migrate-banner').style.display=(local&&!S.ligas.length)?'flex':'none';
}
document.getElementById('migrate-btn').onclick=async()=>{
  const raw=localStorage.getItem('upl_v5')||localStorage.getItem('upl_v4');
  if(!raw){toast('Sin datos locales',1);return;}
  try{
    const local=JSON.parse(raw);
    const batch=db.batch();
    (local.ligas||[]).forEach(l=>batch.set(db.collection('ligas').doc(l.id),l));
    (local.players||[]).forEach(p=>batch.set(db.collection('players').doc(p.id),p));
    (local.jornadas||[]).forEach(j=>batch.set(db.collection('jornadas').doc(j.id),j));
    (local.partidos||[]).forEach(m=>batch.set(db.collection('partidos').doc(m.id),m));
    (local.promociones||[]).forEach(p=>batch.set(db.collection('promociones').doc(p.id),p));
    await batch.commit();
    document.getElementById('migrate-banner').style.display='none';
    toast('✓ Datos migrados a Firebase');
  }catch(e){toast('Error: '+e.message,1);}
};

export function renderLigasAdmin(){
  const el=document.getElementById('ligas-list');
  if(!el)return;
  if(!S.ligas.length){el.innerHTML='<p style="color:var(--muted2);font-size:.78rem">Cargando ligas...</p>';return;}
  const activas=S.ligas.filter(l=>l.status!=='archivada');
  const archivadas=S.ligas.filter(l=>l.status==='archivada');
  function cardHtml(l){
    const isArchived=l.status==='archivada';
    const jornadas=S.jornadas.filter(j=>j.liga===l.id);
    const players=S.players.filter(p=>p.liga===l.id);
    const global=calcGlobal(l.id);
    const champ=global[0]&&global[0].player;
    const isActive=S.activeLiga===l.id;
    const borderColor=isActive?'var(--accent)':'var(--border)';
    const statusClass=isArchived?'b-eq':'b-ok';
    const statusText=(l.status||'activa').toUpperCase();
    var enterBtn=isArchived?
      '<button class="btn bs bsm" onclick="entrarLiga(&quot;'+l.id+'&quot;)">Ver historial</button>':
      '<button class="btn bp bsm" onclick="entrarLiga(&quot;'+l.id+'&quot;)">Entrar &rarr;</button>';
    var closeBtn=!isArchived?'<button class="btn bs bxs" onclick="cerrarLiga(&quot;'+l.id+'&quot;)" style="border-color:var(--accent);color:var(--accent)">Cerrar</button>':'';
    var podio='';
    if(isArchived&&champ){
      const medals=['1o','2o','3o'];
      var top3html='';
      global.slice(0,3).forEach(function(x,i){top3html+='<span style="font-size:.75rem;color:var(--muted2)">'+medals[i]+' '+esc(x.player.nombre)+' <span style="color:var(--accent)">'+(x.total>0?'+':'')+x.total+'</span></span> ';});
      podio='<div style="background:rgba(255,215,0,.06);border:1px solid rgba(255,215,0,.2);border-radius:7px;padding:.6rem .85rem;margin-top:.65rem">'+
        '<div style="font-size:.58rem;font-weight:700;letter-spacing:2px;color:var(--gold);text-transform:uppercase;margin-bottom:.35rem">Campeon</div>'+
        '<div style="font-weight:700;font-size:.9rem">'+esc(champ.nombre)+'</div>'+
        '<div style="display:flex;gap:.65rem;margin-top:.4rem;flex-wrap:wrap">'+top3html+'</div>'+
      '</div>';
    }
    return '<div style="background:var(--card);border:2px solid '+borderColor+';border-radius:12px;padding:1rem;margin-bottom:.65rem">'+
      '<div style="display:flex;align-items:center;gap:.65rem">'+
        '<div style="flex:1"><div style="font-weight:700;font-size:.95rem">'+esc(l.nombre)+'</div>'+
        '<div style="font-size:.68rem;color:var(--muted2);margin-top:.15rem">'+(l.cat||'')+' &middot; '+(l.dia||'')+' &middot; '+jornadas.length+'/'+(l.nj||6)+' jornadas &middot; '+players.length+' jugadores</div></div>'+
        '<span class="bdg '+statusClass+'">'+statusText+'</span>'+enterBtn+closeBtn+
        '<button class="btn bd bxs" onclick="delLiga(&quot;'+l.id+'&quot;)">X</button>'+
      '</div>'+podio+
    '</div>';
  }
  var html='';
  if(activas.length) html+=activas.map(cardHtml).join('');
  if(archivadas.length){
    if(activas.length) html+='<div style="font-size:.62rem;font-weight:700;letter-spacing:2px;color:var(--muted);text-transform:uppercase;margin:1rem 0 .5rem">Ligas archivadas</div>';
    html+=archivadas.map(cardHtml).join('');
  }
  el.innerHTML=html||'<p style="color:var(--muted2);font-size:.78rem">Sin ligas.</p>';
}

export function entrarLiga(lid){
  S.activeLiga=lid;
  const liga=S.ligas.find(l=>l.id===lid);
  const sub=document.getElementById('admin-sub');if(sub)sub.textContent=liga&&liga.nombre||'';
  const navEl=document.getElementById('nav-liga-active');if(navEl)navEl.textContent=liga&&liga.nombre||'';
  const tabs=document.getElementById('main-tabs');if(tabs)tabs.style.display='';
  const btn=document.querySelector('.it[onclick*="resultados"]');if(btn)showAT('resultados',btn);
  renderAdmin();
}

export function volverALigas(){
  S.activeLiga=null;
  const tabs=document.getElementById('main-tabs');if(tabs)tabs.style.display='none';
  const sub=document.getElementById('admin-sub');if(sub)sub.textContent='Selecciona una liga para comenzar';
  const navEl=document.getElementById('nav-liga-active');if(navEl)navEl.textContent='';
  const btn=document.querySelector('.it[onclick*="ligas"]');if(btn)showAT('ligas',btn);
}

export async function cerrarLiga(id){
  const liga=S.ligas.find(l=>l.id===id);if(!liga)return;
  const global=calcGlobal(id);const champ=global[0]&&global[0].player;
  const jornadas=S.jornadas.filter(j=>j.liga===id).length;
  const players=S.players.filter(p=>p.liga===id).length;
  if(!confirm('Cerrar la liga "'+liga.nombre+'"?\n\nCampeon: '+(champ?champ.nombre:'-')+'\nJugadores: '+players+'\nJornadas: '+jornadas+'\n\nSe archivara. Los datos se conservan.'))return;
  await fsSet('ligas',id,Object.assign({},liga,{status:'archivada',fechaCierre:new Date().toISOString().slice(0,10)}));
  toast('Liga cerrada: '+liga.nombre);
}

export async function createLiga(){const n=document.getElementById('nl-n').value.trim();if(!n){toast('Escribe nombre',1);return;}const l={id:uid(),nombre:n,cat:document.getElementById('nl-c').value,status:'activa',nj:parseInt(document.getElementById('nl-nj').value)||6,dia:document.getElementById('nl-d').value,inicio:document.getElementById('nl-i').value,fin:document.getElementById('nl-f').value};await fsSet('ligas',l.id,l);if(!S.activeLiga)S.activeLiga=l.id;closeM('m-liga');toast('✓ Liga creada');}
export async function delLiga(id){if(!confirm('¿Eliminar?'))return;const ops=[{op:'del',col:'ligas',id}];S.players.filter(p=>p.liga===id).forEach(p=>ops.push({op:'del',col:'players',id:p.id}));S.partidos.filter(p=>p.liga===id).forEach(p=>ops.push({op:'del',col:'partidos',id:p.id}));S.jornadas.filter(j=>j.liga===id).forEach(j=>ops.push({op:'del',col:'jornadas',id:j.id}));await fsBatch(ops);if(S.activeLiga===id)S.activeLiga=S.ligas.find(l=>l.id!==id)?.id||null;toast('Liga eliminada');}
